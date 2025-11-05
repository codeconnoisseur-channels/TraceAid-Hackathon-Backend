const { toggleEngagement, recordShare, getAllSavedCampaignsByID } = require("../controller/engagementController");
const { authenticate } = require("../middleware/auth");

const router = require("express").Router();

/**
 * @swagger
 * /engagement/api/v1/engagement/{campaignId}/{actionType}:
 *   patch:
 *     summary: Toggle campaign engagement (like or save)
 *     description: |
 *       Allows an authenticated user (donor or fundraiser) to like or save a campaign.  
 *       - If the user has already performed the action, it will be undone (unlike or unsave).  
 *       - If not, the engagement will be created.  
 *       This endpoint automatically increments or decrements the respective counter on the campaign.
 *     tags:
 *       - Engagement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         description: The ID of the campaign to engage with.
 *         schema:
 *           type: string
 *           example: 671c2ef97e4f91a4fc7123a0
 *       - in: path
 *         name: actionType
 *         required: true
 *         description: The type of engagement to toggle — either "like" or "save".
 *         schema:
 *           type: string
 *           enum: [like, save]
 *           example: like
 *     responses:
 *       200:
 *         description: Engagement toggled successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Campaign successfully liked."
 *               isEngaged: true
 *               likeCount: 12
 *       400:
 *         description: Invalid action type or request error
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Bad Request"
 *               message: 'Invalid action type. Must be "like" or "save".'
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
 *               message: "Error toggling like: Campaign not found or server issue."
 */
router.patch("/engagement/:campaignId/:actionType", authenticate, toggleEngagement);


/**
 * @swagger
 * /engagement/api/v1/recordShare/{campaignId}:
 *   patch:
 *     summary: Record a campaign share action
 *     description: |
 *       Allows an authenticated user (donor or fundraiser) to record a share action for a campaign.  
 *       Each share increases the campaign’s `shareCount` by 1 and stores details such as the channel and optional caption.
 *     tags:
 *       - Engagement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         description: The ID of the campaign being shared.
 *         schema:
 *           type: string
 *           example: 671c2ef97e4f91a4fc7123a0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               channel:
 *                 type: string
 *                 description: The social platform or method used for sharing.
 *                 enum: [X, Facebook, Instagram, CopyLink]
 *                 example: "X"
 *               userCaption:
 *                 type: string
 *                 description: Optional caption added by the user when sharing the campaign.
 *                 example: "Let's support this noble cause together!"
 *     responses:
 *       201:
 *         description: Share recorded successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Share recorded successfully via X."
 *               shareCount: 15
 *       400:
 *         description: Invalid sharing channel provided
 *         content:
 *           application/json:
 *             example:
 *               statusCode: false
 *               statusText: "Bad Request"
 *               message: "Invalid sharing channel provided."
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
 *               message: "Server error recording share action."
 */
router.patch("/recordShare/:campaignId", authenticate, recordShare);

router.get("/all-saved-campaign", authenticate, getAllSavedCampaignsByID)

module.exports = router;
