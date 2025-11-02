const campaignModel = require("../model/campaignModel");
const fundraiserModel = require("../model/fundraiserModel");
const kycModel = require("../model/kycModel");
const milestoneModel = require("../model/milestoneModel");
const milestoneEvidenceModel = require("../model/milestoneEvidenceModel");
const cloudinary = require("../config/cloudinary");
const { campaignNameToTitleCase } = require("../helper/nameConverter");
const fs = require("fs");
const path = require("path");

// Helper function to calculate date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// -------------------- FUNDRAISER ACTIONS --------------------

exports.createACampaign = async (req, res) => {
  const fundraiserId = req.user.id || req.user._id;
  const file = req.file;

  try {
    let { campaignTitle, campaignDescription, totalCampaignGoalAmount, campaignCategory, durationDays, milestones } = req.body;

    if (!campaignTitle || !campaignDescription || !totalCampaignGoalAmount || !campaignCategory || !durationDays) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All campaign fields are required.",
      });
    }

    const goalAmount = Number(totalCampaignGoalAmount);
    const duration = Number(durationDays);
    if (isNaN(goalAmount) || goalAmount <= 0) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Total Campaign Goal Amount must be a positive number.",
      });
    }
    if (isNaN(duration) || duration < 30) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign duration must be at least 30 days.",
      });
    }
    if (!file) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign cover image or video is required.",
      });
    }

    // --- 2. Fundraiser/KYC Checks (Retained from original code) ---
    const user = await fundraiserModel.findById(fundraiserId);
    if (!user || user.status !== "active" || user.isVerified === false || user.kycStatus !== "verified") {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Account is not verified or active. Please verify KYC.",
      });
    }
    const checkVerifiedKyc = await kycModel.findOne({ fundraiserId: fundraiserId, verificationStatus: "verified" });
    if (!checkVerifiedKyc) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "KYC not verified. Please verify your KYC first.",
      });
    }

    // --- 3. Milestones Parsing and Validation ---
    if (typeof milestones === "string") {
      try {
        milestones = JSON.parse(milestones);
      } catch (err) {
        if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: "Invalid milestones format. Must be a valid JSON array.",
        });
      }
    }
    if (!milestones || !Array.isArray(milestones) || milestones.length < 1) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "At least one milestone is required to create a campaign.",
      });
    }

    // **CRITICAL BUSINESS RULE: Sum of Milestone Targets MUST equal Campaign Goal**
    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + Number(m.targetAmount), 0);
    if (totalMilestoneAmount !== goalAmount) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `Sum of all milestone targets (${totalMilestoneAmount}) must exactly match the Total Campaign Goal Amount (${goalAmount}).`,
      });
    }

    const campaignCoverImageOrVideoUrl = await cloudinary.uploader.upload(file.path, {
      folder: "campaign_covers",
      resource_type: "auto",
    });
    fs.unlinkSync(file.path);

    const newCampaign = new campaignModel({
      fundraiser: fundraiserId,
      campaignTitle: campaignNameToTitleCase(campaignTitle),
      campaignDescription,
      totalCampaignGoalAmount: goalAmount,
      campaignCategory,
      durationDays: duration, // Store the number of days
      campaignCoverImageOrVideo: {
        imageUrl: campaignCoverImageOrVideoUrl.secure_url,
        publicId: campaignCoverImageOrVideoUrl.public_id,
      },
      // startDate, endDate, isActive are set by Admin on activation
      status: "pending", // Default status
    });

    await newCampaign.save();
    const campaignId = newCampaign._id;

    // --- 5. Milestone Insertion with Sequence ---
    const milestoneDocuments = milestones.map((m, index) => ({
      campaign: campaignId,
      milestoneTitle: m.milestoneTitle,
      milestoneDescription: m.milestoneDescription,
      targetAmount: Number(m.targetAmount),
      sequence: index + 1,
    }));

    const createdMilestones = await milestoneModel.insertMany(milestoneDocuments);

    res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Campaign created successfully. Pending Admin review.",
      data: {
        campaign: newCampaign,
        milestones: createdMilestones,
      },
    });
  } catch (error) {
    if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    console.error("Error creating campaign:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * Fundraiser submits a request to extend the campaign duration.
 */
exports.requestExtension = async (req, res) => {
  const fundraiserId = req.user.id || req.user._id;
  const { campaignId } = req.params;
  const { days, reason } = req.body;

  try {
    if (!days || !reason || Number(days) <= 0) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Days and reason are required for the extension request. Days must be a positive number.",
      });
    }

    const campaign = await campaignModel.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({ statusCode: false, statusText: "Not Found", message: "Campaign not found." });
    }

    if (campaign.fundraiser.toString() !== fundraiserId.toString()) {
      return res
        .status(403)
        .json({ statusCode: false, statusText: "Forbidden", message: "You are not authorized to request an extension for this campaign." });
    }

    if (campaign.status !== "active") {
      return res.status(403).json({ statusCode: false, statusText: "Forbidden", message: "Only active campaigns can request an extension." });
    }

    // Check for existing pending request
    const pendingRequest = campaign.extensionRequests.some((r) => r.status === "pending");
    if (pendingRequest) {
      return res
        .status(400)
        .json({ statusCode: false, statusText: "Bad Request", message: "A pending extension request already exists for this campaign." });
    }

    // Add the new request to the extensionRequests array
    const newRequest = {
      days: Number(days),
      reason,
      requestedAt: new Date(),
      status: "pending", // Admin will change this status
    };

    campaign.extensionRequests.push(newRequest);
    await campaign.save();

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: `Extension request for ${days} days submitted successfully. Pending Admin review.`,
      data: newRequest,
    });
  } catch (error) {
    console.error("Error requesting extension:", error);
    res.status(500).json({ statusCode: false, statusText: "Internal Server Error", message: error.message });
  }
};

// ... (Other existing functions like getAllCampaigns, getOneCampaign, getCampaignWithMilestonesAndEvidence remain here)
// For brevity, I only show the one you provided, with minor cleanup:

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

    // Status tracking updated to include 'ended'
    const activeCampaigns = allCampaigns.filter((c) => c.status === "active");
    const pendingCampaigns = allCampaigns.filter((c) => c.status === "pending");
    const completedCampaigns = allCampaigns.filter((c) => c.status === "completed" || c.status === "ended");

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
    // Optionally populate fundraiser data here
    const campaign = await campaignModel.findById(campaignId).populate("fundraiser", "name email");
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

    // Milestones should be sorted by sequence for correct display
    const milestones = await milestoneModel.find({ campaign: id }).sort({ sequence: 1 }).lean();
    const milestoneIds = milestones.map((m) => m._id);

    // Find evidences linked to the milestones
    const evidences = await milestoneEvidenceModel.find({ milestone: { $in: milestoneIds } }).lean();

    // Map evidences to milestones
    const evidenceMap = {};
    evidences.forEach((e) => {
      evidenceMap[e.milestone] = evidenceMap[e.milestone] || [];
      evidenceMap[e.milestone].push(e);
    });

    // Integrate evidence into the respective milestone objects
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
