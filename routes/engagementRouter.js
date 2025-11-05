const { toggleEngagement, recordShare } = require("../controller/engagementController");
const { authenticate } = require("../middleware/auth");

const router = require("express").Router();

router.patch("/engagement", authenticate, toggleEngagement);

router.patch("/recordShare", authenticate, recordShare);

module.exports = router;
