const { createPayoutByAdmin, getPendingPayoutRequests } = require("../controller/payoutController");
const { protectAdmin, restrictAdmin } = require("../middleware/adminAuth");

const router = require("express").Router();

router.post("/create-payout", protectAdmin, restrictAdmin, createPayoutByAdmin)

router.get("/get-pending-payout", protectAdmin, restrictAdmin, getPendingPayoutRequests)

module.exports = router;