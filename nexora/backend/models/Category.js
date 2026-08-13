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
  },
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  seoKeywords: { type: String, default: "" },
  popular: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  bannerImageUrl: { type: String, default: null },
  totalBookings: { type: Number, default: 0 },
  whyChoose: [{
    title: { type: String, required: true },
    desc: { type: String, required: true }
  }],
  benefits: [{
    title: { type: String, required: true },
    desc: { type: String, required: true }
  }],
  howItWorks: [{
    title: { type: String, required: true },
    desc: { type: String, required: true }
  }],
  beforeAfterGallery: [{
    beforeUrl: { type: String, required: true },
    afterUrl: { type: String, required: true }
  }],
  faqs: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }]
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

