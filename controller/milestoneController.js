import * as cloudinary from "cloudinary";
import * as fs from "fs";
const milestoneModel = require("../model/milestoneModel");

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
