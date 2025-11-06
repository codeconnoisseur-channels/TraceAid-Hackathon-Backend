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
  getAllKycByTheStatus,
  handleExtensionRequest,
  getAllDonations,
  approvePayoutRequest,
  rejectPayoutRequest,
  getPendingMilestoneEvidence,
  approveMilestoneEvidence,
  rejectMilestoneEvidence,
  getAllCampaigns,
  getCampaignWithMilestonesAndEvidence,
  getAllCampaignByFundraiser,
} = require("../controller/adminController");
const { protectAdmin, restrictAdmin } = require("../middleware/adminAuth");
const { getWalletSummaryByAdmin, createPayoutByAdmin, listTransactions } = require("../controller/fundraiserWalletController");

/**
 * @swagger
 * /api/v1/admin/verify/{kycId}:
 *   patch:
 *     summary: Verify or reject a fundraiser's KYC
 *     description: Allows an admin to verify or reject a fundraiser's KYC record. Only accessible by authorized admins.
 *     tags: [Admin KYC Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kycId
 *         required: true
 *         description: The ID of the KYC record to be verified or rejected
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       description: Provide verification action and optional remarks if rejecting
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
 *                 example: verify
 *               remarks:
 *                 type: string
 *                 example: "Incomplete business registration document"
 *     responses:
 *       200:
 *         description: KYC verified or rejected successfully
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
 *                   example: Success
 *                 message:
 *                   type: string
 *                   example: "KYC has been successfully verified"
 *                 data:
 *                   type: object
 *                   properties:
 *                     kycId:
 *                       type: string
 *                       example: "670fd12b9cba3b987eebc213"
 *                     fundraiser:
 *                       type: string
 *                       example: "Lifeline Foundation"
 *                     verificationStatus:
 *                       type: string
 *                       example: verified
 *                     updatedAt:
 *                       type: string
 *                       example: "2025-10-29T08:32:15.567Z"
 *       400:
 *         description: Invalid action or missing remarks
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
 *                   example: Invalid Action
 *                 message:
 *                   type: string
 *                   example: "Action must be either 'verify' or 'reject'"
 *       404:
 *         description: KYC or fundraiser not found
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
 *                   example: "KYC record not found"
 *       500:
 *         description: Internal server error while verifying KYC
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
 *                   example: "Error verifying KYC"
 */
router.patch("/verify/:kycId", protectAdmin, restrictAdmin, verifyKyc);

/**
 * @swagger
 * /api/v1/admin/get-all-kyc:
 *   get:
 *     summary: Retrieve all fundraiser KYC submissions
 *     description: Allows an admin to fetch all KYC records submitted by fundraisers. Only accessible by authorized admins.
 *     tags: [Admin KYC Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all KYC records
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
 *                   example: "All KYC records retrieved successfully"
 *                 totalRecords:
 *                   type: integer
 *                   example: 12
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "670fd12b9cba3b987eebc213"
 *                       fundraiser:
 *                         type: string
 *                         example: "Lifeline Foundation"
 *                       businessType:
 *                         type: string
 *                         example: "Non-profit"
 *                       registrationNumber:
 *                         type: string
 *                         example: "CAC/IT/54321"
 *                       status:
 *                         type: string
 *                         enum: [pending, verified, rejected]
 *                         example: "pending"
 *                       createdAt:
 *                         type: string
 *                         example: "2025-10-25T09:30:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         example: "2025-10-28T12:45:00.000Z"
 *       403:
 *         description: Unauthorized access - not an admin
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: No KYC records found
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
 *                   example: "No KYC records found"
 *       500:
 *         description: Internal server error while retrieving KYC records
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
 *                   example: "Error fetching KYC records"
 */
router.get("/get-all-kyc", protectAdmin, restrictAdmin, getAllKyc);

