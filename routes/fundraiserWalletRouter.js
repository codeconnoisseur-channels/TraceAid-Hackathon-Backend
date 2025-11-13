const router = require("express").Router();
const { authenticate, isFundraiser } = require("../middleware/auth");
const {
  getFundraiserWallet,
  getPayoutHistory,
  requestPayoutByCampaignAndTheirMilestone,
  getFundraiserWithdrawals,
} = require("../controller/fundraiserWalletController");

/**
 * @swagger
 * tags:
 *   name: Fundraiser Wallet
 *   description: Endpoints for managing fundraiser wallet, payouts, and transactions.
 */

/**
 * @swagger
 * /fundraiser/api/v1/wallet/summary:
 *   get:
 *     summary: Get fundraiser wallet summary
 *     tags: [Fundraiser Wallet]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Returns wallet details of the currently authenticated fundraiser, including balances, per-campaign totals, and recent transactions.
 *     responses:
 *       200:
 *         description: Wallet summary retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                 statusText:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     availableBalance:
 *                       type: number
 *                       example: 50000
 *                     totalWithdrawn:
 *                       type: number
 *                       example: 150000
 *                     perCampaign:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           campaign:
 *                             type: string
 *                             example: "6730abc12e1234f6b1a2cd89"
 *                           credited:
 *                             type: number
 *                             example: 100000
 *                           debited:
 *                             type: number
 *                             example: 50000
 *                           balance:
 *                             type: number
 *                             example: 50000
 *                     totals:
 *                       type: object
 *                       properties:
 *                         credited:
 *                           type: number
 *                           example: 200000
 *                         debited:
 *                           type: number
 *                           example: 100000
 *                     recentTransactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: "credit"
 *                           amount:
 *                             type: number
 *                             example: 5000
 *                           source:
 *                             type: string
 *                             example: "donation"
 *                           reference:
 *                             type: string
 *                             example: "DON_7a3f98c"
 *                           createdAt:
 *                             type: string
 *                             example: "2025-11-05T10:00:00Z"
 *       401:
 *         description: Unauthorized — missing or invalid token.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/summary", authenticate, getFundraiserWallet);

/**
 * @swagger
 * /fundraiser/api/v1/wallet/request-payout:
 *   post:
 *     summary: Request payout for a campaign
 *     tags: [Fundraiser Wallet]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Allows a fundraiser to request withdrawal (payout) of available funds from a specific campaign.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *               
 *             properties:
 *               campaignId:
 *                 type: string
 *                 example: "672e2a0ef6f123c5b9a0b12e"
 *               amount:
 *                 type: number
 *                 example: 10000
 *               note:
 *                 type: string
 *                 example: "Withdrawal for project phase 2"
 *     responses:
 *       201:
 *         description: Payout request created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     payout:
 *                       type: object
 *                       properties:
 *                         referenceID:
 *                           type: string
 *                           example: "PAYOUT_22b1afc9-f47e-4d6b-bca3-2a3b9123e2fa"
 *                         status:
 *                           type: string
 *                           example: "processing"
 *                         amount:
 *                           type: number
 *                           example: 10000
 *                         campaign:
 *                           type: string
 *                           example: "672e2a0ef6f123c5b9a0b12e"
 *                         requestedAt:
 *                           type: string
 *                           example: "2025-11-05T10:00:00Z"
 *       400:
 *         description: Missing or invalid parameters.
 *       401:
 *         description: Unauthorized — missing or invalid token.
 *       404:
 *         description: Wallet not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post("/request-payout", authenticate, requestPayoutByCampaignAndTheirMilestone);

/**
 * @swagger
 * /fundraiser/api/v1/wallet/payout-history:
 *   get:
 *     summary: Get fundraiser payout history
 *     tags: [Fundraiser Wallet]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Fetches the list of all payout requests made by the authenticated fundraiser. You can filter by campaign or status.
 *     parameters:
 *       - in: query
 *         name: campaignId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by campaign ID
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, rejected]
 *         description: Filter by payout status
 *     responses:
 *       200:
 *         description: Payout history retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       campaign:
 *                         type: string
 *                         example: "Medical Support for Esther"
 *                       amount:
 *                         type: number
 *                         example: 20000
 *                       status:
 *                         type: string
 *                         example: "completed"
 *                       requestedAt:
 *                         type: string
 *                         example: "2025-11-01T09:00:00Z"
 *                       completedAt:
 *                         type: string
 *                         example: "2025-11-03T15:30:00Z"
 *       401:
 *         description: Unauthorized — missing or invalid token.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/payout-history", authenticate, getPayoutHistory);

/**
 * @swagger
 * /fundraiser/api/v1/wallet/fundraiser-withdrawals/{id}:
 *   get:
 *     summary: Retrieve all withdrawal requests made by a fundraiser
 *     description: >
 *       This endpoint allows an authenticated fundraiser to view all their withdrawal requests, 
 *       including details like reference ID, campaign name, milestone, withdrawal status, 
 *       and wallet balance summary (available balance and total withdrawn).
 *     tags:
 *       - Fundraiser Wallet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The unique ID of the fundraiser
 *         schema:
 *           type: string
 *           example: "6730bfc8f0ad9b001fcaa128"
 *     responses:
 *       200:
 *         description: Successfully retrieved fundraiser withdrawals
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Fundraiser withdrawal requests fetched successfully"
 *               data:
 *                 availableBalance: 150000
 *                 totalWithdrawn: 50000
 *                 withdrawals:
 *                   - referenceID: "PAYOUT-98765"
 *                     campaignName: "Save a Child’s Education"
 *                     milestoneTitle: "Milestone 1: School Supplies"
 *                     sequence: 1
 *                     amount: 25000
 *                     status: "paid"
 *                     requestedAt: "2025-11-05T10:00:00.000Z"
 *                     processedAt: "2025-11-06T15:30:00.000Z"
 *                   - referenceID: "PAYOUT-98766"
 *                     campaignName: "Feed 100 Orphans"
 *                     milestoneTitle: "Milestone 2: Food Distribution"
 *                     sequence: 2
 *                     amount: 50000
 *                     status: "pending"
 *                     requestedAt: "2025-11-10T08:45:00.000Z"
 *                     processedAt: null
 *       401:
 *         description: Unauthorized — fundraiser authentication required
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Missing authenticated user"
 *       404:
 *         description: Wallet not found for this fundraiser
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "Wallet not found for this fundraiser"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "An unexpected error occurred while fetching withdrawals"
 */
router.get("/fundraiser-withdrawals/:id", authenticate, isFundraiser, getFundraiserWithdrawals)

module.exports = router;
