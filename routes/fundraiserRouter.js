const {
  registerOrganization,
  verifyOrganization,
  resendOTP,
  loginOrganization,
  changePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("../controller/fundraiserController");
const { authenticate } = require("../middleware/auth");
const uploads = require("../utils/multer");
const {
  organizationRegisterValidator,
  organizationVerifyValidator,
  organizationResendValidator,
  organizationLoginValidator,
  organizationForgotPasswordValidator,
  organizationResetPasswordValidator,
  organizationChangePasswordValidator,
  organizationUpdateProfileValidator,
} = require("../validators/fundraiserValidator");

const router = require("express").Router();

router.post("/register", organizationRegisterValidator, registerOrganization);

router.post("/verify", organizationVerifyValidator, verifyOrganization);

router.post("/resend-otp", organizationResendValidator, resendOTP);

router.post("/login", organizationLoginValidator, loginOrganization);

router.post("/forgot-password", organizationForgotPasswordValidator, forgotPassword);

router.put("/reset-password/:token/:id", organizationResetPasswordValidator, resetPassword);

router.put("/change-password/:id", organizationChangePasswordValidator, authenticate, changePassword);

router.put("/update/:id", organizationUpdateProfileValidator, authenticate, uploads.single("profilePicture"), updateProfile);

module.exports = router;
