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
const payoutModel = require("../model/payoutModel");
const mongoose = require("mongoose");
const { CAMPAIGN_CATEGORY_VALUES } = require("../enum/campaignCategoriesEnum");

exports.createACampaign = async (req, res) => {
  const fundraiserId = req.user.id || req.user._id;
  const file = req.file;

  // helper to parse days flexibly (e.g., "30", "30 days", "3,000days")
  const parseDays = (input) => {
    if (input === null || input === undefined) return NaN;
    const str = String(input).trim().toLowerCase();
    const match = str.match(/^\s*([0-9][0-9_,]*)\s*(days?)?\b/);
    if (!match) return NaN;
    const numeric = match[1].replace(/[,_]/g, "");
    const value = Number(numeric);
    if (!Number.isFinite(value) || value < 0) return NaN;
    return value;
  };

  try {
    let { campaignTitle, campaignDescription, totalCampaignGoalAmount, campaignCategory, durationDays, milestones } = req.body;

    // Basic required checks
    if (!campaignTitle || !campaignDescription || !totalCampaignGoalAmount || !campaignCategory || !durationDays) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All campaign fields are required. Kindly provide all necessary information.",
      });
    }

    // Sanitize strings
    campaignTitle = String(campaignTitle).trim();
    campaignDescription = String(campaignDescription).trim();

    if (campaignTitle.length < 5 || campaignTitle.length > 100) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign title must be between 5 and 100 characters.",
      });
    }

    // Ensure title uniqueness for this fundraiser only (await the async query)
    const normalizedTitle = campaignNameToTitleCase(campaignTitle);
    const titleExists = await campaignModel.exists({
      campaignTitle: normalizedTitle,
      fundraiser: fundraiserId,
    });

    if (titleExists) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "You already have a campaign with this title. Kindly choose a different title.",
      });
    }

    if (campaignDescription.length < 20) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign description must be at least 20 characters.",
      });
    }

    if (!CAMPAIGN_CATEGORY_VALUES.includes(campaignCategory)) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid campaign category provided.",
        validCategories: CAMPAIGN_CATEGORY_VALUES,
      });
    }

    // Amount validations
    const goalAmount = Number(
      String(totalCampaignGoalAmount)
        .toString()
        .replace(/[,\s_]/g, "")
    );

    if (isNaN(goalAmount) || goalAmount <= 0) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Total Campaign Goal Amount must be a positive number.",
      });
    }

    if (goalAmount < 1000) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Minimum campaign campaign goal amount should not be less than NGN1,000",
      });
    }

    // Duration validations (parse flexible input and bound)
    const duration = parseDays(durationDays);

    if (!Number.isFinite(duration) || duration < 30 || duration > 365) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign duration must be a valid number of days between 30 and 365.",
      });
    }

    // File validations
    if (!file || !file.path) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign cover image or video is required.",
      });
    }
    // Optional: basic mime/type validation using multer-provided mimetype
    if (file.mimetype && !/^image\//.test(file.mimetype) && !/^video\//.test(file.mimetype)) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Only image or video files are allowed for the campaign cover.",
      });
    }

    const user = await fundraiserModel.findById(fundraiserId);
    if (!user || user.status !== "active" || user.kycStatus !== "verified") {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Account not active or KYC not verified.",
      });
    }

    const kyc = await kycModel.findOne({ user: fundraiserId });
    if (!kyc || kyc.verificationStatus !== "verified") {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "KYC verification is required for this fundraiser.",
      });
    }

    // Milestones parsing
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

    if (!Array.isArray(milestones) || milestones.length !== 3) {
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Milestones must be exactly 3 in number.",
      });
    }

    // Validate each milestone structure
    const percentageDistribution = [30, 50, 20];
    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      if (!m || !m.milestoneTitle || !m.milestoneDescription) {
        if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: `Milestone ${i + 1} must include milestoneTitle and milestoneDescription.`,
        });
      }
      if (String(m.milestoneTitle).trim().length < 3) {
        if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: `Milestone ${i + 1} title must be at least 3 characters.`,
        });
      }
      if (String(m.milestoneDescription).trim().length < 10) {
        if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: `Milestone ${i + 1} description must be at least 10 characters.`,
        });
      }
    }

    const milestoneDocuments = milestones.map((m, index) => {
      const targetAmount = (goalAmount * percentageDistribution[index]) / 100;

      return {
        campaign: null,
        milestoneTitle: String(m.milestoneTitle).trim(),
        milestoneDescription: String(m.milestoneDescription).trim(),
        targetAmount: Number(targetAmount.toFixed(2)),
        sequence: index + 1,
      };
    });

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

    milestoneDocuments.forEach((m) => (m.campaign = newCampaign._id));
    const createdMilestones = await milestoneModel.insertMany(milestoneDocuments);

    const pendingCampaignAndMilestonesEmail = campaignAndMilestonesUnderReview(user.organizationName, newCampaign.campaignTitle, createdMilestones);

    await sendEmail({
      email: user.email,
      subject: `Campaign Submitted: ${newCampaign.campaignTitle}`,
      html: pendingCampaignAndMilestonesEmail,
    });

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

