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


router.post("/register", registerValidator, registerUser);


router.post("/verify-otp", verifyValidator, verifyUser);


router.post("/resend-otp", resendValidator, resendOTP);


router.post("/login", loginValidator, loginUser);


router.post("/forgot-password", forgotPasswordValidator, forgotPassword);


router.put("/reset-password/:token/:id", resetPasswordValidator, resetPassword);


router.put("/change-password/:id", changePasswordValidator, authenticate, changePassword);


router.put("/update/:id", updateProfileValidator, authenticate, uploads.single("profilePicture"), updateProfile);


router.get("/auth/google", profile);

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


router.post("/auth/google", googleAuth);

router.get("/user/:id", getOne);



module.exports = router;
