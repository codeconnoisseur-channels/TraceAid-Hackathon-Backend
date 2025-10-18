const userModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateOTPCode = require("../middleware/generateOTP");
const { registerOTP, forgotPasswordLink } = require("../emailTemplate/emailVerification");
const { sendEmail } = require("../utils/brevo");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword, accountType, acceptedTerms } = req.body;

    if (!fullName || !email || !phoneNumber || !password || !confirmPassword || !acceptedTerms) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All fields are required",
      });
    }

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

    let determinedRole;
    if (accountType === "organization") {
      determinedRole = "fundraiser";
    } else if (accountType === "individual") {
      determinedRole = "donor";
    } else {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid account type provided",
      });
    }

    const saltPassword = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltPassword);
    const { otp, expiresAt } = generateOTPCode();

    const newUser = new userModel({
      fullName,
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

    const mailDetails = {
      email: newUser.email,
      subject: "Email Verification",
      html: registerOTP(newUser.otp, `${newUser.fullName.split(" ")[0]}`),
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

    const { otp, expiresAt } = generateOTPCode();

    if (user.otpExpiredAt > Date.now() && user.otp) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `OTP has already been sent. Please try again after ${new Date(user.otpExpiredAt).toLocaleTimeString()}`,
      });
    }

    user.otp = otp;
    user.otpExpiredAt = expiresAt;

    const mailDetails = {
      email: user.email,
      subject: "Resend: Email Verification",
      html: registerOTP(user.otp, `${user.fullName.split(" ")[0]}`),
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

    const mailDetails = {
      email: user.email,
      subject: "Password Reset Request",
      html: forgotPasswordLink(link, user.fullName),
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
    const { fullName, phoneNumber } = req.body;
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
      fullName: fullName ?? user.fullName,
      phoneNumber: `+234${(phoneNumber ?? user.phoneNumber).slice(1)}`,
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

// exports.googleAuth = async (req, res) => {
//   try {
//     const { token } = req.body;
//     const decoded = jwt.decode(token);

//     if (!decoded) {
//       return res.status(400).json({
//         statusCode: false,
//         statusText: "Bad Request",
//         message: "Invalid token",
//       });
//     }

//     const { email, name, picture } = decoded;

//     let user = await userModel.findOne({ email: email.toLowerCase() });

//     if (!user) {
//       const password = Math.random().toString(36).slice(-8);
//       const saltPassword = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(password, saltPassword);

//       user = await userModel.create({
//         fullName: name,
//         email: email.toLowerCase(),
//         password: hashedPassword,
//         profilePicture: {
//           imageUrl: picture,
//           publicId: "",
//         },
//       });
//     }

//     const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

//     res.status(200).json({
//       statusCode: true,
//       statusText: "OK",
//       message: "Login successful",
//       data: { user, token: jwtToken },
//     });
//   } catch (error) {
//     console.error("Error logging in with Google:", error);
//     res.status(500).json({
//       statusCode: false,
//       statusText: "Internal Server Error",
//       message: error.message,
//     });
//   }
// };

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
      // ⚠️ FIX: Generate and hash a secure temporary password to satisfy Mongoose schema validation.
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const saltPassword = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, saltPassword);

      user = await userModel.create({
        fullName: name,
        email: normalizedEmail,
        password: hashedPassword,
        // 🔑 FIX: Set safe, default values. User must confirm their role/type later.
        accountType: "individual",
        role: "donor",
        // Google doesn't provide a phone number, set a temporary value if required by schema.
        phoneNumber: "0000000000",
        acceptedTerms: true, // Implicitly accepted via social login
        isEmailVerified: true, // Google verifies this
        profilePicture: {
          imageUrl: picture,
          // Use a unique Google ID (sub) as the publicId if you need to track it
          publicId: "GOOGLE_" + decoded.sub,
        },
        // Note: You must remove 'confirmPassword' from your userModel schema as it's not needed here.
      });
    }

    // 2. Generate and send JWT
    const jwtToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Login successful",
      data: {
        // Use user.toObject({ getters: true }) to ensure virtuals are included if needed
        user: user.toObject({ getters: true }),
        token: jwtToken,
        // 🔑 KEY TO THE SOLUTION: Tell the front-end that this is a fresh registration.
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
    // 1. Get the authenticated user ID from the middleware
    const userId = req.user._id;

    // 2. Client sends their choice (e.g., 'organization' or 'individual')
    const { accountType } = req.body;

    if (!["individual", "organization"].includes(accountType)) {
      return res.status(400).json({ message: "Invalid account type provided." });
    }

    // 3. Determine the corresponding role
    const role = accountType === "organization" ? "fundraiser" : "donor";

    // 4. Update the user's document
    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        { accountType, role },
        { new: true } // Return the updated document
      )
      .select("-password"); // Securely exclude password

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
