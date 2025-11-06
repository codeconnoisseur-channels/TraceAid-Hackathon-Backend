const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getFundraiserWallet, requestPayout, getPayoutHistory } = require('../controller/fundraiserWalletController');

// Fundraiser self-service wallet endpoints
router.get('/summary', authenticate, getFundraiserWallet);
router.post('/request-payout', authenticate, requestPayout);
router.get('/payout-history', authenticate, getPayoutHistory);

module.exports = router;