/**
 * @swagger
 * /api/v1/admin/get-kyc-by-status:
 *   get:
 *     summary: Retrieve all KYC records by status
 *     description: Allows an admin to fetch all fundraiser KYC records filtered by their status (e.g., pending, verified, rejected).
 *     tags: [Admin KYC Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         required: true
 *         description: Filter KYC records by status.
 *         example: pending
 *     responses:
 *       200:
 *         description: Successfully retrieved all KYC records matching the specified status
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
 *                   example: "All pending KYC records retrieved successfully"
 *                 totalRecords:
 *                   type: integer
 *                   example: 6
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "67123be5f9b2b03139bcd42a"
 *                       fundraiser:
 *                         type: string
 *                         example: "Aid4All Foundation"
 *                       businessType:
 *                         type: string
 *                         example: "Charity"
 *                       registrationNumber:
 *                         type: string
 *                         example: "CAC/IT/78901"
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                       createdAt:
 *                         type: string
 *                         example: "2025-10-20T09:15:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         example: "2025-10-28T14:00:00.000Z"
 *       400:
 *         description: Missing or invalid query parameter
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
 *                   example: "Status query parameter is required or invalid"
 *       403:
 *         description: Unauthorized access — only admins can perform this operation
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: No KYC records found for the given status
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
 *                   example: "No KYC records found for this status"
 *       500:
 *         description: Internal server error while retrieving KYC records by status
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
 *                   example: "Error fetching KYC records by status"
 */
router.get("/get-kyc-by-status", protectAdmin, restrictAdmin, getAllKycByTheStatus);

/**
 * @swagger
 * /api/v1/admin/getkycs:
 *   get:
 *     summary: Retrieve all KYC records grouped by their verification status
 *     description: Allows an admin to view all fundraiser KYC submissions, grouped by their status (e.g., pending, verified, rejected) for easier analysis.
 *     tags: [Admin KYC Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all KYC records grouped by status
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
 *                   example: "All KYC records grouped by status retrieved successfully"
 *                 totalGroups:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: object
 *                   properties:
 *                     pending:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "67124cc2fa83f220b5d3c9e8"
 *                           fundraiser:
 *                             type: string
 *                             example: "Helping Hands Foundation"
 *                           businessType:
 *                             type: string
 *                             example: "Non-Governmental Organization"
 *                           registrationNumber:
 *                             type: string
 *                             example: "CAC/IT/10987"
 *                           status:
 *                             type: string
 *                             example: "pending"
 *                           createdAt:
 *                             type: string
 *                             example: "2025-10-15T08:30:00.000Z"
 *                     verified:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "67124cc2fa83f220b5d3d123"
 *                           fundraiser:
 *                             type: string
 *                             example: "Care4All Initiative"
 *                           businessType:
 *                             type: string
 *                             example: "Charity"
 *                           registrationNumber:
 *                             type: string
 *                             example: "CAC/IT/22211"
 *                           status:
 *                             type: string
 *                             example: "verified"
 *                           createdAt:
 *                             type: string
 *                             example: "2025-10-12T13:10:00.000Z"
 *                     rejected:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "67124cc2fa83f220b5d3f098"
 *                           fundraiser:
 *                             type: string
 *                             example: "Youth Empower Foundation"
 *                           businessType:
 *                             type: string
 *                             example: "Educational"
 *                           registrationNumber:
 *                             type: string
 *                             example: "CAC/IT/99944"
 *                           status:
 *                             type: string
 *                             example: "rejected"
 *                           createdAt:
 *                             type: string
 *                             example: "2025-10-09T17:45:00.000Z"
 *       403:
 *         description: Unauthorized access — only admins can perform this operation
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: No KYC records found in the system
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
 *                   example: "No KYC records found"
 *       500:
 *         description: Internal server error while grouping KYC records
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
 *                   example: "Error fetching grouped KYC records"
 */
router.get("/getkycs", protectAdmin, restrictAdmin, getAllKycGrouped);

/**
 * @swagger
 * /api/v1/admin/campaigns/review/{campaignId}:
 *   patch:
 *     summary: Review a campaign (approve or reject)
 *     description: Allows an admin to review a fundraiser campaign submission and either approve or reject it with optional remarks.
 *     tags: [Admin Campaign Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         description: The unique ID of the campaign to be reviewed
 *         schema:
 *           type: string
 *           example: "67125acb8f83d223b5e1239a"
 *     requestBody:
 *       required: true
 *       description: Provide the review decision and optional remarks
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 example: approved
 *               remarks:
 *                 type: string
 *                 example: "Campaign content verified and ready to go live."
 *     responses:
 *       200:
 *         description: Campaign reviewed successfully
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
 *                   example: "Campaign approved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "67125acb8f83d223b5e1239a"
 *                     title:
 *                       type: string
 *                       example: "Save the Children Education Fund"
 *                     organizationName:
 *                       type: string
 *                       example: "Hope Foundation"
 *                     status:
 *                       type: string
 *                       example: "approved"
 *                     remarks:
 *                       type: string
 *                       example: "Campaign content verified and ready to go live."
 *                     reviewedBy:
 *                       type: string
 *                       example: "Admin (Super Admin)"
 *                     reviewedAt:
 *                       type: string
 *                       example: "2025-10-29T10:15:00.000Z"
 *       400:
 *         description: Invalid action value or missing required field(s)
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
 *                   example: "Invalid review action. Action must be either 'approved' or 'rejected'."
 *       403:
 *         description: Unauthorized access — only admins can perform this operation
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: Campaign not found
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
 *                   example: "Campaign not found"
 *       500:
 *         description: Internal server error while reviewing campaign
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
 *                   example: "Error reviewing campaign"
 */
