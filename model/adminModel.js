const mongoose = require("mongoose");

const adminActivitySchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin reference is required"],
    },
    role: {
      type: String,
      default: "admin",
    },
    actionType: {
      type: String,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Milestone",
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
    },
    kyc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KYC",
    },
    remarks: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "reversed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const AdminActivity = mongoose.model("AdminActivity", adminActivitySchema);

module.exports = AdminActivity;
