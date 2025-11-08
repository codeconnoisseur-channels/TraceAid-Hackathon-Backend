const axios = require("axios");
const Bank = require("../model/bankModel");

const KORA_API_BASE = "https://api.korapay.com/merchant/api/v1";
const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY;

// Create or update a fundraiser's bank account and register it on Kora
exports.addOrUpdateBankAccount = async (req, res) => {
  try {
    const fundraiserId = req.user.id || req.user._id;
    const { campaignId, accountNumber, accountHolder, bankName, bankCode } = req.body;

    if (!accountNumber || !accountHolder || !bankName || !bankCode) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "All bank details are required",
      });
    }

    // Step 1: Create Recipient on Kora
    const recipientResponse = await axios.post(
      `${KORA_API_BASE}/transfers/recipient`,
      {
        type: "bank_account",
        name: accountHolder,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      },
      {
        headers: {
          Authorization: `Bearer ${KORA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const recipientData = recipientResponse.data.data;

    // Step 2: Save or update Bank record
    const bank = await Bank.findOneAndUpdate(
      { fundraiser: fundraiserId, campaign: campaignId || null },
      {
        accountNumber,
        accountHolder,
        bankName,
        bankCode,
        koraRecipientCode: recipientData.recipient_code,
        status: "verified",
      },
      { new: true, upsert: true }
    );

    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Bank account verified and saved successfully",
      data: bank,
    });
  } catch (error) {
    console.error("Error adding bank account:", error.response?.data || error.message);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.response?.data?.message || error.message,
    });
  }
};

exports.getAllBanks = async (req, res) => {
  try {
    const fundraiserId = req.user.id || req.user._id;
    const banks = await Bank.find({ fundraiser: fundraiserId });
    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Banks retrieved successfully",
      data: banks,
    });
  } catch (error) {
    console.error("Error fetching banks:", error.message);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
