const mongoose = require("mongoose");
const { CAMPAIGN_CATEGORY_VALUES } = require("../enum/campaignCategoriesEnum");

const campaignSchema = new mongoose.Schema(
  {
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fundraiser",
      required: true,
    },
    campaignTitle: {
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
      required: true,
    },
    totalCampaignGoalAmount: {
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
    durationDays: {
      type: Number,
      required: true,
      min: 30,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    supportingDocuments: [
      {
        imageUrl: String,
        publicId: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "active", "completed", "rejected", "ended"],
      default: "pending",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    extensionRequests: [
      {
        days: { type: Number, required: true },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Fundraiser", required: true },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
        requestDate: { type: Date, default: Date.now },
      },
    ],
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
