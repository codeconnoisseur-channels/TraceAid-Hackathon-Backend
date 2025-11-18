const jwt = require("jsonwebtoken");
const fundraiserModel = require("../model/fundraiserModel");
const donorModel = require("../model/donorModel");
const adminModel = require("../model/adminModel");

// Helper function to capitalize the first letter, matching the schema's enum ('Donor', 'Fundraiser')
const capitalize = (s) => {
  if (typeof s !== "string") return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
};

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Authentication Failed",
        message: "No token provided or invalid token format. Use 'Bearer <token>'.",
      });
    }

    if (!token) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Authentication Failed",
        message: "Please login again to continue.",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      const isExpired = error instanceof jwt.TokenExpiredError;
      return res.status(401).json({
        statusCode: false,
        statusText: "Authentication Failed",
        message: isExpired ? "Session expired. Please login again." : "Invalid token signature or format.",
      });
    }

    const userId = decoded.id || decoded.userId || decoded._id;
    if (!userId) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Authentication Failed",
        message: "Invalid token payload - user ID missing.",
      });
    }

    let user = null;

    user = await adminModel.findById(userId).select("role");

    console.log("Admin User FOUND:", user);

    if (!user) {
      user = await fundraiserModel.findById(userId).select("role isVerified kyc");
    }

    if (!user) {
      user = await donorModel.findById(userId).select("role isVerified");
    }

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "User not found in the system.",
      });
    }

    req.user = {
      id: user._id,
      _id: user._id,
      role: user.role, // Keeps the original role field
      userType: capitalize(user.role), // <-- NEW: Mapped role to userType and capitalized it
      isVerified: user.isVerified || false,
      kyc: user.kyc || null,
    };

    console.log("Authenticated User:", req.user);

    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: "An error occurred during authentication.",
    });
  }
};

exports.isFundraiser = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "You must be logged in to access this resource.",
      });
    }

    const userRole = req.user.role;

    const isFundraiser = Array.isArray(userRole) ? userRole.includes("fundraiser") : userRole === "fundraiser";

    if (!isFundraiser) {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Access denied. Only fundraisers can access this route.",
      });
    }

    next();
  } catch (error) {
    console.error("Authorization Error:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: "An error occurred while checking user authorization.",
    });
  }
};

exports.isVerified = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "Authentication required. Please log in first.",
      });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Account not verified. Please complete verification.",
      });
    }

    next();
  } catch (error) {
    console.error("Verification Check Error:", error);
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: "An error occurred while verifying account status.",
    });
  }
};
