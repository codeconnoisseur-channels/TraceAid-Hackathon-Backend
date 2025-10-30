const kycModel = require("../model/kycModel");
const campaignModel = require("../model/campaignModel");
const fundraiserModel = require("../model/fundraiserModel");
const adminActivityModel = require("../model/adminModel");
const { sendEmail } = require("../utils/brevo");
const { kycStatusEmail, campaignStatusEmail } = require("../emailTemplate/emailVerification");
const MilestoneEvidenceModel = require("../model/milestoneEvidenceModel");
const Payout = require("../model/payoutModel");
const FundraiserWallet = require("../model/fundraiserWallet");

exports.verifyKyc = async (req, res) => {
  try {
    const { action, remarks } = req.body;
    const { kycId } = req.params;
    const adminId = req.admin.id;

    if (!["verify", "reject"].includes(action)) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Invalid Action",
        message: "Action must be either 'verify' or 'reject'",
      });
    }

    const kyc = await kycModel.findById(kycId).populate("user");
    if (!kyc) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "KYC record not found",
      });
    }

    const fundraiser = await fundraiserModel.findById(kyc.user);
    if (!fundraiser) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Fundraiser not found for this KYC record",
      });
    }

    if (kyc.verificationStatus === "verified" && action === "verify") {
      return res.status(400).json({
        statusCode: false,
        statusText: "Already Verified",
        message: "This KYC has already been verified",
      });
    }

    if (kyc.verificationStatus === "rejected" && action === "reject") {
      return res.status(400).json({
        statusCode: false,
        statusText: "Already Rejected",
        message: "This KYC has already been rejected",
      });
    }

    if (action === "verify") {
      kyc.verificationStatus = "verified";
      kyc.verifiedAt = new Date();
      kyc.rejectionReason = null;
      fundraiser.kycStatus = "verified";
    } else if (action === "reject") {
      if (!remarks) {
        return res.status(400).json({
          statusCode: false,
          statusText: "Validation Error",
          message: "Rejection requires a reason (remarks field)",
        });
      }
      kyc.verificationStatus = "rejected";
      kyc.rejectionReason = remarks;
      fundraiser.kycStatus = "rejected";
    }

    await kyc.save();
    await fundraiser.save();

    await adminActivityModel.create({
      admin: adminId,
      role: "admin",
      actionType: action === "verify" ? "verify_kyc" : "reject_kyc",
      kyc: kyc._id,
      fundraiser: fundraiser._id,
      remarks: remarks || "",
      status: "completed",
    });

    const statusMessage =
      action === "verify"
        ? "Congratulations! Your KYC verification has been approved."
        : `Unfortunately, your KYC verification has been rejected. Reason: ${remarks}`;

    const mailDetails = {
      email: fundraiser.email,
      subject: "KYC Verification Update",
      html: kycStatusEmail(statusMessage, fundraiser.organizationName),
    };

    await sendEmail(mailDetails);

    return res.status(200).json({
      statusCode: true,
      statusText: "Success",
      message: `KYC has been successfully ${action}ed`,
      data: {
        kycId: kyc._id,
        fundraiser: fundraiser.organizationName,
        verificationStatus: kyc.verificationStatus,
        updatedAt: kyc.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error verifying KYC:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getAllKyc = async (req, res) => {
  try {
    const kycs = await kycModel.find().populate("user");

    res.status(200).json({
      statusCode: true,
      statusText: "Success",
      message: "KYC records retrieved successfully",
      data: kycs,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getAllKycByTheStatus = async (req, res) => {
  try {
    const status = req.query.status;
    const kycs = await kycModel.find({ verificationStatus: status }).populate("user");
    if (!kycs) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "KYC records not found",
      });
    }
    res.status(200).json({ statusCode: true,
      statusText: "Success",
      message: `KYC records retrieved successfully for status ${status}`,
      data: kycs,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }}

exports.reviewCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { action, remarks } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        statusCode: false,
        message: "Action must be either 'approve' or 'reject'",
      });
    }

    const campaign = await campaignModel.findById(campaignId).populate("fundraiser");
    if (!campaign) {
      return res.status(404).json({
        statusCode: false,
        message: "Campaign not found",
      });
    }

    if (campaign.status !== "pending") {
      return res.status(400).json({
        statusCode: false,
        message: `This campaign is already ${campaign.status}`,
      });
    }

    if (action === "approve") {
      campaign.status = "approved";
    } else {
      if (!remarks || remarks.trim() === "") {
        return res.status(400).json({
          statusCode: false,
          message: "Remarks are required when rejecting a campaign",
        });
      }
      campaign.status = "rejected";
      campaign.rejectionReason = remarks;
    }

    await campaign.save();

    const statusMessage =
      action === "approve"
        ? `Congratulations! Your campaign titled "${campaign.title}" has been approved and will be visible to the public soon.`
        : `Unfortunately, your campaign titled "${campaign.title}" has been rejected. Reason: ${remarks}`;

    await sendEmail({
      email: campaign.fundraiser.email,
      subject: "Campaign Review Update",
      html: campaignStatusEmail(campaign.fundraiser.organizationName, action, campaign.title, remarks),
    });

    await adminActivityModel.create({
      admin: req.admin.id,
      action: `${action === "approve" ? "Approved" : "Rejected"} Campaign`,
      details: `Campaign titled "${campaign.title}" has been ${campaign.status}`,
    });

    res.status(200).json({
      statusCode: true,
      message: `Campaign ${action === "approve" ? "approved" : "rejected"} successfully`,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      message: error.message,
    });
  }
};

exports.reviewMilestoneEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const { action, rejectionReason } = req.body; // action = 'approve' | 'reject'
    const adminId = req.user.id;

    const evidence = await MilestoneEvidenceModel.findById(evidenceId).populate("milestone campaign fundraiser");
    if (!evidence) return res.status(404).json({ statusCode: false, statusText: "Not Found", message: "Evidence not found" });

    if (!["approve", "reject"].includes(action))
      return res.status(400).json({ statusCode: false, statusText: "Bad Request", message: "Invalid action" });

    if (action === "approve") {
      evidence.status = "approved";
      evidence.reviewedBy = adminId;
      evidence.reviewedAt = new Date();
      await evidence.save();

      // update milestone
      await Milestone.findByIdAndUpdate(evidence.milestone._id, {
        verificationStatus: "approved",
        status: "completed",
        verifiedAt: new Date(),
      });

      // create payout record (admin will process payment externally)
      const payout = await Payout.create({
        fundraiser: evidence.fundraiser._id,
        campaign: evidence.campaign._id,
        milestone: evidence.milestone._id,
        referenceID: `PAYOUT_${Date.now()}`,
        amount: evidence.milestone.targetAmount ?? evidence.milestone.releasedAmount ?? 0,
        status: "processing",
        processedBy: adminId,
      });

      // send email to fundraiser
      await sendEmail({
        to: evidence.fundraiser.email,
        subject: "Milestone evidence approved",
        html: `Your evidence for milestone "${evidence.milestone.milestoneTitle}" was approved. Next payout reference: ${payout.referenceID}`,
      });

      return res.json({ statusCode: true, statusText: "OK", message: "Evidence approved", data: { evidence, payout } });
    } else {
      evidence.status = "rejected";
      evidence.reviewedBy = adminId;
      evidence.reviewedAt = new Date();
      evidence.rejectionReason = rejectionReason || "Not specified";
      await evidence.save();

      // mark milestone as rejected
      await Milestone.findByIdAndUpdate(evidence.milestone._id, {
        verificationStatus: "rejected",
        status: "rejected",
        rejectedAt: new Date(),
      });

      await sendEmail({
        to: evidence.fundraiser.email,
        subject: "Milestone evidence rejected",
        html: `Your evidence for milestone "${evidence.milestone.milestoneTitle}" was rejected. Reason: ${evidence.rejectionReason}`,
      });

      return res.json({ statusCode: true, statusText: "OK", message: "Evidence rejected", data: evidence });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ statusCode: false, statusText: "Internal Server Error", message: err.message });
  }
};

