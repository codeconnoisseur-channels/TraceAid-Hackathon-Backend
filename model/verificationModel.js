const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema({
  fundraiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fundraiser",
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campaign",
  },
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Milestone",
  },
  kyc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Kyc",
  },
  kycVerification: {
    type: String,
    enum: ["active", "suspended", "deleted"],
    default: "active",
  },
  CampaignVerification: {
    type: String,
    enum: ["pending", "approved", "active", "completed", "rejected"],
    default: "pending",
  },
  milestoneVerification: {
    type: String,
    enum: ["pending", "approved", "active", "completed", "rejected"],
    default: "pending",
  },
});

const Verification = mongoose.model("Verification", verificationSchema);

module.exports = Verification;
