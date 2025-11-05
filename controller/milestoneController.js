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

exports.getMilestoneAchieved = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const milestones = await Milestone.find({ campaign: campaignId, status: "completed" });
    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Milestones retrieved successfully",
      data: { milestones },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
