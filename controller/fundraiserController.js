const fundraiserModel = require("../model/fundraiserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateOTPCode = require("../helper/generateOTP");
const { registerOTP, forgotPasswordLink } = require("../emailTemplate/emailVerification");
const { sendEmail } = require("../utils/brevo");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const { organizationNameToTitleCase } = require("../helper/nameConverter");
const { GetTransacBlockedContacts } = require("@getbrevo/brevo");

exports.registerOrganization = async (req, res) => {
  try {
    const { organizationName, email, phoneNumber, password, confirmPassword, acceptedTerms } = req.body;

    // const existingUser = await fundraiserModel.findOne({ email });
    // if (existingUser) {
    //   return res.status(400).json({
    //     statusCode: false,
    //     statusText: "Bad Request",
    //     message: "User with this email already exists",
    //   });
    // }

    const existingUser = await fundraiserModel.findOne({ email: email.toLowerCase() });

    if (process.env.NODE_ENV === "development") {
      if (existingUser) {
        await fundraiserModel.deleteOne({ email: email.toLowerCase() });
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

    const newUser = new fundraiserModel({
      organizationName: organizationNameToTitleCase(organizationName),
      email: email.toLowerCase(),
      phoneNumber: `+234${phoneNumber.slice(1)}`,
      password: hashedPassword,
      confirmPassword,
      acceptedTerms,
      otp: otp,
      otpExpiredAt: expiresAt,
      role: "fundraiser",
    });

    const displayName = newUser.organizationName;

    const mailDetails = {
      email: newUser.email,
      subject: "Email Verification",
      html: registerOTP(newUser.otp, displayName),
    };

    await newUser.save();
    await sendEmail(mailDetails);

    const response = {
      _id: newUser._id,
      organizationName,
      email,
      phoneNumber,
      role: newUser.role
    };

    res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "User Registration successful",
      data: response,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.verifyOrganization = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Email and OTP are required",
      });
    }

    const user = await fundraiserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "User not found",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid OTP",
      });
    }

    if (user.otpExpiredAt < Date.now()) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "OTP has expired",
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiredAt = null;

    await user.save();

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

    const user = await fundraiserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "User not found",
      });
    }

    if (user.otpExpiredAt > Date.now() && user.otp) {
      const waitOtpTime = new Date(user.otpExpiredAt).toLocaleTimeString();
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `OTP has already been sent. Please try again after ${waitOtpTime}`,
      });
    }

    const { otp, expiresAt } = generateOTPCode();
    user.otp = otp;
    user.otpExpiredAt = expiresAt;

    const displayName = user.organizationName;

    const mailDetails = {
      email: user.email,
      subject: "Email Verification",
      html: registerOTP(user.otp, displayName),
    };

    await sendEmail(mailDetails);
    await user.save();

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

exports.loginOrganization = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Email and password are required",
      });
    }

    const user = await fundraiserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Invalid credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Account not verified. Please verify your email first.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const response = {
      _id: user._id,
      organizationName: user.organizationName,
      email,
      token,
    };

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Login successful",
      data: { login: response },
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
        const checkUser = fundraiserModel.findById(data.id);
        res.status(200).json({
          statusCode: true,
          statusText: "OK",
          message: "Login successful",
          data: { user: checkUser, token },
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

    const user = await fundraiserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Invalid email",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "10m" });

    await fundraiserModel.findByIdAndUpdate(user._id, { token }, { new: true });

    const link = `${req.protocol}://${req.get("host")}/api/v1/reset-password/${token}/${user._id}`;

    const displayName = user.organizationName;

    const mailDetails = {
      email: user.email,
      subject: "Email Verification",
      html: forgotPasswordLink(link, displayName),
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

    const userId = req.params.id;
    const user = await fundraiserModel.findOne({ _id: userId, token: req.params.token });

    jwt.verify(token, process.env.JWT_SECRET, async (error, result) => {
      if (error) {
        return res.status(404).json({
          statusCode: false,
          statusText: "Not Found",
          message: "Email Expired",
        });
      } else {
        await fundraiserModel.findByIdAndUpdate(user._id, { password: hashedPassword, token: null }, { new: true, runValidators: true });
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
    const { id } = req.user;
    const user = await fundraiserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "User not found",
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
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Password does not match your current password",
      });
    }

    const checkExisting = await bcrypt.compare(newPassword, user.password);
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

    await fundraiserModel.findByIdAndUpdate(user._id, { password: hashedPassword }, { new: true, runValidators: true });

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
    const { organizationName, phoneNumber } = req.body;
    const { id } = req.params;
    const file = req.file;
    let uploadProfilePicture;

    const user = await fundraiserModel.findById(id);
    if (!user) {
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "User not found",
      });
    }

    if (file && file.path) {
      uploadProfilePicture = await cloudinary.uploader.upload(file.path);
      fs.unlinkSync(file.path);
    }

    const updateProfile = {
      organizationName: organizationNameToTitleCase(organizationName ?? user.organizationName),
      phoneNumber: phoneNumber ? `+234${phoneNumber.slice(1)}` : user.phoneNumber,
    };

    if (uploadProfilePicture) {
      updateProfile.profilePicture = {
        imageUrl: uploadProfilePicture.secure_url,
        publicId: uploadProfilePicture.public_id,
      };
    }

    const updatedUser = await fundraiserModel.findByIdAndUpdate(user._id, updateProfile, { new: true, runValidators: true });

    const response = {
      _id: updatedUser._id,
      organizationName: updatedUser.organizationName,
      phoneNumber: updatedUser.phoneNumber,
      profilePicture: updatedUser.profilePicture,
    };

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Profile updated successfully",
      data: { update: response },
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
    const user = await fundraiserModel.findById(id).select("-password -otp -otpExpiredAt -token -status");

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Fundraiser not found",
      });
    }

    const response = {
      _id: user._id,
      email: user.email,
      role: user.role,
      organizationName: user.organizationName
    };

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};