const payoutModel = require("../model/payoutModel");
const FundraiserWallet = require("../model/fundraiserWallet");
const KYC = require("../model/kycModel");
const Milestone = require("../model/milestoneModel");
const { v4: uuidv4 } = require("uuid");
const Fundraiser = require("../model/fundraiserModel")
const Campaign = require("../model/campaignModel");
const { payoutApprovedTemplate } = require("../emailTemplate/emailVerification");
const { sendEmail } = require("../utils/brevo");

async function computeWalletSummary(wallet) {
  const perCampaign = {};
  for (const tx of wallet.transactions || []) {
    const cid = String(tx.campaign);
    if (!perCampaign[cid]) {
      perCampaign[cid] = { campaign: tx.campaign, credited: 0, debited: 0 };
    }
    if (tx.type === "credit") perCampaign[cid].credited += tx.amount;
    if (tx.type === "debit") perCampaign[cid].debited += tx.amount;
  }

  const summary = Object.values(perCampaign).map((c) => ({
    campaign: c.campaign,
    credited: c.credited,
    debited: c.debited,
    balance: c.credited - c.debited,
  }));

  return { perCampaign: summary };
}

exports.createPayoutByAdmin = async (req, res) => {
  let wallet = null;

  try {
    const { fundraiserId, campaignId, payoutId, milestoneId, note, amount: bodyAmount } = req.body;

    let payout = payoutId ? await payoutModel.findById(payoutId) : null;

    if (payout && payout.status === "paid") {
      return res.status(400).json({
        statusCode: false,
        statusText: "Already Paid",
        message: `Payout ID ${payoutId} has already been marked as 'paid'. Cannot process twice.`,
      });
    }

    const amountToProcess = payout ? Number(payout.amount) : Number(bodyAmount);

    if (!fundraiserId || !campaignId || !amountToProcess || amountToProcess <= 0)
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "fundraiserId, campaignId and positive amount are required.",
      });

    // 3. Fetch Fundraiser and KYC details for email and validation
    const fundraiser = await Fundraiser.findById(fundraiserId).select("email organizationName");
    if (!fundraiser) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Fundraiser not found.",
      });
    }

    const campaign = await Campaign.findById(campaignId).select("campaignTitle");
    if (!campaign) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Campaign not found.",
      });
    }

    // Populate or find the KYC document to get bank details
    const kyc = await KYC.findOne({ user: fundraiserId, verificationStatus: "verified" });
    if (!kyc)
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Fundraiser KYC is not verified.",
      });

    // 5. Wallet Check (Balance verification)
    wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId });
    if (!wallet)
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Wallet not found",
      });

    const computed = await computeWalletSummary(wallet);
    const perCampaign = computed.perCampaign.find((c) => String(c.campaign._id || c.campaign) === String(campaignId));
    const campaignBalance = perCampaign ? perCampaign.balance : 0;

    if (campaignBalance < amountToProcess)
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `Insufficient campaign balance. Available: ${campaignBalance}. Requested: ${amountToProcess}`,
      });

    // 6. Mark/Create Payout
    if (!payout) {
      // Create new payout
      payout = await payoutModel.create({
        fundraiser: fundraiserId,
        campaign: campaignId,
        milestone: milestoneId || null,
        amount: amountToProcess,
        status: "paid",
        referenceID: "PAYOUT_" + uuidv4(),
        requestedAt: new Date(),
        note: note || "Admin manual payout (bankless)",
        processedAt: new Date(),
        processedBy: req.user?._id,
      });
    } else {
      // Update existing payout (if found and status was NOT 'paid')
      payout.status = "paid";
      payout.amount = amountToProcess;
      payout.note = note || payout.note;
      payout.processedAt = new Date();
      payout.processedBy = req.user?._id;
      await payout.save();
    }

    // 7. Debit Wallet Ledger
    const debitTransaction = {
      type: "debit",
      campaign: campaignId,
      amount: amountToProcess,
      source: "payout",
      reference: payout.referenceID,
      note: "Manual payout recorded",
      createdAt: new Date(),
    };

    wallet.availableBalance = (wallet.availableBalance || 0) - amountToProcess;
    wallet.totalWithdrawn = (wallet.totalWithdrawn || 0) + amountToProcess;
    wallet.transactions.push(debitTransaction);
    await wallet.save();

    // 8. Update Milestone Status
    if (milestoneId) {
      const milestone = await Milestone.findById(milestoneId);
      if (milestone) {
        milestone.releasedAmount = (milestone.releasedAmount || 0) + amountToProcess;
        milestone.status = "released";
        milestone.fundsReleasedAt = new Date();
        await milestone.save();
      }
    }

    try {
      const emailHTML = payoutApprovedTemplate(
        fundraiser.organizationName || "Fundraiser",
        amountToProcess,
        kyc.bankName,
        kyc.bankAccountName,
        kyc.bankAccountNumber
      );

      await sendEmail({
        to: fundraiser.email,
        subject: `Payout Processed for Campaign: ${campaign.campaignTitle}`,
        html: emailHTML,
      });
      console.log(`Payout email sent to ${fundraiser.email} for ${amountToProcess}`);
    } catch (emailError) {
      console.error("Failed to send payout notification email:", emailError);
    }

    // 10. Return Final Response
    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Manual payout processed and recorded successfully. Fundraiser notified.",
      data: { payout },
    });
  } catch (err) {
    console.error("createPayoutByAdmin error:", err.message);

    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: err.message || "Failed to process payout due to a server error.",
    });
  }
};

