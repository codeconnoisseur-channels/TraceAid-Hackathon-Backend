const { createPayoutByAdmin } = require("../controller/payoutController");
const { protectAdmin, restrictAdmin } = require("../middleware/adminAuth");

const router = require("express").Router();


router.post("/create-payout", protectAdmin, restrictAdmin, createPayoutByAdmin)

module.exports = router;