const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServicePartner',
    default: null
  },
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  basePrice: {
    type: Number,
    required: true
  },
  estimatedDurationMins: {
    type: Number,
    required: true
  },
  inclusions: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  imagePublicId: { type: String, default: null },
  rating: {
    type: Number,
    default: 4.5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  isFeatured:   { type: Boolean, default: false },
  isPopular:    { type: Boolean, default: false },
  isMostBooked: { type: Boolean, default: false },
  trending:     { type: Boolean, default: false },
  newArrival:   { type: Boolean, default: false },
  totalBookings: { type: Number, default: 0 },
  bannerImageUrl: { type: String, default: null },
  whatsNotIncluded: [{ type: String }],
  processSteps: [{
    title: { type: String, required: true },
    desc: { type: String, required: true }
  }],
  safetyMeasures: [{ type: String }],
  warrantyInfo: { type: String, default: "" },
  faqs: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  relatedServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  recommendedServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  addons: [{
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
  }],
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  seoKeywords: { type: String, default: "" },
  displayOrder: { type: Number, default: 0 },
  createdByPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServicePartner', default: null },
  approvalStatus: { type: String, enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
  rejectionReason: { type: String, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  approvedAt: { type: Date, default: null },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
  isDeleted: { type: Boolean, default: false },
  serviceImages: [{ type: String }],
  beforeImages: [{ type: String }],
  afterImages: [{ type: String }]
}, { timestamps: true });

// Auto-generate slug from name if not provided
serviceSchema.pre('validate', function(next) {
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

module.exports = mongoose.model('Service', serviceSchema);
