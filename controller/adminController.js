const kycModel = require("../model/kycModel");
const campaignModel = require("../model/campaignModel");
const fundraiserModel = require("../model/fundraiserModel");
const adminActivityModel = require("../model/adminModel");
const { sendEmail } = require("../utils/brevo");
const {
  kycStatusEmail,
  campaignStatusEmail,
} = require("../emailTemplate/emailVerification");

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

    const campaign = await campaignModel
      .findById(campaignId)
      .populate("fundraiser");
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
      html: campaignStatusEmail(
        campaign.fundraiser.organizationName,
        action,
        campaign.title,
        remarks
      ),
    });

    await adminActivityModel.create({
      admin: req.admin.id,
      action: `${action === "approve" ? "Approved" : "Rejected"} Campaign`,
      details: `Campaign titled "${campaign.title}" has been ${campaign.status}`,
    });

    res.status(200).json({
      statusCode: true,
      message: `Campaign ${
        action === "approve" ? "approved" : "rejected"
      } successfully`,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      message: error.message,
    });
  }
};
