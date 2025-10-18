const { registerUser, verifyUser, loginUser, resendOTP, forgotPassword, resetPassword, changePassword, updateProfile } = require("../controller/userController");
const { authenticate } = require("../middleware/auth");
const uploads = require("../utils/multer");
const { registerValidator, verifyValidator, resendValidator } = require("../validators/validator");

const router = require("express").Router();

router.post("/register", registerValidator, registerUser);
router.post("/verify-otp", verifyValidator, verifyUser);
router.post("/resend-otp", resendValidator, resendOTP);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:id", resetPassword);
router.put("/change-password/:id", authenticate, changePassword);
router.put("/update/:id", authenticate, uploads.single("profilePicture"), updateProfile);

module.exports = router;