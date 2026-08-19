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

// @desc    Handle Cashfree DigiLocker Webhook
// @route   POST /api/webhooks/cashfree/digilocker
// @access  Public
router.post('/cashfree/digilocker', async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    
    // 1. Check for required headers and raw body
    if (!signature || !timestamp || !req.rawBody) {
      console.warn('DigiLocker Webhook: Missing signature, timestamp, or rawBody');
      return res.status(401).json({ success: false, message: 'Missing required webhook headers or body' });
    }

    // 2. Validate Signature
    const signedPayload = timestamp + req.rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
      .update(signedPayload)
      .digest('base64');
      
    // Use timing-safe equal to prevent timing attacks, handle length mismatches safely
    const sigBuffer = Buffer.from(signature);
    const expectedSigBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
      console.warn('DigiLocker Webhook: Invalid signature');
      return res.status(403).json({ success: false, message: 'Invalid signature' });
    }

    const { type, data } = req.body;
    
    if (type === 'DIGILOCKER_VERIFICATION_SUCCESS') {
      const verification_id = data?.verification_id;
      if (!verification_id) return res.status(400).json({ success: false, message: 'Missing verification_id' });
      
      // 3. Extract vendorId
      const parts = verification_id.split('_');
      if (parts.length < 3) return res.status(400).json({ success: false, message: 'Invalid verification format' });
      const vendorId = parts[1];
      
      const vendor = await ServicePartner.findById(vendorId);
      if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
      
      // 4. Session Binding Enforced
      if (vendor.kycDetails?.aadharRefId !== verification_id) {
        // Idempotency: If already verified and we receive duplicate webhook for the *same* or old session, just return 200 safely
        if (vendor.kycDetails?.aadharVerified) {
          return res.status(200).json({ success: true, message: 'Vendor already verified (Idempotent)' });
        }
        // If not verified, but the session doesn't match, reject it.
        console.warn(`DigiLocker Webhook: Session mismatch. Expected ${vendor.kycDetails?.aadharRefId}, got ${verification_id}`);
        return res.status(403).json({ success: false, message: 'Invalid verification session for this vendor' });
      }

      // 5. Cashfree Source of Truth
      const axios = require('axios');
      const getCfBaseUrl = () => process.env.CASHFREE_ENV === 'PRODUCTION' ? 'https://api.cashfree.com/verification' : 'https://sandbox.cashfree.com/verification';
      
      // First, get the status to confirm Cashfree itself says it is SUCCESS
      const statusUrl = `${getCfBaseUrl()}/digilocker/${verification_id}`;
      const statusRes = await axios.get(statusUrl, {
        headers: {
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (statusRes.data.status !== "AUTHENTICATED" && statusRes.data.status !== "SUCCESS") {
         console.warn(`DigiLocker Webhook: Status not authenticated in Cashfree. Status: ${statusRes.data.status}`);
         return res.status(400).json({ success: false, message: 'Verification status is not authenticated' });
      }

      // Then get the document details
      const docUrl = `${getCfBaseUrl()}/digilocker/document/AADHAAR?verification_id=${verification_id}`;
      const docRes = await axios.get(docUrl, { 
        headers: {
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const docData = docRes.data.document_fields || {};

      vendor.kycDetails = vendor.kycDetails || {};
      vendor.kycDetails.aadharVerified = true;
      vendor.kycDetails.aadharName = docData.name || vendor.name;
      vendor.kycDetails.aadharDob = docData.dob || "";
      vendor.kycDetails.aadharNumber = docData.uid || vendor.kycDetails.aadharNumber || "";
      vendor.kycDetails.aadharRefId = undefined; // Clear the session
      
      await vendor.save();
    }

    res.status(200).json({ success: true, message: 'DigiLocker Webhook processed successfully' });
  } catch (error) {
    console.error('DigiLocker Webhook Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
