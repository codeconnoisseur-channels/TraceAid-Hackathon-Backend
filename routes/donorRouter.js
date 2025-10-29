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
  googleAuth,
  getOne,
} = require("../controller/donorController");
const { authenticate } = require("../middleware/auth");
const { profile, loginProfile, passport } = require("../middleware/passport");
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
} = require("../validators/donorsValidator");

const router = require("express").Router();

/**
 * @swagger
 * /donor/api/v1/register:
 *   post:
 *     summary: Register a new donor
 *     description: Creates a new donor account and sends an OTP to the user's email for verification.
 *     tags:
 *       - Donor Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phoneNumber
 *               - password
 *               - confirmPassword
 *               - acceptedTerms
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Donor's first name.
 *                 example: John
 *               lastName:
 *                 type: string
 *                 description: Donor's last name.
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Donor's email address.
 *                 example: johndoe@example.com
 *               phoneNumber:
 *                 type: string
 *                 description: Nigerian phone number (must start with 0 and will be auto-prefixed with +234).
 *                 example: "08012345678"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password for the account.
 *                 example: MyStrongPass123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Must match the password field.
 *                 example: MyStrongPass123
 *               acceptedTerms:
 *                 type: boolean
 *                 description: Indicates if the user agreed to the terms and conditions.
 *                 example: true
 *     responses:
 *       201:
 *         description: Donor registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: true
 *                 statusText:
 *                   type: string
 *                   example: "Created"
 *                 message:
 *                   type: string
 *                   example: "User Registration successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "6720b53e894a4219a48fa01c"
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         email:
 *                           type: string
 *                           example: "johndoe@example.com"
 *                         phoneNumber:
 *                           type: string
 *                           example: "+2348012345678"
 *                         isVerified:
 *                           type: boolean
 *                           example: false
 *                         otp:
 *                           type: string
 *                           example: "482915"
 *       400:
 *         description: Bad Request - Validation error, password mismatch, or existing user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "User with this email already exists"
 *       500:
 *         description: Internal Server Error - Unexpected server failure.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "Error registering user"
 */
router.post("/register", registerValidator, registerUser);

/**
 * @swagger
 * /donor/api/v1/verify-otp:
 *   post:
 *     summary: Verify donor email with OTP
 *     tags: [Donor Authentication]
 *     description: Verifies a donor's account by checking the OTP sent to their email during registration.
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
 *                 example: "583920"
 *     responses:
 *       200:
 *         description: Email verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: true
 *                 statusText:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Email verification successful
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Bad Request
 *                 message:
 *                   type: string
 *                   example: Invalid OTP or OTP has expired
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Not Found
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: Unexpected error occurred
 */
router.post("/resend-otp", resendValidator, resendOTP);

/**
 * @swagger
 * /donor/api/v1/login:
 *   post:
 *     summary: Donor Login
 *     tags: [Donor Authentication]
 *     description: Authenticates a registered and verified donor using their email and password.
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
 *                 example: MyStrongPassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: true
 *                 statusText:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       example:
 *                         _id: "673e1234abc7890def567890"
 *                         firstName: "John"
 *                         lastName: "Doe"
 *                         email: "johndoe@gmail.com"
 *                         phoneNumber: "+2348012345678"
 *                         isVerified: true
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid credentials or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Bad Request
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *       403:
 *         description: Account not verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Forbidden
 *                 message:
 *                   type: string
 *                   example: Account not verified. Please verify your email first.
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Not Found
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: Unexpected error occurred while logging in
 */
router.post("/login", loginValidator, loginUser);

/**
 * @swagger
 * /donor/api/v1/forgot-password:
 *   post:
 *     summary: Initiate password reset
 *     tags: [Donor Authentication]
 *     description: Sends a password reset link to the donor's registered email address if the account exists.
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
 *                 format: email
 *                 example: johndoe@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: true
 *                 statusText:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Password reset email sent
 *       400:
 *         description: Missing or invalid email address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Bad Request
 *                 message:
 *                   type: string
 *                   example: Email is required
 *       404:
 *         description: User not found for the provided email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Not Found
 *                 message:
 *                   type: string
 *                   example: Invalid email
 *       500:
 *         description: Internal server error while sending reset email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: Unexpected error occurred while sending password reset email
 */
