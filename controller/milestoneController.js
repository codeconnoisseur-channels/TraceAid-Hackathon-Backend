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
  const fundraiserId = req.user?.id || req.user?._id;
  const milestoneId  = req.params.id
  let { description, fileMetadata } = req.body;
  const files = req.files || [];

  // safe cleanup helper
  const cleanupFiles = (filesArr) => {
    (filesArr || []).forEach((f) => {
      try {
        if (f && f.path) fs.unlinkSync(f.path);
      } catch (e) {
        console.warn("Cleanup file error", e?.message);
      }
    });
  };

  try {
    if (!description) {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Description is required.",
      });
    }

    if (!milestoneId) {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Milestone id required",
      });
    }

    if (files.length < 5 || files.length > 10) {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `Exactly 5 to 10 evidence files are required. Received ${files.length}.`,
      });
    }

    // load milestone & campaign
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      cleanupFiles(files);
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Milestone not found.",
      });
    }

    // Make sure the authenticated fundraiser owns the campaign for security
    const campaign = await Campaign.findById(milestone.campaign);
    if (!campaign || String(campaign.fundraiser) !== String(fundraiserId)) {
      cleanupFiles(files);
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "You are not allowed to upload evidence for this milestone.",
      });
    }

    // Allowed condition:
    // Evidence should be submitted when milestone.evidenceApprovalStatus === 'required'
    // OR milestone.status === 'ready_for_release' (depending on your flow)
    if (!(milestone.evidenceApprovalStatus === "submitted" || milestone.status === "approved")) {
      cleanupFiles(files);
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: `Evidence cannot be submitted for this milestone yet.
         Either previous milestone not released or evidence already submitted/under review.`,
      });
    }

    // parse fileMetadata (must be an array of objects with lat/lng). If absent fail.
    let metadata;
    try {
      metadata = fileMetadata ? JSON.parse(fileMetadata) : null;
    } catch (e) {
      metadata = null;
    }

    if (!Array.isArray(metadata) || metadata.length !== files.length) {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid or mismatched fileMetadata. Provide JSON array with same length as files.",
      });
    }

    const invalidGeo = metadata.some((m) => !m || isNaN(Number(m.latitude)) || isNaN(Number(m.longitude)));
    if (invalidGeo) {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All files must include valid latitude and longitude data.",
      });
    }

    // Upload to cloudinary (or your provider) and build uploads array
    const uploads = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const meta = metadata[i];

      // cloudinary upload; ensure cloudinary.uploader.upload exists and is configured
      const up = await cloudinary.uploader.upload(f.path, { folder: "milestone_evidence", resource_type: "auto" });

      uploads.push({
        imageUrl: up.secure_url,
        publicId: up.public_id,
        uploadedAt: new Date(),
        latitude: Number(meta.latitude),
        longitude: Number(meta.longitude),
      });

      // cleanup local file
      try {
        fs.unlinkSync(f.path);
      } catch (e) {
        console.warn("unlink error", e.message);
      }
    }

    // Create evidence doc
    const newEvidence = await MilestoneEvidence.create({
      campaign: milestone.campaign,
      milestone: milestone._id,
      fundraiser: fundraiserId,
      description,
      uploads,
      status: "in_review",
    });

    // Update milestone reference & evidence status
    milestone.evidenceApprovalStatus = "submitted";
    milestone.evidenceRef = newEvidence._id;
    await milestone.save();

    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Evidence uploaded successfully. Pending admin review.",
      data: newEvidence,
    });
  } catch (error) {
    cleanupFiles(req.files || []);
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
    const campaignId = req.params.id;
    if (!campaignId)
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "campaignId required",
      });

    const milestones = await Milestone.find({ campaign: campaignId, status: "completed" }).sort({ sequence: 1 });
    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Milestones retrieved successfully",
      data: { milestones },
    });
  } catch (error) {
    console.error("getMilestoneAchieved error", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};



exports.getCampaignMilestones = async (req, res) => {
  try {
    const  campaignId  = req.params.id

    const milestones = await Milestone.find({ campaign: campaignId })
      .populate("campaign", "title")
      .sort({ sequence: 1 });

    const results = [];

    for (const milestone of milestones) {
      // Find payout for this milestone
      const payout = await Payout.findOne({
        milestone: milestone._id,
        status: { $in: ["processing", "paid"] },
      });

      // Find evidence for this milestone
      const evidence = await MilestoneEvidence.findOne({
        milestone: milestone._id,
      });

      // Determine display status
      let displayStatus = "pending"; // default

      if (payout && payout.status === "processing") {
        displayStatus = "ongoing";
      } else if (payout && payout.status === "paid" && evidence && evidence.status === "approved") {
        displayStatus = "completed";
      } else if (payout && payout.status === "paid") {
        displayStatus = "ongoing"; // funds released, evidence pending or under review
      }

      results.push({
        _id: milestone._id,
        milestoneTitle: milestone.milestoneTitle,
        milestoneDescription: milestone.milestoneDescription,
        targetAmount: milestone.targetAmount,
        releasedAmount: milestone.releasedAmount,
        sequence: milestone.sequence,
        status: displayStatus,
        evidenceStatus: evidence ? evidence.status : "none",
        evidenceUploads: evidence ? evidence.uploads : [],
        payoutStatus: payout ? payout.status : "none",
      });
    }

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Milestones fetched successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