router.patch("/campaigns/review/:campaignId", protectAdmin, restrictAdmin, reviewCampaign);

/**
 * @swagger
 * /api/v1/admin/campaigns/activate/{campaignId}:
 *   patch:
 *     summary: Activate or deactivate a campaign
 *     description: Allows an admin to change the activation status of a campaign (e.g., from inactive to active or vice versa).
 *     tags: [Admin Campaign Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         description: The unique ID of the campaign to activate or deactivate
 *         schema:
 *           type: string
 *           example: "67125acb8f83d223b5e1239a"
 *     requestBody:
 *       required: true
 *       description: Provide the desired activation action
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [activate, deactivate]
 *                 example: activate
 *               remarks:
 *                 type: string
 *                 example: "Campaign activated for fundraising visibility."
 *     responses:
 *       200:
 *         description: Campaign activation status updated successfully
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
 *                   example: "Campaign activated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "67125acb8f83d223b5e1239a"
 *                     title:
 *                       type: string
 *                       example: "Feed 500 Children Project"
 *                     organizationName:
 *                       type: string
 *                       example: "Hope Foundation"
 *                     status:
 *                       type: string
 *                       example: "active"
 *                     remarks:
 *                       type: string
 *                       example: "Campaign activated for fundraising visibility."
 *                     updatedBy:
 *                       type: string
 *                       example: "Admin (Super Admin)"
 *                     updatedAt:
 *                       type: string
 *                       example: "2025-10-29T11:15:00.000Z"
 *       400:
 *         description: Invalid action or missing required parameters
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
 *                   example: "Invalid action. Action must be either 'activate' or 'deactivate'."
 *       403:
 *         description: Unauthorized access — only admins can perform this operation
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: Campaign not found
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
 *                   example: "Campaign not found"
 *       500:
 *         description: Internal server error while updating campaign activation
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
 *                   example: "Error updating campaign activation status"
 */
router.patch("/campaigns/activate/:campaignId", protectAdmin, restrictAdmin, activateCampaign);

/**
 * @swagger
 * /api/v1/admin/campaigns/{campaignId}/extension/{requestId}:
 *   patch:
 *     summary: Approve or reject a campaign extension request
 *     description: This endpoint allows an admin to handle a campaign duration extension request by either approving or rejecting it.
 *     tags: [Admin Campaign Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         description: The unique ID of the campaign whose extension request is being reviewed
 *         schema:
 *           type: string
 *           example: "67126acb8f83d223b5e1239b"
 *       - name: requestId
 *         in: path
 *         required: true
 *         description: The unique ID of the extension request to approve or reject
 *         schema:
 *           type: string
 *           example: "67127db4a93e1a27834f1230"
 *     requestBody:
 *       required: true
 *       description: Specify the admin’s action (approve or reject) and provide remarks if rejecting
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *               remarks:
 *                 type: string
 *                 example: "Extension approved for 10 additional days due to donor engagement increase."
 *     responses:
 *       200:
 *         description: Extension request handled successfully
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
 *                   example: "Campaign extension request approved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     campaignId:
 *                       type: string
 *                       example: "67126acb8f83d223b5e1239b"
 *                     requestId:
 *                       type: string
 *                       example: "67127db4a93e1a27834f1230"
 *                     status:
 *                       type: string
 *                       example: "approved"
 *                     extendedDuration:
 *                       type: integer
 *                       example: 10
 *                     approvedBy:
 *                       type: string
 *                       example: "Admin (Super Admin)"
 *                     updatedAt:
 *                       type: string
 *                       example: "2025-10-29T11:50:00.000Z"
 *       400:
 *         description: Invalid request or action missing required fields
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
 *                   example: "Invalid action. Must be 'approve' or 'reject'."
 *       403:
 *         description: Unauthorized access — only admins can approve or reject extension requests
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: Campaign or extension request not found
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
 *                   example: "Extension request not found for this campaign"
 *       500:
 *         description: Internal server error while handling campaign extension request
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
 *                   example: "Error processing campaign extension request"
 */
