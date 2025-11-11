const router = require("express").Router();
const uploads = require("../utils/multer"); 
const { authenticate, isFundraiser } = require("../middleware/auth");
const {
  uploadMilestone,
  addMilestone,
  getMilestoneAchieved,
  getCampaignMilestones,
  uploadMilestoneEvidenceForMilestone,
} = require("../controller/milestoneController");

/**
 * @swagger
 * /milestone/api/v1/milestone/add-milestone:
 *   post:
 *     summary: Add a new milestone to a campaign
 *     description: |
 *       Allows an authenticated fundraiser to create a new milestone under a specific campaign.  
 *       All milestone fields (title, description, amount, and duration) must be provided.  
 *       Only authenticated fundraisers can access this endpoint.
 *     tags:
 *       - Milestone - Fundraiser
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *               - milestoneTitle
 *               - milestoneDescription
 *               - milestoneAmount
 *               - milestoneDuration
 *             properties:
 *               campaignId:
 *                 type: string
 *                 description: The ID of the campaign this milestone belongs to.
 *                 example: "6727f63aaf2c7b0012f98c32"
 *               milestoneTitle:
 *                 type: string
 *                 description: The title of the milestone.
 *                 example: "Phase 1: Build School Foundation"
 *               milestoneDescription:
 *                 type: string
 *                 description: A detailed description of what this milestone aims to achieve.
 *                 example: "This phase involves clearing the land, laying the foundation, and building basic classrooms."
 *               milestoneAmount:
 *                 type: number
 *                 description: The target amount (in NGN) for this milestone.
 *                 example: 2500000
 *               milestoneDuration:
 *                 type: string
 *                 description: The estimated duration to complete this milestone.
 *                 example: "3 months"
 *     responses:
 *       201:
 *         description: Milestone created successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "Created"
 *               message: "Milestone added successfully"
 *               data:
 *                 milestone:
 *                   _id: "673b1823a12cd90293ad71f4"
 *                   campaign: "6727f63aaf2c7b0012f98c32"
 *                   milestoneTitle: "Phase 1: Build School Foundation"
 *                   milestoneDescription: "This phase involves clearing the land and laying the foundation."
 *                   milestoneAmount: 2500000
 *                   milestoneDuration: "3 months"
 *                   createdAt: "2025-10-29T10:45:00.000Z"
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Bad Request"
 *               message: "All fields are required (campaignId, milestoneTitle, milestoneDescription, milestoneAmount, milestoneDuration)."
 *       401:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Unauthorized"
 *               message: "Authentication token missing or invalid"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error saving milestone"
 */
router.post("/milestone/add-milestone", authenticate, isFundraiser, addMilestone);

/**
 * @swagger
 * /milestone/api/v1/milestones/upload-milestone:
 *   post:
 *     summary: Upload milestone cover image or video
 *     description: |
 *       Allows uploading a cover image or video for a specific milestone.  
 *       The file must be sent as `multipart/form-data` under the key `file`.  
 *       Only the milestone owner can upload the cover.
 *     tags:
 *       - Milestone - Fundraiser
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - milestoneId
 *               - file
 *             properties:
 *               milestoneId:
 *                 type: string
 *                 description: The ID of the milestone to upload the cover for.
 *                 example: "673b1823a12cd90293ad71f4"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The cover image or video file.
 *     responses:
 *       200:
 *         description: Milestone cover uploaded successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Milestone cover image or video uploaded successfully"
 *               data:
 *                 milestone:
 *                   _id: "673b1823a12cd90293ad71f4"
 *                   milestoneTitle: "Phase 1: Build School Foundation"
 *                   milestoneCoverImageOrVideo: "https://res.cloudinary.com/.../milestone_covers/abc123.jpg"
 *                   milestoneAmount: 2500000
 *                   milestoneDuration: "3 months"
 *                   createdAt: "2025-10-29T10:45:00.000Z"
 *       400:
 *         description: Bad Request (missing file or milestoneId)
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Bad Request"
 *               message: "Milestone cover image or video is required."
 *       404:
 *         description: Milestone not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "Milestone not found."
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error uploading milestone cover"
 */
router.post("/milestones/upload-milestone", uploadMilestone);

