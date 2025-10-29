const express = require("express");
const router = express.Router();
const { authenticate, isFundraiser } = require("../middleware/auth");
const { kycValidator } = require("../validators/kycValidator");
const { addKyc } = require("../controller/kycController");
const uploads = require("../utils/multer");

/**
 * @swagger
 * /api/v1/add-kyc:
 *   post:
 *     summary: Submit KYC documents for verification
 *     description: Allows only Fundraiser (Organization) accounts to submit KYC documents. Uploads files to Cloudinary and creates a KYC record linked to the user.
 *     tags:
 *       - KYC
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - organizationName
 *               - registrationNumber
 *               - authorizedRepresentativeFullName
 *               - organizationAddress
 *               - bankAccountName
 *               - bankAccountNumber
 *               - bankName
 *               - description
 *               - registrationCertificate
 *               - authorizedRepresentativeId
 *               - proofOfAddress
 *             properties:
 *               organizationName:
 *                 type: string
 *                 example: "Hope Foundation"
 *               organizationType:
 *                 type: string
 *                 example: "NGO"
 *               registrationNumber:
 *                 type: string
 *                 example: "RC123456"
 *               authorizedRepresentativeFullName:
 *                 type: string
 *                 example: "John Doe"
 *               organizationAddress:
 *                 type: string
 *                 example: "12 Charity Avenue, Lagos, Nigeria"
 *               bankAccountName:
 *                 type: string
 *                 example: "Hope Foundation"
 *               bankAccountNumber:
 *                 type: string
 *                 example: "0123456789"
 *               bankName:
 *                 type: string
 *                 example: "GTBank"
 *               description:
 *                 type: string
 *                 example: "We provide education support for children in rural areas."
 *               registrationCertificate:
 *                 type: string
 *                 format: binary
 *                 description: Registration certificate document (JPG, JPEG, PNG, or PDF)
 *               authorizedRepresentativeId:
 *                 type: string
 *                 format: binary
 *                 description: Government-issued ID of authorized representative (JPG, JPEG, PNG, or PDF)
 *               proofOfAddress:
 *                 type: string
 *                 format: binary
 *                 description: Proof of organization address (JPG, JPEG, PNG, or PDF)
 *     responses:
 *       201:
 *         description: KYC documents submitted successfully
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
 *                   example: "KYC documents submitted successfully for review."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "670f5d1c8a72b143b0c12345"
 *                     user:
 *                       type: string
 *                       example: "670f5c998a72b143b0c56789"
 *                     verificationStatus:
 *                       type: string
 *                       example: "pending"
 *                     registrationCertificate:
 *                       type: object
 *                       properties:
 *                         imageUrl:
 *                           type: string
 *                           example: "https://res.cloudinary.com/demo/image/upload/v12345/cert.jpg"
 *                         publicId:
 *                           type: string
 *                           example: "traceaid/kyc/certificates/abc123"
 *                     authorizedRepresentativeId:
 *                       type: object
 *                       properties:
 *                         imageUrl:
 *                           type: string
 *                           example: "https://res.cloudinary.com/demo/image/upload/v12345/id.jpg"
 *                         publicId:
 *                           type: string
 *                           example: "traceaid/kyc/ids/xyz456"
 *                     proofOfAddress:
 *                       type: object
 *                       properties:
 *                         imageUrl:
 *                           type: string
 *                           example: "https://res.cloudinary.com/demo/image/upload/v12345/proof.pdf"
 *                         publicId:
 *                           type: string
 *                           example: "traceaid/kyc/proof_address/ghi789"
 *       400:
 *         description: Bad Request (missing or invalid fields)
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
 *                   example: "organizationName is required"
 *       401:
 *         description: Unauthorized access
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
 *                   example: "Only Fundraiser (Organization) accounts can submit KYC."
 *       500:
 *         description: Internal Server Error
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
 *                   example: "An unexpected error occurred."
 */
// router.post(
//   "/add-kyc",
//   authenticate,
//   isFundraiser,
//   uploads.fields([
//     { name: "registrationCertificate", maxCount: 1 },
//     { name: "authorizedRepresentativeId", maxCount: 1 },
//   ]),
//   (req, res, next) => {
//     console.log("MULTER FILES:", req.files);
//     console.log("MULTER BODY:", req.body);
//     next();
//   },
//   kycValidator,
//   addKyc
// );

router.post(
  "/add-kyc",
  authenticate,
  isFundraiser,
  uploads.fields([
    { name: "registrationCertificate", maxCount: 1 },
    { name: "authorizedRepresentativeId", maxCount: 1 },
  ]),
  (req, res, next) => {
    console.log("---- DEBUG MULTER ----");
    console.log("FILES:", req.files);
    console.log("BODY:", req.body);
    console.log("-----------------------");
    next();
  },
  kycValidator,
  addKyc
);



module.exports = router;
 