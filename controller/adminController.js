const kycModel = require("../model/kycModel");
const campaignModel = require("../model/campaignModel");
const fundraiserModel = require("../model/fundraiserModel");
const adminActivityModel = require("../model/adminModel");
const { sendEmail } = require("../utils/brevo");
const { kycStatusEmail, campaignStatusEmail } = require("../emailTemplate/emailVerification");
const MilestoneEvidenceModel = require("../model/milestoneEvidenceModel");
const Payout = require("../model/payoutModel");
const FundraiserWallet = require("../model/fundraiserWallet");
const donorModel = require("../model/donorModel");
const adminAuthModel = require("../model/adminAuth");
const Milestone = require("../model/milestoneModel");


// Helper function to calculate date
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

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
    res.status(200).json({ statusCode: true, statusText: "Success", message: `KYC records retrieved successfully for status ${status}`, data: kycs });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

// exports.reviewCampaign = async (req, res) => {
//   try {
//     const { campaignId } = req.params;
//     const { action, remarks } = req.body;

//     const campaign = await campaignModel.findById(campaignId).populate("fundraiser");
//     if (!campaign) {
//       return res.status(404).json({
//         statusCode: false,
//         message: "Campaign not found",
//       });
//     }

//     if (campaign.status !== "approved") {
//       return res.status(400).json({
//         statusCode: false,
//         message: `This campaign has already been approved and cannot be approved again.`,
//       });
//     }

//     if (!["approve", "reject"].includes(action)) {
//       return res.status(400).json({
//         statusCode: false,
//         message: "Action must be either 'approve' or 'reject'",
//       });
//     }

//     if (action === "approve") {
//       campaign.status = "approved";
//     } else {
//       if (!remarks || remarks.trim() === "") {
//         return res.status(400).json({
//           statusCode: false,
//           message: "Remarks are required when rejecting a campaign",
//         });
//       }

//       campaign.status = "rejected";
//       campaign.rejectionReason = remarks;
//     }

//     await campaign.save();

//     const statusMessage =
//       action === "approve"
//         ? `Congratulations! Your campaign titled "${campaign.campaignTitle}" has been approved and will be visible to the public soon.`
//         : `Unfortunately, your campaign titled "${campaign.campaignTitle}" has been rejected. Reason: ${remarks}`;

//     await sendEmail({
//       email: campaign.fundraiser.email,
//       subject: "Campaign Review Update",
//       html: campaignStatusEmail(campaign.fundraiser.organizationName, action, campaign.campaignTitle, remarks),
//     });

//     await adminActivityModel.create({
//       admin: req.admin.id,
//       action: `${action === "approve" ? "Approved" : "Rejected"} Campaign`,
//       details: `Campaign titled "${campaign.campaignTitle}" has been ${campaign.status}`,
//     });

//     res.status(200).json({
//       statusCode: true,
//       message: `Campaign ${action === "approve" ? "approved" : "rejected"} successfully`,
//       data: campaign,
//     });
//   } catch (error) {
//     res.status(500).json({
//       statusCode: false,
//       message: error.message,
//     });
//   }
// };

