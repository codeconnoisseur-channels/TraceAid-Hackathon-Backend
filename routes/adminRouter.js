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
  getAllCampaignAndItsMilestone,
  getAllCampaignAndMilestoneOfAFundraiser,
} = require("../controller/adminController");
const { protectAdmin, restrictAdmin } = require("../middleware/adminAuth");
const { getWalletSummaryByAdmin, createPayoutByAdmin, listTransactions, getAllPayouts } = require("../controller/fundraiserWalletController");
const { authenticate } = require("../middleware/auth");

/**
 * @swagger
 * /admin/api/v1/verify/{kycId}:
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
 * /admin/api/v1/get-all-kyc:
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
 * /admin/api/v1/get-kyc-by-status:
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
 * /admin/api/v1/getkycs:
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
 * /admin/api/v1/campaigns/review/{campaignId}:
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
 * /admin/api/v1/campaigns/activate/{campaignId}:
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
 * /admin/api/v1/campaigns/{campaignId}/extension/{requestId}:
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
 * /admin/api/v1/evidence/{evidenceId}/review:
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
 * /admin/api/v1/milestones/{milestoneId}/release:
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
 * /admin/api/v1/get-all-fundraisers:
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
 * /admin/api/v1/get-all-donors:
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
 * /admin/api/v1/get-all-donations:
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
 * /admin/api/v1/payout/{payoutId}/approve:
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
 * /admin/api/v1/payout/{payoutId}/reject:
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

/**
 * @swagger
 * /admin/api/v1/milestone-evidence/pending:
 *   get:
 *     summary: Retrieve all pending milestone evidence submissions
 *     description: |
 *       This endpoint allows **admins** to view all milestone evidences currently marked as `"pending"`.
 *       Each evidence entry includes information about its related milestone, campaign, and fundraiser.
 *     tags:
 *       - Admin - Milestone Evidence
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all pending milestone evidences
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Pending milestone evidence retrieved successfully."
 *               data:
 *                 - _id: "6720d6b8ab4d5c4fddaf91b1"
 *                   imageUrl: "https://res.cloudinary.com/traceaid/image/upload/v1728324912/evidence1.jpg"
 *                   videoUrl: "https://res.cloudinary.com/traceaid/video/upload/v1728324912/evidence1.mp4"
 *                   description: "Progress update showing construction completion."
 *                   status: "pending"
 *                   uploadedAt: "2025-10-25T14:32:00.000Z"
 *                   milestone:
 *                     _id: "671fbb78d6b73c74b49f9d5b"
 *                     milestoneTitle: "Phase 1 Construction"
 *                     milestoneAmount: 200000
 *                   fundraiser:
 *                     _id: "671fae58e4b73c74b49f8a5a"
 *                     firstName: "Jane"
 *                     lastName: "Doe"
 *                   campaign:
 *                     _id: "671faa12c3f2c68b92f4b52c"
 *                     campaignTitle: "Clean Water Initiative"
 *       401:
 *         description: Unauthorized (Admin not authenticated)
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Access denied. Please provide a valid token."
 *       403:
 *         description: Forbidden (User not an admin)
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "Access denied. Admin privileges required."
 *       404:
 *         description: No pending milestone evidence found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "No pending milestone evidence found."
 *       500:
 *         description: Internal server error while fetching pending evidences
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error fetching pending evidence: Database connection timeout."
 */
router.get("/milestone-evidence/pending", protectAdmin, restrictAdmin, getPendingMilestoneEvidence);

