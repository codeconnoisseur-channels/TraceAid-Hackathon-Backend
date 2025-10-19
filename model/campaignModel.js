const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Campaign title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Campaign description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["Health", "Education", "Community", "Environment", "Others"],
      required: [true, "Campaign category is required"],
    },
    goalAmount: {
      type: Number,
      required: [true, "Total campaign goal amount is required"],
      min: [1, "Goal amount must be greater than 0"],
    },
    amountRaised: {
      type: Number,
      default: 0,
    },
    coverMedia: {
      imageUrl: { type: String },
      videoUrl: { type: String },
      publicId: { type: String },
    },
    timeline: {
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        required: [true, "Campaign end date is required"],
      },
    },
    milestones: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Milestone",
      },
    ],
    supportingDocuments: [
      {
        imageUrl: { type: String },
        publicId: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "active", "completed", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    progressPercentage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Campaign = mongoose.model("Campaign", campaignSchema);

module.exports = Campaign;
