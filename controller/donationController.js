const Donation = require("../model/donationModel");
const Campaign = require("../model/campaignModel");
const Donor = require("../model/donorModel");
const FundraiserWallet = require("../model/fundraiserWallet");
const Payout = require("../model/payoutModel");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const axios = require("axios");
const { parse } = require("path");
const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY;
const KORA_API_BASE = "https://api.korapay.com/merchant/api/v1/";

exports.makeDonation = async function (req, res) {
  try {
    // avoid destructuring to match your style
    const donorId =
      req.user && (req.user.id || req.user._id)
        ? req.user._id || req.user.id
        : null;
    const campaignId = req.body.campaignId;
    const amountStr = req.body.amount;
    const isAnonymous =
      req.body.isAnonymous === "true" || req.body.isAnonymous === true;
    const message = req.body.message || null;

    // if (!donorId) {
    //   return res.status(401).json({
    //     statusCode: false,
    //     statusText: "Unauthorized",
    //     message: "You must be logged in to donate",
    //   });
    // }

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
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Campaign not found",
      });
    }

    const fundraiser = campaign.fundraiser;

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
      fundraiser: fundraiser,
      // user field removed: not part of Donation schema
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

    const donor = await Donor.findById(donorId).select(
      "firstName lastName email"
    );

    // Use a frontend redirect URL, not the webhook URL
    const FRONTEND_REDIRECT_URL = process.env.PAYMENT_REDIRECT_URL;

    const korapayResponse = await axios.post(
      "https://api.korapay.com/merchant/api/v1/charges/initialize",
      {
        amount: donation.amount,
        currency: donation.currency || "NGN",
        reference: donation.paymentReference,
        redirect_url: FRONTEND_REDIRECT_URL,
        customer: {
          name: donor
            ? `${donor.firstName || ""} ${donor.lastName || ""}`.trim()
            : isAnonymous
            ? "Anonymous Donor"
            : "Unknown Donor",
          email: donor?.email || "noemail@donor.com",
        },
        narration: `Donation for campaign: ${campaign.campaignTitle}`,
      },
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
    // Log for diagnostics
    console.log("Kora Webhook hit! Headers:", req.headers);
    console.log("Kora Webhook body (parsed):", req.body);

    // --- 1. Signature Verification ---
    const signature =
      req.headers["x-korapay-signature"] ||
      req.headers["X-Korapay-Signature".toLowerCase()];

    if (!signature || !KORA_SECRET_KEY) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "Missing signature or secret key.",
      });
    }

    // Use rawBody if provided by middleware, else fallback to re-stringifying req.body
    let rawBodyString;
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
      rawBodyString = req.rawBody.toString();
    } else if (typeof req.body === "string") {
      rawBodyString = req.body; // In case body-parser didn't parse
    } else {
      rawBodyString = JSON.stringify(req.body || {});
    }

    let bodyData;
    try {
      bodyData = JSON.parse(rawBodyString);
    } catch (e) {
      // As a fallback, try using already parsed body
      bodyData = req.body || {};
    }

    const payload = bodyData && (bodyData.data || bodyData.payload || bodyData);

    if (!payload) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid webhook payload structure.",
      });
    }

    // Signature is computed over the data object per Kora docs
    const expectedSignature = crypto
      .createHmac("sha256", KORA_SECRET_KEY)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Signature mismatch.",
      });
    }

    // --- 2. Extract Payment Info ---
    const paymentReference =
      payload.paymentReference ||
      payload.payment_reference ||
      payload.reference;
    const transactionId =
      payload.transactionId || payload.transaction_id || null;
    const status = payload.status || payload.payment_status || null;
    const amount = payload.amount || payload.amount_paid || null;

    if (!paymentReference) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Missing payment reference in payload.",
      });
    }

    const donation = await Donation.findOne({
      paymentReference: paymentReference,
    });

    if (!donation) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Donation not found.",
      });
    }

    if (donation.paymentStatus === "successful") {
      return res.status(200).json({
        statusCode: true,
        statusText: "OK",
        message: "Donation already marked successful.",
      });
    }

    // --- 3. Normalize Status ---
    const normalizedStatus = ["successful", "success", "paid"].includes(
      String(status).toLowerCase()
    )
      ? "successful"
      : "failed";

    // --- 4. Update Donation ---
    donation.transactionId = transactionId || donation.transactionId;
    donation.paymentStatus = normalizedStatus;
    if (normalizedStatus === "successful") {
      donation.verifiedAt = Date.now();
    }
    await donation.save();

    // --- 5. Update Campaign & Wallet on success ---
    if (normalizedStatus === "successful") {
      const campaign = await Campaign.findById(donation.campaign);
      if (campaign) {
        campaign.amountRaised = (campaign.amountRaised || 0) + donation.amount;
        campaign.donorCount = (campaign.donorCount || 0) + 1;

        if (
          campaign.amountRaised >= campaign.totalCampaignGoalAmount &&
          campaign.status === "active"
        ) {
          campaign.status = "completed";
          campaign.isActive = false;
          campaign.endDate = new Date();
        }
        await campaign.save();

        if (campaign.fundraiser) {
          let wallet = await FundraiserWallet.findOne({
            fundraiser: campaign.fundraiser,
          });
          if (!wallet) {
            wallet = new FundraiserWallet({
              fundraiser: campaign.fundraiser,
              availableBalance: 0,
              totalWithdrawn: 0,
              transactions: [],
            });
          }
          // Credit wallet and record ledger entry tied to the campaign and donation reference
          wallet.availableBalance =
            (wallet.availableBalance || 0) + donation.amount;
          wallet.transactions.push({
            type: "credit",
            campaign: campaign._id,
            amount: donation.amount,
            donor: donation.donor,
            donation: donation._id,
            source: "donation",
            reference: donation.paymentReference,
            note: `Donation credited for campaign ${campaign.campaignTitle}`,
            createdAt: new Date(),
          });
          await wallet.save();
        }
      }
    }

    console.log("Webhook processed successfully for:", paymentReference);
    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Webhook processed successfully.",
      data: { donation },
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

