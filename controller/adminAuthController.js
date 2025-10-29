const AdminAuthModel = require("../model/adminAuth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const generateOTPCode = require("../helper/generateOTP");
const {
  registerOTP,
  forgotPasswordLink,
} = require("../emailTemplate/emailVerification");
const { sendEmail } = require("../utils/brevo");
const cloudinary = require("../config/cloudinary");

exports.registerAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    const existingAdmin = await AdminAuthModel.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Admin with this email already exists",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Passwords do not match",
      });
    }
    const saltPassword = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltPassword);
    const { otp, expiresAt } = generateOTPCode();

    const newAdmin = new AdminAuthModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      otp,
      otpExpiredAt: expiresAt,
    });

    const mailDetails = {
      email: newAdmin.email,
      subject: "Email Verification",
      html: registerOTP(newAdmin.otp, newAdmin.firstName),
    };

    await sendEmail(mailDetails);
    await newAdmin.save();

    res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Admin Registration successful",
      data: { admin: newAdmin },
    });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.verifyAdmin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Email and OTP are required",
      });
    }

    const admin = await AdminAuthModel.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Admin not found",
      });
    }

    if (admin.otp !== otp) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid OTP",
      });
    }

    if (admin.otpExpiredAt < Date.now()) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "OTP has expired",
      });
    }

    admin.isVerified = true;
    admin.otp = null;
    admin.otpExpiredAt = null;

    await admin.save();

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Email verification successful",
    });
  } catch (error) {
    console.error("Error verifying user:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Email is required",
      });
    }

    const admin = await AdminAuthModel.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Admin not found",
      });
    }

    if (admin.otpExpiredAt > Date.now() && admin.otp) {
      const waitOtpTime = new Date(admin.otpExpiredAt).toLocaleTimeString();
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `OTP has already been sent. Please try again after ${waitOtpTime}`,
      });
    }

    const { otp, expiresAt } = generateOTPCode();
    admin.otp = otp;
    admin.otpExpiredAt = expiresAt;

    const mailDetails = {
      email: admin.email,
      subject: "Email Verification",
      html: registerOTP(admin.otp, admin.firstName),
    };

    await sendEmail(mailDetails);
    await admin.save();

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Email and password are required",
      });
    }

    const admin = await AdminAuthModel.findOne({
      email: email.toLowerCase(),
    }).select(" -otp -otpExpiredAt");

    if (!admin) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Invalid credentials",
      });
    }

    if (!admin.isVerified) {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Account not verified. Please verify your email first.",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Login successful",
      data: { admin, token },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.checkAuth = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "No token provided",
      });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Login Required",
      });
    }
    jwt.verify(token, process.env.JWT_SECRET, (error, data) => {
      if (err) {
        return res.status(401).json({
          statusCode: false,
          statusText: "Unauthorized",
          message: "Invalid token",
        });
      } else {
        const checkAdmin = AdminAuthModel.findById(decoded.id).select(
          "-password"
        );
        res.status(200).json({
          statusCode: true,
          statusText: "OK",
          message: "Login successful",
          data: { admin: checkAdmin, token },
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Email is required",
      });
    }

    const admin = await AdminAuthModel.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Admin not found",
      });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    await AdminAuthModel.findByIdAndUpdate(admin._id, { token }, { new: true });

    const link = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/reset-password/${token}/${admin._id}`;

    const mailDetails = {
      email: admin.email,
      subject: "Email Verification",
      html: forgotPasswordLink(link, admin.firstName),
    };

    await sendEmail(mailDetails);

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Password and confirm password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Passwords do not match",
      });
    }

    const saltPassword = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltPassword);

    const adminId = req.params.id;
    const admin = await AdminAuthModel.findOne({
      _id: adminId,
      token: req.params.token,
    });

    jwt.verify(token, process.env.JWT_SECRET, async (error, result) => {
      if (error) {
        return res.status(404).json({
          statusCode: false,
          statusText: "Not Found",
          message: "Token Expired or Invalid",
        });
      } else {
        await AdminAuthModel.findByIdAndUpdate(
          admin._id,
          { password: hashedPassword, token: null },
          { new: true, runValidators: true }
        );
        res.status(200).json({
          statusCode: true,
          statusText: "OK",
          message: "Password reset successful",
        });
      }
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { id } = req.admin;
    const admin = await AdminAuthModel.findById(id);

    if (!admin) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Admin not found",
      });
    }
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All fields are required",
      });
    }
    const isMatch = await bcrypt.compare(oldPassword, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Password does not match your current password",
      });
    }

    const checkExisting = await bcrypt.compare(newPassword, admin.password);
    if (checkExisting) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "New password cannot be the same as the old password",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Passwords do not match",
      });
    }

    const saltPassword = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, saltPassword);

    await AdminAuthModel.findByIdAndUpdate(
      admin._id,
      { password: hashedPassword },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const { id } = req.params;
    const file = req.file;
    let uploadProfilePicture;

    const admin = await AdminAuthModel.findById(id);
    if (!admin) {
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Admin not found",
      });
    }

    if (file && file.path) {
      uploadProfilePicture = await cloudinary.uploader.upload(file.path);
      fs.unlinkSync(file.path);
    }

    const updateProfile = {
      firstName: firstName ?? admin.firstName,
      lastName: lastName ?? admin.lastName,
    };

    if (uploadProfilePicture) {
      updateProfile.profilePicture = {
        imageUrl: uploadProfilePicture.secure_url,
        publicId: uploadProfilePicture.public_id,
      };
    }

    const updatedadmin = await AdminAuthModel.findByIdAndUpdate(
      admin._id,
      updateProfile,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await AdminAuthModel.findById(id).select("-password");

    if (!admin) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Admin not found",
      });
    }
    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
