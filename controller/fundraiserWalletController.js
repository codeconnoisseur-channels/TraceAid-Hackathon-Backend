const FundraiserWallet = require("../model/fundraiserWallet");
const Payout = require("../model/payoutModel");
const Campaign = require("../model/campaignModel");
const { v4: uuidv4 } = require("uuid");
const Milestone = require("../model/milestoneModel");
const Bank = require("../model/bankModel");
const axios = require("axios");

const KORA_API_BASE = "https://api.korapay.com/merchant/api/v1";
const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY;

// Compute per-campaign balances from wallet.transactions
async function computeWalletSummary(wallet) {
  const perCampaign = {};
  for (const tx of wallet.transactions || []) {
    const cid = String(tx.campaign);
    if (!perCampaign[cid]) {
      perCampaign[cid] = { campaign: tx.campaign, credited: 0, debited: 0 };
    }
    if (tx.type === "credit") perCampaign[cid].credited += tx.amount;
    if (tx.type === "debit") perCampaign[cid].debited += tx.amount;
  }
  const summary = Object.values(perCampaign).map((c) => ({
    campaign: c.campaign,
    credited: c.credited,
    debited: c.debited,
    balance: c.credited - c.debited,
  }));
  const totals = summary.reduce(
    (acc, c) => {
      acc.credited += c.credited;
      acc.debited += c.debited;
      return acc;
    },
    { credited: 0, debited: 0 }
  );
  return { perCampaign: summary, totals };
}

exports.getWalletSummaryByAdmin = async (req, res) => {
  try {
    const fundraiserId = req.params.fundraiserId;
    if (!fundraiserId)
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "fundraiserId is required",
      });

    let wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId }).populate("transactions.campaign", "campaignTitle");
    if (!wallet) {
      wallet = new FundraiserWallet({ fundraiser: fundraiserId, availableBalance: 0, totalWithdrawn: 0, transactions: [] });
      await wallet.save();
    }
    const computed = await computeWalletSummary(wallet);

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Wallet summary",
      data: {
        availableBalance: wallet.availableBalance,
        totalWithdrawn: wallet.totalWithdrawn,
        perCampaign: computed.perCampaign,
        totals: computed.totals,
        transactions: wallet.transactions.slice(-50).reverse(),
      },
    });
  } catch (err) {
    console.error("getWalletSummaryByAdmin error:", err);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: err.message,
    });
  }
};

exports.listTransactions = async (req, res) => {
  try {
    const fundraiserId = req.params.fundraiserId;
    const { campaignId, type, limit } = req.query;
    const wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId }).populate("transactions.campaign", "campaignTitle");
    if (!wallet) {
      return res.status(404).json({ statusCode: false, statusText: "Not Found", message: "Wallet not found" });
    }
    let txs = wallet.transactions || [];
    if (campaignId) txs = txs.filter((t) => String(t.campaign._id || t.campaign) === String(campaignId));
    if (type) txs = txs.filter((t) => t.type === type);
    const lim = Math.max(1, Math.min(200, Number(limit) || 50));
    txs = txs.slice(-lim).reverse();
    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Transactions",
      data: txs,
    });
  } catch (err) {
    console.error("listTransactions error:", err);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: err.message,
    });
  }
};

exports.getFundraiserWallet = async (req, res) => {
  try {
    const fundraiserId = req.user && req.user.id ? req.user.id : req.user?._id;
    if (!fundraiserId) {
      return res.status(401).json({ statusCode: false, statusText: "Unauthorized", message: "Missing authenticated user" });
    }

    let wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId }).populate("transactions.campaign", "campaignTitle");
    if (!wallet) {
      wallet = new FundraiserWallet({ fundraiser: fundraiserId, availableBalance: 0, totalWithdrawn: 0, transactions: [] });
      await wallet.save();
    }

    const computed = await computeWalletSummary(wallet);
    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Fundraiser wallet summary",
      data: {
        availableBalance: wallet.availableBalance,
        totalWithdrawn: wallet.totalWithdrawn,
        perCampaign: computed.perCampaign,
        totals: computed.totals,
        recentTransactions: wallet.transactions.slice(-20).reverse(),
      },
    });
  } catch (err) {
    console.error("getFundraiserWallet error:", err);
    return res.status(500).json({ statusCode: false, statusText: "Internal Server Error", message: err.message });
  }
};

