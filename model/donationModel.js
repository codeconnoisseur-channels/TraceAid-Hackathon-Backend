const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Donation must belong to a donor"],
      role: "donor"
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: [true, "Donation must be linked to a campaign"],
    },
    amount: {
      type: Number,
      required: [true, "Donation amount is required"],
      min: [1, "Donation amount must be at least 1"],
    },
    currency: {
      type: String,
      enum: ["NGN"],
      default: "NGN",
    },
    paymentReference: {
      type: String,
      required: [true, "Payment reference is required"],
      unique: true,
    },
    transactionId: {
      type: String,
      required: [true, "Korapay transaction ID is required"],
      unique: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Korapay"],
      default: "Korapay",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "successful", "failed"],
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
    paymentReceipt: {
      imageUrl: { type: String },
      publicId: { type: String },
    },
    refunded: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Donation = mongoose.model("Donation", donationSchema);

module.exports = Donation;
