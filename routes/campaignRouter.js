const { isFundraiser, authenticate } = require("../middleware/auth");
const uploads = require("../utils/multer");
const {
  createACampaign,
  getOneCampaign,
  getCampaignWithMilestonesAndEvidence,
  getACampaignAndMilestone,
  getAllActiveCampaigns,
  getAllCampaignsByFundraiser,
  getCampaignAndMilestoneOfAFundraiser,
  getAllCampaignsByAFundraiser,
} = require("../controller/campaignController");

const router = require("express").Router();

/**
 * @swagger
 * /campaign/api/v1/create-campaign:
 *   post:
 *     summary: Create a new campaign
 *     description: |
 *       Allows a verified and active fundraiser to create a new campaign.
 *       The fundraiser must have a verified KYC and provide all required campaign details, including milestones (max 3) whose total target amount must equal the overall campaign goal amount.
 *     tags: [Fundraiser Campaign Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - campaignTitle
 *               - campaignDescription
 *               - totalCampaignGoalAmount
 *               - campaignCategory
 *               - durationDays
 *               - campaignCoverImageOrVideo
 *               - milestones
 *             properties:
 *               campaignTitle:
 *                 type: string
 *                 description: Title of the campaign
 *                 example: "Save the Children Initiative"
 *               campaignDescription:
 *                 type: string
 *                 description: Detailed description of the campaign
 *                 example: "Raising funds to provide educational materials to children in rural communities."
 *               totalCampaignGoalAmount:
 *                 type: number
 *                 description: The total target amount for the campaign (must match total of milestones)
 *                 example: 100000
 *               campaignCategory:
 *                 type: string
 *                 description: Category of the campaign (e.g., Education, Health, Community)
 *                 example: "Education"
 *               durationDays:
 *                 type: number
 *                 description: Duration of the campaign in days (must be exactly 30 days)
 *                 example: 30
 *               campaignCoverImageOrVideo:
 *                 type: string
 *                 format: binary
 *                 description: Campaign cover image or video file
 *               milestones:
 *                 type: string
 *                 description: JSON array of milestones. Each milestone must have a unique title, description, and target amount.
 *                 example: |
 *                   [
 *                     {
 *                       "milestoneTitle": "Phase 1 - School Supplies",
 *                       "milestoneDescription": "Purchase of books and writing materials for 100 children.",
 *                       "targetAmount": 40000
 *                     },
 *                     {
 *                       "milestoneTitle": "Phase 2 - Classroom Renovation",
 *                       "milestoneDescription": "Renovate classrooms and provide furniture.",
 *                       "targetAmount": 60000
 *                     }
 *                   ]
 *     responses:
 *       201:
 *         description: Campaign created successfully and pending admin review
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
 *                   example: Created
 *                 message:
 *                   type: string
 *                   example: Campaign created successfully. Pending Admin review.
 *                 data:
 *                   type: object
 *                   properties:
 *                     campaign:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "673dfbfa8f8c2f40b923ed25"
 *                         campaignTitle:
 *                           type: string
 *                           example: "Save the Children Initiative"
 *                         campaignDescription:
 *                           type: string
 *                           example: "Providing educational resources to rural children."
 *                         totalCampaignGoalAmount:
 *                           type: number
 *                           example: 100000
 *                         campaignCategory:
 *                           type: string
 *                           example: "Education"
 *                         durationDays:
 *                           type: number
 *                           example: 30
 *                         status:
 *                           type: string
 *                           example: "pending"
 *                         campaignCoverImageOrVideo:
 *                           type: object
 *                           properties:
 *                             imageUrl:
 *                               type: string
 *                               example: "https://res.cloudinary.com/demo/image/upload/v1730132345/campaign_covers/abc123.jpg"
 *                             publicId:
 *                               type: string
 *                               example: "campaign_covers/abc123"
 *                     milestones:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           milestoneTitle:
 *                             type: string
 *                             example: "Phase 1 - School Supplies"
 *                           milestoneDescription:
 *                             type: string
 *                             example: "Purchase of books and writing materials for 100 children."
 *                           targetAmount:
 *                             type: number
 *                             example: 40000
 *                           sequence:
 *                             type: integer
 *                             example: 1
 *       400:
 *         description: Missing or invalid input data (e.g., missing fields, milestone mismatch, invalid file)
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
 *                   example: "All campaign fields are required."
 *       403:
 *         description: Fundraiser account not verified or KYC not approved
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
 *                   example: "KYC verification is required for this fundraiser."
 *       404:
 *         description: KYC record not found or user not found
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
 *         description: Internal server error while creating campaign
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
 *                   example: "Failed to save milestones."
 */
