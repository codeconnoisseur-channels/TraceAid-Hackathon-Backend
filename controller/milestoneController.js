const Milestone = require("../model/milestoneModel");
const MilestoneEvidence = require("../model/milestoneEvidenceModel");
const Campaign = require("../model/campaignModel"); // New Import
const FundraiserWallet = require("../model/fundraiserWallet"); // New Import
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

exports.addMilestone = (req, res) => {
  try {
    const { campaignId, milestoneTitle, milestoneDescription, milestoneAmount, milestoneDuration } = req.body;

    if (!campaignId || !milestoneTitle || !milestoneDescription || !milestoneAmount || !milestoneDuration) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All fields are required (campaignId, milestoneTitle, milestoneDescription, milestoneAmount, milestoneDuration).",
      });
    }

    // NOTE: Changed 'milestoneModel' to 'Milestone' for consistency
    const newMilestone = new Milestone({
      campaign: campaignId,
      milestoneTitle,
      milestoneDescription,
      milestoneAmount,
      milestoneDuration,
    });

    newMilestone.save();

    res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Milestone added successfully",
      data: { milestone: newMilestone },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.uploadMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Milestone cover image or video is required.",
      });
    }

    const milestoneCoverImageOrVideoUrl = await cloudinary.uploader.upload(file.path, {
      folder: "milestone_covers",
      resource_type: "auto",
    });

    fs.unlinkSync(file.path);

    // NOTE: Changed 'milestoneModel' to 'Milestone' for consistency
    const milestone = await Milestone.findByIdAndUpdate(
      milestoneId,
      {
        milestoneCoverImageOrVideo: milestoneCoverImageOrVideoUrl.secure_url,
      },
      { new: true }
    );

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Milestone cover image or video uploaded successfully",
      data: { milestone },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.uploadMilestoneEvidence = async (req, res) => {
  const fundraiserId = req.user.id || req.user._id;
  const { milestoneId } = req.params;
  let { description, fileMetadata } = req.body;
  const files = req.files || []; // Assuming `req.files` is used for multiple files (Multer)

  try {
    // --- 1. Basic Validation ---
    if (!description) {
      // Clean up files if they were uploaded before the check fails
      files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(400).json({ statusCode: false, statusText: "Bad Request", message: "Description is required." });
    } // **CRITICAL RULE: 5 to 10 files required**

    if (files.length < 5 || files.length > 10) {
      files.forEach((f) => fs.unlinkSync(f.path));
      return res
        .status(400)
        .json({ statusCode: false, statusText: "Bad Request", message: `Exactly 5 to 10 evidence files are required. Received ${files.length}.` });
    } // --- 2. Milestone and Status Check ---

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(404).json({ statusCode: false, statusText: "Not Found", message: "Milestone not found." });
    } // Only allow evidence submission if funds for the PREVIOUS milestone have been released
    if (milestone.evidenceApprovalStatus !== "required" && milestone.status !== "ready_for_release") {
      files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Evidence cannot be submitted for this milestone yet. Funds must have been released, or evidence is already under review.",
      });
    } // --- 3. Geolocation Metadata Validation ---

    let metadata;
    try {
      metadata = JSON.parse(fileMetadata); // Should be an array of { latitude, longitude }
    } catch (e) {
      files.forEach((f) => fs.unlinkSync(f.path));
      return res
        .status(400)
        .json({ statusCode: false, statusText: "Bad Request", message: "Invalid fileMetadata format (must be valid JSON array)." });
    }

    if (!Array.isArray(metadata) || metadata.length !== files.length) {
      files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(400).json({ statusCode: false, statusText: "Bad Request", message: "Metadata count must match file count." });
    } // Check if all files have valid geolocation data

    const invalidMetadata = metadata.some((m) => !m.latitude || !m.longitude || isNaN(m.latitude) || isNaN(m.longitude));
    if (invalidMetadata) {
      files.forEach((f) => fs.unlinkSync(f.path));
      return res
        .status(400)
        .json({ statusCode: false, statusText: "Bad Request", message: "All files must include valid latitude and longitude data." });
    } // --- 4. Upload Files and Prepare Uploads Array ---

    const uploads = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const meta = metadata[i];

      const up = await cloudinary.uploader.upload(f.path, { folder: "milestone_evidence", resource_type: "auto" });

      uploads.push({
        imageUrl: up.secure_url,
        publicId: up.public_id,
        uploadedAt: new Date(), // **ADD GEOLOCATION DATA**
        latitude: meta.latitude,
        longitude: meta.longitude,
      });
      fs.unlinkSync(f.path);
    } // --- 5. Create MilestoneEvidence Document ---

    const newEvidence = await MilestoneEvidence.create({
      campaign: milestone.campaign,
      milestone: milestone._id,
      fundraiser: fundraiserId,
      description,
      uploads,
      status: "pending",
    }); // --- 6. Update Milestone Reference and Status ---

    milestone.evidenceApprovalStatus = "submitted"; // Evidence submitted, waiting for Admin
    milestone.evidenceRef = newEvidence._id; // Link to the new evidence document
    await milestone.save();

    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Evidence uploaded successfully. Pending admin review.",
      data: newEvidence,
    });
  } catch (error) {
    // Clean up remaining uploaded files on error
    if (req.files)
      req.files.forEach((f) => {
        try {
          fs.unlinkSync(f.path);
        } catch (err) {
          console.error("Cleanup error:", err);
        }
      });
    console.error("Error uploading milestone evidence:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

// --- ADMIN MILESTONE MANAGEMENT FUNCTIONS ---

/**
 * @description Admin: Get all milestone evidence submitted by fundraisers awaiting review.
 * @route GET /api/admin/milestone-evidence/pending
 * @access Private (Admin only)
 */
exports.getPendingMilestoneEvidence = async (req, res) => {
  try {
    const pendingEvidence = await MilestoneEvidence.find({ status: "pending" })
      .populate({
        path: "milestone",
        select: "milestoneTitle milestoneAmount",
      })
      .populate({
        path: "fundraiser",
        select: "firstName lastName",
      })
      .populate({
        path: "campaign",
        select: "campaignTitle",
      })
      .sort({ uploadedAt: 1 });

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Pending milestone evidence retrieved successfully.",
      data: pendingEvidence,
    });
  } catch (error) {
    console.error("Error fetching pending evidence:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @description Admin: Approve milestone evidence, update status, and release funds to the wallet.
 * @route POST /api/admin/milestone-evidence/approve/:evidenceId
 * @access Private (Admin only)
 */
exports.approveMilestoneEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    const evidence = await MilestoneEvidence.findById(evidenceId).populate("milestone").populate("campaign");

    if (!evidence || evidence.status !== "pending") {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Evidence not found or not currently pending review.",
      });
    }

    

    const milestone = evidence.milestone;
    const campaign = evidence.campaign;

    if (!milestone || !campaign) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Associated milestone or campaign not found.",
      });
    }

    // --- FINANCIAL LOGIC: RELEASE FUNDS ---
    const amountToRelease = milestone.milestoneAmount;
    const fundraiserId = campaign.fundraiser;

    // 1. Atomically update the Fundraiser's wallet
    const wallet = await FundraiserWallet.findOneAndUpdate(
      { fundraiser: fundraiserId },
      { $inc: { availableBalance: amountToRelease } }, // Add the milestone amount to availableBalance
      { upsert: true, new: true } // Create if not exists, return updated document
    );

    // 2. Update Milestone and Evidence Status
    evidence.status = "approved";
    milestone.evidenceApprovalStatus = "approved";
    milestone.status = "completed"; // Milestone is now completed

    await evidence.save();
    await milestone.save();

    // 3. Update the Campaign to mark the milestone as completed
    // (Optional: You might have an array on Campaign to track completed milestone IDs)
    // For now, we rely on the Milestone status.

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: `Milestone evidence approved. ${amountToRelease} released to fundraiser wallet.`,
      data: { evidence, wallet },
    });
  } catch (error) {
    console.error("Error approving milestone evidence:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @description Admin: Reject milestone evidence, update status, and allow resubmission.
 * @route POST /api/admin/milestone-evidence/reject/:evidenceId
 * @access Private (Admin only)
 */
exports.rejectMilestoneEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Rejection reason is required.",
      });
    }

    const evidence = await MilestoneEvidence.findById(evidenceId).populate("milestone");

    if (!evidence || evidence.status !== "pending") {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Evidence not found or not currently pending review.",
      });
    }

    const milestone = evidence.milestone;

    // 1. Update Evidence Status
    evidence.status = "rejected";
    evidence.rejectionReason = rejectionReason;
    await evidence.save();

    // 2. Update Milestone Status to allow the fundraiser to resubmit
    milestone.evidenceApprovalStatus = "required";
    milestone.evidenceRef = null; // Clear reference to allow new submission
    await milestone.save();

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Milestone evidence rejected. Fundraiser notified to resubmit.",
      data: { evidence, milestone },
    });
  } catch (error) {
    console.error("Error rejecting milestone evidence:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
