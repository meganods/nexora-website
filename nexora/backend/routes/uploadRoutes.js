const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middlewares/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// @desc    Generate a signed upload signature for direct uploads
// @route   POST /api/public/upload-signature
// @access  Private (Any authenticated user / vendor)
router.post('/upload-signature', protect, async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'nexora-website';
    const upload_preset = process.env.CLOUDINARY_UPLOAD_PRESET || 'nexora-website';

    const paramsToSign = {
      timestamp,
      folder,
      upload_preset
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      success: true,
      signature,
      timestamp,
      folder,
      upload_preset,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error('Failed to generate upload signature:', error);
    res.status(500).json({ success: false, message: 'Failed to generate upload signature' });
  }
});

module.exports = router;
