const payoutModel = require("../model/payoutModel");
const FundraiserWallet = require("../model/fundraiserWallet");
const Bank = require("../model/bankModel");

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
  const totals = summary.reduce(
    (acc, c) => {
      acc.credited += c.credited;
      acc.debited += c.debited;
      return acc;
    },
    { credited: 0, debited: 0 }
  );
  return { perCampaign: summary, totals };
}

exports.createPayoutByAdmin = async (req, res) => {
  try {
    const { fundraiserId, campaignId, payoutId, milestoneId, amount, note } = req.body;
    if (!fundraiserId || !campaignId || !amount)
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "fundraiserId, campaignId and positive amount required",
      });

    const wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId });
    if (!wallet)
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Wallet not found",
      });

    const computed = await computeWalletSummary(wallet);
    const perCampaign = computed.perCampaign.find((c) => String(c.campaign._id || c.campaign) === String(campaignId));
    const campaignBalance = perCampaign ? perCampaign.balance : 0;
    if (campaignBalance < Number(amount))
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `Insufficient campaign balance. Available: ${campaignBalance}`,
      });

    // find bank with Kora recipient
    const bank = await Bank.findOne({ fundraiser: fundraiserId, $or: [{ campaign: campaignId }, { campaign: null }], status: "verified" });
    if (!bank || !bank.koraRecipientCode)
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "No verified bank with Kora recipient found",
      });

    // mark a payout (either update existing or create)
    let payout = payoutId ? await Payout.findById(payoutId) : null;
    if (!payout) {
      payout = await Payout.create({
        fundraiser: fundraiserId,
        campaign: campaignId,
        milestone: milestoneId || null,
        amount: Number(amount),
        status: "processing",
        referenceID: "PAYOUT_" + uuidv4(),
        requestedAt: new Date(),
        note: note || "Admin payout via Kora",
      });
    } else {
      payout.status = "processing";
      payout.amount = Number(amount);
      payout.note = note || payout.note;
      await payout.save();
    }

    // debit wallet ledger
    wallet.availableBalance = (wallet.availableBalance || 0) - Number(amount);
    wallet.totalWithdrawn = (wallet.totalWithdrawn || 0) + Number(amount);
    wallet.transactions.push({
      type: "debit",
      campaign: campaignId,
      amount: Number(amount),
      source: "payout",
      reference: payout.referenceID,
      note: "Kora payout initiated",
      createdAt: new Date(),
    });
    await wallet.save();

    // call Kora API
    const transferRes = await axios.post(
      `${KORA_API_BASE}/transfers`,
      {
        reference: payout.referenceID,
        destination: bank.koraRecipientCode,
        amount: Number(amount),
        currency: "NGN",
        narration: note || "Fundraiser payout",
      },
      {
        headers: { Authorization: `Bearer ${KORA_SECRET_KEY}`, "Content-Type": "application/json" },
      }
    );

    // on success
    payout.status = "paid";
    payout.processedAt = new Date();
    payout.processedBy = req.user?._id;
    await payout.save();

    // if a milestone exists, mark milestone.releasedAmount and fundsReleasedAt
    if (milestoneId) {
      const milestone = await Milestone.findById(milestoneId);
      if (milestone) {
        milestone.releasedAmount = (milestone.releasedAmount || 0) + Number(amount);
        milestone.fundsReleasedAt = new Date();
        milestone.status = "ready_for_release"; // or 'released' depending on your flow — choose one
        await milestone.save();
      }
    }

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Payout processed successfully via Kora",
      data: { payout, transferData: transferRes.data },
    });
  } catch (err) {
    console.error("createPayoutByAdmin error:", err.response?.data || err.message);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: err.response?.data?.message || err.message,
    });
  }
};

exports.getPendingPayoutRequests = async function (req, res) {
  try {
    const pendingRequests = await payoutModel
      .find({ status: "requested" })
      .populate("fundraiser", "firstName lastName email")
      .populate("campaign", "campaignTitle totalCampaignGoalAmount")
      .sort({ requestedAt: 1 });

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Pending payout requests retrieved successfully.",
      data: pendingRequests,
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
        const adminId = req.user._id; // Assuming admin ID is available on req.user

        // 1. Find the payout and check its status
        const payout = await Payout.findOne({ _id: payoutId, status: "pending" });

        if (!payout) {
            return res.status(404).json({
                statusCode: false,
                statusText: "Not Found",
                message: "Pending payout request not found or already processed.",
            });
        }

        // 2. Update Payout Status to Processing
        payout.status = "processing";
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