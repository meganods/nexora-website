const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  imageUrl: { type: String, default: null },
  imagePublicId: { type: String, default: null },

  // Pricing
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },

  estimatedDurationMins: {
    type: Number,
    default: 120,
  },

  // What's included
  includedServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  }],

  // Which categories this package belongs to (for filtering)
  categoryIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],

  // Visibility flags
  isActive:   { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

  // Sorting
  displayOrder: { type: Number, default: 0 },

  // Inclusions text (for display without populating services)
  inclusions: [{ type: String }],

}, { timestamps: true });

// Auto-generate slug from name if not provided
packageSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

// Virtual: effective price after discount
packageSchema.virtual('effectivePrice').get(function () {
  if (this.discountPercentage > 0) {
    return Math.round(this.basePrice * (1 - this.discountPercentage / 100));
  }
  return this.basePrice;
});

module.exports = mongoose.model('Package', packageSchema);
