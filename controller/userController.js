const userModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateOTPCode = require("../middleware/generateOTP");
const { registerOTP, forgotPasswordLink } = require("../emailTemplate/emailVerification");
const { sendEmail } = require("../utils/brevo");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const { individualNameToTitleCase, organizationNameToTitleCase } = require("../helper/nameConverter");

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, organizationName, email, phoneNumber, password, confirmPassword, accountType, acceptedTerms } = req.body;

    if (!accountType) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Account type is required (individual or  organization)",
      });
    }

    if (accountType === "organization") {
      if (!organizationName || !email || !phoneNumber || !password || !confirmPassword || !acceptedTerms) {
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: "All organization fields are required",
        });
      }
    } else if (accountType === "individual") {
      if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword || !acceptedTerms) {
        return res.status(400).json({
          statusCode: false,
          statusText: "Bad Request",
          message: "All individual fields are required",
        });
      }
    } else {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid account type provided",
      });
    }

    const determinedRole = accountType === "organization" ? "fundraiser" : "donor";

    if (password !== confirmPassword) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Passwords do not match",
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "User with this email already exists",
      });
    }

    const saltPassword = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltPassword);
    const { otp, expiresAt } = generateOTPCode();

    const newUser = new userModel({
      firstName: individualNameToTitleCase(firstName),
      lastName: individualNameToTitleCase(lastName),
      organizationName: organizationNameToTitleCase(organizationName),
      email,
      phoneNumber: `+234${phoneNumber.slice(1)}`,
      password: hashedPassword,
      confirmPassword,
      role: determinedRole,
      accountType,
      acceptedTerms,
      otp: otp,
      otpExpiredAt: expiresAt,
    });

    const displayName = accountType === "individual" ? `${newUser.firstName} ` : newUser.organizationName;

    const mailDetails = {
      email: newUser.email,
      subject: "Email Verification",
      html: registerOTP(newUser.otp, displayName),
    };

    await sendEmail(mailDetails);
    await newUser.save();

    res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "User Registration successful",
      data: { user: newUser },
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

exports.verifyUser = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Email and OTP are required",
      });
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });

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

    const user = await userModel.findOne({ email: email.toLowerCase() });

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

    const displayName = accountType === "individual" ? `${user.firstName}` : user.organizationName;

    const mailDetails = {
      email: newUser.email,
      subject: "Email Verification",
      html: registerOTP(newUser.otp, displayName),
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

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Email and password are required",
      });
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });

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

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Login successful",
      data: { user, token },
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
        const checkUser = userModel.findById(data.id);
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

    const user = await userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Invalid email",
      });
    }

    await userModel.findByIdAndUpdate(user._id, { new: true });

    const link = `${req.protocol}://${req.get("host")}/api/v1/reset-password/${user._id}`;

    const { accountType } = user;
    const displayName = accountType === "individual" ? `${user.firstName}` : user.organizationName;

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
    const { id } = req.params;
    const { password, confirmPassword } = req.body;

    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "User not found",
      });
    }

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

    await userModel.findByIdAndUpdate(user._id, { password: hashedPassword, token: null }, { new: true });

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Password reset successful",
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
    const user = await userModel.findById(id);

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

    await userModel.findByIdAndUpdate(user._id, { password: hashedPassword }, { new: true, runValidators: true });

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
    const { firstName, lastName, organizationName, phoneNumber } = req.body;
    const { id } = req.params;
    const file = req.file;
    let uploadProfilePicture;

    const user = await userModel.findById(id);
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
      firstName: individualNameToTitleCase(firstName ?? user.firstName),
      lastName: individualNameToTitleCase(lastName ?? user.lastName),
      organizationName: organizationNameToTitleCase(organizationName ?? user.organizationName),
      phoneNumber: phoneNumber ? `+234${phoneNumber.slice(1)}` : user.phoneNumber,
    };

    if (uploadProfilePicture) {
      updateProfile.profilePicture = {
        imageUrl: uploadProfilePicture.secure_url,
        publicId: uploadProfilePicture.public_id,
      };
    }

    const updatedUser = await userModel.findByIdAndUpdate(user._id, updateProfile, { new: true, runValidators: true });

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

exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    // Assuming 'token' is the Google ID Token sent from the client
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.email) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid token or missing email in token.",
      });
    }

    const { email, name, picture } = decoded;
    const normalizedEmail = email.toLowerCase();
    let user = await userModel.findOne({ email: normalizedEmail });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const saltPassword = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, saltPassword);

      user = await userModel.create({
        fullName: name,
        email: normalizedEmail,
        password: hashedPassword,
        accountType: "individual",
        role: "donor",
        phoneNumber: "0000000000",
        acceptedTerms: true,
        isEmailVerified: true,
        profilePicture: {
          imageUrl: picture,
          publicId: "GOOGLE_" + decoded.sub,
        },
      });
    }

    const jwtToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Login successful",
      data: {
        user: user.toObject({ getters: true }),
        token: jwtToken,
        isNewUser: isNewUser,
      },
    });
  } catch (error) {
    console.error("Error logging in with Google:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.setRole = async (req, res) => {
  try {
    const userId = req.user._id;

    const { accountType } = req.body;
    if (!accountType) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Account type is required.",
      });
    }
    if (!["individual", "organization"].includes(accountType)) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid account type provided.",
      });
    }
    const role = accountType === "organization" ? "fundraiser" : "donor";

    const updatedUser = await userModel.findByIdAndUpdate(userId, { accountType, role }, { new: true }).select("-password");

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Account type and role set successfully.",
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