router.patch("/campaigns/:campaignId/extension/:requestId", protectAdmin, restrictAdmin, handleExtensionRequest);

/**
 * @swagger
 * /api/v1/admin/evidence/{evidenceId}/review:
 *   put:
 *     summary: Review milestone evidence submission
 *     description: This endpoint allows an admin to review a fundraiser’s milestone evidence submission by approving or rejecting it with remarks.
 *     tags: [Admin Milestone Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: evidenceId
 *         in: path
 *         required: true
 *         description: The unique ID of the milestone evidence to be reviewed
 *         schema:
 *           type: string
 *           example: "67128abc92f4a9a2c5d123ff"
 *     requestBody:
 *       required: true
 *       description: Provide the review decision and optional remarks
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *               remarks:
 *                 type: string
 *                 example: "Evidence looks valid and aligns with campaign objectives."
 *     responses:
 *       200:
 *         description: Milestone evidence reviewed successfully
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
 *                   example: "Milestone evidence approved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     evidenceId:
 *                       type: string
 *                       example: "67128abc92f4a9a2c5d123ff"
 *                     campaignTitle:
 *                       type: string
 *                       example: "Save the Children Initiative"
 *                     milestoneTitle:
 *                       type: string
 *                       example: "Distribute 100 food packs"
 *                     status:
 *                       type: string
 *                       example: "approved"
 *                     reviewedBy:
 *                       type: string
 *                       example: "Admin (Super Admin)"
 *                     reviewedAt:
 *                       type: string
 *                       example: "2025-10-29T12:25:00.000Z"
 *                     remarks:
 *                       type: string
 *                       example: "Evidence validated successfully."
 *       400:
 *         description: Invalid review request or missing required fields
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
 *                   example: "Invalid action. Action must be either 'approve' or 'reject'."
 *       403:
 *         description: Unauthorized access — only admins can review milestone evidence
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: Milestone evidence not found
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
 *                   example: "Milestone evidence not found"
 *       500:
 *         description: Internal server error while reviewing milestone evidence
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
 *                   example: "Error reviewing milestone evidence"
 */
router.put("/evidence/:evidenceId/review", protectAdmin, restrictAdmin, reviewMilestoneEvidence);

/**
 * @swagger
 * /api/v1/admin/milestones/{milestoneId}/release:
 *   post:
 *     summary: Release funds for a specific milestone
 *     description: Allows an admin to approve and release funds for a milestone that has been successfully verified and approved.
 *     tags: [Admin Milestone Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: milestoneId
 *         in: path
 *         required: true
 *         description: The unique ID of the milestone whose funds are to be released
 *         schema:
 *           type: string
 *           example: "6721cabc42f9e19d6e211abc"
 *     requestBody:
 *       required: true
 *       description: Provide release details and remarks (optional)
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *                 example: "Funds released after verification and evidence approval."
 *     responses:
 *       200:
 *         description: Milestone funds released successfully
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
 *                   example: "Milestone funds released successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     milestoneId:
 *                       type: string
 *                       example: "6721cabc42f9e19d6e211abc"
 *                     campaignTitle:
 *                       type: string
 *                       example: "Feed 500 Children Initiative"
 *                     milestoneTitle:
 *                       type: string
 *                       example: "Distribute 500 food packages"
 *                     amountReleased:
 *                       type: number
 *                       example: 250000
 *                     releasedBy:
 *                       type: string
 *                       example: "Admin (Super Admin)"
 *                     releasedAt:
 *                       type: string
 *                       example: "2025-10-29T14:00:00.000Z"
 *                     remarks:
 *                       type: string
 *                       example: "Funds released successfully after approval."
 *       400:
 *         description: Invalid milestone release request or milestone not eligible for fund release
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
 *                   example: "Milestone not eligible for release. Ensure evidence has been approved."
 *       403:
 *         description: Unauthorized access — only admins can release milestone funds
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: Milestone not found
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
 *                   example: "Milestone not found"
 *       500:
 *         description: Internal server error while releasing milestone funds
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
 *                   example: "Error releasing milestone funds"
 */
router.post("/milestones/:milestoneId/release", protectAdmin, restrictAdmin, releaseMilestoneFunds);

