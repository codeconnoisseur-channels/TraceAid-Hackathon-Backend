const router = require("express").Router();
const {
  verifyKyc,
  reviewCampaign,
  reviewMilestoneEvidence,
  releaseMilestoneFunds,
  getAllKyc,
  getAllKycGrouped,
  getAllFundraisers,
  getAllDonors,
  activateCampaign,
} = require("../controller/adminController");
const { protectAdmin, restrictAdmin } = require("../middleware/adminAuth");

/**
 * @swagger
 * /admin/api/v1/kyc/{kycId}/verify:
 *   patch:
 *     summary: Verify or reject a fundraiser's KYC record
 *     description: Allows an authenticated admin to verify or reject a fundraiser's KYC record. Verification updates both the KYC and fundraiser status and sends an email notification to the fundraiser.
 *     tags:
 *       - Admin KYC Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kycId
 *         required: true
 *         description: The ID of the KYC record to verify or reject.
 *         schema:
 *           type: string
 *           example: "670a8f9b4c9a5123f4b2de89"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [verify, reject]
 *                 description: The action to take on the KYC record.
 *                 example: verify
 *               remarks:
 *                 type: string
 *                 description: Required only if rejecting a KYC. Explains the reason for rejection.
 *                 example: "Submitted ID document is invalid."
 *     responses:
 *       200:
 *         description: KYC verification action completed successfully.
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
 *                   example: "Success"
 *                 message:
 *                   type: string
 *                   example: "KYC has been successfully verified"
 *                 data:
 *                   type: object
 *                   properties:
 *                     kycId:
 *                       type: string
 *                       example: "670a8f9b4c9a5123f4b2de89"
 *                     fundraiser:
 *                       type: string
 *                       example: "Hope Foundation"
 *                     verificationStatus:
 *                       type: string
 *                       example: "verified"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-29T09:45:00.000Z"
 *       400:
 *         description: Bad Request - Invalid action or missing remarks.
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
 *                   example: "Invalid Action"
 *                 message:
 *                   type: string
 *                   example: "Action must be either 'verify' or 'reject'"
 *       401:
 *         description: Unauthorized - Missing or invalid token
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
 *                   example: "No token provided or invalid token."
 *       404:
 *         description: KYC or Fundraiser not found
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
 *                   example: "KYC record not found"
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
 *                   example: "An unexpected error occurred while verifying KYC"
 */
router.patch("/verify/:kycId", protectAdmin, restrictAdmin, verifyKyc);

/**
 * @swagger
 * /admin/api/v1/campaigns/{campaignId}/review:
 *   patch:
 *     summary: Approve or reject a campaign
 *     description: Allows an authenticated admin to approve or reject a campaign. If approved, the campaign becomes public; if rejected, a rejection reason (remarks) must be provided.
 *     tags:
 *       - Admin Campaign Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         description: The ID of the campaign to review.
 *         schema:
 *           type: string
 *           example: "670a8f9b4c9a5123f4b2de89"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: The review decision for the campaign.
 *                 example: approve
 *               remarks:
 *                 type: string
 *                 description: Required only if rejecting a campaign. Explains the reason for rejection.
 *                 example: "Campaign goal not clearly stated."
 *     responses:
 *       200:
 *         description: Campaign review completed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Campaign approved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "670a8f9b4c9a5123f4b2de89"
 *                     title:
 *                       type: string
 *                       example: "Save the Children Project"
 *                     status:
 *                       type: string
 *                       example: "approved"
 *                     rejectionReason:
 *                       type: string
 *                       example: null
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-29T10:05:00.000Z"
 *       400:
 *         description: Bad Request - Invalid action, already reviewed, or missing remarks.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Remarks are required when rejecting a campaign"
 *       401:
 *         description: Unauthorized - Missing or invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No token provided or invalid token."
 *       404:
 *         description: Campaign not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Campaign not found"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred while reviewing campaign."
 */
router.patch("/campaigns/review/:campaignId", protectAdmin, restrictAdmin, reviewCampaign);
router.put("/evidence/:evidenceId/review", protectAdmin, restrictAdmin, reviewMilestoneEvidence);
router.post("/milestones/:milestoneId/release", protectAdmin, restrictAdmin, releaseMilestoneFunds);
router.get("/get-all-kyc", protectAdmin, restrictAdmin, getAllKyc);
router.get("/getkycs", protectAdmin, restrictAdmin, getAllKycGrouped);
router.get("/get-all-fundraisers", protectAdmin, restrictAdmin, getAllFundraisers);
router.get("/get-all-donors", protectAdmin, restrictAdmin, getAllDonors);
router.patch("/campaigns/activate/:campaignId", protectAdmin, restrictAdmin, activateCampaign);

module.exports = router;
