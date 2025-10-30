const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fundraiser",
      required: true,
    },
    referenceID: {
      type: String,
      required: true,
      // unique: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["processing", "paid", "failed", "reversed"],
      default: "processing",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    processedAt: Date,
  },
  { timestamps: true }
);

const Payout = mongoose.model("Payout", payoutSchema);
module.exports = Payout;
