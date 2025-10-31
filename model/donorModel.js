const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
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
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
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
      enum: ["donor", "fundraiser"],
      default: "donor",
    },
    isAnonymousDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const donor = mongoose.model("Donor", donorSchema);

module.exports = donor;