exports.getAllActiveCampaigns = async (req, res) => {
  try {
    const allCampaigns = await campaignModel.find();

    if (allCampaigns.length === 0) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "No campaigns found for this fundraiser.",
      });
    }

    // Status tracking updated to include 'ended'
    const activeCampaigns = allCampaigns.filter((c) => c.status === "active");

    //shuffle the active campaigns based on how many times the api is called
    const shuffledCampaigns = activeCampaigns.sort(() => Math.random() - 0.5);
    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Campaigns retrieved successfully",
      data: {
        active: shuffledCampaigns,
        counts: {
          active: activeCampaigns.length,
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

exports.getAllCampaignsByFundraiser = async (req, res) => {
  try {
    const userId = req.user.id;

    const allCampaigns = await campaignModel.find({ fundraiser: userId }).lean();

    if (allCampaigns.length === 0) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "No campaigns found for this fundraiser.",
      });
    }

    const campaignIds = allCampaigns.map((c) => c._id);
    const allMilestones = await milestoneModel
      .find({ campaign: { $in: campaignIds } })
      .select(
        "campaign milestoneTitle milestoneDescription targetAmount releasedAmount status evidenceApprovalStatus fundsReleasedAt createdAt updatedAt"
      )
      .sort({ sequence: 1 })
      .lean();

    const milestonesByCampaign = allMilestones.reduce((acc, m) => {
      const key = m.campaign.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});

    const campaignsWithMilestones = allCampaigns.map((campaign) => ({
      ...campaign,
      milestones: milestonesByCampaign[campaign._id.toString()] || [],
    }));

    const activeCampaigns = campaignsWithMilestones.filter((c) => c.status === "active");
    const approvedCampaigns = campaignsWithMilestones.filter((c) => c.status === "approved");
    const pendingCampaigns = campaignsWithMilestones.filter((c) => c.status === "pending");
    const completedCampaigns = campaignsWithMilestones.filter((c) => ["completed", "ended"].includes(c.status));

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Campaigns with milestones retrieved successfully",
      data: {
        all: campaignsWithMilestones,
        active: activeCampaigns,
        approved: approvedCampaigns,
        pending: pendingCampaigns,
        completed: completedCampaigns,
        counts: {
          active: activeCampaigns.length,
          approved: approvedCampaigns.length,
          pending: pendingCampaigns.length,
          completed: completedCampaigns.length,
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving campaigns with milestones:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getAllCampaignsByAFundraiser = async (req, res) => {
  try {
    const userId = req.user.id;

    const allCampaigns = await campaignModel.find({ fundraiser: userId }).sort({ createdAt: -1 });

    if (allCampaigns.length === 0) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "No campaigns found for this fundraiser.",
      });
    }

    const processedCampaigns = [];

    for (const campaign of allCampaigns) {
      const now = new Date();
      const endDate = new Date(campaign.createdAt);
      endDate.setDate(endDate.getDate() + (campaign.durationDays || 30));

      const hasReachedTarget = campaign.amountRaised >= campaign.totalCampaignGoalAmount;
      const hasExpired = now >= endDate;

      if ((hasReachedTarget || hasExpired) && campaign.status === "active") {
        campaign.status = "completed";
        await campaign.save();
      }

      const milestones = await milestoneModel.find({ campaign: campaign._id }).sort({ sequence: 1 });
      const milestoneDetails = [];

      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];
        const payout = await payoutModel.findOne({ milestone: milestone._id });
        const evidence = await milestoneEvidenceModel.findOne({ milestone: milestone._id });

        let canRequestWithdrawal = false;
        let canUploadEvidence = false;
        let milestoneStatus = "pending";

        if (campaign.status === "completed") {
          const isFirstMilestone = i === 0;
          const prevMilestone = milestones[i - 1];
          const prevApproved = isFirstMilestone || (await milestoneEvidenceModel.findOne({ milestone: prevMilestone?._id, status: "approved" }));

          if (prevApproved) {
            if (!payout) {
              canRequestWithdrawal = true;
              milestoneStatus = "ready_for_request";
            } else if (payout.status === "processing") {
              milestoneStatus = "awaiting_disbursement";
            } else if (payout.status === "paid" && !evidence) {
              canUploadEvidence = true;
              milestoneStatus = "awaiting_evidence";
            } else if (payout.status === "paid" && evidence?.status === "pending") {
              milestoneStatus = "evidence_under_review";
            } else if (payout.status === "paid" && evidence?.status === "approved") {
              milestoneStatus = "completed";
            }
          }
        }

        milestoneDetails.push({
          _id: milestone._id,
          title: milestone.milestoneTitle,
          targetAmount: milestone.targetAmount,
          sequence: milestone.sequence,
          payoutStatus: payout?.status || "none",
          evidenceStatus: evidence?.status || "none",
          canRequestWithdrawal,
          canUploadEvidence,
          milestoneStatus,
        });
      }

      const summary = {
        totalMilestones: milestones.length,
        completedMilestones: milestoneDetails.filter((m) => m.milestoneStatus === "completed").length,
        remainingMilestones: milestones.length - milestoneDetails.filter((m) => m.milestoneStatus === "completed").length,
        allMilestonesApproved: milestoneDetails.every((m) => m.milestoneStatus === "completed"),
      };

      processedCampaigns.push({
        _id: campaign._id,
        campaignTitle: campaign.campaignTitle,
        amountRaised: campaign.amountRaised,
        totalCampaignGoalAmount: campaign.totalCampaignGoalAmount,
        status: campaign.status,
        createdAt: campaign.createdAt,
        endDate: endDate,
        durationDays: campaign.durationDays,
        campaignCategory: campaign.campaignCategory,
        campaignDescription: campaign.campaignDescription,
        campaignCoverImageOrVideo: campaign.campaignCoverImageOrVideo,
        donorCount: campaign.donorCount || 0,
        summary,
        milestones: milestoneDetails,
      });
    }

    const activeCampaigns = processedCampaigns.filter((c) => c.status === "active");
    const pendingCampaigns = processedCampaigns.filter((c) => c.status === "pending");
    const completedCampaigns = processedCampaigns.filter((c) => c.status === "completed");

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Campaigns retrieved successfully",
      data: {
        all: processedCampaigns,
        active: activeCampaigns,
        pending: pendingCampaigns,
        completed: completedCampaigns,
        counts: {
          total: processedCampaigns.length,
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

exports.getACampaignAndMilestone = async (req, res) => {
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
    const milestones = await milestoneModel.find({ campaign: campaignId });
    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Campaign and its milestones retrieved successfully",
      data: {
        campaign,
        milestones,
      },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getCampaignAndMilestoneOfAFundraiser = async (req, res) => {
  try {
    const fundraiserId = req.user.id || req.user._id;
    const campaigns = await campaignModel.find({ fundraiser: fundraiserId }).lean();
    if (campaigns.length === 0) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "No campaigns found for the specified fundraiser",
      });
    }
    const campaignIds = campaigns.map((c) => c._id);
    const milestones = await milestoneModel.find({ campaign: { $in: campaignIds } }).lean();
    const milestoneMap = {};
    milestones.forEach((m) => {
      milestoneMap[m.campaign] = milestoneMap[m.campaign] || [];
      milestoneMap[m.campaign].push(m);
    });
    const campaignsWithMilestones = campaigns.map((c) => ({
      ...c,
      milestones: milestoneMap[c._id] || [],
    }));
    return res.json({
      statusCode: true,
      statusText: "OK",
      data: campaignsWithMilestones,
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

exports.checkCampaignCompletion = async (req, res) => {
  try {
    const campaignId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid campaign ID",
      });
    }

    const campaign = await campaignModel.findById(campaignId).lean();
    if (!campaign) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Campaign not found",
      });
    }

    if (campaign.status === "pending") {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign is still under review by admin. It must be active and completed before you can upload Milestone Evidence.",
      });
    }

    if (campaign.status === "active") {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign is not completed yet. Complete your campaign before uploading Milestone Evidence.",
      });
    }

    if (campaign.status === "approved") {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign is not active yet, it has to be active then completed before uploading Milestone Evidence.",
      });
    }

    const now = new Date();
    let endDate = campaign.endDate || null;

    if (!endDate && campaign.createdAt && campaign.durationDays) {
      endDate = new Date(campaign.createdAt);
      endDate.setDate(endDate.getDate() + campaign.durationDays);
    }

    const reachedGoal = (campaign.amountRaised || 0) >= (campaign.totalCampaignGoalAmount || 0);

    const expired = endDate ? now >= endDate : false;
    const isCompleted = campaign.status === "completed" || reachedGoal || expired;

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: isCompleted ? "Campaign is completed or expired." : "Campaign is not yet completed.",
      data: {
        campaignId,
        isCompleted,
        reachedGoal,
        expired,
        campaignStatus: campaign.status,
      },
    });
  } catch (error) {
    console.error("checkCampaignCompletion error:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.searchCampaignsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!CAMPAIGN_CATEGORY_VALUES.includes(category)) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `Invalid campaign category provided: ${category}. Please use one of the predefined categories.`,
        validCategories: CAMPAIGN_CATEGORY_VALUES,
      });
    }

    const campaigns = await campaignModel.find({
      campaignCategory: category,
      status: "active",
    });

    if (campaigns.length === 0) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: `No active campaigns found in the category: ${category}`,
      });
    }

    // --- 3. Success Response ---
    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Campaigns retrieved successfully",
      data: campaigns,
    });
  } catch (error) {
    console.error("searchCampaignsByCategory error:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
