const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: [true, "Donation must belong to a donor"],
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: [true, "Donation must be linked to a campaign"],
    },
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fundraiser",
      required: [true, "Donation must be linked to a fundraiser"],
    },
    amount: {
      type: Number,
      required: [true, "Donation amount is required"],
      min: 1,
    },
    currency: {
      type: String,
      enum: ["NGN"],
      default: "NGN",
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
    },
    transactionId: {
      type: String,
      default: null,
      sparse: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "successful", "failed", "refunded"],
      default: "pending",
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      trim: true,
    },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

const Donation = mongoose.model("Donation", donationSchema);
module.exports = Donation;
