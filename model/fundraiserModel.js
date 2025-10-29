const mongoose = require("mongoose");

const fundraiserSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      // unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    acceptedTerms: {
      type: Boolean,
      required: [true, "You must accept the terms and conditions"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["fundraiser", "admin"],
      default: "fundraiser",
      required: true,
    },
    token: {
      type: String,
      default: null,
    },
    otp: {
      type: String,
    },
    otpExpiredAt: {
      type: Date,
    },
    profilePicture: {
      imageUrl: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },
    kyc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KYC",
    },
    kycStatus: {
      type: String,
      enum: ["not_submitted", "pending", "verified", "rejected"],
      default: "not_submitted",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FundraiserWallet",
    },
  },

  { timestamps: true }
);

const Fundraiser = mongoose.model("Fundraiser", fundraiserSchema);

module.exports = Fundraiser;
