const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const {
  verifyPaymentWebhook,
  getDonationsByCampaign,
  getDonationsByUser,
  makeDonation,
  getAllDonationsForCampaign,
  getTopDonorsForCampaign,
} = require("../controller/donationController");

/**
 * @swagger
 * tags:
 *   name: Donation
 *   description: Donation management APIs
 */

/**
 * @swagger
 * /donation/api/v1/donate:
 *   post:
 *     summary: Make a donation to a campaign
 *     tags: [Donation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               campaignId:
 *                 type: string
 *                 example: 672e2a0ef6f123c5b9a0b12e
 *               amount:
 *                 type: number
 *                 example: 5000
 *               isAnonymous:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Supporting this cause!"
 *     responses:
 *       201:
 *         description: Donation initialized successfully.
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
 *                     paymentReference:
 *                       type: string
 *                       example: DON_abc123
 *                     checkoutUrl:
 *                       type: string
 *                       example: https://checkout.korapay.com/pay/abc123
 *       400:
 *         description: Missing or invalid input data.
 *       403:
 *         description: Campaign not accepting donations.
 *       404:
 *         description: Campaign not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post("/donate", authenticate, makeDonation);

/**
 * @swagger
 * /donation/api/v1/webhook/verify-payment:
 *   post:
 *     summary: KoraPay webhook endpoint for verifying payments
 *     tags: [Donation]
 *     description: Endpoint that receives payment status updates from KoraPay after a transaction.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             data:
 *               paymentReference: "DON_12345"
 *               transactionId: "TXN_67890"
 *               status: "successful"
 *               amount: 5000
 *     responses:
 *       200:
 *         description: Webhook processed successfully.
 *       400:
 *         description: Invalid payload structure.
 *       401:
 *         description: Unauthorized - missing signature or key.
 *       403:
 *         description: Signature mismatch.
 *       404:
 *         description: Donation not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post("/webhook/verify-payment", verifyPaymentWebhook);

/**
 * @swagger
 * /donation/api/v1/campaign/{id}/donations:
 *   get:
 *     summary: Get all successful, non-anonymous donations for a campaign
 *     tags: [Donation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: List of donations for the campaign
 *       400:
 *         description: Missing campaign ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get("/campaign/:id/donations", authenticate, getDonationsByCampaign);

/**
 * @swagger
 * /donation/api/v1/campaign/{id}/donations/all:
 *   get:
 *     summary: Get all successful donations for a campaign (admin/fundraiser only)
 *     tags: [Donation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: List of all donations for campaign
 *       400:
 *         description: Missing campaign ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get("/campaign/:id/donations/all", authenticate, getAllDonationsForCampaign);

/**
 * @swagger
 * /donation/api/v1/campaign/{id}/donors/top:
 *   get:
 *     summary: Get top donors for a campaign
 *     tags: [Donation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top donors to return (default 10)
 *     responses:
 *       200:
 *         description: Top donors retrieved successfully
 *       400:
 *         description: Missing campaign ID
 *       500:
 *         description: Internal Server Error
 */
router.get("/campaign/:id/donors/top", getTopDonorsForCampaign);

/**
 * @swagger
 * /donation/api/v1/my-donations:
 *   get:
 *     summary: Get donations made by the currently logged-in donor
 *     tags: [Donation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User donations retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get("/my-donations", authenticate, getDonationsByUser);

module.exports = router;
