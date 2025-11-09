const { kycVerificationInProgress } = require("../emailTemplate/emailVerification");
const fundraiserModel = require("../model/fundraiserModel");
const kycModel = require("../model/kycModel");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { sendEmail } = require("../utils/brevo");

exports.addKyc = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("req files", req.files);
    console.log("USER ID:", userId);

    const file = req.files || [];

    // console.log("FILE:", file);

    // const existingKyc = await kycModel.findOne({ user: userId });
    // if (existingKyc) {
    //   return res.status(400).json({
    //     statusCode: false,
    //     statusText: "Bad Request",
    //     message: "KYC document already submitted for this account.",
    //   });
    // }

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

    const existingUser = await kycModel.findOne({ user: userId });

    if (process.env.NODE_ENV === "development") {
      if (existingUser) {
        await kycModel.deleteOne({ user: userId });
      }
    } else {
      if (existingUser) {
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: "User with this email already exists",
        });
      }
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

    // console.log("BODY:", req.body);

    // console.log(file);

    // const certFile = file.find((f) => f.fieldname === "registrationCertificate");
    // console.log(certFile)
    // const idFile = file.find((f) => f.fieldname === "authorizedRepresentativeId");
    // console.log(idFile)
    const certFile = req.files?.registrationCertificate?.[0];
    const idFile = req.files?.authorizedRepresentativeId?.[0];
    console.log("Certificate File:", certFile);
    console.log("ID File:", idFile);

    if (!certFile || !idFile) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All required KYC documents must be uploaded.",
      });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf", "video/mp4", "video/webm"];

    const allFiles = [certFile, idFile];
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
      organizationName,
      organizationType,
      registrationNumber,
      authorizedRepresentativeFullName,
      organizationAddress,
      bankAccountName,
      bankAccountNumber,
      bankName,
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
      message: "KYC documents submitted successfully for review.",
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

exports.getKycByFundraiser = async (req, res)=>{
try {
  const userId = req.user._id;
  const kyc = await kycModel.findOne({user: userId}).populate("user", "organizationName");
  if(!kyc){
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
}