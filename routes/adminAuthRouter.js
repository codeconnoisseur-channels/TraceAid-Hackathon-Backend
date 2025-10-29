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

router.post("/register", registerValidator, registerAdmin);
router.post("/verify-otp", verifyValidator, verifyAdmin);
router.post("/resend-otp", resendValidator, resendOTP);
router.post("/login", loginValidator, loginAdmin);
router.post("/forgot-password", forgotPasswordValidator, forgotPassword);
router.put("/admin/reset-password/:token/:id", resetPasswordValidator, resetPassword);
router.put("/change-password", changePasswordValidator, protectAdmin, changePassword);
router.put("/update/:id", updateProfileValidator, protectAdmin, uploads.single("profilePicture"), updateProfile);
router.get("/admin/:id", protectAdmin, getOne);
module.exports = router;
