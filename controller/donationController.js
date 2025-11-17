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
const Fundraiser = require("../model/fundraiserModel");
exports.makeDonation = async function (req, res) {
  try {
    const authUser = req.user || req.user._id;
    const userId = authUser?.id || authUser?._id || null;
    const userRole = authUser?.role || "donor";

    const campaignId = req.body.campaignId;
    const amountStr = req.body.amount;
    const isAnonymous = req.body.isAnonymous === "true" || req.body.isAnonymous === true;
    const message = req.body.message || null;

    if (!userId) {
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
    }

    if (isNaN(amount)|| amount <= 99) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Minimum donation amount is 100 NGN",
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

    if (campaign.status !== "active") {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Donations are not accepted. Campaign status is not active.",
      });
    }

    if (campaign.endDate && campaign.endDate < new Date()) {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Donations are not accepted. Campaign has ended.",
      });
    }

    if (userRole === "fundraiser" && String(campaign.fundraiser) === String(userId)) {
      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: "Fundraisers cannot donate to their own campaigns.",
      });
    }

    // Only allow donations while campaign is active and not expired
    const today = new Date();
    if (campaign.status !== "active" || (campaign.endDate && campaign.endDate < today)) {
      const msg =
        campaign.status !== "active"
          ? `Donations are not accepted. Campaign status is '${campaign.status}'.`
          : "The campaign duration has ended and no longer accepts donations.";

      return res.status(403).json({
        statusCode: false,
        statusText: "Forbidden",
        message: msg,
      });
    }

    const remainingGoal = campaign.totalCampaignGoalAmount - campaign.amountRaised;
    if (amount > remainingGoal) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: `Donation amount (${amount}) exceeds the remaining goal (${remainingGoal}). The maximum allowed donation is ${remainingGoal}.`,
      });
    }

    let donationData = {
      campaign: campaignId,
      fundraiser: campaign.fundraiser,
      amount,
      currency: "NGN",
      paymentReference: "DON_" + uuidv4(),
      transactionId: "TXN_" + uuidv4(),
      paymentStatus: "pending",
      isAnonymous,
      message,
      verifiedAt: null,
    };

    if (userRole === "donor") {
      donationData.donor = userId;
    } else if (userRole === "fundraiser") {
      donationData.donor = null;
      donationData.donorType = "fundraiser";
      donationData.donatingFundraiser = userId;
    }

    const donation = new Donation(donationData);
    await donation.save();

    let donorInfo = null;
    if (donationData.donor) {
      donorInfo = await Donor.findById(donationData.donor).select("firstName lastName email");
    } else if (donationData.donatingFundraiser) {
      const f = await Fundraiser.findById(donationData.donatingFundraiser).select("organizationName email");
      donorInfo = f ? { firstName: f.organizationName, lastName: "", email: f.email || null } : null;
    }

    const FRONTEND_REDIRECT_URL = process.env.PAYMENT_REDIRECT_URL;
    const korapayResponse = await axios.post(
      `${KORA_API_BASE}/charges/initialize`,
      {
        amount: donation.amount,
        currency: donation.currency || "NGN",
        reference: donation.paymentReference,
        redirect_url: FRONTEND_REDIRECT_URL,
        customer: {
          name: donorInfo ? `${donorInfo.firstName || ""} ${donorInfo.lastName 
          || ""}`.trim() : isAnonymous ? "Anonymous Donor" : "Unknown Donor",
          email: donorInfo?.email || "noemail@donor.com",
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
        donation,
        paymentReference: donation.paymentReference,
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

    const signature = req.headers["x-korapay-signature"] || req.headers["X-Korapay-Signature".toLowerCase()];

    if (!signature || !KORA_SECRET_KEY) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "Missing signature or secret key.",
      });
    }

    let rawBodyString;
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
      rawBodyString = req.rawBody.toString();
    } else if (typeof req.body === "string") {
      rawBodyString = req.body;
    } else {
      rawBodyString = JSON.stringify(req.body || {});
    }

    let bodyData;
    try {
      bodyData = JSON.parse(rawBodyString);
    } catch (e) {
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

    const normalizedStatus = ["successful", "success", "paid"]
    .includes(String(status).toLowerCase()) ? "successful" : "failed";

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

        if (campaign.amountRaised >= campaign.totalCampaignGoalAmount
           && campaign.status === "active") {
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

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Invalid campaign id",
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
          as: "donorDetails",
        },
      },
      {
        $unwind: { path: "$donorDetails", preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: "fundraisers",
          localField: "donor",
          foreignField: "_id",
          as: "fundraiserDetails",
        },
      },
      {
        $unwind: { path: "$fundraiserDetails", preserveNullAndEmptyArrays: true },
      },

      {
        $addFields: {
          donor: {
            $cond: [
              // CONDITION 1: Anonymous Donation
              { $eq: ["$isAnonymous", true] },
              {
                firstName: "Anonymous",
                lastName: "",
                email: null,
                _id: "$donor",
              },
              // CONDITION 2: Public Donation (Check for Fundraiser Organization Name first)
              {
                $cond: [
                  // Sub-condition A: Is a Fundraiser (check if organizationName exists)
                  { $ifNull: ["$fundraiserDetails.organizationName", false] },
                  {
                    _id: "$donor",
                    firstName: "$fundraiserDetails.organizationName",
                    lastName: "", // Use empty last name for organizations
                    email: "$fundraiserDetails.email",
                  },
                  // Sub-condition B: Is a Standard Donor
                  {
                    _id: "$donor",
                    // Use standard donor names, defaulting to empty string if null
                    firstName: { $ifNull: ["$donorDetails.firstName", ""] },
                    lastName: { $ifNull: ["$donorDetails.lastName", ""] },
                    email: { $ifNull: ["$donorDetails.email", null] },
                  },
                ],
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
          donor: 1, // This is the newly constructed object
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

    // --- 1. Fetch Campaign Details and Fundraiser Organization Name ---
    // Perform this lookup separately to get the organization name once and validate campaign status
    const campaignDetails = await Campaign.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(campaignId) } },
      {
        $lookup: {
          from: "fundraisers",
          localField: "fundraiser",
          foreignField: "_id",
          as: "fundraiserDetails",
        },
      },
      { $unwind: { path: "$fundraiserDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          isActive: 1,
          // Get the organizationName from the Fundraiser or default to "Personal Fundraiser"
          organizationName: { $ifNull: ["$fundraiserDetails.organizationName", "Personal Fundraiser"] },
        },
      },
    ]);

    if (campaignDetails.length === 0 || !campaignDetails[0].isActive) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "This campaign is not active or is completed",
      });
    }

    const fundraiserOrganizationName = campaignDetails[0].organizationName;

    // --- 2. Aggregate Top Donors and Determine Donor Name Type ---
    const topDonors = await Donation.aggregate([
      {
        $match: {
          campaign: new mongoose.Types.ObjectId(campaignId),
          paymentStatus: "successful",
        },
      },

      // GROUP DONATIONS by donor and anonymity status
      {
        $group: {
          _id: {
            donor: "$donor",
            isAnonymous: "$isAnonymous",
          },
          totalDonated: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },

      // SORT & LIMIT
      { $sort: { totalDonated: -1 } },
      { $limit: 10 },

      // LOOKUP 1: Check if the donor is in the 'donors' collection
      {
        $lookup: {
          from: "donors",
          localField: "_id.donor",
          foreignField: "_id",
          as: "donorDetails",
        },
      },
      {
        $addFields: {
          donorDetails: { $arrayElemAt: ["$donorDetails", 0] },
        },
      },

      // LOOKUP 2: Check if the donor is in the 'fundraisers' collection (This is the fix)
      {
        $lookup: {
          from: "fundraisers",
          localField: "_id.donor",
          foreignField: "_id",
          as: "fundraiserDetails",
        },
      },
      {
        $addFields: {
          fundraiserDetails: { $arrayElemAt: ["$fundraiserDetails", 0] },
        },
      },

      // FINAL PROJECTION: Determine the donorName, firstName, and lastName
      {
        $project: {
          _id: 0,
          realDonorIds: "$_id.donor",
          totalDonated: "$totalDonated",
          donationCount: "$donationCount",
          isAnonymous: "$_id.isAnonymous",

          // Use first/last name from Donor collection if present, otherwise empty string
          firstName: { $ifNull: ["$donorDetails.firstName", ""] },
          lastName: { $ifNull: ["$donorDetails.lastName", ""] },

          donorName: {
            $cond: {
              if: "$_id.isAnonymous", // Case 1: Anonymous
              then: "Anonymous",
              else: {
                $cond: {
                  if: "$fundraiserDetails.organizationName", // Case 2: Found Fundraiser Organization Name
                  then: "$fundraiserDetails.organizationName",
                  else: {
                    // Case 3: Found Donor name (firstName + lastName) - handles empty names/trim
                    $let: {
                      vars: {
                        donorFName: { $ifNull: ["$donorDetails.firstName", ""] },
                        donorLName: { $ifNull: ["$donorDetails.lastName", ""] },
                      },
                      in: {
                        // Concatenate and trim any leading/trailing space if a name is missing
                        $trim: {
                          input: { $concat: ["$$donorFName", " ", "$$donorLName"] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    // --- 3. Return Final Response ---
    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Top donors fetched successfully",
      fundraiserOrganization: fundraiserOrganizationName, // Campaign's organization name
      data: topDonors, // Fully processed donor list
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
