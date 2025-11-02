const mongoose = require("mongoose");

const fundraiserWalletSchema = new mongoose.Schema(
  {
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fundraiser",
      required: true,
      unique: true,
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
    campaignFunds: [
      {
        campaign: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Campaign",
          required: true,
        },
        milestone: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Milestone",
          required: false,
        },
        amountReadyForPayout: {
          type: Number,
          default: 0,
          required: true,
        },
        isPendingPayout: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

const FundraiserWallet = mongoose.model("FundraiserWallet", fundraiserWalletSchema);
module.exports = FundraiserWallet;
