const Donation = require("../model/donationModel");
const Campaign = require("../model/campaignModel");
const Donor = require("../model/donorModel");
const FundraiserWallet = require("../model/fundraiserWallet");
const Payout = require("../model/payoutModel");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const axios = require("axios");
const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY;
const KORA_API_BASE = "https://api.korapay.com/merchant/api/v1/";

exports.createDonation = async function (req, res) {
  try {
    // avoid destructuring to match your style
    const donorId = req.user && req.user.id ? req.user.id : null;
    const campaignId = req.body.campaignId;
    const amountStr = req.body.amount;
    const isAnonymous =
      req.body.isAnonymous === "true" || req.body.isAnonymous === true;
    const message = req.body.message || null;

    if (!donorId) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "You must be logged in to donate",
      });
    }

    if (!campaignId) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "campaignId is required",
      });
    }

    if (!amountStr) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "amount is required",
      });
    }

    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "amount must be a positive number",
      });
    } // check campaign exists

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Campaign not found",
      });
    }

    // ----------------------------------------------------------------------
    // 🔥 CRITICAL UPDATE 1: Campaign Status and Duration Check
    // ----------------------------------------------------------------------
    const today = new Date();
    // Check if campaign is active AND if end date has not passed
    if (
      campaign.status !== "active" ||
      (campaign.endDate && campaign.endDate < today)
    ) {
      const message =
        campaign.status !== "active"
          ? `Donations are not accepted. Campaign status is '${campaign.status}'.`
          : "The campaign duration has ended and no longer accepts donations.";

      // We assume 'active' is the status that allows donations
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: message,
      });
    }

    // ----------------------------------------------------------------------
    // 🔥 CRITICAL UPDATE 2: Over-Donation Check
    // ----------------------------------------------------------------------
    const remainingGoal =
      campaign.totalCampaignGoalAmount - campaign.amountRaised;

    // Check if the donation amount is greater than the remaining required amount
    if (amount > remainingGoal) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `Donation amount (${amount}) exceeds the remaining goal (${remainingGoal}). The maximum allowed donation is ${remainingGoal}.`,
      });
    } // create unique payment reference to be used by frontend -> gateway

    let paymentReference = "DON_" + uuidv4();
    let transactionId = "TXN_" + uuidv4(); // create donation record with pending status

    let donation = new Donation({
      donor: donorId,
      campaign: campaignId,
      amount: amount,
      currency: "NGN",
      paymentReference: paymentReference,
      transactionId: transactionId,
      paymentStatus: "pending",
      isAnonymous: isAnonymous,
      message: message,
      verifiedAt: null,
    });

    await donation.save(); // return donation and paymentReference for frontend to call gateway

    const initializePayment = {
      amount: donation.amount,
      currency: donation.currency || "NGN",
      reference: paymentReference,
      donor: {
        email: req.body.email,
      },
    };
    const korapayResponse = await axios.post(
      `${KORA_API_BASE}/charges/initialize`,
      initializePayment,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${KORA_SECRET_KEY}`,
        },
      }
    );

    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message:
        "Donation initiated. Use the paymentReference or checkout_url to complete payment.",
      data: {
        donation: donation,
        paymentReference: paymentReference,
        checkoutUrl: korapayResponse?.data?.data?.checkout_url,
      },
    });
  } catch (error) {
    console.error("Error creating donation:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.verifyPaymentWebhook = async function (req, res) {
  try {
    // --- 1. KORA SIGNATURE VERIFICATION (CRITICAL SECURITY STEP) ---
    const signature = req.headers["x-korapay-signature"];
    const bodyData = req.body.data; // Kora signs ONLY the 'data' object.

    if (!signature || !KORA_SECRET_KEY) {
      console.error(
        "Webhook Error: Missing signature header or KORA_SECRET_KEY."
      );
      // Important: Respond 401 or 403 on failed security check
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "Security check failed: Missing signature or key.",
      });
    }

    // Calculate expected signature (HMAC SHA256 of the JSON string of the 'data' object)
    const expectedSignature = crypto
      .createHmac("sha256", KORA_SECRET_KEY)
      .update(JSON.stringify(bodyData))
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error(
        "Webhook Security Error: Signature mismatch. Request dropped."
      );
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Security check failed: Invalid signature.",
      });
    }
    // --- END KORA SIGNATURE VERIFICATION ---

    // NOTE: The exact body depends on your gateway. We assume:
    const paymentReference =
      req.body.paymentReference || req.body.reference || null;
    const transactionIdFromGateway =
      req.body.transactionId || req.body.transaction_id || null;
    const gatewayStatus = req.body.status || req.body.payment_status || null;
    const amountFromGateway = req.body.amount || null;
    const campaignId = req.body.campaignId || req.body.campaign_id || null;

    if (!paymentReference) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "paymentReference is required in webhook",
      });
    }

    // find donation by paymentReference
    const donation = await Donation.findOne({
      paymentReference: paymentReference,
    });

    if (!donation) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Donation record not found",
      });
    }

    // If already successful, ignore
    if (donation.paymentStatus === "successful") {
      return res.status(200).json({
        statusCode: true,
        statusText: "OK",
        message: "Donation already marked successful",
      });
    }

    // Decide status mapping (gateway-specific).
    let normalizedStatus = "pending"; // Default to pending if not a clear success or failure

    if (
      String(gatewayStatus).toLowerCase() === "successful" ||
      String(gatewayStatus).toLowerCase() === "success" ||
      String(gatewayStatus).toLowerCase() === "paid"
    ) {
      normalizedStatus = "successful";
    } else {
      normalizedStatus = "failed"; // Explicitly set to failed if not a success state
    }

    // Update donation record
    donation.transactionId = transactionIdFromGateway || donation.transactionId;
    donation.paymentStatus = normalizedStatus;

    if (normalizedStatus === "successful") {
      donation.verifiedAt = Date.now();
    }
    await donation.save();

    // If payment successful, update campaign and fundraiser wallet
    if (normalizedStatus === "successful") {
      // Find campaign before update to get current goal and status
      const campaign = await Campaign.findById(donation.campaign);

      if (campaign) {
        // 1. Update campaign amountRaised and donorCount
        const newAmountRaised = campaign.amountRaised + donation.amount;
        campaign.amountRaised = newAmountRaised;
        const newDonorCount = campaign.donorCount + 1;
        campaign.donorCount = newDonorCount;

        // 🔥 CRITICAL UPDATE: Campaign Auto-Close Check
        // If the new total amount raised meets or exceeds the goal, close the campaign.
        if (
          newAmountRaised >= campaign.totalCampaignGoalAmount &&
          campaign.status === "active"
        ) {
          campaign.status = "completed"; // Set status to completed
          campaign.endDate = new Date(); // Set the completion date/time
        }

        await campaign.save();

        // 2. Update fundraiser wallet (increase availableBalance)
        // find the fundraiser id from campaign
        if (campaign.fundraiser) {
          const fundraiserId = campaign.fundraiser;
          let wallet = await FundraiserWallet.findOne({
            fundraiser: fundraiserId,
          });

          if (!wallet) {
            // create wallet if not exists
            wallet = new FundraiserWallet({
              fundraiser: fundraiserId,
              availableBalance: 0,
              totalWithdrawn: 0,
            });
          }
          wallet.availableBalance = wallet.availableBalance + donation.amount;
          await wallet.save();
        }
      }
    }

    // respond 200 to webhook upon successful processing
    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Webhook processed successfully",
      data: {
        donation: donation,
      },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Respond 500 in the event of an internal server error during processing
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getDonationsByCampaign = async function (req, res) {
  try {
    const campaignId = req.params.id;
    if (!campaignId) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "campaign id is required",
      });
    }

    // Only return successful and non-anonymous donations for public viewing
    const donations = await Donation.find({
      campaign: campaignId,
      paymentStatus: "successful",
      isAnonymous: false,
    })
      .populate("donor", "name") // Optionally populate donor name if needed
      .sort({ createdAt: -1 })
      .select("amount message createdAt"); // Select minimal fields

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Donations retrieved",
      data: donations,
    });
  } catch (error) {
    console.error("Error getting donations by campaign:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getDonationsByUser = async function (req, res) {
  try {
    const donorId = req.user && req.user.id ? req.user.id : null;
    if (!donorId) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "Login required",
      });
    }

    const donations = await Donation.find({ donor: donorId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "User donations retrieved",
      data: donations,
    });
  } catch (error) {
    console.error("Error getting donations by user:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
