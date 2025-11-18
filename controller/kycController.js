const { kycVerificationInProgress } = require("../emailTemplate/emailVerification");
const fundraiserModel = require("../model/fundraiserModel");
const kycModel = require("../model/kycModel");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { sendEmail } = require("../utils/brevo");

exports.addKyc = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (userId === undefined) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "You must be logged in to submit KYC documents.",
      });
    }

    console.log("req files", req.files);
    console.log("USER ID:", userId);

    // Guard: one KYC per user unless in development reset mode
    const existingKyc = await kycModel.findOne({ user: userId });
    if (existingKyc && process.env.NODE_ENV !== "development") {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "KYC document already submitted for this account.",
      });
    }

    const fundraiser = await fundraiserModel.findById(userId);
    if (!fundraiser) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Fundraiser not found.",
      });
    }

    if (fundraiser.kycStatus === "pending") {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "KYC verification is already in progress.",
      });
    }

    if (existingKyc && process.env.NODE_ENV === "development") {
      await kycModel.deleteOne({ user: userId });
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
    } = req.body;

    // Normalize and validate textual fields
    const str = (v) => (v === undefined || v === null ? "" : String(v).trim());
    const orgName = str(organizationName);
    const orgType = str(organizationType);
    const regNo = str(registrationNumber);
    const repName = str(authorizedRepresentativeFullName);
    const orgAddr = str(organizationAddress);
    const acctName = str(bankAccountName);
    const acctNumber = str(bankAccountNumber).replace(/[^0-9]/g, "");
    const bank = str(bankName);

    const requiredEmpty = [
      [orgName, "organizationName"],
      [orgType, "organizationType"],
      [regNo, "registrationNumber"],
      [repName, "authorizedRepresentativeFullName"],
      [orgAddr, "organizationAddress"],
      [acctName, "bankAccountName"],
      [acctNumber, "bankAccountNumber"],
      [bank, "bankName"],
    ].filter(([v]) => !v);

    if (requiredEmpty.length > 0) {
      const missing = requiredEmpty.map(([, k]) => k);
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    // Organization type whitelist (adjust as needed)
    const allowedOrgTypes = ["Non-profit", "NGO", "Foundation"];
    console.log("Organization Type:", orgType);
    if (!allowedOrgTypes.includes(orgType)) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `Invalid organization type. Allowed: ${allowedOrgTypes.join(", ")}`,
      });
    }

    if (orgName.length < 3 || orgName.length > 150) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "organizationName must be between 3 and 150 characters.",
      });
    }

    if (repName.length < 5 || repName.length > 150) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Authorized Representative FullName must be between 5 and 150 characters.",
      });
    }

    if (orgAddr.length < 10) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Organization Address must be at least 10 characters.",
      });
    }

    // Bank account validations (Nigeria: 10 digits typical; keep generic if needed)
    if (!/^\d{10}$/.test(acctNumber)) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Bank Account Number must 10 digits.",
      });
    }

    // File validations
    const certFile = req.files?.registrationCertificate?.[0];
    const idFile = req.files?.authorizedRepresentativeId?.[0];
    console.log("Certificate File:", certFile);
    console.log("ID File:", idFile);

    if (!certFile || !idFile) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All required KYC documents must be uploaded before submission.",
      });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf", "video/mp4", "video/webm"];
    const maxSizeBytes = 50 * 1024 * 1024;

    const allFiles = [certFile, idFile];
    for (const f of allFiles) {
      if (f && !allowedTypes.includes(f.mimetype)) {
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: `Invalid file type. Only JPG, JPEG, PNG, PDF, MP4, and WEBM are allowed.`,
        });
      }
      if (f && typeof f.size === "number" && f.size > maxSizeBytes) {
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: "Each file must not exceed 50MB.",
        });
      }
    }

    const uploadToCloudinary = async (file, folder) => {
      const result = await cloudinary.uploader.upload(file.path, { resource_type: "auto", folder });
      fs.unlinkSync(file.path);
      return { imageUrl: result.secure_url, publicId: result.public_id };
    };

    const [certUpload, idUpload] = await Promise.all([
      uploadToCloudinary(certFile, "traceaid/kyc/certificates"),
      uploadToCloudinary(idFile, "traceaid/kyc/ids"),
    ]);

    const newKyc = await kycModel.create({
      user: userId,
      organizationName: orgName,
      organizationType: orgType,
      registrationNumber: regNo,
      authorizedRepresentativeFullName: repName,
      organizationAddress: orgAddr,
      bankAccountName: acctName,
      bankAccountNumber: acctNumber,
      bankName: bank,
      registrationCertificate: certUpload,
      authorizedRepresentativeId: idUpload,
      verificationStatus: "pending",
    });

    await fundraiserModel.findByIdAndUpdate(
      userId,
      {
        kyc: newKyc._id,
        kycStatus: "pending",
      },
      { new: true, runValidators: true }
    );

    const pendingKycEmail = kycVerificationInProgress(fundraiser.organizationName);

    const mailDetails = {
      email: fundraiser.email,
      subject: "KYC Verification In Progress",
      html: pendingKycEmail,
    };

    await sendEmail(mailDetails);

    const response = {
      user: newKyc.user,
      id: newKyc._id,
      organizationName: newKyc.organizationName,
      organizationType: newKyc.organizationType,
      registrationNumber: newKyc.registrationNumber,
      authorizedRepresentativeFullName: newKyc.authorizedRepresentativeFullName,
      organizationAddress: newKyc.organizationAddress,
      bankAccountName: newKyc.bankAccountName,
      bankAccountNumber: newKyc.bankAccountNumber,
      bankName: newKyc.bankName,
      registrationCertificate: newKyc.registrationCertificate,
      authorizedRepresentativeId: newKyc.authorizedRepresentativeId,
      verificationStatus: newKyc.verificationStatus,
      createdAt: newKyc.createdAt,
      updatedAt: newKyc.updatedAt,
    };

    res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: `KYC submitted successfully. You will be notified once the verification is approved. Kindly check your email for the verification email.`,
      data: response,
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

exports.getKycByFundraiser = async (req, res) => {
  try {
    const userId = req.user._id;
    const kyc = await kycModel.findOne({ user: userId }).populate("user", "organizationName");
    if (!kyc) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Fundraiser has not submitted KYC",
      });
    }
    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      data: kyc,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
