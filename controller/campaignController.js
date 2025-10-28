const campaignModel = require("../model/campaignModel");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const { campaignNameToTitleCase } = require("../helper/nameConverter");
const fundraiserModel = require("../model/fundraiserModel");
const kycModel = require("../model/kycModel");
const milestoneModel = require("../model/milestoneModel");

exports.createACampaign = async (req, res) => {
  const fundraiserId = req.user.id;
  const file = req.file;

  try {
    const { campaignTitle, campaignDescription, TotalCampaignGoalAmount, campaignCategory, campaignDuration, milestones } = req.body;
    const user = await fundraiserModel.findById(fundraiserId);

    const checkVerifiedKyc = await kycModel.findOne({ fundraiserId: fundraiserId });

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Authenticated Fundraiser user not found.",
      });
    }

    if (user.isVerified === false) {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Account not verified. Please verify your email first.",
      });
    }

    if (!checkVerifiedKyc || checkVerifiedKyc.verificationStatus !== "verified") {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Can't create a campaign until your KYC is verified.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Only active fundraisers can create a campaign.",
      });
    }

    if (!campaignTitle || !campaignDescription || !TotalCampaignGoalAmount || !campaignCategory || !campaignDuration) {
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All fields are required (Title, Description, Goal, Category, Duration).",
      });
    }

    if (isNaN(TotalCampaignGoalAmount) || Number(TotalCampaignGoalAmount) <= 0) {
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Total Campaign Goal Amount must be a positive number.",
      });
    }

    if (!file) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign cover image or video is required.",
      });
    }

    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "At least one milestone is required to create a campaign.",
      });
    }

    const campaignCoverImageOrVideoUrl = await cloudinary.uploader.upload(file.path, {
      folder: "campaign_covers",
      resource_type: "auto",
    });

    fs.unlinkSync(file.path);

    const newCampaign = new campaignModel({
      fundraiser: fundraiserId, // Use the secured ID
      campaignTitle: campaignNameToTitleCase(campaignTitle),
      campaignDescription,
      TotalCampaignGoalAmount: Number(TotalCampaignGoalAmount),
      campaignCategory,
      campaignCoverImageOrVideo: {
        imageUrl: campaignCoverImageOrVideoUrl.secure_url,
        publicId: campaignCoverImageOrVideoUrl.public_id,
      },
      campaignDuration,
    });

    await newCampaign.save();

    const campaignId = newCampaign._id; // Store the ID for milestones

    // Map the incoming milestone data to the Milestone model structure
    const milestoneDocuments = milestones.map((m) => ({
      campaign: campaignId, // 💡 KEY FIX: Use the newly generated campaignId
      milestoneTitle: m.milestoneTitle,
      milestoneDescription: m.milestoneDescription,
      targetAmount: Number(m.targetAmount), // Ensure it's a number
      endDate: m.endDate, // Assuming format matches your schema's Date type
    }));

    // Insert all milestones into the database efficiently
    const createdMilestones = await milestoneModel.insertMany(milestoneDocuments);

    res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Campaign created successfully",
      data: {
        campaign: newCampaign,
        milestones: createdMilestones,
      },
    });
  } catch (error) {
    if (file && file.path) fs.unlinkSync(file.path);

    console.error("Error creating campaign:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getAllCampaigns = async (req, res) => {
  try {
    const userId = req.user.id;

    const allCampaigns = await campaignModel.find({ fundraiser: userId });

    if (allCampaigns.length === 0) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "No campaigns found for this fundraiser.",
      });
    }

    const activeCampaigns = allCampaigns.filter((c) => c.status === "active");
    const pendingCampaigns = allCampaigns.filter((c) => c.status === "pending");
    const completedCampaigns = allCampaigns.filter((c) => c.status === "completed");

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Campaigns retrieved successfully",
      data: {
        all: allCampaigns,
        active: activeCampaigns,
        pending: pendingCampaigns,
        completed: completedCampaigns,
        counts: {
          active: activeCampaigns.length,
          pending: pendingCampaigns.length,
          completed: completedCampaigns.length,
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving campaigns:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getOneCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = await campaignModel.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Campaign not found.",
      });
    }
    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Campaign retrieved successfully",
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
