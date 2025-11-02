const FundraiserWallet = require('../model/fundraiserWallet');
const Payout = require('../model/payoutModel');
const Campaign = require('../model/campaignModel');
const Milestone = require('../model/milestoneModel');
const { v4: uuidv4 } = require("uuid");

/**
 * @description Fundraiser: Get wallet details (available balance, totals).
 * @route GET /api/fundraiser/wallet
 * @access Private (Fundraiser only)
 */
exports.getFundraiserWallet = async function (req, res) {
    try {
        const fundraiserId = req.user.id; // Assumes req.user.id is set by your authentication middleware

        if (!fundraiserId) {
            return res.status(401).json({
                statusCode: false,
                statusText: "Unauthorized",
                message: "Fundraiser ID is required for wallet access.",
            });
        }

        // Find or create the wallet document for the fundraiser
        const wallet = await FundraiserWallet.findOneAndUpdate(
            { fundraiser: fundraiserId },
            { $setOnInsert: { availableBalance: 0, totalWithdrawn: 0 } },
            { upsert: true, new: true } // Upsert: create if it doesn't exist; new: return the updated/created document
        );
        
        // Find all campaigns associated with this fundraiser
        const campaigns = await Campaign.find({ fundraiser: fundraiserId });
        
        // Calculate Total Raised across all campaigns (if not already tracked in wallet)
        // Note: The totalRaised should conceptually come from the sum of all successful donations 
        // linked to this fundraiser, but for simplicity, we calculate total based on campaign amountRaised.
        const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.amountRaised, 0);

        return res.status(200).json({
            statusCode: true,
            statusText: "OK",
            message: "Wallet details retrieved successfully.",
            data: {
                wallet: wallet,
                totalRaised: totalRaised, // Total raised across all campaigns
            },
        });

    } catch (error) {
        console.error("Error fetching fundraiser wallet:", error);
        return res.status(500).json({
            statusCode: false,
            statusText: "Internal Server Error",
            message: error.message,
        });
    }
};

/**
 * @description Fundraiser: Request a payout from the available balance.
 * @route POST /api/fundraiser/wallet/request-payout
 * @access Private (Fundraiser only)
 */
exports.requestPayout = async function (req, res) {
    try {
        const fundraiserId = req.user.id;
        const amountStr = req.body.amount;
        const campaignId = req.body.campaignId || null; // Optional: specify which campaign the payout is linked to

        if (!fundraiserId) {
            return res.status(401).json({
                statusCode: false,
                statusText: "Unauthorized",
                message: "Fundraiser ID is required.",
            });
        }

        const amount = Number(amountStr);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                statusCode: false,
                statusText: "Bad Request",
                message: "Amount must be a positive number.",
            });
        }
        
        // 1. Fetch Wallet and Check Balance
        const wallet = await FundraiserWallet.findOne({ fundraiser: fundraiserId });

        if (!wallet) {
            return res.status(404).json({
                statusCode: false,
                statusText: "Not Found",
                message: "Wallet not found. Please contact support.",
            });
        }

        // Ensure the requested amount does not exceed the available balance
        if (wallet.availableBalance < amount) {
            return res.status(400).json({
                statusCode: false,
                statusText: "Bad Request",
                message: `Insufficient balance. Available: ${wallet.availableBalance}, Requested: ${amount}.`,
            });
        }

        // 2. Check for Payout Restriction (Milestone Logic)
        // CRITICAL: We only allow payout requests for funds tied to completed milestones
        // NOTE: This logic assumes that only funds tied to approved milestones are moved into the 'availableBalance'
        // If the 'availableBalance' already only contains approved funds, this check is redundant but good for safety.

        // We will assume a simple rule for now: the available balance is funds tied to approved milestones, 
        // AND the Fundraiser can ONLY request a payout if they have NO pending requests.
        
        const pendingPayouts = await Payout.countDocuments({ 
            fundraiser: fundraiserId, 
            status: { $in: ['requested', 'processing'] } 
        });

        if (pendingPayouts > 0) {
            return res.status(403).json({
                statusCode: false,
                statusText: "Forbidden",
                message: "You have a pending payout request. Please wait for the admin to approve the current one.",
            });
        }
        
        // 3. Create Payout Request Record
        const payoutReference = "PREQ_" + uuidv4();

        const payout = new Payout({
            fundraiser: fundraiserId,
            referenceID: payoutReference,
            campaign: campaignId,
            amount: amount,
            status: "requested", // Fundraiser requests, Admin approves
            requestedAt: new Date(),
        });

        await payout.save();

        // 4. Temporarily "Reserve" the amount by moving it from availableBalance to pendingPayout
        // This prevents the user from requesting the same funds twice.
        wallet.availableBalance -= amount;
        // Optionally, add a 'pendingPayout' field to the wallet model for tracking. 
        // For now, we rely on the Payout model's 'requested' status.
        await wallet.save();


        return res.status(201).json({
            statusCode: true,
            statusText: "Created",
            message: "Payout request successfully submitted to Admin for review.",
            data: {
                payout: payout,
                newAvailableBalance: wallet.availableBalance,
            },
        });

    } catch (error) {
        console.error("Error submitting payout request:", error);
        return res.status(500).json({
            statusCode: false,
            statusText: "Internal Server Error",
            message: error.message,
        });
    }
};

/**
 * @description Fundraiser: Get list of their payout requests/history.
 * @route GET /api/fundraiser/payout-history
 * @access Private (Fundraiser only)
 */
exports.getPayoutHistory = async function (req, res) {
    try {
        const fundraiserId = req.user.id;
        
        if (!fundraiserId) {
            return res.status(401).json({
                statusCode: false,
                statusText: "Unauthorized",
                message: "Fundraiser ID is required.",
            });
        }

        const history = await Payout.find({ fundraiser: fundraiserId })
            .populate('campaign', 'campaignTitle')
            .sort({ requestedAt: -1 });

        return res.status(200).json({
            statusCode: true,
            statusText: "OK",
            message: "Payout history retrieved successfully.",
            data: history,
        });
    } catch (error) {
        console.error("Error fetching payout history:", error);
        return res.status(500).json({
            statusCode: false,
            statusText: "Internal Server Error",
            message: error.message,
        });
    }
};
