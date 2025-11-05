const {
  registerOrganization,
  verifyOrganization,
  resendOTP,
  loginOrganization,
  changePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
  fundraiserActivateCampaign,
  getOne,
  fundraiserDashboard,
} = require("../controller/fundraiserController");
const { authenticate, isFundraiser } = require("../middleware/auth");
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

/**
 * @swagger
 * /fundraiser/api/v1/register:
 *   post:
 *     summary: Register a new fundraising organization
 *     tags: [Fundraiser Management]
 *     description: |
 *       This endpoint allows a new fundraising organization to create an account.
 *       The organization must provide valid information including name, email, phone number, and matching passwords.
 *       Upon successful registration, an OTP email will be sent for account verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationName
 *               - email
 *               - phoneNumber
 *               - password
 *               - confirmPassword
 *               - acceptedTerms
 *             properties:
 *               organizationName:
 *                 type: string
 *                 example: "Hope Foundation"
 *               email:
 *                 type: string
 *                 example: "contact@hopefoundation.org"
 *               phoneNumber:
 *                 type: string
 *                 description: Nigerian phone number format (starts with 0)
 *                 example: "08012345678"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "StrongPass123!"
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: "StrongPass123!"
 *               acceptedTerms:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Organization registered successfully and OTP email sent
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
 *                           example: "671b32d2c4aab930dbf12f56"
 *                         organizationName:
 *                           type: string
 *                           example: "Hope Foundation"
 *                         email:
 *                           type: string
 *                           example: "contact@hopefoundation.org"
 *                         phoneNumber:
 *                           type: string
 *                           example: "+2348012345678"
 *                         isVerified:
 *                           type: boolean
 *                           example: false
 *       400:
 *         description: Invalid input or email already exists
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
 *         description: Internal server error during registration
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
 *                   example: "Unexpected error occurred while registering organization"
 */
router.post("/register", organizationRegisterValidator, registerOrganization);

/**
 * @swagger
 * /fundraiser/api/v1/verify:
 *   post:
 *     summary: Verify a fundraising organization's email address
 *     tags: [Fundraiser Management]
 *     description: |
 *       This endpoint verifies a newly registered fundraising organization's email using an OTP sent to their inbox.
 *       The organization must provide the same email used during registration and the valid OTP received.
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
 *                 example: "contact@hopefoundation.org"
 *               otp:
 *                 type: string
 *                 example: "123456"
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
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "Email verification successful"
 *       400:
 *         description: Invalid or expired OTP / Missing required fields
 *         content:
 *           application/json:
 *             examples:
 *               MissingFields:
 *                 summary: Missing email or OTP
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Email and OTP are required"
 *               InvalidOTP:
 *                 summary: Invalid OTP
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Invalid OTP"
 *               ExpiredOTP:
 *                 summary: Expired OTP
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "OTP has expired"
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
 *         description: Internal server error while verifying email
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
 *                   example: "Unexpected error occurred while verifying user"
 */
router.post("/verify", organizationVerifyValidator, verifyOrganization);

/**
 * @swagger
 * /fundraiser/api/v1/resend-otp:
 *   post:
 *     summary: Resend OTP to an organization's registered email
 *     tags: [Fundraiser Management]
 *     description: |
 *       This endpoint resends a new OTP to an organization's email address if the previous one has expired or was not received.
 *       The email provided must be the same as the one used during registration.
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
 *                 example: "contact@hopefoundation.org"
 *     responses:
 *       200:
 *         description: OTP resent successfully
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
 *                   example: "OTP resent successfully"
 *       400:
 *         description: Invalid request or OTP already sent recently
 *         content:
 *           application/json:
 *             examples:
 *               MissingEmail:
 *                 summary: Missing email field
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Email is required"
 *               EarlyRequest:
 *                 summary: OTP already sent and not yet expired
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "OTP has already been sent. Please try again after 12:34:56 PM"
 *       404:
 *         description: Organization not found for provided email
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
 *         description: Internal server error while resending OTP
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
 *                   example: "Unexpected error occurred while resending OTP"
 */