exports.releaseMilestoneFunds = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { milestoneId } = req.params;
    const adminId = req.user.id;

    const milestone = await MilestoneModel.findById(milestoneId).session(session);
    if (!milestone) throw new Error("Milestone not found");

    if (milestone.verificationStatus === "approved" || milestone.status === "funds-released") {
      return res.status(400).json({ statusCode: false, statusText: "Bad Request", message: "Funds already released or milestone already approved" });
    }

    // amount to release
    const amount = milestone.targetAmount;

    // create payout record (admin processes actual transfer outside)
    const payout = await PayoutModel.create(
      [
        {
          fundraiser: milestone.campaign.fundraiser,
          campaign: milestone.campaign,
          milestone: milestone._id,
          referenceID: `PAYOUT_${Date.now()}`,
          amount,
          status: "processing",
          processedBy: adminId,
        },
      ],
      { session }
    );

    // Update milestone
    milestone.releasedAmount = amount;
    milestone.fundsReleasedAt = new Date();
    milestone.status = "funds-released";
    milestone.verificationStatus = "funds-released";
    await milestone.save({ session });

    // Optionally credit fundraiser wallet immediately (if you want to track available balance)
    await FundraiserWallet.findOneAndUpdate(
      { fundraiser: milestone.campaign.fundraiser },
      { $inc: { availableBalance: amount } },
      { upsert: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    // send email notifying fundraiser
    // sendEmail({ to: fundraiser.email, subject: "Funds released", html: ... })

    return res.json({
      statusCode: true,
      statusText: "OK",
      message: "Funds released (recorded). Admin should complete actual transfer externally.",
      data: payout[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return res.status(500).json({ statusCode: false, statusText: "Internal Server Error", message: err.message });
  }
};
