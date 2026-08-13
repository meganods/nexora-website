const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Booking = require('../models/Booking');
const ServicePartner = require('../models/ServicePartner');
const AdminSettings = require('../models/AdminSettings');
const { findBestPartner } = require('../services/assignmentEngine');

// @desc    Handle Cashfree Webhook Confirmation
// @route   POST /api/webhooks/cashfree
// @access  Public
router.post('/cashfree', async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    
    // In production, verify signature:
    // const body = timestamp + req.rawBody;
    // const expectedSignature = crypto.createHmac('sha256', process.env.CASHFREE_CLIENT_SECRET).update(body).digest('base64');
    // if (signature !== expectedSignature) return res.status(400).send('Invalid signature');

    const { data } = req.body;
    if (!data || !data.order || !data.payment) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload structure' });
    }

    const orderId = data.order.order_id;
    const paymentStatus = data.payment.payment_status;

    if (paymentStatus === 'SUCCESS') {
      const booking = await Booking.findOne({ 'paymentDetails.cashfreeOrderId': orderId })
        .populate('serviceId')
        .populate('packageId');
      if (booking && booking.paymentDetails.status !== 'PAID') {
        booking.paymentDetails.status = 'PAID';
        booking.status = 'REQUESTED';
        await booking.save();

        // Check if Auto-Assign is enabled globally
        const settings = await AdminSettings.getSingleton();
        if (settings.autoAssignEnabled) {
          const best = await findBestPartner(booking);
          if (best) {
            booking.vendorId = best.partner._id;
            booking.status = 'ASSIGNED';
            await booking.save();
          }
        }
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
