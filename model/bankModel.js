const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema(
  {
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fundraiser",
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: false, 
    },
    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      trim: true,
    },
    accountHolder: {
      type: String,
      required: [true, "Account holder name is required"],
      trim: true,
    },
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
      trim: true,
    },
    bankCode: {
      type: String,
      required: [true, "Bank code is required"],
      trim: true,
    },
    koraRecipientCode: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Bank = mongoose.model("Bank", bankSchema);
module.exports = Bank;
