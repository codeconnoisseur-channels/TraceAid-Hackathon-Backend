const Campaign = require("../model/campaignModel");
const Engagement = require("../model/engagementModel");

exports.toggleEngagement = async (req, res) => {
  const { campaignId, actionType } = req.params;
  if (!["like", "save"].includes(actionType)) {
    return res.status(400).json({
      statusCode: false,
      statusText: "Bad Request",
      message: 'Invalid action type. Must be "like" or "save".',
    });
  }

  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "User not authenticated.",
      });
    }

    const counterField = `${actionType}Count`;
    const filter = { userId, campaign: campaignId, actionType };

    const existing = await Engagement.findOne(filter).lean();

    let isEngaged;
    let message;

    if (existing) {
      // User already engaged -> toggle off: delete engagement and decrement counter
      await Engagement.deleteOne({ _id: existing._id });

      const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, { $inc: { [counterField]: -1 } }, { new: true }).select(counterField);

      if (!updatedCampaign) {
        return res.status(404).json({
          statusCode: false,
          statusText: "Not Found",
          message: "Campaign not found.",
        });
      }

      isEngaged = false;
      message = `Campaign successfully un-${actionType}d.`;

      return res.status(200).json({
        success: true,
        message,
        isEngaged,
        [counterField]: updatedCampaign[counterField] || 0,
      });
    } else {
      // Not engaged -> toggle on: create engagement (upsert) and increment counter
      // Use upsert with setOnInsert to be race-safe with unique index
      await Engagement.updateOne(filter, { $setOnInsert: filter }, { upsert: true });

      const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, { $inc: { [counterField]: 1 } }, { new: true }).select(counterField);

      if (!updatedCampaign) {
        // Roll back engagement if campaign missing to keep consistency
        await Engagement.deleteOne(filter).catch(() => {});
        return res.status(404).json({
          statusCode: false,
          statusText: "Not Found",
          message: "Campaign not found.",
        });
      }

      isEngaged = true;
      message = `Campaign successfully ${actionType}d.`;

      return res.status(200).json({
        success: true,
        message,
        isEngaged,
        [counterField]: updatedCampaign[counterField] || 0,
      });
    }
  } catch (error) {
    // Do not reference actionType here; it is validated earlier
    console.error("Error toggling engagement:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.recordShare = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { channel, userCaption } = req.body;

    const userId = req.user._id; // Check if userType is present on the authenticated user object.
    const userType = req.user.userType;

    if (!userType) {
      console.error("Authentication Error: userType is missing from req.user object.");
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "User session incomplete. Missing user type for engagement tracking.",
      });
    }

    if (!["X", "Facebook", "Instagram", "CopyLink"].includes(channel)) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid sharing channel provided.",
      });
    }

    if (!userCaption) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Caption is required for sharing.",
      });
    }
    if (!campaignId) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign ID is required.",
      });
    }
    await Engagement.create({
      userId,
      userType,
      actionType: "share",
      campaign: campaignId,
      channel: channel,
      userCaption: userCaption || null,
    });

    const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, { $inc: { shareCount: 1 } }, { new: true, select: "shareCount" });

    if (!updatedCampaign) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Campaign not found.",
      });
    }

    res.status(201).json({
      success: true,
      message: `Share recorded successfully via ${channel}.`,
      shareCount: updatedCampaign.shareCount,
    });
  } catch (error) {
    console.error("Error recording share:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: "Server error recording share action.",
    });
  }
};

exports.getAllSavedCampaignsByID = async (req, res) => {
  try {
    const userId = req.user._id;
    const savedEngagements = await Engagement.find({ userId, actionType: "save" }).populate("campaign");

    if (!savedEngagements || savedEngagements.length === 0) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "No saved campaigns found for this user.",
      });
    }
    const savedCampaigns = savedEngagements.map((engagement) => engagement.campaign);
    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Saved campaigns retrieved successfully",
      data: savedCampaigns,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