exports.reviewCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { action, remarks } = req.body;

    const campaign = await campaignModel.findById(campaignId).populate("fundraiser");
    if (!campaign) {
      return res.status(404).json({
        statusCode: false,
        message: "Campaign not found",
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        statusCode: false,
        message: "Action must be either 'approve' or 'reject'",
      });
    }

    if (campaign.status !== "pending") {
      return res.status(400).json({
        statusCode: false,
        message: `Campaign already ${campaign.status}, cannot review again`,
      });
    }

    if (action === "approve") {
      campaign.status = "approved";
      campaign.rejectionReason = null;
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

    await sendEmail({
      email: campaign.fundraiser.email,
      subject: "Campaign Review Update",
      html: campaignStatusEmail(campaign.fundraiser.organizationName, action, campaign.campaignTitle, remarks),
    });

    await adminActivityModel.create({
      admin: req.admin.id,
      action: `${action === "approve" ? "Approved" : "Rejected"} Campaign`,
      details: `Campaign titled "${campaign.campaignTitle}" has been ${campaign.status}`,
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

exports.adminActivateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await campaignModel.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        status: false,
        message: "Campaign not found",
      });
    }

    if (campaign.status !== "approved") {
      return res.status(400).json({
        status: false,
        message: "Only approved campaigns can be activated",
      });
    }

    campaign.status = "active";
    await campaign.save();

    return res.status(200).json({
      status: true,
      message: "Campaign is now active and live for donations",
      data: campaign,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
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

exports.getAllKycGrouped = async (req, res) => {
  try {
    const fundraiserId = req.query.fundraiserId; // optional
    const kycs = await kycModel.find().populate("user");

    if (!kycs || kycs.length === 0) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "No KYC records found",
      });
    }

    // Filter by fundraiserId if provided
    const filteredKycs = fundraiserId ? kycs.filter((kyc) => kyc.user && kyc.user._id.toString() === fundraiserId) : kycs;

    // Group by verificationStatus
    const groupedKycs = filteredKycs.reduce((acc, kyc) => {
      const status = kyc.verificationStatus || "unknown";
      if (!acc[status]) acc[status] = [];
      acc[status].push(kyc);
      return acc;
    }, {});

    res.status(200).json({
      statusCode: true,
      statusText: "Success",
      message: fundraiserId ? `KYC records grouped by status for fundraiser ${fundraiserId}` : "KYC records grouped by status",
      data: groupedKycs,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getAllFundraisers = async (req, res) => {
  try {
    const fundraisers = await fundraiserModel.find().select("-password -phoneNumber -token -otp -otpExpiredAt").sort({ createdAt: -1 }).lean();

    if (!fundraisers || fundraisers.length === 0) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "No fundraisers found",
      });
    }

    res.status(200).json({
      statusCode: true,
      statusText: "Success",
      message: "Fundraisers retrieved successfully",
      data: {
        total: fundraisers.length,
        fundraisers,
      },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getAllDonors = async (req, res) => {
  try {
    const donors = await donorModel.find().select("-password -phoneNumber -token -otp -otpExpiredAt").sort({ createdAt: -1 }).lean();

    if (!donors || donors.length === 0) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "No donors found",
      });
    }

    res.status(200).json({
      statusCode: true,
      statusText: "Success",
      message: "Donors retrieved successfully",
      data: {
        total: donors.length,
        donors,
      },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.activateCampaign = async (req, res) => {
    // Assuming req.user is the Admin object
    const adminId = req.user.id || req.user._id;
    const { campaignId } = req.params;

    try {
        const campaign = await campaignModel.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({ statusCode: false, statusText: "Not Found", message: "Campaign not found." });
        }

        // Only allow activation if the campaign is pending review
        if (campaign.status !== "pending" && campaign.status !== "approved") {
            return res.status(403).json({ statusCode: false, statusText: "Forbidden", message: `Campaign is already ${campaign.status}.` });
        }

        const today = new Date();
        const endDate = addDays(today, campaign.durationDays);

        // **CRITICAL UPDATE: Activation**
        const updatedCampaign = await campaignModel.findByIdAndUpdate(
            campaignId,
            {
                status: "active",
                isActive: true, // Allow donations
                startDate: today,
                endDate: endDate,
            },
            { new: true }
        );

        // Optionally, send a notification to the fundraiser here (e.g., using a notification service)

        res.status(200).json({
            statusCode: true,
            statusText: "OK",
            message: "Campaign successfully activated and is now accepting donations.",
            data: updatedCampaign,
        });

    } catch (error) {
        console.error("Error activating campaign:", error);
        res.status(500).json({ statusCode: false, statusText: "Internal Server Error", message: error.message });
    }
};

/**
 * Admin handles a request from a fundraiser to extend the campaign duration.
 */
exports.handleExtensionRequest = async (req, res) => {
    const adminId = req.user.id || req.user._id;
    const { campaignId, requestId } = req.params;
    const { status, rejectionReason } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ statusCode: false, statusText: "Bad Request", message: "Invalid status provided. Must be 'approved' or 'rejected'." });
    }

    if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({ statusCode: false, statusText: "Bad Request", message: "Rejection reason is required for rejected requests." });
    }

    try {
        const campaign = await campaignModel.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({ statusCode: false, statusText: "Not Found", message: "Campaign not found." });
        }

        const requestIndex = campaign.extensionRequests.findIndex(req => req._id.toString() === requestId);

        if (requestIndex === -1) {
            return res.status(404).json({ statusCode: false, statusText: "Not Found", message: "Extension request not found." });
        }
        
        const request = campaign.extensionRequests[requestIndex];

        if (request.status !== 'pending') {
            return res.status(403).json({ statusCode: false, statusText: "Forbidden", message: `This request has already been ${request.status}.` });
        }

        // Update the request status
        request.status = status;
        request.reviewedBy = adminId;
        
        let message = `Extension request successfully ${status}.`;

        if (status === 'approved') {
            // **CRITICAL UPDATE: Extend Campaign End Date**
            const newEndDate = addDays(campaign.endDate, request.days);
            campaign.endDate = newEndDate;
            campaign.durationDays += request.days; // Optional: update total duration
            message = `Campaign end date extended by ${request.days} days to ${newEndDate.toDateString()}.`;
        } else {
            campaign.extensionRequests[requestIndex].rejectionReason = rejectionReason;
        }
        
        await campaign.save();

        res.status(200).json({
            statusCode: true,
            statusText: "OK",
            message: message,
            data: campaign,
        });

    } catch (error) {
        console.error("Error handling extension request:", error);
        res.status(500).json({ statusCode: false, statusText: "Internal Server Error", message: error.message });
    }
};

