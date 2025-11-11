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
const campaignModel = require("../model/campaignModel");
const donationModel = require("../model/donationModel");
const milestoneModel = require("../model/milestoneModel");

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

    // Check for organization name uniqueness
    const existingOrg = await fundraiserModel.findOne({ organizationName: organizationNameToTitleCase(organizationName) });
    if (existingOrg) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Organization name already exists",
      });
    }

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
      role: newUser.role,
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

    const jwtPayload = {
      _id: user._id,
      email: user.email,
      organizationName: user.organizationName,
      role: user.role,
    };

    const jwtSecret = process.env.JWT_SECRET;
    const token = jwt.sign(jwtPayload, jwtSecret, { expiresIn: "1d" });

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Email verification successful",
      data: {
        token: token,
        _user: {
          id: user._id,
          organizationName: user.organizationName,
          email: user.email,
          role: user.role,
        },
      },
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

    if (user.isVerified) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "User already verified",
      });
    }

    // if (user.otpExpiredAt > Date.now() && user.otp) {
    //   const waitOtpTime = new Date(user.otpExpiredAt).toLocaleTimeString();
    //   return res.status(400).json({
    //     statusCode: false,
    //     statusText: "Bad Request",
    //     message: `OTP has already been sent. Please try again after ${waitOtpTime}`,
    //   });
    // }

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
      role: user.role,
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

    const link = `https://trace-aid.vercel.app/#/reset-password/${token}/${user._id}`;

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

