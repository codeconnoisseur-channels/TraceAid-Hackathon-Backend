const mongoose = require("mongoose");
const { validate } = require("./userModel");

const kycSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      validate: {
        validator: async function (value) {
          const user = await mongoose.model("User").findById(value);
          return user && user.role === "fundraiser";
        },
        message: "User must be an fundraiser",
      },
    },
    organizationName: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    organizationType: {
      type: String,
      enum: ["Non-profit", "NGO", "Foundation"],
      required: [true, "Organization type is required"],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
    },
    registrationCertificate: {
      imageUrl: {
        type: String,
        required: [true, "Registration certificate is required"],
      },
      publicId: {
        type: String,
        required: [true, "Registration certificate is required"],
      },
    },
    authorizedRepresentativeFullName: {
      type: String,
      required: [true, "Authorized representative name is required"],
      trim: true,
    },
    authorizedRepresentativeId: {
      imageUrl: {
        type: String,
        required: [true, "Authorized representative ID image is required"],
      },
      publicId: {
        type: String,
        required: [true, "Authorized representative ID image is required"],
      },
    },
    organizationAddress: {
      type: String,
      required: [true, "Organization address is required"],
      trim: true,
    },
    proofOfAddress: {
      imageUrl: { type: String },
      publicId: { type: String },
    },
    bankAccountName: {
      type: String,
      required: [true, "Bank account name is required"],
      trim: true,
    },
    bankAccountNumber: {
      type: String,
      required: [true, "Bank account number is required"],
      trim: true,
      unique: true,
    },
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Organization description is required"],
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const KYC = mongoose.model("KYC", kycSchema);

module.exports = KYC;
