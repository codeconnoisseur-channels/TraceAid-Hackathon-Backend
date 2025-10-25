const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
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
      type: String,
      default: "donor",
    },
    isAnonymousDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const donor = mongoose.model("User", donorSchema);

module.exports = donor;
