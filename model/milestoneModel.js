const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: [true, "Milestone must belong to a campaign"],
    },
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Milestone must belong to a fundraiser"],
    },
    title: {
      type: String,
      required: [true, "Milestone title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Milestone description is required"],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, "Milestone target amount is required"],
      min: [1, "Milestone target must be greater than 0"],
    },
    releasedAmount: {
      type: Number,
      default: 0,
    },
    evidenceUploads: [
      {
        imageUrl: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "in-progress", "completed", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Milestone = mongoose.model("Milestone", milestoneSchema);

module.exports = Milestone;