exports.fundraiserActivateCampaign = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await fundraiserModel.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Fundraiser account not found",
      });
    }
    const { campaignId } = req.params;

    const campaign = await campaignModel.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        status: false,
        message: "Campaign not found",
      });
    }

    if (campaign.status !== "approved") {
      return res.status(400).json({
        status: false,
        message: "Only approved campaigns can be activated",
      });
    }

    campaign.status = "active";
    await campaign.save();

    return res.status(200).json({
      status: true,
      message: "Your campaign is now live!",
      data: campaign,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
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
      organizationName: user.organizationName,
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

// exports.fundraiserDashboard = async (req, res) => {
//   console.log("I am from the anthentication", req.user)
//   try {
//     const fundraiserId = req.user._id

//     console.log("user ID", fundraiserId)

//     // 1. Basic User Check
//     const user = await fundraiserModel.findById(fundraiserId).select("-password -otp -otpExpiredAt -token -status");
//     if (!user) {
//       return res.status(404).json({
//         statusCode: false,
//         statusText: "Not Found",
//         message: "Fundraiser not found",
//       });
//     }

//     // Query 1: Total Donations Amount (Uses Donation.fundraiser and amount field)
//     const donationResults = await donationModel.aggregate([
//       { $match: { fundraiser: fundraiserId, paymentStatus: "successful" } },
//       { $group: { _id: null, totalDonationsAmount: { $sum: "$amount" } } },
//     ]);
//     const totalDonationsAmount = donationResults.length > 0 ? donationResults[0].totalDonationsAmount : 0;

//     // Query 2: Milestones Achieved (Uses Milestone.fundraiser and status field)
//     const milestoneAchievedCount = await milestoneModel.countDocuments({
//       fundraiser: fundraiserId,
//       status: "completed",
//     });

//     // Query 3 & 4: Active and Pending Campaigns (Uses Campaign.fundraiser and status field)
//     const activeCampaignsCount = await campaignModel.countDocuments({ fundraiser: fundraiserId, status: "active" });
//     const pendingVerificationsCount = await campaignModel.countDocuments({ fundraiser: fundraiserId, status: "pending" });

//     const recentTransactions = await donationModel
//       .find({
//         fundraiser: fundraiserId,
//         paymentStatus: "successful",
//       })
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .populate({
//         path: "donor",
//         select: "firstName lastName",
//       })
//       .populate({
//         path: "campaign",
//         select: "campaignTitle",
//       })
//       .select("amount createdAt donor campaign isAnonymous");

//     res.status(200).json({
//       statusCode: true,
//       statusText: "OK",
//       data: {
//         totalDonations: totalDonationsAmount,
//         milestoneAchieved: milestoneAchievedCount,
//         activeCampaigns: activeCampaignsCount,
//         pendingVerifications: pendingVerificationsCount,

//         recentTransactions: recentTransactions.map((transaction) => ({
//           donorName: transaction.isAnonymous
//             ? "Anonymous Donor"
//             : transaction.donor && transaction.donor.organizationName
//             ? transaction.donor.organizationName
//             : "N/A",

//           campaignTitle: transaction.campaign ? transaction.campaign.campaignTitle : "Campaign Deleted",
//           date: transaction.createdAt,
//           amount: transaction.amount,
//         })),
//       },
//     });
//   } catch (error) {
//     console.error("Fundraiser dashboard error:", error);
//     res.status(500).json({
//       statusCode: false,
//       statusText: "Internal Server Error",
//       message: error.message,
//     });
//   }
// };

exports.fundraiserDashboard = async (req, res) => {
  console.log("I am from the anthentication", req.user);
  try {
    const fundraiserId = req.user._id;

    console.log("user ID", fundraiserId);

    const user = await fundraiserModel.findById(fundraiserId).select("-password -otp -otpExpiredAt -token -status");
    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Fundraiser not found",
      });
    }

    const donationResults = await donationModel.aggregate([
      { $match: { fundraiser: fundraiserId, paymentStatus: "successful" } },
      { $group: { _id: null, totalDonationsAmount: { $sum: "$amount" } } },
    ]);
    const totalDonationsAmount = donationResults.length > 0 ? donationResults[0].totalDonationsAmount : 0;

    const milestoneAchievedCount = await milestoneModel.countDocuments({
      fundraiser: fundraiserId,
      status: "completed",
    });

    const activeCampaignsCount = await campaignModel.countDocuments({ fundraiser: fundraiserId, status: "active" });
    const pendingVerificationsCount = await campaignModel.countDocuments({ fundraiser: fundraiserId, status: "pending" });

    const recentTransactions = await donationModel
      .find({
        fundraiser: fundraiserId,
        paymentStatus: "successful",
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: "donor",
        select: "firstName lastName organizationName",
      })
      .populate({
        path: "campaign",
        select: "campaignTitle",
      })
      .select("amount createdAt donor campaign isAnonymous");

    res.status(200).json({
      statusCode: true,
      statusText: "OK",
      data: {
        totalDonations: totalDonationsAmount,
        milestoneAchieved: milestoneAchievedCount,
        activeCampaigns: activeCampaignsCount,
        pendingVerifications: pendingVerificationsCount,

        recentTransactions: recentTransactions.map((transaction) => {
          if (transaction.isAnonymous) {
            return {
              donorName: "Anonymous Donor",
              campaignTitle: transaction.campaign ? transaction.campaign.campaignTitle : "Campaign Deleted",
              date: transaction.createdAt,
              amount: transaction.amount,
            };
          }

          let donorName = "N/A";

          if (transaction.donor) {
            if (transaction.donor.organizationName) {
              donorName = transaction.donor.organizationName;
            } else if (transaction.donor.firstName && transaction.donor.lastName) {
              donorName = `${transaction.donor.firstName} ${transaction.donor.lastName}`;
            } else if (transaction.donor.firstName) {
              // Fallback: First Name only
              donorName = transaction.donor.firstName;
            }
          }

          return {
            donorName: donorName,
            campaignTitle: transaction.campaign ? transaction.campaign.campaignTitle : "Campaign Deleted",
            date: transaction.createdAt,
            amount: transaction.amount,
          };
        }),
      },
    });
  } catch (error) {
    console.error("Fundraiser dashboard error:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
