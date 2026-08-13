const mongoose = require('mongoose');

const saleCampaignSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  imageUrl:    { type: String, default: null },
  imagePublicId: { type: String, default: null },

  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },

  // Scope (empty = applies to all active services)
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableServices:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],

  // Validity — backend enforces by comparing Date.now()
  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

// Virtual: is the campaign currently running?
saleCampaignSchema.virtual('isRunning').get(function () {
  const now = Date.now();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

module.exports = mongoose.model('SaleCampaign', saleCampaignSchema);