router.post("/resend-otp", organizationResendValidator, resendOTP);

/**
 * @swagger
 * /fundraiser/api/v1/login:
 *   post:
 *     summary: Log in an organization
 *     tags: [Fundraiser Management]
 *     description: |
 *       Authenticates an organization using email and password credentials.
 *       On successful login, a JSON Web Token (JWT) is returned for authenticated access.
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
 *                 format: email
 *                 example: "contact@hopefoundation.org"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123"
 *     responses:
 *       200:
 *         description: Login successful — returns user data and token
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
 *                           example: "66f7c915fbdc8a1234b89012"
 *                         organizationName:
 *                           type: string
 *                           example: "Hope Foundation"
 *                         email:
 *                           type: string
 *                           example: "contact@hopefoundation.org"
 *                         phoneNumber:
 *                           type: string
 *                           example: "+2348123456789"
 *                         isVerified:
 *                           type: boolean
 *                           example: true
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid input or incorrect password
 *         content:
 *           application/json:
 *             examples:
 *               MissingCredentials:
 *                 summary: Missing email or password
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Email and password are required"
 *               InvalidCredentials:
 *                 summary: Incorrect password
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Invalid credentials"
 *       403:
 *         description: Account not verified yet
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
 *                   example: "Forbidden"
 *                 message:
 *                   type: string
 *                   example: "Account not verified. Please verify your email first."
 *       404:
 *         description: User not found for provided email
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
 *                   example: "Invalid credentials"
 *       500:
 *         description: Internal server error while logging in
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
 *                   example: "Unexpected error occurred while logging in"
 */
router.post("/login", organizationLoginValidator, loginOrganization);

/**
 * @swagger
 * /fundraiser/api/v1/forgot-password:
 *   post:
 *     summary: Initiate password reset for an organization
 *     tags: [Fundraiser Management]
 *     description: |
 *       Sends a password reset link to the organization's registered email address.
 *       The email contains a token and ID for securely resetting the password.
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
 *                 example: "contact@hopefoundation.org"
 *     responses:
 *       200:
 *         description: Password reset link successfully sent
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
 *                   example: "Password reset link sent successfully to contact@hopefoundation.org"
 *       400:
 *         description: Invalid or missing email field
 *         content:
 *           application/json:
 *             examples:
 *               MissingEmail:
 *                 summary: No email provided
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Email is required"
 *               InvalidEmail:
 *                 summary: Email format invalid
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Invalid email format"
 *       404:
 *         description: Organization not found for provided email
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
 *                   example: "No organization found with this email address"
 *       500:
 *         description: Internal server error while sending reset link
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
 *                   example: "Unexpected error occurred while sending password reset email"
 */
router.post(
  "/forgot-password",
  organizationForgotPasswordValidator,
  forgotPassword
);

/**
 * @swagger
 * /fundraiser/api/v1/reset-password/{token}/{id}:
 *   put:
 *     summary: Reset organization password using token and ID
 *     tags: [Fundraiser Management]
 *     description: |
 *       Allows an organization to reset their password by providing a valid reset token and user ID.
 *       The new password must meet the required security standards (e.g., minimum length, confirmation match).
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         description: Token sent to the organization's email during the forgot password process.
 *         schema:
 *           type: string
 *           example: "f4c0b6a0d8e34b20f9f7b5df13e57b21"
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique ID of the organization account.
 *         schema:
 *           type: string
 *           example: "672f52c8a7b21e3abcf1a95e"
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
 *                 format: password
 *                 example: "NewSecurePassword123!"
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewSecurePassword123!"
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
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "Password reset successful. You can now log in with your new password."
 *       400:
 *         description: Invalid or expired token, or validation error
 *         content:
 *           application/json:
 *             examples:
 *               TokenExpired:
 *                 summary: Token expired
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Reset token has expired. Please request a new password reset."
 *               PasswordMismatch:
 *                 summary: Passwords do not match
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Password and confirm password do not match."
 *       404:
 *         description: Organization not found for provided ID
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
 *                   example: "Organization not found."
 *       500:
 *         description: Internal server error during password reset
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
 *                   example: "Unexpected error occurred while resetting password."
 */