router.post("/create-campaign", authenticate, isFundraiser, uploads.single("campaignCoverImageOrVideo"), createACampaign);

/**
 * @swagger
 * /campaign/api/v1/campaign/get-all-campaigns:
 *   get:
 *     summary: Retrieve all campaigns belonging to the authenticated fundraiser
 *     description: Returns all campaigns (active, pending, completed) created by the authenticated fundraiser, along with summary counts for each category.
 *     tags:
 *       - Fundraiser Campaign Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Campaigns retrieved successfully
 *               data:
 *                 all:
 *                   - _id: "66f1a12b8efb9f1234abcd01"
 *                     fundraiser: "66f1a12b8efb9f1234abcd99"
 *                     campaignTitle: "Education for All"
 *                     campaignDescription: "Raising funds to provide education for underprivileged children."
 *                     totalCampaignGoalAmount: 500000
 *                     campaignCategory: "Education"
 *                     durationDays: 30
 *                     status: "active"
 *                 active:
 *                   - _id: "66f1a12b8efb9f1234abcd01"
 *                     campaignTitle: "Education for All"
 *                 pending:
 *                   - _id: "66f1a12b8efb9f1234abcd02"
 *                     campaignTitle: "Feed the Hungry"
 *                 completed:
 *                   - _id: "66f1a12b8efb9f1234abcd03"
 *                     campaignTitle: "Clean Water Project"
 *                 counts:
 *                   active: 1
 *                   pending: 1
 *                   completed: 1
 *       404:
 *         description: No campaigns found for this fundraiser
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: No campaigns found for this fundraiser.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: Error retrieving campaigns
 */
router.get("/campaign/get-all-campaigns", authenticate, isFundraiser, getAllCampaignsByFundraiser);

/**
 * @swagger
 * /campaign/api/v1/campaign/get-all-active-campaign:
 *   get:
 *     summary: Retrieve all active campaigns
 *     description: Fetches all campaigns that are currently active. This endpoint is accessible to all users.
 *     tags:
 *       - Campaign Management
 *     responses:
 *       200:
 *         description: Active campaigns retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Active campaigns retrieved successfully
 *               data:
 *                 - _id: "XXXXXXXXXXXXXXXXXXXXXXXX"
 *                   fundraiser: "66f1a12b8efb9f1234abcd99"
 *                   campaignTitle: "Education for All"
 *                   campaignDescription: "Raising funds to provide education for underprivileged children."
 *                   totalCampaignGoalAmount: 500000
 *                   campaignCategory: "Education"
 *                   durationDays: 30
 *                   status: "active"
 *       404:
 *         description: No active campaigns found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: No active campaigns found.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: Error retrieving active campaigns
 */
router.get("/campaign/get-all-active-campaign", getAllActiveCampaigns);

/**
 * @swagger
 * /campaign/api/v1/campaign/get-one:
 *   post:
 *     summary: Retrieve a single campaign by ID
 *     description: Fetches a specific campaign's details by its ID. Only accessible to an authenticated fundraiser.
 *     tags:
 *       - Fundraiser Campaign Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the campaign to retrieve
 *                 example: 66f1a12b8efb9f1234abcd01
 *     responses:
 *       200:
 *         description: Campaign retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Campaign retrieved successfully
 *               data:
 *                 _id: "66f1a12b8efb9f1234abcd01"
 *                 fundraiser:
 *                   _id: "66f1a12b8efb9f1234abcd99"
 *                   name: "Charity Foundation"
 *                   email: "charity@example.com"
 *                 campaignTitle: "Education for All"
 *                 campaignDescription: "Raising funds for underprivileged children."
 *                 totalCampaignGoalAmount: 500000
 *                 campaignCategory: "Education"
 *                 durationDays: 30
 *                 status: "active"
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: Campaign not found.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: Error retrieving campaign
 */
router.post("/campaign/get-one", authenticate, isFundraiser, getOneCampaign);

