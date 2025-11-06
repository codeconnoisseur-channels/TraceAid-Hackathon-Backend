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
    // Legacy per-campaign bucket (kept for compatibility if used elsewhere)
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
    // Immutable ledger capturing campaign-specific wallet movements
    transactions: [
      {
        type: {
          type: String,
          enum: ["credit", "debit"],
          required: true,
        },
        campaign: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Campaign",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 1,
        },
        donor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Donor",
          required: false,
          index: true,
        },
        donation: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Donation",
          required: false,
          index: true,
        },
        source: {
          type: String,
          enum: ["donation", "payout", "adjustment"],
          required: true,
        },
        reference: {
          type: String,
          index: true,
        },
        note: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const FundraiserWallet = mongoose.model("FundraiserWallet", fundraiserWalletSchema);
module.exports = FundraiserWallet;