/**
 * @swagger
 * /admin/api/v1/get-campaigns:
 *   get:
 *     summary: Retrieve all campaigns on the platform
 *     description: |
 *       This endpoint allows **admins** to retrieve all campaigns created by fundraisers.
 *       It returns detailed information about each campaign, including title, description, status, category, target amount, and fundraiser details.
 *     tags:
 *       - Admin - Campaign Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Campaigns retrieved successfully"
 *               data:
 *                 - _id: "6720d6b8ab4d5c4fddaf91b1"
 *                   campaignTitle: "Help Build a School in Makoko"
 *                   campaignDescription: "Raising funds to construct classrooms for underprivileged children."
 *                   targetAmount: 5000000
 *                   amountRaised: 2000000
 *                   category: "Education"
 *                   status: "active"
 *                   createdAt: "2025-10-25T09:10:00.000Z"
 *                   fundraiser:
 *                     _id: "671fae58e4b73c74b49f8a5a"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     email: "john.doe@example.com"
 *       401:
 *         description: Unauthorized (Admin not logged in)
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Access denied. Please provide a valid token."
 *       403:
 *         description: Forbidden (User is not an admin)
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "Access denied. Admin privileges required."
 *       404:
 *         description: No campaigns found in the system
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "No campaigns found."
 *       500:
 *         description: Internal server error while fetching campaigns
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error retrieving campaigns from database."
 */
router.get("/get-campaigns", protectAdmin, restrictAdmin, getAllCampaigns);

/**
 * @swagger
 * /admin/api/v1/campaigns-with-milestones-and-evidence:
 *   get:
 *     summary: Retrieve all campaigns with their milestones and attached evidences
 *     description: |
 *       This endpoint allows **admins** to fetch all campaigns along with their associated milestones and the evidences submitted for each milestone.
 *       It provides a complete hierarchical view for campaign performance tracking and transparency reporting.
 *     tags:
 *       - Admin - Campaign Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Campaigns with milestones and evidences retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Campaigns with milestones and evidences retrieved successfully."
 *               data:
 *                 - campaign:
 *                     _id: "6720d6b8ab4d5c4fddaf91b1"
 *                     campaignTitle: "Help Build a School in Makoko"
 *                     targetAmount: 5000000
 *                     amountRaised: 2000000
 *                     category: "Education"
 *                     status: "active"
 *                     createdAt: "2025-10-25T09:10:00.000Z"
 *                     fundraiser:
 *                       _id: "671fae58e4b73c74b49f8a5a"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                       email: "john.doe@example.com"
 *                   milestones:
 *                     - _id: "6720d7e5ab4d5c4fddaf91b5"
 *                       milestoneTitle: "Foundation Construction"
 *                       milestoneAmount: 1000000
 *                       status: "completed"
 *                       sequence: 1
 *                       evidences:
 *                         - _id: "6720d9a3ab4d5c4fddaf91b9"
 *                           imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/foundation.jpg"
 *                           status: "approved"
 *                           uploadedAt: "2025-10-26T09:00:00.000Z"
 *                         - _id: "6720d9a3ab4d5c4fddaf91c0"
 *                           imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/foundation2.jpg"
 *                           status: "pending"
 *                           uploadedAt: "2025-10-26T09:10:00.000Z"
 *                     - _id: "6720d7e5ab4d5c4fddaf91b8"
 *                       milestoneTitle: "Roofing Phase"
 *                       milestoneAmount: 1500000
 *                       status: "pending"
 *                       sequence: 2
 *                       evidences: []
 *       401:
 *         description: Unauthorized — Admin not authenticated
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Access denied. Please provide a valid token."
 *       403:
 *         description: Forbidden — User does not have admin privileges
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "Access denied. Admin privileges required."
 *       404:
 *         description: No campaigns found in the database
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "No campaigns found."
 *       500:
 *         description: Internal server error while retrieving campaigns with milestones and evidences
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error fetching campaign data."
 */
router.get("/campaigns-with-milestones-and-evidence", authenticate, getCampaignWithMilestonesAndEvidence);

