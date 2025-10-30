const mongoose = require("mongoose");

const fundraiserWalletSchema = new mongoose.Schema(
  {
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fundraiser",
      required: true,
      // unique: true,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    payoutBank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
    },
  },
  { timestamps: true }
);

const FundraiserWallet = mongoose.model("FundraiserWallet", fundraiserWalletSchema);
module.exports = FundraiserWallet;