router.post("/forgot-password", forgotPasswordValidator, forgotPassword);

/**
 * @swagger
 * /donor/api/v1/users/reset-password/{token}/{id}:
 *   put:
 *     summary: Reset user password
 *     tags: [Donor Authentication]
 *     description: Allows a user to reset their password using a valid reset token sent via email.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: JWT reset token sent to user's email
 *         schema:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           example: 673fbb63e2e8d2d6a93f4c5a
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *             properties:
 *               password:
 *                 type: string
 *                 example: NewSecurePassword@2025
 *               confirmPassword:
 *                 type: string
 *                 example: NewSecurePassword@2025
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: true
 *                 statusText:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: Bad request — invalid input or mismatched passwords
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Bad Request
 *                 message:
 *                   type: string
 *                   example: Passwords do not match or missing fields
 *       404:
 *         description: Token expired or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Not Found
 *                 message:
 *                   type: string
 *                   example: Invalid or expired reset link
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: Unexpected error occurred while resetting password
 */
router.put("/reset-password/:token/:id", resetPasswordValidator, resetPassword);

/**
 * @swagger
 * /donor/api/v1/users/change-password/{id}:
 *   put:
 *     summary: Change user password (authenticated)
 *     tags: [Donor Authentication]
 *     description: Allows an authenticated user to change their password by providing the current and new passwords.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           example: 67420ac2e3c9237f7a9b81a1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: OldPassword@2024
 *               newPassword:
 *                 type: string
 *                 example: NewSecurePassword@2025
 *               confirmPassword:
 *                 type: string
 *                 example: NewSecurePassword@2025
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: true
 *                 statusText:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Invalid input or password mismatch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Bad Request
 *                 message:
 *                   type: string
 *                   example: New passwords do not match or incorrect current password
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Unauthorized
 *                 message:
 *                   type: string
 *                   example: Authentication failed or token expired
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Not Found
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: Unexpected error occurred while changing password
 */
router.put(
  "/change-password/:id",
  changePasswordValidator,
  authenticate,
  changePassword
);

/**
 * @swagger
 * /donor/api/v1/users/update/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Donor Authentication]
 *     description: Allows an authenticated user to update their profile information, including uploading a profile picture.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user whose profile is being updated
 *         schema:
 *           type: string
 *           example: 67420ac2e3c9237f7a9b81a1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348012345678"
 *               address:
 *                 type: string
 *                 example: 12 Admiralty Way, Lekki Phase 1, Lagos
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Optional profile picture upload
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: true
 *                 statusText:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 67420ac2e3c9237f7a9b81a1
 *                     fullName:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     phoneNumber:
 *                       type: string
 *                       example: +2348012345678
 *                     address:
 *                       type: string
 *                       example: 12 Admiralty Way, Lekki Phase 1, Lagos
 *                     profilePicture:
 *                       type: string
 *                       example: https://res.cloudinary.com/example/image/upload/v1729912739/profile.jpg
 *       400:
 *         description: Invalid input or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Bad Request
 *                 message:
 *                   type: string
 *                   example: Invalid phone number format or missing required fields
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Unauthorized
 *                 message:
 *                   type: string
 *                   example: Authentication failed or token expired
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Not Found
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error while updating profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: Unexpected error occurred while updating profile
 */
router.put(
  "/update/:id",
  updateProfileValidator,
  authenticate,
  uploads.single("profilePicture"),
  updateProfile
);

/**
 * @swagger
 * /donor/api/v1/users/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Donor Authentication]
 *     description: Redirects the user to Google for authentication. After successful login, Google redirects the user back to your callback endpoint with an authorization code.
 *     responses:
 *       302:
 *         description: Redirect to Google authentication page
 *         headers:
 *           Location:
 *             description: Google OAuth login URL
 *             schema:
 *               type: string
 *               example: https://accounts.google.com/o/oauth2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_CALLBACK_URL
 *       500:
 *         description: Internal server error while initiating Google authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: Unexpected error occurred while initiating Google OAuth
 */
router.get("/auth/google", profile);

