const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  icon: String,
  imageUrl: { type: String, default: null },
  imagePublicId: { type: String, default: null },
  displayOrder: { type: Number, default: 0 },
  isActive: {
    type: Boolean,
    default: true
  },
  platformFeePercentage: {
    type: Number,
    default: 10
  }
}, { timestamps: true });

// Auto-generate slug from name if not provided
categorySchema.pre('validate', function(next) {
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

module.exports = mongoose.model('Category', categorySchema);