/**
 * @swagger
 * /api/v1/admin/get-all-fundraisers:
 *   get:
 *     summary: Retrieve all registered fundraisers
 *     description: Allows an admin to fetch a comprehensive list of all registered fundraisers, including profile and campaign information.
 *     tags: [Admin Fundraiser Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all fundraisers
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
 *                   example: "Fundraisers retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "671f9d05e9a1a7b234ac1234"
 *                       organizationName:
 *                         type: string
 *                         example: "Hope for All Foundation"
 *                       email:
 *                         type: string
 *                         example: "contact@hopeforall.org"
 *                       phoneNumber:
 *                         type: string
 *                         example: "+2348012345678"
 *                       kycStatus:
 *                         type: string
 *                         enum: [pending, approved, rejected]
 *                         example: "approved"
 *                       totalCampaigns:
 *                         type: number
 *                         example: 8
 *                       activeCampaigns:
 *                         type: number
 *                         example: 3
 *                       totalFundsRaised:
 *                         type: number
 *                         example: 12500000
 *                       dateRegistered:
 *                         type: string
 *                         example: "2024-06-20T09:35:00.000Z"
 *       403:
 *         description: Unauthorized access — only admins can view fundraisers
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: No fundraisers found
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
 *                   example: "No fundraisers found"
 *       500:
 *         description: Internal server error while retrieving fundraisers
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
 *                   example: "Error retrieving fundraisers"
 */
router.get("/get-all-fundraisers", protectAdmin, restrictAdmin, getAllFundraisers);

/**
 * @swagger
 * /api/v1/admin/get-all-donors:
 *   get:
 *     summary: Retrieve all donors
 *     description: Allows an admin to fetch a comprehensive list of all donors registered on the platform, including donation statistics.
 *     tags: [Admin Donor Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all donors
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
 *                   example: "Donors retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "6720c845a72d59a19b7a5689"
 *                       firstName:
 *                         type: string
 *                         example: "Chika"
 *                       lastName:
 *                         type: string
 *                         example: "Okafor"
 *                       email:
 *                         type: string
 *                         example: "chika.okafor@gmail.com"
 *                       phoneNumber:
 *                         type: string
 *                         example: "+2348031234567"
 *                       totalDonations:
 *                         type: number
 *                         example: 15
 *                       totalAmountDonated:
 *                         type: number
 *                         example: 450000
 *                       dateJoined:
 *                         type: string
 *                         example: "2024-03-11T08:45:00.000Z"
 *       403:
 *         description: Unauthorized access — only admins can view donors
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: No donors found in the system
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
 *                   example: "No donors found"
 *       500:
 *         description: Internal server error while retrieving donors
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
 *                   example: "Error retrieving donors"
 */
router.get("/get-all-donors", protectAdmin, restrictAdmin, getAllDonors);

/**
 * @swagger
 * /api/v1/admin/get-all-donations:
 *   get:
 *     summary: Retrieve all donations
 *     description: Allows an admin to fetch a detailed list of all donations made across all campaigns and users.
 *     tags: [Admin Donation Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all donations
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
 *                   example: "Donations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "6734c845a72d59a19b7a5689"
 *                       donor:
 *                         type: object
 *                         properties:
 *                           donorId:
 *                             type: string
 *                             example: "6721f8b2e9fcb218f4b5c332"
 *                           donorName:
 *                             type: string
 *                             example: "Olamide Adebayo"
 *                           donorEmail:
 *                             type: string
 *                             example: "olamide.adebayo@gmail.com"
 *                       campaign:
 *                         type: object
 *                         properties:
 *                           campaignId:
 *                             type: string
 *                             example: "671dc845a72d59a19b7a5633"
 *                           campaignTitle:
 *                             type: string
 *                             example: "Save the Children Project"
 *                       amount:
 *                         type: number
 *                         example: 5000
 *                       paymentReference:
 *                         type: string
 *                         example: "TXN_12345ABCDEF"
 *                       paymentMethod:
 *                         type: string
 *                         example: "Paystack"
 *                       dateDonated:
 *                         type: string
 *                         example: "2024-05-01T13:24:00.000Z"
 *       403:
 *         description: Unauthorized access — only admins can view donations
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: No donations found
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
 *                   example: "No donations found"
 *       500:
 *         description: Internal server error while retrieving donations
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
 *                   example: "Error retrieving donations"
 */
router.get("/get-all-donations", protectAdmin, restrictAdmin, getAllDonations);

