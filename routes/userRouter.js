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
} = require("../controller/userController");
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
} = require("../validators/userValidator");

const router = require("express").Router();

/**
 * @swagger
 * /api/v1/register:
 *   post:
 *     summary: Register a new user as either an individual or an organization
 *     description: |
 *       This endpoint allows a user to register as either an **individual** or an **organization**.
 *       - If `accountType` is `individual`, you must provide `firstName` and `lastName`.
 *       - If `accountType` is `organization`, you must provide `organizationName`.
 *       A verification OTP will be sent to the user's email upon successful registration.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - firstName
 *                   - lastName
 *                   - email
 *                   - phoneNumber
 *                   - password
 *                   - confirmPassword
 *                   - accountType
 *                   - acceptedTerms
 *                 properties:
 *                   accountType:
 *                     type: string
 *                     enum: [individual]
 *                     example: individual
 *                   firstName:
 *                     type: string
 *                     example: John
 *                   lastName:
 *                     type: string
 *                     example: Doe
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: johndoe@gmail.com
 *                   phoneNumber:
 *                     type: string
 *                     example: 08012345678
 *                   password:
 *                     type: string
 *                     example: secret123
 *                   confirmPassword:
 *                     type: string
 *                     example: secret123
 *                   acceptedTerms:
 *                     type: boolean
 *                     example: true
 *               - type: object
 *                 required:
 *                   - organizationName
 *                   - email
 *                   - phoneNumber
 *                   - password
 *                   - confirmPassword
 *                   - accountType
 *                   - acceptedTerms
 *                 properties:
 *                   accountType:
 *                     type: string
 *                     enum: [organization]
 *                     example: organization
 *                   organizationName:
 *                     type: string
 *                     example: "Helping Hands Foundation"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: info@helpinghands.org
 *                   phoneNumber:
 *                     type: string
 *                     example: 08098765432
 *                   password:
 *                     type: string
 *                     example: secret123
 *                   confirmPassword:
 *                     type: string
 *                     example: secret123
 *                   acceptedTerms:
 *                     type: boolean
 *                     example: true
 *     responses:
 *       201:
 *         description: User registration successful — verification OTP sent to email.
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: Created
 *               message: User Registration successful
 *               data:
 *                 user:
 *                   _id: 6720fabb8e2c91822c456abc
 *                   email: johndoe@gmail.com
 *                   accountType: individual
 *                   role: donor
 *                   isVerified: false
 *       400:
 *         description: Invalid input or missing required fields.
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Bad Request
 *               message: All individual fields are required
 *       500:
 *         description: Server error during registration.
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: "Error registering user"
 */
router.post("/register", registerValidator, registerUser);

/**
 * @swagger
 * /api/v1/verify-otp:
 *   post:
 *     summary: Verify user email using the OTP sent after registration
 *     description: |
 *       This endpoint verifies a user's email address by checking the **OTP** (One-Time Password) sent during registration.
 *       The OTP must match the one stored in the database and must not be expired.
 *     tags: [Authentication]
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
 *                 format: email
 *                 example: johndoe@gmail.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verification successful
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Email verification successful
 *       400:
 *         description: Invalid OTP, expired OTP, or missing fields
 *         content:
 *           application/json:
 *             examples:
 *               MissingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Email and OTP are required
 *               InvalidOTP:
 *                 summary: Invalid OTP provided
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Invalid OTP
 *               ExpiredOTP:
 *                 summary: OTP has expired
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: OTP has expired
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: User not found
 *       500:
 *         description: Server error during OTP verification
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: "Error verifying user"
 */
router.post("/verify-otp", verifyValidator, verifyUser);

/**
 * @swagger
 * /api/v1/resend-otp:
 *   post:
 *     summary: Resend a new OTP to the user’s registered email
 *     description: |
 *       This endpoint resends a new **OTP** (One-Time Password) to the user's registered email address for verification.
 *       If an OTP is still active (not expired), the user must wait until it expires before requesting another one.
 *     tags: [Authentication]
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
 *                 example: johndoe@gmail.com
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: OTP resent successfully
 *       400:
 *         description: Missing email or OTP already sent recently
 *         content:
 *           application/json:
 *             examples:
 *               MissingEmail:
 *                 summary: Missing email field
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Email is required
 *               ActiveOTP:
 *                 summary: Existing OTP still active
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: "OTP has already been sent. Please try again after 12:45:00 PM"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: User not found
 *       500:
 *         description: Server error while resending OTP
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: "Error resending OTP"
 */
