const campaignModel = require("../model/campaignModel");
const fundraiserModel = require("../model/fundraiserModel");
const kycModel = require("../model/kycModel");
const milestoneModel = require("../model/milestoneModel");
const milestoneEvidenceModel = require("../model/milestoneEvidenceModel");
const cloudinary = require("../config/cloudinary");
const { campaignNameToTitleCase } = require("../helper/nameConverter");
const fs = require("fs");
const path = require("path");
const { campaignAndMilestonesUnderReview } = require("../emailTemplate/emailVerification");
const { sendEmail } = require("../utils/brevo");


exports.createACampaign = async (req, res) => {
  const fundraiserId = req.user.id || req.user._id;
  const file = req.file;

  console.log(req.file);

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

    if (duration > 30) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign duration must not exceed 30 days.",
      });
    }

    if (!file) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign cover image or video is required.",
      });
    }

    if (!file.path) {
      return res.status(500).json({
        statusCode: false,
        statusText: "Internal Server Error",
        message: "File processing failed. Ensure file is correctly uploaded.",
      });
    }

    const user = await fundraiserModel.findById(fundraiserId);
    if (!user || user.status !== "active" || user.isVerified === false || user.kycStatus !== "verified") {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Account is not verified or active. Please verify KYC.",
      });
    }

    if (user.kycStatus !== "verified") {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "KYC verification is required for this fundraiser.",
      });
    }

    const kyc = await kycModel.findOne({ user: fundraiserId });
    if (!kyc) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "KYC record not found",
      });
    }

    if (kyc.verificationStatus !== "verified") {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "KYC verification is required for this fundraiser.",
      });
    }

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

    const MAX_MILESTONES = 3;
    if (milestones.length > MAX_MILESTONES) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `A campaign cannot have more than ${MAX_MILESTONES} milestones.`,
      });
    }

    const titles = new Set();
    let totalTargetAmountCheck = 0;

    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];
      // Use 1-based index for user messages
      const index = i + 1;

      if (!milestone.milestoneTitle || !milestone.milestoneDescription || !milestone.targetAmount) {
        if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: `Milestone ${index} is missing a title, description, or target amount.`,
        });
      }

      const targetAmount = Number(milestone.targetAmount);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: `Target amount for Milestone ${index} must be a positive number.`,
        });
      }

      const normalizedTitle = milestone.milestoneTitle.trim().toLowerCase();
      if (titles.has(normalizedTitle)) {
        if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: `Milestone title "${milestone.milestoneTitle}" is a duplicate. All milestone titles must be unique.`,
        });
      }
      titles.add(normalizedTitle);

      totalTargetAmountCheck += targetAmount;
    }

    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + Number(m.targetAmount), 0);
    if (totalTargetAmountCheck !== goalAmount) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `Sum of all milestone targets (${totalMilestoneAmount}) must exactly match the Total Campaign Goal Amount (${goalAmount}).`,
      });
    }

    const campaignCoverImageOrVideo = await cloudinary.uploader.upload(file.path, {
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
      durationDays: duration,
      campaignCoverImageOrVideo: {
        imageUrl: campaignCoverImageOrVideo.secure_url,
        publicId: campaignCoverImageOrVideo.public_id,
      },
      status: "pending",
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
    if (!createdMilestones) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(500).json({
        statusCode: false,
        statusText: "Internal Server Error",
        message: "Failed to save milestones.",
      });
    }

    if (!createdMilestones || createdMilestones.length !== milestoneDocuments.length) {
      await campaignModel.findByIdAndDelete(campaignId);
      return res.status(500).json({
        statusCode: false,
        statusText: "Internal Server Error",
        message: "Failed to save all required milestones. Campaign creation aborted.",
      });
    }

    const pendingCampaignAndMilesstonesEmail = campaignAndMilestonesUnderReview(user.organizationName, newCampaign.campaignTitle, createdMilestones);

    const mailDetails = {
      email: user.email,
      subject: `Campaign Submitted: ${newCampaign.campaignTitle}`,
      html: pendingCampaignAndMilesstonesEmail,
    };

    await sendEmail(mailDetails);

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

exports.getAllCampaign = async (req, res) => {
  try {

    const allCampaigns = await campaignModel.find();

    if (allCampaigns.length === 0) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "No campaigns in the database.",
      });
    }

    const activeCampaigns = allCampaigns.filter((c) => c.status === "active");
    const pendingCampaigns = allCampaigns.filter((c) => c.status === "pending");
    const completedCampaigns = allCampaigns.filter((c) => c.status === "completed" || c.status === "ended");

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Campaigns retrieved successfully",
      numberOfCampaigns: allCampaigns.length,
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
