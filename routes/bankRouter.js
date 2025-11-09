const express = require("express");
const router = express.Router();
const { isFundraiser, authenticate } = require("../middleware/auth");
const { addOrUpdateBankAccount, getAllBanks } = require("../controller/bankController");

// Fundraiser adds or updates bank account (protected route)
/**
 * @swagger
 * /bank/api/v1/add:
 *   post:
 *     summary: Add or update a fundraiser’s bank account
 *     description: |
 *       This endpoint allows an authenticated **fundraiser** to add or update their bank account details.  
 *       The system automatically registers the account on **Kora** to generate a recipient code for payouts.
 *     tags:
 *       - Fundraiser - Bank Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - accountHolder
 *               - bankName
 *               - bankCode
 *             properties:
 *               campaignId:
 *                 type: string
 *                 example: "671fc90fa2b1a4c9e84b91d2"
 *                 description: Optional campaign ID to link the bank account
 *               accountNumber:
 *                 type: string
 *                 example: "0123456789"
 *               accountHolder:
 *                 type: string
 *                 example: "Adewale Johnson"
 *               bankName:
 *                 type: string
 *                 example: "Guaranty Trust Bank"
 *               bankCode:
 *                 type: string
 *                 example: "058"
 *     responses:
 *       201:
 *         description: Bank account successfully added or updated
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "Created"
 *               message: "Bank account verified and saved successfully"
 *               data:
 *                 _id: "67225b2cf7a5d3efb908c1e4"
 *                 fundraiser: "671fae58e4b73c74b49f8a5a"
 *                 campaign: "671fc90fa2b1a4c9e84b91d2"
 *                 accountNumber: "0123456789"
 *                 accountHolder: "Adewale Johnson"
 *                 bankName: "Guaranty Trust Bank"
 *                 bankCode: "058"
 *                 koraRecipientCode: "RCP_3f91b26d54e7"
 *                 status: "verified"
 *                 createdAt: "2025-10-25T08:12:00.000Z"
 *                 updatedAt: "2025-10-25T08:12:00.000Z"
 *       400:
 *         description: Missing or invalid bank details
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Bad Request"
 *               message: "All bank details are required"
 *       401:
 *         description: Unauthorized — Missing or invalid token
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Authentication required"
 *       403:
 *         description: Forbidden — Only fundraisers are allowed
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "Access denied. Fundraiser role required."
 *       500:
 *         description: Kora API or server error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error adding bank account: Recipient creation failed at Kora"
 */
router.post("/add", authenticate, isFundraiser, addOrUpdateBankAccount);

// Optional: get all bank accounts for a fundraiser (for testing or admin view)

/**
 * @swagger
 * /bank/api/v1/get-all-banks:
 *   get:
 *     summary: Retrieve all bank accounts of a fundraiser
 *     description: |
 *       This endpoint allows an authenticated **fundraiser** to retrieve all bank accounts they have previously added or verified.
 *       Each record contains the account information and its verification status.
 *     tags:
 *       - Fundraiser - Bank Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all fundraiser bank accounts
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Banks retrieved successfully"
 *               data:
 *                 - _id: "67225b2cf7a5d3efb908c1e4"
 *                   fundraiser: "671fae58e4b73c74b49f8a5a"
 *                   campaign: "671fc90fa2b1a4c9e84b91d2"
 *                   accountNumber: "0123456789"
 *                   accountHolder: "Adewale Johnson"
 *                   bankName: "Guaranty Trust Bank"
 *                   bankCode: "058"
 *                   koraRecipientCode: "RCP_3f91b26d54e7"
 *                   status: "verified"
 *                   createdAt: "2025-10-25T08:12:00.000Z"
 *                   updatedAt: "2025-10-25T08:12:00.000Z"
 *       401:
 *         description: Unauthorized — Missing or invalid token
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Authentication required"
 *       403:
 *         description: Forbidden — Only fundraisers are allowed
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "Access denied. Fundraiser role required."
 *       404:
 *         description: No bank records found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "No bank accounts found for this fundraiser"
 *       500:
 *         description: Server error while retrieving banks
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error fetching banks"
 */
router.get("/get-all-banks", authenticate, isFundraiser, getAllBanks)

module.exports = router;
