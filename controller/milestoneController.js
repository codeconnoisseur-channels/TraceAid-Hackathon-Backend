const Milestone = require("../model/milestoneModel");
const MilestoneEvidence = require("../model/milestoneEvidenceModel");
const Campaign = require("../model/campaignModel"); // New Import
const FundraiserWallet = require("../model/fundraiserWallet"); // New Import
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const Payout = require("../model/payoutModel");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

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

const cleanupFiles = (filesArr) =>
  (filesArr || []).forEach((f) => {
    try {
      if (f && f.path) fs.unlinkSync(f.path);
    } catch (e) {
      console.warn(`File unlink error: ${e?.message}`);
    }
  });

exports.uploadMilestoneEvidenceForMilestone = async (req, res) => {
  const fundraiserId = req.user?.id || req.user?._id;
  const milestoneId = req.params.id;
  const files = req.files || [];
  const { description } = req.body;

  try {
    if (!fundraiserId) {
      cleanupFiles(files);
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "Missing authenticated user",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid milestone id",
      });
    }
    if (!description) {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Description is required.",
      });
    }
    if (files.length < 5 || files.length > 10) {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `Exactly 5 to 10 evidence files required. Got ${files.length}.`,
      });
    }

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      cleanupFiles(files);
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Milestone not found",
      });
    }

    const campaign = await Campaign.findById(milestone.campaign);
    if (!campaign || String(campaign.fundraiser) !== String(fundraiserId)) {
      cleanupFiles(files);
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "You cannot upload evidence for a milestone of another fundraiser.",
      });
    }

    const isCampaignCompleted = campaign.status === "completed" || campaign.amountRaised >= campaign.totalCampaignGoalAmount;
    if (!isCampaignCompleted) {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "You can only upload milestone evidence after the campaign has reached its funding goal or is marked as completed.",
      });
    }

    const payout = await Payout.findOne({
      milestone: milestone._id,
      campaign: campaign._id,
    });

    if (!payout) {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "A withdrawal request for this milestone must be submitted first.",
      });
    }

    if (payout.status !== "paid") {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Not Eligible",
        message: `Admin must approve and disburse funds for this milestone before uploading evidence. Current payout status: ${payout.status}.`,
      });
    }

    const allowedStatuses = ["released"];
    if (!allowedStatuses.includes(milestone.status)) {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Not Eligible",
        message: `Evidence cannot be uploaded for a milestone in status: ${milestone.status}.`,
      });
    }

    if (milestone.evidenceApprovalStatus !== "required" && milestone.evidenceApprovalStatus !== "rejected") {
      cleanupFiles(files);
      return res.status(400).json({
        statusCode: false,
        statusText: "Not Eligible",
        message: `Evidence submission not currently required or previous evidence is already submitted/approved.`,
      });
    }

    const uploadedEvidence = [];
    for (const f of files) {
      const up = await cloudinary.uploader.upload(f.path, {
        folder: "milestone_evidence",
        resource_type: "auto",
      });

      uploadedEvidence.push({
        imageUrl: up.secure_url,
        publicId: up.public_id,
        uploadedAt: new Date(),
      });

      try {
        fs.unlinkSync(f.path);
      } catch (e) {
        console.warn("unlink error", e.message);
      }
    }

    const newEvidence = await MilestoneEvidence.create({
      campaign: campaign._id,
      milestone: milestone._id,
      fundraiser: fundraiserId,
      description,
      uploads: uploadedEvidence,
      status: "pending",
    });

    milestone.evidenceApprovalStatus = "submitted";
    milestone.status = "on-going";
    milestone.evidenceRef = newEvidence._id;
    await milestone.save();

    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Evidence uploaded and pending admin review. Remember, images must be stamped with location/time.",
      data: newEvidence,
    });
  } catch (error) {
    cleanupFiles(req.files || []);
    console.error("uploadMilestoneEvidenceForMilestone error:", error);
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
    const campaignId = req.params.id;

    const milestones = await Milestone.find({ campaign: campaignId }).populate("campaign", "title").sort({ sequence: 1 });

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