/**
 * Admin handles review of milestone evidence submitted by the fundraiser.
 */
exports.reviewMilestoneEvidence = async (req, res) => {
    const adminId = req.user.id || req.user._id;
    const { evidenceId } = req.params;
    const { status, rejectionReason } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ statusCode: false, statusText: "Bad Request", message: "Invalid status provided. Must be 'approved' or 'rejected'." });
    }
    if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({ statusCode: false, statusText: "Bad Request", message: "Rejection reason is required for rejected requests." });
    }

    try {
        const evidence = await milestoneEvidenceModel.findById(evidenceId);
        if (!evidence) {
            return res.status(404).json({ statusCode: false, statusText: "Not Found", message: "Evidence document not found." });
        }
        if (evidence.status !== 'pending') {
            return res.status(403).json({ statusCode: false, statusText: "Forbidden", message: `Evidence has already been ${evidence.status}.` });
        }
        
        const milestone = await milestoneModel.findById(evidence.milestone);
        if (!milestone) {
            return res.status(404).json({ statusCode: false, statusText: "Not Found", message: "Milestone linked to evidence not found." });
        }

        // Update Evidence Document
        evidence.status = status;
        evidence.reviewedBy = adminId;
        evidence.reviewedAt = new Date();
        if (status === 'rejected') {
            evidence.rejectionReason = rejectionReason;
        }
        await evidence.save();

        // Update Milestone Document
        milestone.evidenceApprovalStatus = status; // 'approved' or 'rejected'
        
        let message;
        if (status === 'approved') {
            // Funds are now ready to be released for this milestone
            milestone.status = "ready_for_release"; 
            message = `Milestone evidence approved. Funds are now ready for release to the fundraiser.`;
        } else {
            // Fundraiser needs to resubmit evidence
            milestone.evidenceRef = null; // Clear reference so fundraiser can submit new evidence
            milestone.evidenceApprovalStatus = "required"; 
            message = `Milestone evidence rejected. Fundraiser notified to resubmit.`;
        }
        await milestone.save();
        
        res.status(200).json({
            statusCode: true,
            statusText: "OK",
            message: message,
            data: { evidence, milestone },
        });

    } catch (error) {
        console.error("Error reviewing evidence:", error);
        res.status(500).json({ statusCode: false, statusText: "Internal Server Error", message: error.message });
    }
};

