const { isFundraiser, authenticate } = require("../middleware/auth");
const uploads = require("../utils/multer");
const {
  createACampaign,
  getAllCampaigns,
  getOneCampaign,
  getCampaignWithMilestonesAndEvidence,
  getAllCampaign,
  getACampaignAndMilestone,
  getAllActiveCampaigns,
  getAllCampaignsByFundraiser,
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
 * /campaign/api/v1/get-all-active-campaign:
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
router.get("/get-all-active-campaign", getAllActiveCampaigns);

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

router.get("/campaign/get-campaign-and-milestones/:id", getACampaignAndMilestone);

module.exports = router;