router.post("/resend-otp", resendValidator, resendOTP);

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Login a user with valid credentials
 *     description: |
 *       This endpoint allows a verified user to log in using their **email** and **password**.
 *       Upon successful authentication, a **JWT token** is returned for accessing protected routes.
 *     tags: [Authentication]
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
 *                 example: johndoe@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Login successful
 *               data:
 *                 user:
 *                   _id: "64f6e36a2c8bde9b047a12ef"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   email: "johndoe@gmail.com"
 *                   role: "donor"
 *                   isVerified: true
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5..."
 *       400:
 *         description: Missing fields or invalid credentials
 *         content:
 *           application/json:
 *             examples:
 *               MissingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Email and password are required
 *               InvalidCredentials:
 *                 summary: Incorrect email or password
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Invalid credentials
 *       403:
 *         description: Account not verified
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Forbidden
 *               message: Account not verified. Please verify your email first.
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: Invalid credentials
 *       500:
 *         description: Server error during login
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: "Error logging in user"
 */
router.post("/login", loginValidator, loginUser);

/**
 * @swagger
 * /api/v1/forgot-password:
 *   post:
 *     summary: Send password reset link to user's email
 *     description: Sends a secure token link to the registered email for password reset. Token expires in 10 minutes.
 *     tags:
 *       - Authentication
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
 *                 example: johndoe@gmail.com
 *     responses:
 *       200:
 *         description: Password reset link sent
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Password reset email sent
 *       400:
 *         description: Missing or invalid email
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Bad Request
 *               message: Email is required
 *       404:
 *         description: Email not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: Invalid email
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: Error sending OTP
 */
router.post("/forgot-password", forgotPasswordValidator, forgotPassword);

/**
 * @swagger
 * /api/v1/reset-password/{token}/{id}:
 *   put:
 *     summary: Reset password using reset token
 *     description: Resets a user's password using a valid reset token and user ID from the reset email.
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: JWT reset token from email link
 *         schema:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID from email link
 *         schema:
 *           type: string
 *           example: 6714d65f94e6123b5a1c81b7
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
 *                 example: newpassword123
 *               confirmPassword:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Password reset successful
 *       400:
 *         description: Missing fields or mismatch
 *         content:
 *           application/json:
 *             examples:
 *               MissingFields:
 *                 summary: Missing password fields
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Password and confirm password are required
 *               PasswordMismatch:
 *                 summary: Passwords do not match
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Passwords do not match
 *       404:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: Token expired or invalid
 *       500:
 *         description: Server error during reset
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: Error resetting password
 */
router.put("/reset-password/:token/:id", resetPasswordValidator, resetPassword);

/**
 * @swagger
 * /api/v1/change-password/{id}:
 *   put:
 *     summary: Change a user's password
 *     description: |
 *       This endpoint allows an **authenticated user** to change their password.  
 *       It verifies the old password, ensures the new one is different, and validates that both password fields match.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The user's unique ID
 *         schema:
 *           type: string
 *           example: 6714d65f94e6123b5a1c81b7
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
 *                 example: currentPassword123
 *               newPassword:
 *                 type: string
 *                 example: newStrongPassword456
 *               confirmPassword:
 *                 type: string
 *                 example: newStrongPassword456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Password changed successfully
 *       400:
 *         description: Validation error or password mismatch
 *         content:
 *           application/json:
 *             examples:
 *               MissingFields:
 *                 summary: Missing fields
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: All fields are required
 *               OldPasswordMismatch:
 *                 summary: Old password incorrect
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Password does not match your current password
 *               SamePassword:
 *                 summary: New password same as old
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: New password cannot be the same as the old password
 *               PasswordsMismatch:
 *                 summary: New and confirm password mismatch
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Passwords do not match
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: User not found
 *       500:
 *         description: Server error while changing password
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: Error changing password
 */
router.put("/change-password/:id", changePasswordValidator, authenticate, changePassword);

/**
 * @swagger
 * /api/v1/update/{id}:
 *   put:
 *     summary: Update user profile
 *     description: |
 *       This endpoint allows an **authenticated user** to update their profile information such as name, organization, phone number, and profile picture.  
 *       The profile picture is uploaded to Cloudinary and existing user data is preserved if not provided.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique ID of the user whose profile is being updated
 *         schema:
 *           type: string
 *           example: 6714d65f94e6123b5a1c81b7
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               organizationName:
 *                 type: string
 *                 example: Tech Innovations Ltd
 *               phoneNumber:
 *                 type: string
 *                 description: Nigerian phone number (will be formatted to +234 automatically)
 *                 example: 08012345678
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Upload a profile picture (JPG, PNG, etc.)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Profile updated successfully
 *               data:
 *                 _id: 6714d65f94e6123b5a1c81b7
 *                 firstName: John
 *                 lastName: Doe
 *                 organizationName: Tech Innovations Ltd
 *                 phoneNumber: "+2348012345678"
 *                 profilePicture:
 *                   imageUrl: "https://res.cloudinary.com/demo/image/upload/v1731234567/sample.jpg"
 *                   publicId: "profile_abc123"
 *       400:
 *         description: Invalid or missing data
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Bad Request
 *               message: Validation failed for one or more fields
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: User not found
 *       500:
 *         description: Server error while updating profile
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: Error updating profile
 */
