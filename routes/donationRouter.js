const router = require("express").Router()
const { authenticate } = require("../middleware/auth");
const { verifyPaymentWebhook, getDonationsByCampaign, getDonationsByUser,makeDonation  } = require("../controller/donationController");
const { restrictAdmin, protectAdmin } = require("../middleware/adminAuth");

router.post("/donate", authenticate, makeDonation );

router.post("/webhook/verify-payment", verifyPaymentWebhook);

router.get("/campaign/:id/donations", authenticate, getDonationsByCampaign);

router.get("/my-donations", authenticate, getDonationsByUser);

module.exports = router;
