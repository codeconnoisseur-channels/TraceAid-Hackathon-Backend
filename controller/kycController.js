const userModel = require("../model/userModel");
const kycModel = require("../model/kycModel");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

exports.addKyc = async (req, res) => {
  const userId = req.user._id;
  const { role, kyc, accountType } = req.user;
  const files = req.files || {};

  try {
    // Ensure only Fundraiser (organization) accounts can submit KYC
    if (accountType !== "organization" || role !== "fundraiser") {
      return res.status(401).json({
        statusCode: false,
        message: "Only Fundraiser (Organization) accounts can submit KYC.",
      });
    }

    // Prevent duplicate KYC submission
    if (kyc) {
      return res.status(400).json({
        statusCode: false,
        message: "KYC document already linked to your account.",
      });
    }

    const {
      organizationName,
      organizationType,
      registrationNumber,
      authorizedRepresentativeName,
      organizationAddress,
      bankAccountName,
      bankAccountNumber,
      bankName,
      description,
    } = req.body;

    // Validate all fields
    const requiredFields = {
      organizationName,
      registrationNumber,
      authorizedRepresentativeName,
      organizationAddress,
      bankAccountName,
      bankAccountNumber,
      bankName,
      description,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.status(400).json({
          statusCode: false,
          message: `${key} is required`,
        });
      }
    }

    // Ensure required files exist
    const certFile = files["registrationCertificate"]?.[0];
    const idFile = files["authorizedRepresentativeId"]?.[0];
    const proofFile = files["proofOfAddress"]?.[0];

    if (!certFile || !idFile || !proofFile) {
      return res.status(400).json({
        statusCode: false,
        message: "All required KYC documents must be uploaded.",
      });
    }

    // Upload all files to Cloudinary
    const uploadToCloudinary = async (file, folder) => {
      const result = await cloudinary.uploader.upload(file.path, { folder });
      fs.unlinkSync(file.path);
      return { imageUrl: result.secure_url, publicId: result.public_id };
    };

    const [certUpload, idUpload, proofUpload] = await Promise.all([
      uploadToCloudinary(certFile, "traceaid/kyc/certificates"),
      uploadToCloudinary(idFile, "traceaid/kyc/ids"),
      uploadToCloudinary(proofFile, "traceaid/kyc/proof_address"),
    ]);

    // Create KYC record
    const newKyc = await kycModel.create({
      user: userId,
      organizationName,
      organizationType,
      registrationNumber,
      authorizedRepresentativeName,
      organizationAddress,
      bankAccountName,
      bankAccountNumber,
      bankName,
      description,
      registrationCertificate: certUpload,
      authorizedRepresentativeId: idUpload,
      proofOfAddress: proofUpload,
      verificationStatus: "pending",
    });

    // Link KYC record to user
    await userModel.findByIdAndUpdate(userId, { kyc: newKyc._id });

    res.status(201).json({
      statusCode: true,
      message: "KYC documents submitted successfully for review.",
      data: newKyc,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      statusCode: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
