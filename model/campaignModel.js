const mongoose = require("mongoose");
const { CAMPAIGN_CATEGORY_VALUES } = require("../enum/campaignCategoriesEnum");

const campaignSchema = new mongoose.Schema(
  {
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fundraiser",
      required: true,
    },
   CampaignTitle: {
      type: String,
      required: true,
      trim: true,
    },
    campaignDescription: {
      type: String,
      required: true,
      trim: true,
    },
    campaignCategory: {
      type: String,
      enum: CAMPAIGN_CATEGORY_VALUES,
      required: true,
    },
    TotalCampaignGoalAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    amountRaised: {
      type: Number,
      default: 0,
    },
    campaignCoverImageOrVideo: {
      imageUrl: String,
      publicId: String,
    },
    campaignDuration: {
      endDate: {
        type: Date,
        required: true,
      },
    },
    supportingDocuments: [
      {
        imageUrl: String,
        publicId: String,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "active", "completed", "rejected"],
      default: "draft",
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    progressPercentage: {
      type: Number,
      default: 0,
    },
    donorCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    saveCount: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Campaign = mongoose.model("Campaign", campaignSchema);
module.exports = Campaign;