router.put(
  "/reset-password/:token/:id",
  organizationResetPasswordValidator,
  resetPassword
);

/**
 * @swagger
 * /fundraiser/api/v1/change-password/{id}:
 *   put:
 *     summary: Change organization password (authenticated users only)
 *     tags: [Fundraiser Management]
 *     description: |
 *       Allows an authenticated organization to change their password.
 *       The user must provide the current password and the new password details.
 *       Authentication via a valid Bearer token is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique ID of the organization account.
 *         schema:
 *           type: string
 *           example: "672f52c8a7b21e3abcf1a95e"
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
 *                 format: password
 *                 example: "OldPassword123!"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewSecurePassword456!"
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewSecurePassword456!"
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
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully."
 *       400:
 *         description: Validation or password mismatch error
 *         content:
 *           application/json:
 *             examples:
 *               IncorrectPassword:
 *                 summary: Incorrect current password
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Current password is incorrect."
 *               PasswordMismatch:
 *                 summary: New and confirm password mismatch
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "New password and confirm password do not match."
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
 *                   example: "Unauthorized"
 *                 message:
 *                   type: string
 *                   example: "Access denied. Please provide a valid token."
 *       404:
 *         description: Organization not found
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
 *                   example: "Organization not found."
 *       500:
 *         description: Internal server error during password change
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
 *                   example: "Unexpected error occurred while updating password."
 */
router.put(
  "/change-password/:id",
  organizationChangePasswordValidator,
  authenticate,
  changePassword
);

/**
 * @swagger
 * /fundraiser/api/v1/update/{id}:
 *   put:
 *     summary: Update organization profile
 *     tags: [Fundraiser Management]
 *     description: |
 *       Allows an authenticated organization to update their profile details, such as organization name, description, contact information, or profile picture.
 *       This endpoint supports **multipart/form-data** to allow file uploads.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique ID of the organization account to update.
 *         schema:
 *           type: string
 *           example: "672f52c8a7b21e3abcf1a95e"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               organizationName:
 *                 type: string
 *                 example: "Hope for All Foundation"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "hopeforall@gmail.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348123456789"
 *               description:
 *                 type: string
 *                 example: "We provide aid and resources to underprivileged communities across Nigeria."
 *               address:
 *                 type: string
 *                 example: "24, Ajose Adeogun Street, Victoria Island, Lagos"
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Upload a new organization profile image.
 *     responses:
 *       200:
 *         description: Organization profile updated successfully
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
 *                   example: "Profile updated successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "672f52c8a7b21e3abcf1a95e"
 *                     organizationName:
 *                       type: string
 *                       example: "Hope for All Foundation"
 *                     email:
 *                       type: string
 *                       example: "hopeforall@gmail.com"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+2348123456789"
 *                     profilePicture:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/image/upload/v1730199201/hopeforall.jpg"
 *       400:
 *         description: Validation or file upload error
 *         content:
 *           application/json:
 *             examples:
 *               InvalidFileType:
 *                 summary: Unsupported file format
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Invalid file type. Only image formats are allowed."
 *               ValidationError:
 *                 summary: Invalid input data
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Please provide valid organization details."
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
 *                   example: "Unauthorized"
 *                 message:
 *                   type: string
 *                   example: "Access denied. Please provide a valid token."
 *       404:
 *         description: Organization not found
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
 *                   example: "Organization not found."
 *       500:
 *         description: Internal server error while updating organization profile
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
 *                   example: "Unexpected error occurred while updating organization profile."
 */
router.put(
  "/update/:id",
  organizationUpdateProfileValidator,
  authenticate,
  uploads.single("profilePicture"),
  updateProfile
);


router.patch("/campaigns/activate/:campaignId", authenticate, isFundraiser, fundraiserActivateCampaign)

router.get("/user/:id", getOne)

router.get("/fundraiser-dashboard", authenticate, isFundraiser, fundraiserDashboard)


module.exports = router;
