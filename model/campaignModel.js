const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fundraiser",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Health", "Education", "Community", "Environment", "Others"],
      required: true,
    },
    goalAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    amountRaised: {
      type: Number,
      default: 0,
    },
    coverMedia: {
      imageUrl: String,
      publicId: String,
    },
    timeline: {
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
