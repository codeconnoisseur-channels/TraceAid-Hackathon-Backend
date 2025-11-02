const router = require("express").Router()
const { authenticate } = require("../middleware/auth");
const { createDonation, verifyPaymentWebhook, getDonationsByCampaign, getDonationsByUser, getAllDonations, createPayout } = require("../controller/donationController");
const { restrictAdmin, protectAdmin } = require("../middleware/adminAuth");

router.post("/donate", authenticate, createDonation );

router.post("/webhook/verify-payment", authenticate, verifyPaymentWebhook);

router.get("/campaign/:id/donations", authenticate, getDonationsByCampaign);

router.get("/my-donations", authenticate, getDonationsByUser);

module.exports = router;