/**
 * @swagger
 * /api/v1/admin/payout/{payoutId}/approve:
 *   patch:
 *     summary: Approve a payout request
 *     description: Allows an admin to review and approve a pending payout request made by a fundraiser.
 *     tags: [Admin Payout Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payoutId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the payout request
 *     responses:
 *       200:
 *         description: Payout request approved successfully
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
 *                   example: "Payout request approved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     payoutId:
 *                       type: string
 *                       example: "6740c845a72d59a19b7a5689"
 *                     fundraiserId:
 *                       type: string
 *                       example: "6721b4f9a1e2e7351a4b8934"
 *                     fundraiserName:
 *                       type: string
 *                       example: "Grace Foundation"
 *                     amount:
 *                       type: number
 *                       example: 150000
 *                     status:
 *                       type: string
 *                       example: "approved"
 *                     approvedBy:
 *                       type: string
 *                       example: "Admin - David Okoro"
 *                     approvalDate:
 *                       type: string
 *                       example: "2024-08-15T12:45:00.000Z"
 *       400:
 *         description: Invalid or already approved payout request
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
 *                   example: "Payout has already been approved"
 *       403:
 *         description: Unauthorized access — only admins can approve payout requests
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: Payout request not found
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
 *                   example: "Payout request not found"
 *       500:
 *         description: Internal server error while approving payout request
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
 *                   example: "Error approving payout request"
 */
router.patch("/payout/:payoutId/approve", protectAdmin, restrictAdmin, approvePayoutRequest);

/**
 * @swagger
 * /api/v1/admin/payout/{payoutId}/reject:
 *   patch:
 *     summary: Reject a payout request
 *     description: Allows an admin to reject a pending payout request, providing a reason for rejection.
 *     tags: [Admin Payout Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payoutId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the payout request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *                 description: Reason for rejecting the payout request
 *                 example: "Invalid bank details provided by fundraiser"
 *     responses:
 *       200:
 *         description: Payout request rejected successfully
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
 *                   example: "Payout request rejected successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     payoutId:
 *                       type: string
 *                       example: "6740c845a72d59a19b7a5689"
 *                     fundraiserId:
 *                       type: string
 *                       example: "6721b4f9a1e2e7351a4b8934"
 *                     fundraiserName:
 *                       type: string
 *                       example: "Hope Initiative Foundation"
 *                     amount:
 *                       type: number
 *                       example: 120000
 *                     status:
 *                       type: string
 *                       example: "rejected"
 *                     remarks:
 *                       type: string
 *                       example: "Bank details did not match KYC record"
 *                     rejectedBy:
 *                       type: string
 *                       example: "Admin - Faith Adebayo"
 *                     rejectionDate:
 *                       type: string
 *                       example: "2024-08-16T10:30:00.000Z"
 *       400:
 *         description: Missing remarks or payout already rejected/approved
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
 *                   example: "Remarks are required to reject a payout request"
 *       403:
 *         description: Unauthorized access — only admins can reject payout requests
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
 *                   example: "Access denied. Admins only."
 *       404:
 *         description: Payout request not found
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
 *                   example: "Payout request not found"
 *       500:
 *         description: Internal server error while rejecting payout request
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
 *                   example: "Error rejecting payout request"
 */
router.patch("/payout/:payoutId/reject", protectAdmin, restrictAdmin, rejectPayoutRequest);

router.get("/milestone-evidence/pending", protectAdmin, restrictAdmin, getPendingMilestoneEvidence);

router.patch("/milestone-evidence/approve/:evidenceId", protectAdmin, restrictAdmin, approveMilestoneEvidence);

router.patch("/milestone-evidence/reject/:evidenceId", protectAdmin, restrictAdmin, rejectMilestoneEvidence);

router.get("/get-campaigns", protectAdmin, restrictAdmin, getAllCampaigns);

router.get("/campaigns-with-milestones-and-evidence", protectAdmin, restrictAdmin, getCampaignWithMilestonesAndEvidence);

router.get("/fundraiser-campaigns/:id", protectAdmin, restrictAdmin, getAllCampaignByFundraiser);

// Admin wallet routes
router.get("/wallet/:fundraiserId/summary", protectAdmin, restrictAdmin, getWalletSummaryByAdmin);
router.post("/wallet/payout", protectAdmin, restrictAdmin, createPayoutByAdmin);
router.get("/wallet/:fundraiserId/transactions", protectAdmin, restrictAdmin, listTransactions);

module.exports = router;