exports.requestPayoutByCampaignAndTheirMilestone = async (req, res) => {
  try {
    const fundraiserId = req.user?.id || req.user?._id;
    const { campaignId, milestoneId } = req.body;

    if (!fundraiserId) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "Missing authenticated user",
      });
    }

    if (!campaignId || !milestoneId) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Bad Request",
        message: "Campaign ID and Milestone ID are required",
      });
    }

    const campaign = await Campaign.findOne({ _id: campaignId, fundraiser: fundraiserId });
    if (!campaign) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Campaign not found for this fundraiser",
      });
    }

    const campaignEndDate = new Date(campaign.createdAt);
    campaignEndDate.setDate(campaignEndDate.getDate() + campaign.durationDays);

    const isCampaignExpired = new Date() >= campaignEndDate;
    const isCampaignFullyFunded = campaign.amountRaised >= campaign.totalCampaignGoalAmount;

    if (!campaign.isActive && !isCampaignExpired && !isCampaignFullyFunded) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Not Eligible",
        message: "This campaign is not yet eligible for withdrawal",
      });
    }

    const milestones = await Milestone.find({ campaign: campaignId }).sort({ order: 1 });
    if (!milestones.length) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "No milestones found for this campaign",
      });
    }

    const milestone = milestones.find((m) => m._id.toString() === milestoneId);
    if (!milestone) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Milestone not found for this campaign",
      });
    }

    const previousMilestone = milestones.find((m) => m.order === milestone.order - 1);
    if (previousMilestone && previousMilestone.status !== "approved") {
      return res.status(400).json({
        statusCode: false,
        statusText: "Not Eligible",
        message: `You must complete and get approval for Milestone ${previousMilestone.order} before requesting Milestone ${milestone.order}`,
      });
    }

    const existingPayout = await Payout.findOne({ milestone: milestoneId, status: { $in: ["pending", "processing"] } });
    if (existingPayout) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Not Eligible",
        message: "A payout request for this milestone is already pending or being processed.",
      });
    }

    if (["ready_for_release", "released", "completed"].includes(milestone.status)) {
      return res.status(400).json({
        statusCode: false,
        statusText: "Not Eligible",
        message: "This milestone has already been processed or withdrawn",
      });
    }

    const wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId });
    if (!wallet) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Wallet not found for fundraiser",
      });
    }

    const payout = await Payout.create({
      fundraiser: fundraiserId,
      campaign: campaignId,
      milestone: milestoneId,
      amount: milestone.targetAmount,
      status: "pending",
      referenceID: `PAYOUT-${Date.now()}`,
    });

    milestone.status = "on-going";
    await milestone.save();

    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: `Payout request for Milestone ${milestone.order} submitted successfully. It is now pending review.`,
      data: { payout },
    });
  } catch (err) {
    console.error("requestPayout error:", err);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: err.message,
    });
  }
};

exports.getPayoutHistory = async (req, res) => {
  try {
    const fundraiserId = req.user && req.user.id ? req.user.id : req.user?._id;
    if (!fundraiserId) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "Missing authenticated user",
      });
    }

    const { campaignId, status } = req.query;
    const query = { fundraiser: fundraiserId };
    if (campaignId) query.campaign = campaignId;
    if (status) query.status = status;

    const payouts = await Payout.find(query).populate("campaign", "campaignTitle").sort({ requestedAt: -1 }).limit(100);

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Payout history",
      data: payouts,
    });
  } catch (err) {
    console.error("getPayoutHistory error:", err);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: err.message,
    });
  }
};

exports.getAllPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find().populate("fundraiser", "name email").populate("campaign", "title").sort({ createdAt: -1 });

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "All payouts retrieved successfully",
      data: payouts,
    });
  } catch (error) {
    console.error("Error fetching payouts:", error.message);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
};


exports.getFundraiserWithdrawals = async (req, res) => {
  try {
    const fundraiserId = req.user && req.user.id ? req.user.id : req.user?._id;
    if (!fundraiserId) {
      return res.status(401).json({
        statusCode: false,
        statusText: "Unauthorized",
        message: "Missing authenticated user",
      });
    }


    const wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId });
    if (!wallet) {
      return res.status(404).json({
        statusCode: false,
        statusText: "Not Found",
        message: "Wallet not found for this fundraiser",
      });
    }

    const payouts = await Payout.find({ fundraiser: fundraiserId })
      .populate("campaign", "campaignTitle")
      .populate("milestone", "milestoneTitle sequence")
      .sort({ createdAt: -1 }); // latest first

    const formattedWithdrawals = payouts.map(p => ({
      referenceID: p.referenceID,
      campaignName: p.campaign ? p.campaign.campaignTitle : "Unknown Campaign",
      milestoneTitle: p.milestone ? p.milestone.milestoneTitle : "N/A",
      sequence: p.milestone ? p.milestone.sequence : null,
      amount: p.amount,
      status: p.status, // e.g. "pending", "paid"
      requestedAt: p.createdAt,
      processedAt: p.processedAt || null,
    }));

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Fundraiser withdrawal requests fetched successfully",
      data: {
        availableBalance: wallet.availableBalance,
        totalWithdrawn: wallet.totalWithdrawn,
        withdrawals: formattedWithdrawals,
      },
    });

  } catch (err) {
    console.error("getFundraiserWithdrawals error:", err);
    return res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: err.message,
    });
  }
};