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
 * /milestone/api/v1/milestones/evidence/{id}:
 *   post:
 *     summary: Upload milestone evidence (Fundraiser only)
 *     description: |
 *       Upload between **5 and 10 evidence files** (images or videos) to verify that a milestone has been achieved.
 *       This endpoint can only be accessed by authenticated fundraisers **after payout for the milestone has been approved and disbursed**.
 *     tags:
 *       - Milestone - Fundraiser
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique ID of the milestone
 *         schema:
 *           type: string
 *           example: "6743b6de95bc13a32ff1a9c7"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: A short description of the milestone evidence being uploaded
 *                 example: "Completed the school roof installation and classroom painting."
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 5–10 image or video files showing milestone evidence
 *     responses:
 *       201:
 *         description: Evidence uploaded successfully
 *         content:
 *           application/json:
 *             example:
 *               statusCode: true
 *               statusText: "Created"
 *               message: "Evidence uploaded and pending admin review. Remember, images must be stamped with location/time."
 *               data:
 *                 _id: "6743b6de95bc13a32ff1a9e2"
 *                 campaign: "673b1823a12cd90293ad71f4"
 *                 milestone: "6743b6de95bc13a32ff1a9c7"
 *                 fundraiser: "672c48bc18792d0f1f3b2ac1"
 *                 description: "Completed the school roof installation and classroom painting."
 *                 uploads:
 *                   - imageUrl: "https://res.cloudinary.com/demo/image/upload/sample1.jpg"
 *                     publicId: "milestone_evidence/abc123"
 *                     uploadedAt: "2025-11-11T08:45:00Z"
 *                   - imageUrl: "https://res.cloudinary.com/demo/image/upload/sample2.jpg"
 *                     publicId: "milestone_evidence/abc124"
 *                     uploadedAt: "2025-11-11T08:46:00Z"
 *                 status: "pending"
 *       400:
 *         description: Bad request (invalid inputs or upload conditions not met)
 *         content:
 *           application/json:
 *             examples:
 *               missingDescription:
 *                 summary: Missing description
 *                 value:
 *                   statusCode: false
 *                   statusText: "Bad Request"
 *                   message: "Description is required."
 *               notEligible:
 *                 summary: Not eligible to upload
 *                 value:
 *                   statusCode: false
 *                   statusText: "Not Eligible"
 *                   message: "Admin must approve and disburse funds for this milestone before uploading evidence."
 *       403:
 *         description: Forbidden – fundraiser trying to upload evidence for someone else's milestone
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Forbidden"
 *               message: "You cannot upload evidence for a milestone of another fundraiser."
 *       404:
 *         description: Milestone not found
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Not Found"
 *               message: "Milestone not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Internal Server Error"
 *               message: "Error uploading evidence to Cloudinary"
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
