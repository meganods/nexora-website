const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  slug:        { type: String, unique: true, trim: true },
  description: { type: String, default: '' },
  imageUrl:    { type: String, default: null },
  imagePublicId: { type: String, default: null },

  // What is this deal for?
  dealType: {
    type: String,
    enum: ['SERVICE', 'PACKAGE'],
    required: true,
    default: 'SERVICE',
  },
  serviceId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Service',  default: null },
  serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  packageId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Package',  default: null },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  city:       { type: String, default: null },

  // Pricing (backend-computed, frontend value is NEVER trusted)
  originalPrice: { type: Number, required: true, min: 0 },
  discountType:  { type: String, enum: ['PERCENTAGE', 'FIXED'], default: 'PERCENTAGE' },
  discountValue: { type: Number, required: true, min: 0 },
  finalPrice:    { type: Number, required: true, min: 0 },   // always server-computed

  // Validity window
  startDate: { type: Date, default: Date.now },
  endDate:   { type: Date, default: null },

  // Sorting / display
  displayOrder: { type: Number, default: 0 },
  isFeatured:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },

  // Who created
  createdBy:     { type: mongoose.Schema.Types.ObjectId, default: null },
  createdByRole: { type: String, enum: ['admin', 'super_admin', 'vendor'], default: 'admin' },

  // Vendor deal support
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServicePartner', default: null },

  // Admin approval workflow
  requiresAdminApproval: { type: Boolean, default: false },
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'APPROVED',
  },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  approvedAt:      { type: Date, default: null },
  rejectionReason: { type: String, default: null },

  termsAndConditions: { type: String, default: '' },

}, { timestamps: true });

// ─── Auto-generate slug from title ──────────────────────────────────────────
dealSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

// ─── MongoDB indexes ─────────────────────────────────────────────────────────

dealSchema.index({ isActive: 1 });
dealSchema.index({ approvalStatus: 1 });
dealSchema.index({ startDate: 1 });
dealSchema.index({ endDate: 1 });
dealSchema.index({ categoryId: 1 });
dealSchema.index({ serviceId: 1 });
dealSchema.index({ packageId: 1 });
dealSchema.index({ isFeatured: 1, displayOrder: 1 });

module.exports = mongoose.model('Deal', dealSchema);
