const { isFundraiser, authenticate } = require("../middleware/auth");
const uploads = require("../utils/multer");
const { createACampaign, getAllCampaigns, getOneCampaign, getCampaignWithMilestonesAndEvidence } = require("../controller/campaignController");

const router = require("express").Router();

router.post("/create-campaign", authenticate, isFundraiser, uploads.single("campaignCoverImageOrVideo"), createACampaign);
router.get("campaign/get-all-campaigns", authenticate, isFundraiser, getAllCampaigns);
router.post("/campaign/get-one", authenticate, isFundraiser, getOneCampaign);
router.get("/campaign/get-campaigns-milestones", authenticate, isFundraiser, getCampaignWithMilestonesAndEvidence);

module.exports = router;
