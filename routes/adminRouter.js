const router = require("express").Router();
const { verifyKyc, reviewCampaign } = require("../controller/adminController");
const { protectAdmin, restrictAdmin } = require("../middleware/adminAuth");

router.patch("/kyc/:kycId/verify", protectAdmin, restrictAdmin, verifyKyc);
router.patch("/campaigns/:campaignId/review", protectAdmin, restrictAdmin, reviewCampaign)

module.exports = router;
