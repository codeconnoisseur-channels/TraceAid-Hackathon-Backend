const campaignModel = require("../model/campaignModel");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const { campaignNameToTitleCase } = require("../helper/nameConverter");
const fundraiserModel = require("../model/fundraiserModel");
const kycModel = require("../model/kycModel");
const milestoneModel = require("../model/milestoneModel");
const milestoneEvidenceModel = require("../model/milestoneEvidenceModel");

exports.createACampaign = async (req, res) => {
  console.log("AUTH USER OBJECT:", req.user);

  const fundraiserId = req.user.id || req.user._id;
  const file = req.file;

  try {
    let { campaignTitle, campaignDescription, totalCampaignGoalAmount, campaignCategory, campaignDuration, milestones } = req.body;

    if (!campaignTitle || !campaignDescription || !totalCampaignGoalAmount || !campaignCategory || !campaignDuration) {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All fields are required (Title, Description, Goal, Category, Duration).",
      });
    }
    // If milestones came as a string (from form-data), parse it
    if (typeof milestones === "string") {
      try {
        milestones = JSON.parse(milestones);
      } catch (err) {
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: "Invalid milestones format. Must be a valid JSON array.",
        });
      }
    }

    if (!file) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign cover image or video is required.",
      });
    }

    const user = await fundraiserModel.findById(fundraiserId);
    console.log("USER:", user);

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Authenticated Fundraiser user not found.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Only active fundraisers can create a campaign.",
      });
    }

    if (user.isVerified === false) {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Account not verified. Please verify your email first.",
      });
    }

    if (user.kycStatus === "not_submitted") {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "You must submit your KYC before creating a campaign.",
      });
    }

    if (user.kycStatus === "pending") {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "KYC is under review. You can create a campaign after approval.",
      });
    }

    if (user.kycStatus === "rejected") {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Your KYC was rejected. Please resubmit and wait for approval.",
      });
    }

    if (user.kycStatus !== "verified") {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "KYC not verified. Please verify your KYC first.",
      });
    }

    const checkVerifiedKyc = await kycModel.findOne({ fundraiserId: req.user.id, verificationStatus: "verified" });
    console.log("KYC:", checkVerifiedKyc);

    if (!checkVerifiedKyc) {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "KYC not verified. Please verify your KYC first.",
      });
    }

    if (isNaN(totalCampaignGoalAmount) || Number(totalCampaignGoalAmount) <= 0) {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
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

    console.log("RAW BODY:", req.body);

    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
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
      totalCampaignGoalAmount: Number(totalCampaignGoalAmount),
      campaignCategory,
      campaignCoverImageOrVideo: {
        imageUrl: campaignCoverImageOrVideoUrl.secure_url,
        publicId: campaignCoverImageOrVideoUrl.public_id,
      },
      campaignDuration: {
        endDate: new Date(campaignDuration),
      },
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
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
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

exports.getCampaignWithMilestonesAndEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await campaignModel.findById(id).lean();
    if (!campaign)
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Campaign not found",
      });

    const milestones = await milestoneModel.find({ campaign: id }).lean();
    const milestoneIds = milestones.map((m) => m._id);
    const evidences = await milestoneEvidenceModel.find({ milestone: { $in: milestoneIds } }).lean();

    // map evidences to milestones
    const evidenceMap = {};
    evidences.forEach((e) => {
      evidenceMap[e.milestone] = evidenceMap[e.milestone] || [];
      evidenceMap[e.milestone].push(e);
    });

    const milestonesWithEvidence = milestones.map((m) => ({ ...m, evidences: evidenceMap[m._id] || [] }));

    return res.json({
      statusCode: true,
      statusText: "OK",
      data: { campaign, milestones: milestonesWithEvidence },
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

