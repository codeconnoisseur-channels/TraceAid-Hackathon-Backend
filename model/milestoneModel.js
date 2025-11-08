const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    sequence: {
      type: Number,
      required: true,
      min: 1,
    },
    milestoneTitle: {
      type: String,
      required: true,
      trim: true,
    },
    milestoneDescription: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    releasedAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "on-going", "ready_for_release", "released", "completed"],
      default: "pending",
    },
    evidenceApprovalStatus: {
      type: String,
      enum: ["required", "submitted", "approved", "rejected"],
      default: "required",
    },
    evidenceRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MilestoneEvidence",
      default: null,
    },
    fundsReleasedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Milestone = mongoose.model("Milestone", milestoneSchema);
module.exports = Milestone;
