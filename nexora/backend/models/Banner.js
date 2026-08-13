const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  subtitle: { type: String, default: '' },

  // Images (desktop + mobile)
  imageUrl:         { type: String, default: null },
  imagePublicId:    { type: String, default: null },
  mobileImageUrl:   { type: String, default: null },
  mobilePublicId:   { type: String, default: null },

  // CTA
  ctaText:  { type: String, default: 'Book Now' },
  ctaRoute: { type: String, default: '/services' },

  // Promo code displayed on banner (optional)
  promoCode:  { type: String, default: null },
  promoLabel: { type: String, default: null },

  // Styling
  gradient:  { type: String, default: 'from-[#0F3D30] to-[#1D6B50]' },
  badgeText: { type: String, default: '' },

  // Validity window
  startDate: { type: Date, default: Date.now },
  endDate:   { type: Date, default: null }, // null = never expires

  isActive:     { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  position:     { type: String, enum: ['CAROUSEL', 'PROMO_CARD'], default: 'CAROUSEL' },

}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
