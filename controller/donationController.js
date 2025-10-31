const Donation = require("../model/donationModel");
const Campaign = require("../model/campaignModel");
const Donor = require("../model/donorModel");
const FundraiserWallet = require("../model/fundraiserWallet");
const Payout = require("../model/payoutModel");
const { v4: uuidv4 } = require("uuid"); // for generating references

// Create a donation record (initial request from frontend).
// Frontend should call your payment gateway with paymentReference produced here
exports.createDonation = async function (req, res) {
  try {
    // avoid destructuring to match your style
    const donorId = req.user && req.user.id ? req.user.id : null;
    const campaignId = req.body.campaignId;
    const amountStr = req.body.amount;
    const isAnonymous = req.body.isAnonymous === "true" || req.body.isAnonymous === true;
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

    var amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "amount must be a positive number",
      });
    }

    // check campaign exists
    var campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Campaign not found",
      });
    }

    // create unique payment reference to be used by frontend -> gateway
    var paymentReference = "DON_" + uuidv4();
    var transactionId = "TXN_" + uuidv4();

    // create donation record with pending status
    var donation = new Donation({
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

    await donation.save();

    // return donation and paymentReference for frontend to call gateway
    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Donation initiated. Use the paymentReference to complete payment.",
      data: {
        donation: donation,
        paymentReference: paymentReference,
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

// Webhook or callback from payment gateway to verify transaction.
// This endpoint should be hit by your payment provider (server-side) after payment.
// This function will:
// 1) find donation by paymentReference or transactionId
// 2) check payment result (we assume provider gives status and transaction id)
// 3) mark donation successful and update campaign amountRaised and donor count
// 4) update fundraiser wallet (increase availableBalance) - here we do not auto-payout, admin handles payout
exports.verifyPaymentWebhook = async function (req, res) {
  try {
    // NOTE: The exact body depends on your gateway. We assume:
    // req.body.paymentReference, req.body.transactionId, req.body.status (successful/failed), req.body.amount
    var paymentReference = req.body.paymentReference || req.body.reference || null;
    var transactionIdFromGateway = req.body.transactionId || req.body.transaction_id || null;
    var gatewayStatus = req.body.status || req.body.payment_status || null;
    var amountFromGateway = req.body.amount || null;

    if (!paymentReference) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "paymentReference is required in webhook",
      });
    }

    // find donation by paymentReference
    var donation = await Donation.findOne({ paymentReference: paymentReference });
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

    // Decide status mapping (gateway-specific). We'll map common positive value to 'successful'
    var normalizedStatus = "failed";
    if (String(gatewayStatus).toLowerCase() === "successful" || String(gatewayStatus).toLowerCase() === "success" || String(gatewayStatus).toLowerCase() === "paid") {
      normalizedStatus = "successful";
    } else {
      normalizedStatus = "failed";
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
      // update campaign amountRaised and donorCount
      var campaign = await Campaign.findById(donation.campaign);
      if (campaign) {
        // increment amountRaised
        var newAmountRaised = campaign.amountRaised + donation.amount;
        campaign.amountRaised = newAmountRaised;

        // increment donorCount by 1 (be careful if donor can donate multiple times; you may dedupe by donor)
        var newDonorCount = campaign.donorCount + 1;
        campaign.donorCount = newDonorCount;

        await campaign.save();
      }

      // update fundraiser wallet (increase availableBalance)
      // find the fundraiser id from campaign
      if (campaign && campaign.fundraiser) {
        var fundraiserId = campaign.fundraiser;
        var wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId });
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

    // respond 200 to webhook
    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Webhook processed",
      data: {
        donation: donation,
      },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

// Get donations for a campaign (public)
exports.getDonationsByCampaign = async function (req, res) {
  try {
    var campaignId = req.params.id;
    if (!campaignId) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "campaign id is required",
      });
    }

    var donations = await Donation.find({ campaign: campaignId }).sort({ createdAt: -1 });

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

// Get donations for a logged-in donor (private)
exports.getDonationsByUser = async function (req, res) {
  try {
    var donorId = req.user && req.user.id ? req.user.id : null;
    if (!donorId) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "Login required",
      });
    }

    var donations = await Donation.find({ donor: donorId }).sort({ createdAt: -1 });

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

// Admin: get all donations (with filters)
exports.getAllDonations = async function (req, res) {
  try {
    var statusFilter = req.query.status || null;
    var query = {};
    if (statusFilter) {
      query.paymentStatus = statusFilter;
    }

    var donations = await Donation.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Donations retrieved",
      data: donations,
    });
  } catch (error) {
    console.error("Error getting all donations:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

// Admin: create manual payout record (when admin approves disbursement to fundraiser bank)
exports.createPayout = async function (req, res) {
  try {
    // admin triggers payout: pass fundraiserId, campaignId (optional), amount, reference
    var fundraiserId = req.body.fundraiserId;
    var campaignId = req.body.campaignId || null;
    var amountStr = req.body.amount;
    if (!fundraiserId) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "fundraiserId is required",
      });
    }
    if (!amountStr) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "amount is required",
      });
    }
    var amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "amount must be a positive number",
      });
    }

    // ensure wallet exists and has enough balance
    var wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId });
    if (!wallet) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Fundraiser wallet not found",
      });
    }

    if (wallet.availableBalance < amount) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Insufficient wallet balance",
      });
    }

    // create payout record
    var payoutReference = "PAYOUT_" + uuidv4();
    var payout = new Payout({
      fundraiser: fundraiserId,
      referenceID: payoutReference,
      campaign: campaignId,
      amount: amount,
      status: "processing",
    });

    await payout.save();

    // deduct availableBalance and add to totalWithdrawn when marked paid
    wallet.availableBalance = wallet.availableBalance - amount;
    wallet.totalWithdrawn = wallet.totalWithdrawn + amount;
    await wallet.save();

    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Payout created and wallet debited (processing).",
      data: payout,
    });
  } catch (error) {
    console.error("Error creating payout:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};
