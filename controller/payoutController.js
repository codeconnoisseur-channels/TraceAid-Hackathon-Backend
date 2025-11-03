const payoutModel = require("../model/payoutModel")
const fundraiserWallet = require("../model/fundraiserWallet")

exports.createPayout = async function (req, res) {
  try {
    const fundraiserId = req.body.fundraiserId;
    const campaignId = req.body.campaignId || null;
    const amountStr = req.body.amount;
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
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "amount must be a positive number",
      });
    } 

    const wallet = await fundraiserWallet.findOne({ fundraiser: fundraiserId });
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

    const payoutReference = "PAYOUT_" + uuidv4();
    const payout = new payoutModel({
      fundraiser: fundraiserId,
      referenceID: payoutReference,
      campaign: campaignId,
      amount: amount,
      status: "processing",
    });

    await payout.save();

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

exports.getPendingPayoutRequests = async function (req, res) {
  try {

    const pendingRequests = await payoutModel.find({ status: "requested" })
      .populate("fundraiser", "firstName lastName email")
      .populate("campaign", "campaignTitle totalCampaignGoalAmount")
      .sort({ requestedAt: 1 });

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Pending payout requests retrieved successfully.",
      data: pendingRequests,
    });
  } catch (error) {
    console.error("Error fetching pending payout requests:", error);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};