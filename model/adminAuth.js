const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Firstname is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Lastname is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      // unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpiredAt: {
      type: Date,
    },
    role: {
      type: String,
      default: "admin",
      enum: ["admin"],
    },
    profilePicture: {
      imageUrl: String,
      publicId: String,
    },
  },
  { timestamps: true }
);

const adminAuth = mongoose.model("adminAuth", adminSchema);
module.exports = adminAuth;
