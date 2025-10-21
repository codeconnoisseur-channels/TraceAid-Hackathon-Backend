const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    accountType: {
      type: String,
      enum: ["individual", "organization"],
      required: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    organizationName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
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
    isGoogle: {
      type: Boolean,
      default: false,
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
    role: {
      type: [String],
      enum: ["donor", "fundraiser"],
      default: "donor",
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
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