/**
 * @swagger
 * /campaign/api/v1/campaign/get-campaigns-milestones:
 *   get:
 *     summary: Get campaign details along with milestones and evidence
 *     description: Retrieves a campaign by its ID, including all associated milestones and uploaded milestone evidences. Only accessible to an authenticated fundraiser.
 *     tags:
 *       - Fundraiser Campaign Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: The ID of the campaign to retrieve
 *         schema:
 *           type: string
 *           example: 66f1a12b8efb9f1234abcd01
 *     responses:
 *       200:
 *         description: Campaign and milestones retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: OK
 *               message: Campaign and milestones retrieved successfully
 *               data:
 *                 campaign:
 *                   _id: "66f1a12b8efb9f1234abcd01"
 *                   campaignTitle: "Clean Water for All"
 *                   campaignDescription: "Providing clean water to rural communities."
 *                   totalCampaignGoalAmount: 300000
 *                   campaignCategory: "Health"
 *                   durationDays: 30
 *                   status: "active"
 *                   campaignCoverImageOrVideo:
 *                     imageUrl: "https://res.cloudinary.com/example/image/upload/v1730123456/campaign.jpg"
 *                     publicId: "campaign_covers/abc123"
 *                 milestones:
 *                   - _id: "66f1b12b8efb9f5678abcd11"
 *                     milestoneTitle: "Phase 1 - Water Borehole"
 *                     milestoneDescription: "Construct a borehole in Village A."
 *                     targetAmount: 100000
 *                     sequence: 1
 *                     evidences:
 *                       - _id: "66f1b22b8efb9f7890abcd22"
 *                         description: "Drilling completed."
 *                         media:
 *                           imageUrl: "https://res.cloudinary.com/example/image/upload/v1730123456/evidence1.jpg"
 *                           publicId: "milestone_evidence/xyz123"
 *                       - _id: "66f1b33b8efb9f8912abcd33"
 *                         description: "Pump installation completed."
 *                         media:
 *                           imageUrl: "https://res.cloudinary.com/example/image/upload/v1730123456/evidence2.jpg"
 *                           publicId: "milestone_evidence/xyz456"
 *                   - _id: "66f1b44b8efb9f9123abcd44"
 *                     milestoneTitle: "Phase 2 - Water Storage Tank"
 *                     milestoneDescription: "Build a 10,000L storage tank."
 *                     targetAmount: 200000
 *                     sequence: 2
 *                     evidences: []
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Not Found
 *               message: Campaign not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: Internal Server Error
 *               message: Unexpected server error
 */
router.get("/campaign/get-campaigns-milestones", authenticate, isFundraiser, getCampaignWithMilestonesAndEvidence);

/**
 * @swagger
 * /campaign/api/v1/campaign/get-campaign-and-milestones/{id}:
 *   get:
 *     summary: Retrieve a specific campaign and its milestones
 *     description: |
 *       Fetches detailed information about a single campaign and all milestones associated with it.
 *       This endpoint is useful for viewing the progress, goals, and updates within a campaign.
 *     tags:
 *       - Campaign - Public Access
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique ID of the campaign to retrieve
 *         schema:
 *           type: string
 *           example: "671fc90fa2b1a4c9e84b91d2"
 *     responses:
 *       200:
 *         description: Successfully retrieved campaign and its milestones
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Campaign and its milestones retrieved successfully"
 *               data:
 *                 campaign:
 *                   _id: "671fc90fa2b1a4c9e84b91d2"
 *                   title: "Help Build a Tech Hub for Underprivileged Youths"
 *                   description: "A campaign to establish a learning space for young coders."
 *                   targetAmount: 5000000
 *                   amountRaised: 1200000
 *                   fundraiser: "671fae58e4b73c74b49f8a5a"
 *                   startDate: "2025-10-01T00:00:00.000Z"
 *                   endDate: "2025-12-01T00:00:00.000Z"
 *                   status: "active"
 *                   createdAt: "2025-10-01T10:00:00.000Z"
 *                   updatedAt: "2025-10-25T10:00:00.000Z"
 *                 milestones:
 *                   - _id: "67225b2cf7a5d3efb908c1e4"
 *                     campaign: "671fc90fa2b1a4c9e84b91d2"
 *                     title: "Purchase Laptops"
 *                     description: "Buy 20 laptops for the coding program"
 *                     amount: 2000000
 *                     status: "in progress"
 *                     createdAt: "2025-10-05T08:12:00.000Z"
 *                   - _id: "67225b4ef7a5d3efb908c1e5"
 *                     campaign: "671fc90fa2b1a4c9e84b91d2"
 *                     title: "Set Up Learning Center"
 *                     description: "Prepare and equip the physical space"
 *                     amount: 1500000
 *                     status: "pending"
 *                     createdAt: "2025-10-10T08:12:00.000Z"
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "Campaign not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error retrieving campaign data"
 */
router.get("/campaign/get-campaign-and-milestones/:id", getACampaignAndMilestone);

