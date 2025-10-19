const {
  registerUser,
  verifyUser,
  loginUser,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  setRole,
} = require("../controller/userController");
const { authenticate } = require("../middleware/auth");
const { profile, loginProfile } = require("../middleware/passport");
const uploads = require("../utils/multer");
const { registerValidator, verifyValidator, resendValidator } = require("../validators/validator");

const router = require("express").Router();

/**
 * @swagger
 * /api/v1/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phoneNumber
 *               - password
 *               - confirmPassword
 *               - acceptedTerms
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: johndoe@gmail.com
 *               phoneNumber:
 *                 type: string
 *                 example: 08012345678
 *               password:
 *                 type: string
 *                 example: secret123
 *               confirmPassword:
 *                 type: string
 *                 example: secret123
 *               accountType:
 *                 type: string
 *                 example: individual
 *               acceptedTerms:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: User Registration successful
 *       400:
 *         description: Bad Request
 */
router.post("/register", registerValidator, registerUser);

/**
 * @swagger
 * /api/v1/verify-otp:
 *   post:
 *     summary: Verify user email using OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@gmail.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verification successful
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-otp", verifyValidator, verifyUser);

/**
 * @swagger
 * /api/v1/resend-otp:
 *   post:
 *     summary: Resend verification OTP to user email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@gmail.com
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Failed to resend OTP
 */
router.post("/resend-otp", resendValidator, resendOTP);

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Log in a user and return a JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@gmail.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful (returns user and token)
 *       400:
 *         description: Bad Request / Invalid credentials
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /api/v1/forgot-password:
 *   post:
 *     summary: Send password reset link to the user's email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@gmail.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: Email not found
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/v1/reset-password/{id}:
 *   get:
 *     summary: Reset password using a link (id param used in your implementation)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID used in the reset link
 *     responses:
 *       200:
 *         description: Password reset successful (or show reset form depending on implementation)
 *       400:
 *         description: Invalid or expired token/id
 */
router.get("/reset-password/:id", resetPassword);

/**
 * @swagger
 * /api/v1/change-password/{id}:
 *   put:
 *     summary: Change logged-in user's password (requires auth)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: oldpass123
 *               newPassword:
 *                 type: string
 *                 example: newpass456
 *               confirmPassword:
 *                 type: string
 *                 example: newpass456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.put("/change-password/:id", authenticate, changePassword);

/**
 * @swagger
 * /api/v1/update/{id}:
 *   put:
 *     summary: Update user profile and optionally upload profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe Updated
 *               phoneNumber:
 *                 type: string
 *                 example: 08012345678
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.put("/update/:id", authenticate, uploads.single("profilePicture"), updateProfile);
router.get("/google-Auth", profile)
router.get("/google-Auth/callback", loginProfile)


/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Start Google OAuth (redirect to Google)
 *     tags: [Users]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get("/auth/google", profile);

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback endpoint
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Google login successful (returns user & token)
 *       400:
 *         description: Google authentication failed
 */
router.get("/auth/google/callback", loginProfile);

/**
 * @swagger
 * /api/v1/set-role:
 *   put:
 *     summary: Set or update the user's accountType and role (e.g., organization/individual)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountType
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [individual, organization]
 *                 example: individual
 *     responses:
 *       200:
 *         description: Account type and role set successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put("/set-role", authenticate, setRole);

module.exports = router;
