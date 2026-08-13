const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  imageUrl:    { type: String, default: null },
  imagePublicId: { type: String, default: null },

  // Discount
  discountType:  { type: String, enum: ['PERCENTAGE', 'FIXED'], default: 'PERCENTAGE' },
  discountValue: { type: Number, required: true, min: 0 },

  // Scope
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableServices:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],

  // Validity
  startDate: { type: Date, default: Date.now },
  endDate:   { type: Date, default: null },

  isActive:   { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

  // Source: admin = platform offer, vendor = vendor-specific offer
  source:          { type: String, enum: ['ADMIN', 'VENDOR'], default: 'ADMIN' },
  vendorId:        { type: mongoose.Schema.Types.ObjectId, ref: 'ServicePartner', default: null },
  requiresAdminApproval: { type: Boolean, default: false },
  approvalStatus:  { type: String, enum: ['APPROVED', 'PENDING', 'REJECTED'], default: 'APPROVED' },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  approvedAt:      { type: Date, default: null },
  rejectionReason: { type: String, default: null },

}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
