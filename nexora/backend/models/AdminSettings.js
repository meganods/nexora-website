const mongoose = require('mongoose');

/**
 * AdminSettings — singleton document (only one record ever exists).
 * Stores configurable weights for the auto-assignment engine and
 * platform fee / commission bounds.
 */
const adminSettingsSchema = new mongoose.Schema(
  {
    // ─── Assignment Engine Weights (must sum to 100) ───────────────────────
    weights: {
      categoryMatch: { type: Number, default: 30, min: 0, max: 100 }, // exact category = full score
      location: { type: Number, default: 25, min: 0, max: 100 }, // inverse distance score
      availability: { type: Number, default: 20, min: 0, max: 100 }, // isOnline == true
      workload: { type: Number, default: 15, min: 0, max: 100 }, // fewer active bookings = higher
      rating: { type: Number, default: 10, min: 0, max: 100 }, // avgRating (future-proof)
    },

    // ─── Geo Search Radius ─────────────────────────────────────────────────
    maxRadiusKm: { type: Number, default: 20, min: 1, max: 200 }, // search radius in km

    // ─── Platform Fee (charged to customer) ───────────────────────────────
    platformFee: {
      minRupees: { type: Number, default: 10, min: 0 },
      maxRupees: { type: Number, default: 20, min: 0 },
    },

    // ─── Partner Commission (deducted from partner payout) ────────────────
    partnerCommission: {
      minPercent: { type: Number, default: 10, min: 0, max: 100 },
      maxPercent: { type: Number, default: 15, min: 0, max: 100 },
    },

    // ─── Auto-assignment toggle ────────────────────────────────────────────
    autoAssignEnabled: { type: Boolean, default: false },

    // ─── Promo/Coupon Configuration ────────────────────────────────────────
    promoCode: { type: String, default: 'NEXORA10' },
    promoText: { type: String, default: 'ONLINE BOOKING 10% OFF' },
  },
  { timestamps: true }
);

/**
 * Singleton helper: always read/write the single settings document.
 */
adminSettingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
