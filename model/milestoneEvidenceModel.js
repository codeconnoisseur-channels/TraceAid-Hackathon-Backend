const mongoose = require("mongoose");

const milestoneEvidenceSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Milestone",
      required: true,
    },
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fundraiser",
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    uploads: [
      {
        imageUrl: String,
        publicId: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    reviewedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

const MilestoneEvidence = mongoose.model("MilestoneEvidence", milestoneEvidenceSchema);
module.exports = MilestoneEvidence;
