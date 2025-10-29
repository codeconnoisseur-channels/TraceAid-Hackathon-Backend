const router = require("express").Router();
const { verifyKyc, reviewCampaign, reviewMilestoneEvidence, releaseMilestoneFunds } = require("../controller/adminController");
const { protectAdmin, restrictAdmin } = require("../middleware/adminAuth");

router.patch("/kyc/:kycId/verify", protectAdmin, restrictAdmin, verifyKyc);
router.patch("/campaigns/:campaignId/review", protectAdmin, restrictAdmin, reviewCampaign)
router.put("/evidence/:evidenceId/review", protectAdmin, restrictAdmin, reviewMilestoneEvidence);
router.post("/milestones/:milestoneId/release",protectAdmin, restrictAdmin,  releaseMilestoneFunds);


module.exports = router;