// Admin/Fundraiser: get all donations for a campaign (successful only)
exports.getAllDonationsForCampaign = async function (req, res) {
  try {
    const campaignId = req.params.id;
    if (!campaignId) {
      return res
        .status(400)
        .json({
          statusCode: false,
          statusText: "Bad Request",
          message: "campaign id is required",
        });
    }
    const donations = await Donation.find({
      campaign: campaignId,
      paymentStatus: "successful",
    })
      .populate("donor", "firstName lastName email")
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .json({
        statusCode: true,
        statusText: "OK",
        message: "All donations retrieved",
        data: donations,
      });
  } catch (error) {
    console.error("Error getting all donations for campaign:", error);
    return res
      .status(500)
      .json({
        statusCode: false,
        statusText: "Internal Server Error",
        message: error.message,
      });
  }
};

// Public: get top donors for a campaign (by total contributed amount)
exports.getTopDonorsForCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));

    if (!campaignId) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign ID is required",
      });
    }

    // Validate ObjectId — if invalid, respond early
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid campaign ID format",
      });
    }

    //  Match donations only for this campaign
    const pipeline = [
      {
        $match: {
          campaign: mongoose.Types.ObjectId(campaignId),
          paymentStatus: "successful",
          isAnonymous: false,
        },
      },
      {
        $group: {
          _id: "$donor", // ensure donation model field is "donor"
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "donors", //  must match your donor collection name
          localField: "_id",
          foreignField: "_id",
          as: "donorInfo",
        },
      },
      { $unwind: "$donorInfo" },
      {
        $project: {
          _id: 0,
          donorId: "$donorInfo._id",
          firstName: "$donorInfo.firstName",
          lastName: "$donorInfo.lastName",
          email: "$donorInfo.email",
          totalAmount: 1,
          donationCount: 1,
        },
      },
    ];

    const result = await Donation.aggregate(pipeline);

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Top donors retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error getting top donors for campaign:", error);
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