/**
 * @swagger
 * /admin/api/v1/fundraiser-campaigns/{id}:
 *   get:
 *     summary: Retrieve all campaigns belonging to a specific fundraiser
 *     description: |
 *       This endpoint allows **admins** to fetch all campaigns created by a specific fundraiser using their ID.
 *       It helps administrators review fundraiser activities, campaign statuses, and monitor compliance or performance.
 *     tags:
 *       - Admin - Campaign Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The unique ID of the fundraiser whose campaigns you want to retrieve.
 *         required: true
 *         schema:
 *           type: string
 *           example: "671fae58e4b73c74b49f8a5a"
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully for the specified fundraiser
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Campaigns retrieved successfully"
 *               data:
 *                 - _id: "6720d6b8ab4d5c4fddaf91b1"
 *                   campaignTitle: "Help Build a School in Makoko"
 *                   targetAmount: 5000000
 *                   amountRaised: 2000000
 *                   category: "Education"
 *                   status: "active"
 *                   createdAt: "2025-10-25T09:10:00.000Z"
 *                   fundraiser:
 *                     _id: "671fae58e4b73c74b49f8a5a"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     email: "john.doe@example.com"
 *                 - _id: "6720d7e5ab4d5c4fddaf91b8"
 *                   campaignTitle: "Clean Water for Yaba"
 *                   targetAmount: 2000000
 *                   amountRaised: 500000
 *                   category: "Health"
 *                   status: "pending"
 *                   createdAt: "2025-09-20T12:00:00.000Z"
 *                   fundraiser:
 *                     _id: "671fae58e4b73c74b49f8a5a"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     email: "john.doe@example.com"
 *       401:
 *         description: Unauthorized — Admin not authenticated
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Access denied. Please provide a valid token."
 *       403:
 *         description: Forbidden — User does not have admin privileges
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "Access denied. Admin privileges required."
 *       404:
 *         description: No campaigns found for the given fundraiser ID
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "No campaigns found for the specified fundraiser"
 *       500:
 *         description: Internal server error while fetching fundraiser campaigns
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error retrieving campaigns for fundraiser."
 */
router.get("/fundraiser-campaigns/:id", protectAdmin, restrictAdmin, getAllCampaignByFundraiser);

/**
 * @swagger
 * /admin/api/v1/get-all-campaign-and-milestones:
 *   get:
 *     summary: Retrieve all campaigns and their associated milestones
 *     description: |
 *       This endpoint allows **admins** to fetch all campaigns along with their milestones.
 *       Each campaign record includes its milestone details in an embedded array.
 *       It is useful for administrative overview, analytics, and campaign progress tracking.
 *     tags:
 *       - Admin - Campaign Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Campaigns with their milestones retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               data:
 *                 - _id: "6720d6b8ab4d5c4fddaf91b1"
 *                   campaignTitle: "Support Free Medical Outreach in Lagos"
 *                   targetAmount: 3000000
 *                   amountRaised: 1800000
 *                   category: "Health"
 *                   status: "active"
 *                   fundraiser:
 *                     _id: "671fae58e4b73c74b49f8a5a"
 *                     firstName: "Amaka"
 *                     lastName: "Okoro"
 *                     email: "amaka.okoro@example.com"
 *                   createdAt: "2025-09-15T08:40:00.000Z"
 *                   milestones:
 *                     - _id: "6720d8b2ab4d5c4fddaf91c1"
 *                       title: "Purchase medical supplies"
 *                       amount: 1000000
 *                       status: "completed"
 *                       evidence: ["https://cloudinary.com/evidence/123"]
 *                     - _id: "6720d8b2ab4d5c4fddaf91c2"
 *                       title: "Hire medical professionals"
 *                       amount: 2000000
 *                       status: "pending"
 *                       evidence: []
 *       404:
 *         description: No campaigns found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "No campaigns found"
 *       401:
 *         description: Unauthorized — Missing or invalid admin token
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Access denied. Please provide a valid token."
 *       403:
 *         description: Forbidden — Admin privileges required
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "Access denied. Admin privileges required."
 *       500:
 *         description: Internal server error while fetching campaigns and milestones
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "An unexpected error occurred while fetching campaigns."
 */
router.get("/get-all-campaign-and-milestones", protectAdmin, restrictAdmin, getAllCampaignAndItsMilestone);

