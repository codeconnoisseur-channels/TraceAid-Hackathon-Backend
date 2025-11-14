const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

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
      unique: true,
      default: () => uuidv4(),
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Milestone",
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "paid",],
      default: "pending",
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