exports.approvePayoutRequest = async function (req, res) {
  try {
    const { payoutId } = req.params;
    const adminId = req.user._id;

    // 1. Find the payout and check its status
    // Since createPayoutByAdmin now marks it as 'paid' immediately, this function
    // is likely only used for requested payouts (status: 'pending').
    const payout = await payoutModel.findOne({ _id: payoutId, status: "pending" });

    if (!payout) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Pending payout request not found or already processed.",
      });
    }

    // 2. Update Payout Status to Paid (or processing, depending on your final flow)
    // For a bankless flow, this means the funds have been manually sent.
    payout.status = "paid";
    payout.processedBy = adminId;
    payout.processedAt = new Date();
    await payout.save();

    // 3. Perform the wallet debit here IF it wasn't done on request (often safer to debit here)
    // NOTE: Based on your createPayoutByAdmin, wallet debit happens on creation.
    // This function should be aligned with the manual flow.

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: `Payout request ${payout.referenceID} approved and marked as paid.`,
      data: payout,
    });
  } catch (error) {
    console.error("Error approving payout request:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getPendingPayoutRequests = async function (req, res) {
  try {
    const allPayout = await payoutModel
      .find()
      .populate("fundraiser", "firstName lastName email")
      .populate("campaign", "campaignTitle totalCampaignGoalAmount")
      .sort({ requestedAt: 1 });

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "All payout requests successfully retrieved.",
      data: allPayout,
    });
  } catch (error) {
    console.error("Error fetching pending payout requests:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.approvePayoutRequest = async function (req, res) {
  try {
    const { payoutId } = req.params;
    const adminId = req.user._id;

    // 1. Find the payout and check its status
    const payout = await payoutModel.findOne({ _id: payoutId, status: "processing" });

    if (!payout) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Pending payout request not found or already processed.",
      });
    }

    // 2. Update Payout Status to Processing
    payout.status = "paid";
    payout.processedBy = adminId;
    payout.processedAt = new Date();
    await payout.save();

    // 3. Optional: Update Milestone Status (This step is often kept minimal here)
    // If you need to update the milestone status to reflect approval, you would do it here.

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: `Payout request ${payout.referenceID} approved and moved to processing queue.`,
      data: payout,
    });
  } catch (error) {
    console.error("Error approving payout request:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