router.put("/update/:id", updateProfileValidator, authenticate, uploads.single("profilePicture"), updateProfile);

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Initiate Google OAuth2 authentication
 *     description: |
 *       Redirects the user to **Google’s authentication page** for login or registration using their Google account.  
 *       After successful authentication, Google redirects the user to the callback URL.
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google for authentication
 *         headers:
 *           Location:
 *             description: Google login URL
 *             schema:
 *               type: string
 *               example: https://accounts.google.com/o/oauth2/v2/auth
 *       500:
 *         description: Server error initiating Google authentication
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: "Error initiating Google OAuth"
 */
router.get("/auth/google", profile);

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth2 callback
 *     description: |
 *       This endpoint handles the **callback** after Google authentication.  
 *       It either logs in an existing user or automatically registers a new one using their Google account details.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User successfully authenticated via Google
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: "Login successful via Google"
 *               data:
 *                 _id: 6714d65f94e6123b5a1c81b7
 *                 fullName: John Doe
 *                 email: johndoe@gmail.com
 *                 accountType: individual
 *                 role: donor
 *                 isVerified: true
 *                 profilePicture:
 *                   imageUrl: "https://lh3.googleusercontent.com/a-/AOh14Ghxyz123"
 *                   publicId: "1132837461827364"
 *       302:
 *         description: Redirects the user after login (based on app setup)
 *         headers:
 *           Location:
 *             description: Redirect destination after successful login
 *             schema:
 *               type: string
 *               example: "/"
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Unauthorized
 *               message: "Google authentication failed"
 *       500:
 *         description: Server error during Google callback processing
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: "Error processing Google OAuth callback"
 */
router.get("/auth/google/callback", loginProfile);

/**
 * @swagger
 * /api/v1/set-role:
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
 * /api/v1/auth/google:
 *   post:
 *     summary: Sign in or register user using Google Authentication
 *     description: |
 *       This endpoint allows users to **sign in or register** using their **Google account**.  
 *       The client must send a **Google ID Token** obtained from Google Sign-In.  
 *       - If the user does **not exist**, a new account is automatically created.  
 *       - If the user **already exists**, they are logged in directly.  
 *       
 *       The endpoint returns a JWT token for authorization and indicates whether the user is new.
 *     tags: [Authentication]
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
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU2ZT..."
 *     responses:
 *       200:
 *         description: Successful Google authentication
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Login successful
 *               data:
 *                 user:
 *                   _id: 6714d65f94e6123b5a1c81b7
 *                   fullName: John Doe
 *                   email: johndoe@gmail.com
 *                   accountType: individual
 *                   role: donor
 *                   phoneNumber: "0000000000"
 *                   isEmailVerified: true
 *                   profilePicture:
 *                     imageUrl: "https://lh3.googleusercontent.com/a-/AOh14Gj..."
 *                     publicId: "GOOGLE_103498109231"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 isNewUser: false
 *       400:
 *         description: Invalid or missing Google token
 *         content:
 *           application/json:
 *             examples:
 *               MissingToken:
 *                 summary: Token missing or malformed
 *                 value:
 *                   statusCode: false
 *                   statusText: Bad Request
 *                   message: Invalid token or missing email in token.
 *       500:
 *         description: Server error during Google authentication
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: "Error logging in with Google"
 */
router.post("/auth/google", googleAuth);

/**
 * @swagger
 * /api/v1/user/{id}:
 *   get:
 *     summary: Retrieve a single user by ID
 *     description: |
 *       This endpoint allows the frontend to fetch a specific user's details by their **User ID**.
 *       
 *       - No authentication required.
 *       - The **password** field is automatically excluded from the response.
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique ID of the user to retrieve
 *         schema:
 *           type: string
 *           example: 6714d65f94e6123b5a1c81b7
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               data:
 *                 _id: "6714d65f94e6123b5a1c81b7"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 email: "johndoe@gmail.com"
 *                 role: "donor"
 *                 accountType: "individual"
 *                 createdAt: "2025-10-20T12:00:00.000Z"
 *                 updatedAt: "2025-10-20T12:00:00.000Z"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: Error retrieving user
 */
router.get("/user/:id", getOne);



module.exports = router;