/**
 * @swagger
 * /milestone/api/v1/milestones/evidence/{id}:
 *   post:
 *     summary: Upload evidence for a milestone
 *     description: |
 *       Allows a fundraiser to upload 5 to 10 evidence files (images or videos) for a specific milestone.  
 *       Each file must include metadata with latitude and longitude coordinates.  
 *       Only the owner of the milestone's campaign can upload evidence. Evidence will be pending admin review.
 *     tags:
 *       - Milestone - Fundraiser
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the milestone for which evidence is being uploaded.
 *         schema:
 *           type: string
 *           example: "673b1823a12cd90293ad71f4"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - evidenceFiles
 *               - fileMetadata
 *             properties:
 *               description:
 *                 type: string
 *                 description: A short description of the milestone evidence.
 *                 example: "Completed foundation work and initial framing"
 *               evidenceFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 5 to 10 evidence files (images/videos)
 *               fileMetadata:
 *                 type: string
 *                 description: JSON string array containing latitude and longitude for each file
 *                 example: '[{"latitude": "6.5244","longitude": "3.3792"}, {"latitude": "6.5245","longitude": "3.3795"}]'
 *     responses:
 *       201:
 *         description: Evidence uploaded successfully and pending admin review
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "Created"
 *               message: "Evidence uploaded successfully. Pending admin review."
 *               data:
 *                 _id: "673b1823a12cd90293ad71f4"
 *                 milestone: "673b1823a12cd90293ad71f4"
 *                 fundraiser: "63ab1823a12cd90293ad71f9"
 *                 description: "Completed foundation work and initial framing"
 *                 uploads:
 *                   - imageUrl: "https://res.cloudinary.com/.../milestone_evidence/abc123.jpg"
 *                     publicId: "milestone_evidence/abc123"
 *                     latitude: 6.5244
 *                     longitude: 3.3792
 *                     uploadedAt: "2025-11-09T12:00:00.000Z"
 *                 status: "in_review"
 *       400:
 *         description: Bad Request (missing description, files, or metadata issues)
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Bad Request"
 *               message: "Exactly 5 to 10 evidence files are required. Received 3."
 *       403:
 *         description: Forbidden (unauthorized user or milestone not ready)
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "You are not allowed to upload evidence for this milestone."
 *       404:
 *         description: Milestone not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "Milestone not found."
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error uploading milestone evidence"
 */
router.post("/milestones/evidence/:id", uploads.array("files", 10), uploadMilestoneEvidenceForMilestone);

/**
 * @swagger
 * /milestone/api/v1/get-milestone-achieved:
 *   get:
 *     summary: Retrieve all completed milestones for a fundraiser's campaign
 *     description: |
 *       Returns a list of milestones that have been completed for a given campaign.
 *       Only accessible to authenticated fundraisers.
 *     tags:
 *       - Milestone - Fundraiser
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: The ID of the campaign for which completed milestones are being retrieved.
 *         schema:
 *           type: string
 *           example: "673b1823a12cd90293ad71f4"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Milestones retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Milestones retrieved successfully"
 *               data:
 *                 milestones:
 *                   - _id: "673b1823a12cd90293ad71f5"
 *                     milestoneTitle: "Foundation Completion"
 *                     milestoneDescription: "Complete the foundation of the building"
 *                     milestoneAmount: 50000
 *                     milestoneDuration: 14
 *                     status: "completed"
 *                     sequence: 1
 *       400:
 *         description: Bad Request (missing campaignId)
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Bad Request"
 *               message: "campaignId required"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error retrieving milestones"
 */
router.get("/get-milestone-achieved", authenticate, isFundraiser, getMilestoneAchieved);

/**
 * @swagger
 * /milestone/api/v1/campaigns/milestones/{id}:
 *   get:
 *     summary: Retrieve all milestones for a specific campaign with detailed status
 *     description: |
 *       Returns a list of milestones for a given campaign, including payout status, evidence status,
 *       and display status for each milestone. Only accessible to authenticated fundraisers.
 *     tags:
 *       - Milestone - Fundraiser
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the campaign to retrieve milestones for
 *         schema:
 *           type: string
 *           example: "673b1823a12cd90293ad71f4"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Milestones fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "OK"
 *               message: "Milestones fetched successfully"
 *               data:
 *                 - _id: "673b1823a12cd90293ad71f5"
 *                   milestoneTitle: "Foundation Completion"
 *                   milestoneDescription: "Complete the foundation of the building"
 *                   targetAmount: 50000
 *                   releasedAmount: 25000
 *                   sequence: 1
 *                   status: "ongoing"
 *                   evidenceStatus: "approved"
 *                   evidenceUploads:
 *                     - imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg"
 *                       publicId: "milestone_evidence/xyz123"
 *                       uploadedAt: "2025-11-09T08:00:00Z"
 *                       latitude: 6.5244
 *                       longitude: 3.3792
 *                   payoutStatus: "processing"
 *       400:
 *         description: Bad Request (invalid campaign ID)
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Bad Request"
 *               message: "Invalid campaign ID"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error fetching milestones"
 */
router.get("/campaigns/milestones/:id", authenticate, isFundraiser, getCampaignMilestones);

module.exports = router;