// Admin: get all donations (with filters)
exports.getAllDonations = async function (req, res) {
  try {
    const statusFilter = req.query.status || null;
    const query = {};
    if (statusFilter) {
      query.paymentStatus = statusFilter;
    }

    const donations = await Donation.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Donations retrieved",
      data: donations,
    });
  } catch (error) {
    console.error("Error getting all donations:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

// Admin: create manual payout record (when admin approves disbursement to fundraiser bank)
exports.createPayout = async function (req, res) {
  try {
    // admin triggers payout: pass fundraiserId, campaignId (optional), amount, reference
    const fundraiserId = req.body.fundraiserId;
    const campaignId = req.body.campaignId || null;
    const amountStr = req.body.amount;
    if (!fundraiserId) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "fundraiserId is required",
      });
    }
    if (!amountStr) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "amount is required",
      });
    }
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "amount must be a positive number",
      });
    } // ensure wallet exists and has enough balance

    const wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId });
    if (!wallet) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Fundraiser wallet not found",
      });
    }

    if (wallet.availableBalance < amount) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Insufficient wallet balance",
      });
    } // create payout record

    const payoutReference = "PAYOUT_" + uuidv4();
    const payout = new Payout({
      fundraiser: fundraiserId,
      referenceID: payoutReference,
      campaign: campaignId,
      amount: amount,
      status: "processing",
    });

    await payout.save(); // deduct availableBalance and add to totalWithdrawn when marked paid

    wallet.availableBalance = wallet.availableBalance - amount;
    wallet.totalWithdrawn = wallet.totalWithdrawn + amount;
    await wallet.save();

    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Payout created and wallet debited (processing).",
      data: payout,
    });
  } catch (error) {
    console.error("Error creating payout:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @description Admin: Get all pending or requested payout requests.
 * @route GET /api/admin/payouts/pending
 * @access Private (Admin only)
 */
exports.getPendingPayoutRequests = async function (req, res) {
    try {
        // Retrieve all payout requests that the fundraiser has initiated (status: 'requested')
        const pendingRequests = await Payout.find({ status: 'requested' })
            .populate('fundraiser', 'firstName lastName email') // Populate Fundraiser details
            .populate('campaign', 'campaignTitle totalCampaignGoalAmount') // Populate Campaign details
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

/**
 * @description Admin: Approve a payout request and mark it as 'processing'.
 * @route POST /api/admin/payouts/approve/:payoutId
 * @access Private (Admin only)
 */
exports.approvePayoutRequest = async function (req, res) {
    try {
        const { payoutId } = req.params;
        // Optionally, admin can provide a transaction ID from the bank transfer
        const adminTransactionId = req.body.adminTransactionId || null; 

        const payout = await Payout.findById(payoutId);

        if (!payout || payout.status !== 'requested') {
            return res.status(404).json({
                statusCode: false,
                statusText: "Not Found",
                message: "Payout request not found or not in 'requested' status.",
            });
        }
        
        // --- ADMIN APPROVAL LOGIC ---
        // 1. Mark the Payout as processing/paid
        payout.status = 'paid'; 
        payout.adminApprovedAt = new Date();
        if (adminTransactionId) {
            payout.adminTransactionId = adminTransactionId;
        }

        await payout.save();
        
        // 2. Update Fundraiser Wallet (Final step based on previous wallet deduction)
        // NOTE: The amount was already deducted from availableBalance during requestPayout.
        // Here, we just add the amount to totalWithdrawn.

        const wallet = await FundraiserWallet.findOne({ fundraiser: payout.fundraiser });

        if (wallet) {
            // Note: The deduction of payout.amount from availableBalance was done in requestPayout.
            // We just ensure totalWithdrawn is correctly incremented.
            // If the amount was already deducted in Fundraiser Wallet Controller, no need to touch availableBalance again.
            // If it wasn't, uncomment the deduction below.
            
            // wallet.availableBalance -= payout.amount; // Use this if you only track it as 'pending' and not deducted
            wallet.totalWithdrawn += payout.amount; // Finalize the withdrawal amount
            await wallet.save();
        }


        return res.status(200).json({
            statusCode: true,
            statusText: "OK",
            message: `Payout request ${payoutId} approved and marked as 'paid'. Wallet updated.`,
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

/**
 * @description Admin: Reject a payout request and refund the amount to the wallet.
 * @route POST /api/admin/payouts/reject/:payoutId
 * @access Private (Admin only)
 */
exports.rejectPayoutRequest = async function (req, res) {
    try {
        const { payoutId } = req.params;
        const rejectReason = req.body.reason || "Admin rejected the request.";

        const payout = await Payout.findById(payoutId);

        if (!payout || payout.status !== 'requested') {
            return res.status(404).json({
                statusCode: false,
                statusText: "Not Found",
                message: "Payout request not found or not in 'requested' status.",
            });
        }
        
        // --- ADMIN REJECTION LOGIC ---
        // 1. Mark the Payout as rejected
        payout.status = 'rejected';
        payout.rejectionReason = rejectReason;
        await payout.save();

        // 2. Refund the amount back to the Fundraiser Wallet's availableBalance
        const wallet = await FundraiserWallet.findOne({ fundraiser: payout.fundraiser });

        if (wallet) {
            // Add the deducted amount back to availableBalance
            wallet.availableBalance += payout.amount;
            await wallet.save();
        }

        return res.status(200).json({
            statusCode: true,
            statusText: "OK",
            message: `Payout request ${payoutId} rejected. Funds returned to wallet.`,
            data: payout,
        });

    } catch (error) {
        console.error("Error rejecting payout request:", error);
        return res.status(500).json({
            statusCode: false,
            statusText: "Internal Server Error",
            message: error.message,
        });
    }
};