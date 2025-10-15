const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    accountType: {
      type: String,
      enum: ["individual", "organization"],
      required: true,
    },
    fullName: {
      type: String,
      required: [true, "Fullname or organization name is required"],
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
    confirmPassword: {
      type: String,
      required: [true, "Please confirm your password"],
    },
    role: {
      type: String,
      enum: ["donor", "fundraiser", "admin"],
      default: "donor",
    },
    kyc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KYC",
    },
    donations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Donation",
      },
    ],
    campaigns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaign",
      },
    ],
    acceptedTerms: {
      type: Boolean,
      required: [true, "You must accept the terms and conditions"],
    },
    isVerified: {
      type: Boolean,
      default: false,
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
