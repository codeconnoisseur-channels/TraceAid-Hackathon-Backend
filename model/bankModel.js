const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema({
  fundraiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fundraiser",
    required: true,
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
  status: {
    // Verification status of the bank account
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
});

const Bank = mongoose.model("Bank", bankSchema);
module.exports = Bank;
