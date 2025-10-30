const userModel = require("../model/fundraiserModel");
const kycModel = require("../model/kycModel");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

exports.addKyc = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("req files", req.files);
    console.log("USER ID:", userId);

    const file = req.files || [];

    console.log("FILE:", file);

    // const existingKyc = await kycModel.findOne({ user: userId });
    // if (existingKyc) {
    //   return res.status(400).json({
    //     statusCode: false,
    //     statusText: "Bad Request",
    //     message: "KYC document already submitted for this account.",
    //   });
    // }

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

    console.log("BODY:", req.body);

    console.log(file);

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
