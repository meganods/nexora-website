const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: { type: String, default: '' },

  // Discount type and value
  discountType: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  maxDiscountAmount: {
    type: Number,
    default: null, // null = no cap
  },
  minOrderValue: {
    type: Number,
    default: 0,
  },

  // Validity window
  startDate: { type: Date, default: Date.now },
  endDate:   { type: Date, default: null }, // null = never expires

  // Usage limits
  usageLimit:    { type: Number, default: null }, // null = unlimited
  perUserLimit:  { type: Number, default: 1 },
  totalUsed:     { type: Number, default: 0 },

  // Scope restrictions (empty = applies to all)
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableServices:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  applicablePackages:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Package' }],

  // Eligibility rules
  isFirstTimeOnly: { type: Boolean, default: false },
  isActive:        { type: Boolean, default: true },

  // Usage log (per-user tracking)
  usageLogs: [{
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt:  { type: Date, default: Date.now },
    orderId: String,
  }],

  // Vendor promotion support
  vendorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'ServicePartner', default: null },
  approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
  rejectionReason: { type: String, default: null },

}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
