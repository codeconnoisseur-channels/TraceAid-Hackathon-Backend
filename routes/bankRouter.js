const express = require("express");
const router = express.Router();
const { isFundraiser, authenticate } = require("../middleware/auth");
const { addOrUpdateBankAccount, getAllBanks } = require("../controller/bankController");

// Fundraiser adds or updates bank account (protected route)
router.post("/add", authenticate, isFundraiser, addOrUpdateBankAccount);

// Optional: get all bank accounts for a fundraiser (for testing or admin view)

router.get("/get-all-banks", authenticate, isFundraiser, getAllBanks)

module.exports = router;
