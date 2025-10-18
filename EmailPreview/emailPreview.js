const fs = require("fs");
const { forgotPasswordLink, registerOTP } = require("../emailTemplate/emailVerification");

// For now, just use a dummy reset link (for testing)
const verifyEmail = registerOTP("12345", "TestUser");
const forgotPasswordEmail = forgotPasswordLink("http://localhost:5050/api/v1/reset-password?token=12345", "TestUser");

fs.writeFileSync("verifyEmail.html", verifyEmail, "utf8");
fs.writeFileSync("forgotPasswordEmail.html", forgotPasswordEmail, "utf-8")

console.log("✅ Open the email html thats in project directory in your browser to see how the email looks");
