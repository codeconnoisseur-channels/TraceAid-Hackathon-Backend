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
const mongoose = require("mongoose");

exports.makeDonation = async function (req, res) {
  try {
    // avoid destructuring to match your style
    const donorId = req.user && (req.user.id || req.user._id) ? req.user._id || req.user.id : null;
    const campaignId = req.body.campaignId;
    const amountStr = req.body.amount;
    const isAnonymous = req.body.isAnonymous === "true" || req.body.isAnonymous === true;
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

    const today = new Date();
    // Check if campaign is active AND if end date has not passed
    if (campaign.status !== "active" || (campaign.endDate && campaign.endDate < today)) {
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

    const remainingGoal = campaign.totalCampaignGoalAmount - campaign.amountRaised;

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

    const donor = await Donor.findById(donorId).select("firstName lastName email");

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
          name: donor ? `${donor.firstName || ""} ${donor.lastName || ""}`.trim() : isAnonymous ? "Anonymous Donor" : "Unknown Donor",
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
      message: "Donation initiated. Use the paymentReference or checkout_url to complete payment.",
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
    const signature = req.headers["x-korapay-signature"] || req.headers["X-Korapay-Signature".toLowerCase()];

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

    const expectedSignature = crypto.createHmac("sha256", KORA_SECRET_KEY).update(JSON.stringify(payload)).digest("hex");

    if (expectedSignature !== signature) {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Signature mismatch.",
      });
    }

    const paymentReference = payload.paymentReference || payload.payment_reference || payload.reference;
    const transactionId = payload.transactionId || payload.transaction_id || null;
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

    const normalizedStatus = ["successful", "success", "paid"].includes(String(status).toLowerCase()) ? "successful" : "failed";

    donation.transactionId = transactionId || donation.transactionId;
    donation.paymentStatus = normalizedStatus;
    if (normalizedStatus === "successful") {
      donation.verifiedAt = Date.now();
    }
    await donation.save();

    if (normalizedStatus === "successful") {
      const campaign = await Campaign.findById(donation.campaign);
      if (campaign) {
        campaign.amountRaised = (campaign.amountRaised || 0) + donation.amount;
        campaign.donorCount = (campaign.donorCount || 0) + 1;

        if (campaign.amountRaised >= campaign.totalCampaignGoalAmount && campaign.status === "active") {
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
          wallet.availableBalance = (wallet.availableBalance || 0) + donation.amount;
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

exports.getAllDonationsForCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "campaign id is required",
      });
    }

    const donations = await Donation.aggregate([
      {
        $match: {
          campaign: new mongoose.Types.ObjectId(campaignId),
          paymentStatus: "successful",
        },
      },
      {
        $lookup: {
          from: "donors",
          localField: "donor",
          foreignField: "_id",
          as: "donor",
        },
      },
      { $unwind: "$donor" },

      {
        // anonymize donor if isAnonymous=true
        $addFields: {
          donor: {
            $cond: [
              { $eq: ["$isAnonymous", true] },
              {
                firstName: "Anonymous",
                lastName: "",
                email: null,
                _id: "$donor._id",
              },
              {
                _id: "$donor._id",
                firstName: "$donor.firstName",
                lastName: "$donor.lastName",
                email: "$donor.email",
              },
            ],
          },
        },
      },

      { $sort: { createdAt: -1 } },

      {
        // keep only what frontend needs
        $project: {
          _id: 1,
          donor: 1,
          amount: 1,
          message: 1,
          createdAt: 1,
          isAnonymous: 1,
        },
      },
    ]);

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Donations retrieved",
      data: donations,
    });
  } catch (error) {
    console.error("Error getting donations:", error);

    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};

exports.getTopDonorsByCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid campaign id",
      });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || !campaign.isActive) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "This campaign is not active or is completed",
      });
    }

    let topDonors = await Donation.aggregate([
      {
        $match: {
          campaign: new mongoose.Types.ObjectId(campaignId),
          paymentStatus: "successful",
          isAnonymous: false,
        },
      },
      {
        $group: {
          _id: "$donor",
          totalDonated: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalDonated: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const donorIds = topDonors.map((donor) => donor._id);

    const DonorModel = mongoose.model("Donor");

    const donorDetails = await DonorModel.find({
      _id: { $in: donorIds },
    }).select("firstName lastName");

    const donorMap = donorDetails.reduce((map, donor) => {
      map[donor._id.toString()] = donor;
      return map;
    }, {});

    topDonors = topDonors.map((donor) => {
      const details = donorMap[donor._id.toString()];

      const firstName = details ? details.firstName : null;
      const lastName = details ? details.lastName : null;

      return {
        donorId: donor._id,
        totalDonated: donor.totalDonated,
        donationCount: donor.donationCount,
        firstName: firstName,
        lastName: lastName,
        donorName: details ? `${firstName || ""} ${lastName || ""}`.trim() : "Anonymous User",
      };
    });

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Top donors fetched successfully",
      data: topDonors,
    });
  } catch (err) {
    console.error("getTopDonorsByCampaign error:", err);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: err.message,
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

    const donations = await Donation.find({
      campaign: campaignId,
      paymentStatus: "successful",
      isAnonymous: false,
    })
      .populate("donor", "firstName lastName")
      .sort({ createdAt: -1 })
      .select("amount message createdAt");

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

    const donations = await Donation.find({ donor: donorId })
      .sort({
        createdAt: -1,
      })
      .populate({ path: "campaign", select: "campaignTitle campaignDescription totalCampaignGoalAmount amountRaised" })
      .populate("donor", "firstName lastName");

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
