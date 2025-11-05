const Campaign = require("../model/campaignModel");
const Engagement = require("../model/engagementModel");

exports.toggleEngagement = async (req, res) => {
  const { campaignId, actionType } = req.params;

  const userId = req.user.id;
  const userType = req.user.userType;

  if (!["like", "save"].includes(actionType)) {
    return res.status(400).json({
      statusCode: false,
      statusText: "Bad Request",
      message: 'Invalid action type. Must be "like" or "save".',
    });
  }

  const counterField = ` ${actionType}Count`;

  try {
    const filter = { userId, userType, actionType, campaign: campaignId };

    const existingEngagement = await Engagement.findOne(filter);

    let updateCampaign;
    let isEngaged;
    let message;

    if (existingEngagement) {
      await Engagement.deleteOne(filter);
      updateCampaign = { $inc: { [counterField]: -1 } };
      isEngaged = false;
      message = `Campaign successfully un-${actionType}d.`;
    } else {
      await Engagement.create(filter);
      updateCampaign = { $inc: { [counterField]: 1 } };
      isEngaged = true;
      message = `Campaign successfully ${actionType}d.`;
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, updateCampaign, { new: true, select: counterField });

    if (!updatedCampaign) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Campaign not found.",
      });
    }

    res.status(200).json({
      success: true,
      message,
      isEngaged,
      [counterField]: updatedCampaign[counterField],
    });
  } catch (error) {
    console.error(`Error toggling ${actionType}:`, error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};


exports.recordShare = async (req, res) => {
  const { campaignId } = req.params;
  const { channel, userCaption } = req.body;

  const userId = req.user.id;
  const userType = req.user.userType;

  if (!["X", "Facebook", "Instagram", "CopyLink"].includes(channel)) {
    return res.status(400).json({
      statusCode: false,
      statusText: "Bad Request",
      message: "Invalid sharing channel provided.",
    });
  }

  try {
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