/**
 * @swagger
 * /donor/api/v1/users/auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     tags: [Donor Authentication]
 *     description: Handles the callback from Google after the user authorizes the application. Retrieves user information from Google and either logs in the existing user or registers a new account.
 *     responses:
 *       200:
 *         description: Successfully authenticated via Google OAuth
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: true
 *                 statusText:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "User logged in successfully via Google OAuth"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "6721234abcd56789ef012345"
 *                     fullName:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "johndoe@gmail.com"
 *                     profilePicture:
 *                       type: string
 *                       example: "https://lh3.googleusercontent.com/a-/AOh14GgEXAMPLE"
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Bad Request (invalid or missing authorization code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired authorization code."
 *       500:
 *         description: Internal Server Error (failed to process Google login)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "Unexpected error occurred during Google OAuth callback handling."
 */
router.get("/auth/google/callback", loginProfile);

/**
 * @swagger
 * /donor/api/v1/set-role:
 *   put:
 *     summary: Set user account type and role
 *     description: |
 *       This endpoint allows an authenticated user to **set their account type** as either
 *       an `individual` or an `organization`.
 *
 *       - If `accountType` = `individual`, the user is assigned the **donor** role.
 *       - If `accountType` = `organization`, the user is assigned the **fundraiser** role.
 *
 *       The request must include a valid authentication token.
 *     tags: [User Management]
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
 *         description: Account type and role successfully updated
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Account type and role set successfully.
 *               data:
 *                 _id: 6714d65f94e6123b5a1c81b7
 *                 firstName: John
 *                 lastName: Doe
 *                 email: johndoe@gmail.com
 *                 accountType: individual
 *                 role: donor
 *       400:
 *         description: Missing or invalid account type
 *         content:
 *           application/json:
 *             examples:
 *               MissingField:
 *                 summary: Missing accountType field
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Account type is required.
 *               InvalidType:
 *                 summary: Invalid accountType provided
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Invalid account type provided.
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Unauthorized
 *               message: "Authentication failed. Please log in again."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: "Error setting user role"
 */
router.put("/set-role", authenticate, setRole);

/**
 * @swagger
 * /donor/api/v1/users/auth/google:
 *   post:
 *     summary: Authenticate user with Google
 *     tags: [Donor Authentication]
 *     description: Authenticates a user using a Google ID token sent from the client. If the user does not exist, a new account is created automatically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token obtained from the client-side Google Sign-In
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1Nz..."
 *     responses:
 *       200:
 *         description: Successfully authenticated via Google ID token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: true
 *                 statusText:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "6721234abcd56789ef012345"
 *                         fullName:
 *                           type: string
 *                           example: "Jane Doe"
 *                         email:
 *                           type: string
 *                           example: "janedoe@gmail.com"
 *                         profilePicture:
 *                           type: string
 *                           example: "https://lh3.googleusercontent.com/a-/AOh14GgEXAMPLE"
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     isNewUser:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Invalid Google token or missing email in token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Invalid token or missing email in token."
 *       500:
 *         description: Internal Server Error (Google authentication failed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "Unexpected error occurred during Google authentication."
 */
router.post("/auth/google", googleAuth);

/**
 * @swagger
 * /donor/api/v1/users/user/{id}:
 *   get:
 *     summary: Retrieve a user profile by ID
 *     tags: [Donor Authentication]
 *     description: Fetch detailed profile information for a specific user using their unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique ID of the user to retrieve
 *         schema:
 *           type: string
 *           example: "6719f38c0b15d22f40c9d111"
 *     responses:
 *       200:
 *         description: User found and returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: true
 *                 statusText:
 *                   type: string
 *                   example: "OK"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "6719f38c0b15d22f40c9d111"
 *                     firstName:
 *                       type: string
 *                       example: "Jane"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "janedoe@gmail.com"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+2348123456789"
 *                     profilePicture:
 *                       type: string
 *                       example: "https://res.cloudinary.com/tracenaid/image/upload/v12345/userpic.jpg"
 *                     role:
 *                       type: string
 *                       example: "donor"
 *                     accountType:
 *                       type: string
 *                       example: "individual"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: "Not Found"
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal Server Error while fetching user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 statusText:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "Unexpected error occurred while retrieving user information"
 */
router.get("/user/:id", getOne);

module.exports = router;
