const adminAuthModel = require("../model/adminAuth");
const jwt = require("jsonwebtoken");

exports.protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Authentication Failed",
        message:
          "No token provided or token format is invalid (Bearer <token>)",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await adminAuthModel.findById(decoded.id);

    if (!admin) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "admin not found",
      });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Access denied. Admin only",
      });
    }
    req.admin = admin;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Authentication Failed",
        message: "Session expired, please login again to continue",
      });
    }

    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.restrictAdmin = async (req, res, next) => {
  try {
    if (req.admin && req.admin.role === "admin") {
      next();
    } else {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Access denied. Only admin can access this resource",
      });
    }
  } catch (error) {
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: "An unexpected error occured while processing the authorization",
    });
  }
};
