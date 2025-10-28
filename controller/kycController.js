const userModel = require("../model/fundraiserModel");
const kycModel = require("../model/kycModel");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

exports.addKyc = async (req, res) => {
  try {
    const userId = req.user._id;
    const files = req.files || {};

    const existingKyc = await kycModel.findOne({ user: userId });
    if (existingKyc) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "KYC document already submitted for this account.",
      });
    }

    const {
      organizationName,
      organizationType,
      registrationNumber,
      authorizedRepresentativeFullName,
      organizationAddress,
      bankAccountName,
      bankAccountNumber,
      bankName,
      description,
    } = req.body;

    const certFile = files["registrationCertificate"]?.[0];
    const idFile = files["authorizedRepresentativeId"]?.[0];
    const proofFile = files["proofOfAddress"]?.[0];

    if (!certFile || !idFile || !proofFile) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All required KYC documents must be uploaded.",
      });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

    const allFiles = [certFile, idFile, proofFile];
    for (const file of allFiles) {
      if (file && !allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: `Invalid file type for ${file.fieldname}. Only JPG, JPEG, PNG, and PDF are allowed.`,
        });
      }
    }

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

    const newKyc = await kycModel.create({
      user: userId,
      organizationName,
      organizationType,
      registrationNumber,
      authorizedRepresentativeFullName,
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

    await userModel.findByIdAndUpdate(userId, { kyc: newKyc._id });

    res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "KYC documents submitted successfully for review.",
      data: newKyc,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
