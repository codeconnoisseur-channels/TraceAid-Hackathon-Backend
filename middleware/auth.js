const userModel = require("../model/userModel");
const jwt = require("jsonwebtoken");

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Authentication Failed",
        message: "No token provided or token format is invalid (Bearer <token>)",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.id).select("role accountType kyc isEmailVerified");

    if (!user) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "User not found",
      });
    }

    req.user = decoded;
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