/**
 * @swagger
 * /campaign/api/v1/get-all-campaign-and-milestone-of-fundraiser:
 *   get:
 *     summary: Retrieve all campaigns and milestones of the authenticated fundraiser
 *     description: |
 *       Returns all campaigns created by the logged-in fundraiser, along with their associated milestones.
 *       This endpoint requires fundraiser authentication.
 *     tags:
 *       - Campaign - Fundraiser Access
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all campaigns and their milestones
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Campaigns and milestones retrieved successfully"
 *               data:
 *                 - _id: "671fc90fa2b1a4c9e84b91d2"
 *                   title: "Build a Coding Hub for Youths"
 *                   description: "Setting up a hub for young developers."
 *                   targetAmount: 5000000
 *                   amountRaised: 1800000
 *                   status: "active"
 *                   milestones:
 *                     - _id: "67225b2cf7a5d3efb908c1e4"
 *                       campaign: "671fc90fa2b1a4c9e84b91d2"
 *                       title: "Purchase Equipment"
 *                       description: "Buy laptops and routers"
 *                       amount: 2000000
 *                       status: "completed"
 *                       createdAt: "2025-10-05T08:12:00.000Z"
 *                     - _id: "67225b4ef7a5d3efb908c1e5"
 *                       campaign: "671fc90fa2b1a4c9e84b91d2"
 *                       title: "Set Up Hub"
 *                       description: "Prepare workspace for coding sessions"
 *                       amount: 1500000
 *                       status: "pending"
 *                       createdAt: "2025-10-10T08:12:00.000Z"
 *                 - _id: "671fd021e4b73c74b49f8b91"
 *                   title: "Empower Rural Girls with Tech Skills"
 *                   description: "A campaign to train 100 girls in basic programming."
 *                   targetAmount: 3000000
 *                   amountRaised: 1200000
 *                   status: "active"
 *                   milestones:
 *                     - _id: "67227110a7a5d3efb908c2f9"
 *                       title: "Recruit Participants"
 *                       amount: 500000
 *                       status: "completed"
 *                     - _id: "6722712fa7a5d3efb908c2fa"
 *                       title: "Purchase Learning Materials"
 *                       amount: 700000
 *                       status: "in progress"
 *       404:
 *         description: No campaigns found for the fundraiser
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "No campaigns found for the specified fundraiser"
 *       401:
 *         description: Unauthorized — Fundraiser not authenticated
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Authentication required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error retrieving campaign and milestone data"
 */
router.get("/get-all-campaign-and-milestone-of-fundraiser", authenticate, isFundraiser, getCampaignAndMilestoneOfAFundraiser);


/**
 * @swagger
 * /fundraiser/api/v1/get-all-campaign-and-milestones-of-a-fundraiser:
 *   get:
 *     summary: Get all campaigns and milestones of a fundraiser
 *     description: Returns all campaigns created by the authenticated fundraiser, along with milestone details and status flags.
 *     tags:
 *       - Campaign - Fundraiser Access
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Campaigns and milestones retrieved successfully
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
 *                   example: Campaigns retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     all:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           campaignTitle:
 *                             type: string
 *                           raisedAmount:
 *                             type: number
 *                           targetAmount:
 *                             type: number
 *                           status:
 *                             type: string
 *                           summary:
 *                             type: object
 *                             properties:
 *                               totalMilestones:
 *                                 type: integer
 *                               completedMilestones:
 *                                 type: integer
 *                               remainingMilestones:
 *                                 type: integer
 *                               allMilestonesApproved:
 *                                 type: boolean
 *                           milestones:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                 title:
 *                                   type: string
 *                                 targetAmount:
 *                                   type: number
 *                                 sequence:
 *                                   type: integer
 *                                 payoutStatus:
 *                                   type: string
 *                                 evidenceStatus:
 *                                   type: string
 *                                 canRequestWithdrawal:
 *                                   type: boolean
 *                                 canUploadEvidence:
 *                                   type: boolean
 *                                 milestoneStatus:
 *                                   type: string
 *                     active:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pending:
 *                       type: array
 *                       items:
 *                         type: object
 *                     completed:
 *                       type: array
 *                       items:
 *                         type: object
 *                     counts:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *       404:
 *         description: No campaigns found for this fundraiser
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
 *                   example: No campaigns found for this fundraiser.
 *       500:
 *         description: Internal server error
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
 *                   example: An error occurred while retrieving campaigns
 */
router.get("/get-all-campaign-and milestones-of-a-fundraiser", authenticate, isFundraiser, getAllCampaignsByAFundraiser)

module.exports = router;
