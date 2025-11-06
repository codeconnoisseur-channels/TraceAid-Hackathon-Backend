const FundraiserWallet = require("../model/fundraiserWallet");
const Payout = require("../model/payoutModel");
const Campaign = require("../model/campaignModel");
const { v4: uuidv4 } = require("uuid");

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
    if (!fundraiserId) {
      return res.status(400).json({ statusCode: false, statusText: "Bad Request", message: "fundraiserId is required" });
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
      message: "Wallet summary",
      data: {
        availableBalance: wallet.availableBalance,
        totalWithdrawn: wallet.totalWithdrawn,
        perCampaign: computed.perCampaign,
        totals: computed.totals,
        transactions: wallet.transactions.slice(-50).reverse(), // last 50
      },
    });
  } catch (err) {
    console.error("getWalletSummaryByAdmin error:", err);
    return res.status(500).json({ statusCode: false, statusText: "Internal Server Error", message: err.message });
  }
};

exports.createPayoutByAdmin = async (req, res) => {
  try {
    const { fundraiserId, campaignId, amount, note } = req.body;
    const amountNum = Number(amount);
    if (!fundraiserId || !campaignId || !amountNum || amountNum <= 0) {
      return res
        .status(400)
        .json({ statusCode: false, statusText: "Bad Request", message: "fundraiserId, campaignId and positive amount are required" });
    }
    const wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId });
    if (!wallet) {
      return res.status(404).json({ statusCode: false, statusText: "Not Found", message: "Wallet not found for fundraiser" });
    }

    // compute per-campaign balance
    const computed = await computeWalletSummary(wallet);
    const perCampaign = computed.perCampaign.find((c) => String(c.campaign._id || c.campaign) === String(campaignId));
    const campaignBalance = perCampaign ? perCampaign.balance : 0;
    if (campaignBalance < amountNum) {
      return res
        .status(400)
        .json({ statusCode: false, statusText: "Bad Request", message: `Insufficient campaign balance. Available: ${campaignBalance}` });
    }

    // Create payout record
    const payout = new Payout({
      fundraiser: fundraiserId,
      campaign: campaignId,
      amount: amountNum,
      status: "processing",
      referenceID: "PAYOUT_" + uuidv4(),
      requestedAt: new Date(),
    });
    await payout.save();

    // Debit wallet and add ledger entry
    wallet.availableBalance = (wallet.availableBalance || 0) - amountNum;
    wallet.totalWithdrawn = (wallet.totalWithdrawn || 0) + amountNum;
    wallet.transactions.push({
      type: "debit",
      campaign: campaignId,
      amount: amountNum,
      source: "payout",
      reference: payout.referenceID,
      note: note || "Admin payout",
      createdAt: new Date(),
    });
    await wallet.save();

    // In a real integration, trigger external transfer then update payout.status accordingly
    payout.status = "completed";
    payout.completedAt = new Date();
    await payout.save();

    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Payout completed",
      data: { payout, walletAvailableBalance: wallet.availableBalance },
    });
  } catch (err) {
    console.error("createPayoutByAdmin error:", err);
    return res.status(500).json({ statusCode: false, statusText: "Internal Server Error", message: err.message });
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

// Fundraiser self-service endpoints
// GET /fundraiser-wallet/summary
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

// POST /fundraiser-wallet/request-payout
exports.requestPayout = async (req, res) => {
  try {
    const fundraiserId = req.user && req.user.id ? req.user.id : req.user?._id;
    const { campaignId, amount, note } = req.body;
    const amountNum = Number(amount);

    if (!fundraiserId) {
      return res.status(401).json({ statusCode: false, statusText: "Unauthorized", message: "Missing authenticated user" });
    }
    if (!campaignId || !amountNum || amountNum <= 0) {
      return res.status(400).json({ statusCode: false, statusText: "Bad Request", message: "campaignId and positive amount are required" });
    }

    const wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId });
    if (!wallet) {
      return res.status(404).json({ statusCode: false, statusText: "Not Found", message: "Wallet not found" });
    }

    // compute per-campaign balance
    const computed = await computeWalletSummary(wallet);
    const perCampaign = computed.perCampaign.find((c) => String(c.campaign._id || c.campaign) === String(campaignId));
    const campaignBalance = perCampaign ? perCampaign.balance : 0;

    if (campaignBalance < amountNum) {
      return res.status(400).json({ statusCode: false, statusText: "Bad Request", message: `Insufficient campaign balance. Available: ${campaignBalance}` });
    }

    // Create payout request (pending/processing)
    const payout = new Payout({
      fundraiser: fundraiserId,
      campaign: campaignId,
      amount: amountNum,
      status: "processing", // adjust to your workflow: pending -> processing -> completed/rejected
      referenceID: "PAYOUT_" + uuidv4(),
      requestedAt: new Date(),
      note: note || "Fundraiser-initiated payout",
    });
    await payout.save();

    // Debit the wallet immediately or after admin approval depending on business rules.
    // Here we hold funds until completion, so we DO NOT debit immediately. If you want to debit now, uncomment below.
    // wallet.availableBalance = (wallet.availableBalance || 0) - amountNum;
    // wallet.totalWithdrawn = (wallet.totalWithdrawn || 0) + amountNum;
    // wallet.transactions.push({ type: "debit", campaign: campaignId, amount: amountNum, source: "payout", reference: payout.referenceID, note: note || "Payout request", createdAt: new Date() });
    // await wallet.save();

    return res.status(201).json({
      statusCode: true,
      statusText: "Created",
      message: "Payout request submitted",
      data: { payout },
    });
  } catch (err) {
    console.error("requestPayout error:", err);
    return res.status(500).json({ statusCode: false, statusText: "Internal Server Error", message: err.message });
  }
};

// GET /fundraiser-wallet/payout-history
exports.getPayoutHistory = async (req, res) => {
  try {
    const fundraiserId = req.user && req.user.id ? req.user.id : req.user?._id;
    if (!fundraiserId) {
      return res.status(401).json({ statusCode: false, statusText: "Unauthorized", message: "Missing authenticated user" });
    }

    const { campaignId, status } = req.query;
    const query = { fundraiser: fundraiserId };
    if (campaignId) query.campaign = campaignId;
    if (status) query.status = status; 

    const payouts = await Payout.find(query)
      .populate("campaign", "campaignTitle")
      .sort({ requestedAt: -1 })
      .limit(100);

    return res.status(200).json({
      statusCode: true,
      statusText: "OK",
      message: "Payout history",
      data: payouts,
    });
  } catch (err) {
    console.error("getPayoutHistory error:", err);
    return res.status(500).json({ statusCode: false, statusText: "Internal Server Error", message: err.message });
  }
};
