const {
  registerAdmin,
  verifyAdmin,
  resendOTP,
  loginAdmin,
  forgotPassword,
  resetPassword,
  changePassword,
  getOne,
  updateProfile,
} = require("../controller/adminAuthController");
const { protectAdmin } = require("../middleware/adminAuth");
const uploads = require("../utils/multer");
const {
  registerValidator,
  verifyValidator,
  resendValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
} = require("../validators/adminValidator");

const router = require("express").Router();

router.post("/admin/register", registerValidator, registerAdmin);
router.post("/admin/verify-otp", verifyValidator, verifyAdmin);
router.post("/admin/resend-otp", resendValidator, resendOTP);
router.post("/admin/login", loginValidator, loginAdmin);
router.post("/admin/forgot-password", forgotPasswordValidator, forgotPassword);
router.put(
  "/admin/reset-password/:token/:id",
  resetPasswordValidator,
  resetPassword
);
router.put(
  "/admin/change-password",
  changePasswordValidator,
  protectAdmin,
  changePassword
);
router.put(
  "/admin/update/:id",
  updateProfileValidator,
  protectAdmin,
  uploads.single("profilePicture"),
  updateProfile
);
router.get("/admin/admin/:id", protectAdmin, getOne);
module.exports = router;