/**
 * @swagger
 * /admin/api/v1/get-all-campaign-and-milestone-of-fundraiser/{id}:
 *   get:
 *     summary: Retrieve all campaigns and milestones for a specific fundraiser
 *     description: |
 *       This endpoint allows **admins** to fetch all campaigns created by a specific fundraiser,
 *       along with each campaign's milestones.
 *       Useful for monitoring fundraiser performance and verifying milestone progress.
 *     tags:
 *       - Admin - Campaign Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique ID of the fundraiser
 *         schema:
 *           type: string
 *           example: "671fae58e4b73c74b49f8a5a"
 *     responses:
 *       200:
 *         description: Campaigns and milestones for the specified fundraiser retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               data:
 *                 - _id: "6720d6b8ab4d5c4fddaf91b1"
 *                   campaignTitle: "Help Rural Women Access Clean Water"
 *                   targetAmount: 2500000
 *                   amountRaised: 1900000
 *                   category: "Community"
 *                   status: "active"
 *                   fundraiser:
 *                     _id: "671fae58e4b73c74b49f8a5a"
 *                     firstName: "Ngozi"
 *                     lastName: "Uche"
 *                     email: "ngozi.uche@example.com"
 *                   createdAt: "2025-09-12T10:00:00.000Z"
 *                   milestones:
 *                     - _id: "6720d8b2ab4d5c4fddaf91c9"
 *                       title: "Purchase water tanks"
 *                       amount: 1000000
 *                       status: "completed"
 *                       evidence: ["https://cloudinary.com/evidence/xyz"]
 *                     - _id: "6720d8b2ab4d5c4fddaf91ca"
 *                       title: "Install borehole systems"
 *                       amount: 1500000
 *                       status: "in-progress"
 *                       evidence: []
 *       404:
 *         description: No campaigns found for the specified fundraiser
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "No campaigns found for the specified fundraiser"
 *       400:
 *         description: Invalid or malformed fundraiser ID
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Bad Request"
 *               message: "Invalid fundraiser ID format"
 *       401:
 *         description: Unauthorized — Missing or invalid admin token
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Access denied. Please provide a valid token."
 *       403:
 *         description: Forbidden — Admin privileges required
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "Access denied. Admin privileges required."
 *       500:
 *         description: Internal server error while fetching campaigns and milestones
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "An unexpected error occurred while fetching fundraiser campaigns."
 */
router.get("/get-all-campaign-and-milestone-of-fundraiser/:id", protectAdmin, restrictAdmin, getAllCampaignAndMilestoneOfAFundraiser);

// Admin wallet routes

/**
 * @swagger
 * tags:
 *   name: Admin Wallet
 *   description: Admin endpoints for managing fundraisers' wallets, payouts, and transactions.
 */

