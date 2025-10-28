const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
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
    evidenceUploads: [{ imageUrl: String, publicId: String, uploadedAt: Date }],
    status: {
      type: String,
      enum: ["pending", "approved", "in-progress", "completed", "rejected"],
      default: "pending",
    },
    verifiedAt: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    fundsReleasedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Milestone = mongoose.model("Milestone", milestoneSchema);
module.exports = Milestone;
