const express = require('express');
const {
  validateCoupon,
  checkFirstTimeEligibility,
} = require('../controllers/promotionController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Coupon validation — backend-enforced, user must be authenticated
router.post('/validate-coupon', protect, validateCoupon);

// First-time customer check
router.get('/first-time-eligible', protect, checkFirstTimeEligibility);

module.exports = router;