/**
 * @swagger
 * /admin/api/v1/wallet/{fundraiserId}/summary:
 *   get:
 *     summary: Get wallet summary for a specific fundraiser
 *     tags: [Admin Wallet]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Allows admin to fetch detailed wallet summary of a specific fundraiser, including balances, campaign totals, and transactions.
 *     parameters:
 *       - in: path
 *         name: fundraiserId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the fundraiser.
 *     responses:
 *       200:
 *         description: Fundraiser wallet summary retrieved successfully.
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
 *                     fundraiser:
 *                       type: string
 *                       example: "672e24b1d62a99e9e01cde23"
 *                     availableBalance:
 *                       type: number
 *                       example: 80000
 *                     totalWithdrawn:
 *                       type: number
 *                       example: 120000
 *                     perCampaign:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           campaign:
 *                             type: string
 *                             example: "Save the Children"
 *                           credited:
 *                             type: number
 *                             example: 100000
 *                           debited:
 *                             type: number
 *                             example: 20000
 *                           balance:
 *                             type: number
 *                             example: 80000
 *       401:
 *         description: Unauthorized — invalid or missing admin token.
 *       403:
 *         description: Forbidden — admin role restricted.
 *       404:
 *         description: Fundraiser not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/wallet/:fundraiserId/summary", protectAdmin, restrictAdmin, getWalletSummaryByAdmin);

/**
 * @swagger
 * /admin/api/v1/wallet/{fundraiserId}/transactions:
 *   get:
 *     summary: Get all transactions of a specific fundraiser
 *     tags: [Admin Wallet]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Fetches all wallet transactions (credit and debit) for a specific fundraiser, with optional filters.
 *     parameters:
 *       - in: path
 *         name: fundraiserId
 *         required: true
 *         schema:
 *           type: string
 *         description: The fundraiser’s unique ID.
 *       - in: query
 *         name: campaignId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by campaign ID.
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [credit, debit]
 *         description: Filter by transaction type.
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully.
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
 *                       type:
 *                         type: string
 *                         example: "credit"
 *                       amount:
 *                         type: number
 *                         example: 10000
 *                       source:
 *                         type: string
 *                         example: "donation"
 *                       campaign:
 *                         type: string
 *                         example: "Help Esther Heal"
 *                       reference:
 *                         type: string
 *                         example: "DON_923be7"
 *                       createdAt:
 *                         type: string
 *                         example: "2025-11-05T08:00:00Z"
 *       401:
 *         description: Unauthorized — invalid or missing admin token.
 *       403:
 *         description: Forbidden — admin role restricted.
 *       404:
 *         description: Fundraiser not found or has no transactions.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/wallet/:fundraiserId/transactions", protectAdmin, restrictAdmin, listTransactions);

/**
 * @swagger
 * /admin/api/v1/get-all-payout:
 *   get:
 *     summary: Retrieve all payout requests
 *     description: |
 *       This endpoint allows **admins** to fetch all payout requests made by fundraisers.
 *       Each payout record includes the fundraiser details, related campaign, payout amount, and status.
 *     tags:
 *       - Admin - Payout Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All payout requests retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "All payouts retrieved successfully"
 *               data:
 *                 - _id: "6721a4db82b4e8b239b93b1f"
 *                   fundraiser:
 *                     _id: "671fae58e4b73c74b49f8a5a"
 *                     name: "Tunde Bello"
 *                     email: "tunde.bello@example.com"
 *                   campaign:
 *                     _id: "6721a3e782b4e8b239b93a7d"
 *                     title: "Support Education for Disadvantaged Children"
 *                   amountRequested: 500000
 *                   amountApproved: 500000
 *                   status: "approved"
 *                   transactionReference: "TXN12345XYZ"
 *                   createdAt: "2025-10-15T09:12:00.000Z"
 *                   updatedAt: "2025-10-15T12:25:00.000Z"
 *       401:
 *         description: Unauthorized — Missing or invalid admin token
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Access denied. Please provide a valid token."
 *       403:
 *         description: Forbidden — Admin privileges required
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "Access denied. Admin privileges required."
 *       500:
 *         description: Internal Server Error while fetching payouts
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error fetching payouts: Cannot read properties of undefined"
 */
router.get("/get-all-payout", protectAdmin, restrictAdmin, getAllPayouts);

/**
 * @swagger
 * /admin/api/v1/review-milestone-evidence/:id:
 *   post:
 *     summary: Review milestone evidence
 *     description: |
 *       This endpoint allows **admins** to review and approve or reject evidence for a milestone of a fundraiser's campaign.
 *       It updates the milestone's status to "completed" and adds the evidence URL to the milestone.
 *     tags:
 *       - Admin - Milestone Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fundraiserId:
 *                 type: string
 *                 description: The ID of the fundraiser.
 *               campaignId:
 *                 type: string
 *                 description: The ID of the campaign.
 *               milestoneId:
 *                 type: string
 *                 description: The ID of the milestone.
 *               evidenceUrl:
 *                 type: string
 *                 description: The URL of the evidence.
 *     responses:
 *       200:
 *         description: Milestone evidence reviewed successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Milestone evidence reviewed successfully"
 *       400:
 *         description: Invalid or malformed request body
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Bad Request"
 *               message: "Invalid request body"
 *       401:
 *         description: Unauthorized — Missing or invalid admin token
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Access denied. Please provide a valid token."
 *       403:
 *         description: Forbidden — Admin privileges required
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "Access denied. Admin privileges required."
 *       500:
 *         description: Internal Server Error while reviewing milestone evidence
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error reviewing milestone evidence: Cannot read properties of undefined"
 */
router.post("/review-milestone-evidence/:id", protectAdmin, restrictAdmin, reviewMilestoneEvidence);

module.exports = router;
