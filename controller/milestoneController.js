const Milestone = require("../model/milestoneModel");
const MilestoneEvidence = require("../model/milestoneEvidenceModel");
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

    const newMilestone = new milestoneModel({
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

    const milestone = await milestoneModel.findByIdAndUpdate(
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
  try {
    const { milestoneId } = req.params;
    const { description } = req.body;
    const files = req.files || [];

    if (!description) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Description is required",
      });
    }
    if (!files.length) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "At least 1 evidence file is required",
      });
    }

    // find milestone + campaign
    const milestone = await Milestone.findById(milestoneId).populate("campaign");
    if (!milestone)
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Milestone not found",
      });

    const uploads = [];
    for (const f of files) {
      const up = await cloudinary.uploader.upload(f.path, { folder: "milestone_evidence", resource_type: "auto" });
      uploads.push({ imageUrl: up.secure_url, publicId: up.public_id, uploadedAt: new Date(), mimetype: f.mimetype });
      fs.unlinkSync(f.path);
    }

    const newEvidence = await MilestoneEvidence.create({
      campaign: milestone.campaign._id,
      milestone: milestone._id,
      fundraiser: req.user.id,
      description,
      uploads,
    });

    // update milestone status to show evidence is pending review (helps UI show it)
    milestone.verificationStatus = "evidence-pending";
    await milestone.save();

    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Evidence uploaded, pending admin review",
      data: newEvidence,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
