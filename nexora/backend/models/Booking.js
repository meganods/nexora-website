const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServicePartner',
    default: null // null until accepted by a vendor
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: false, // optional when it's a package booking
    default: null,
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    default: null,
  },
  isPackageBooking: { type: Boolean, default: false },

  // Coupon applied at checkout (backend-validated)
  couponCode:     { type: String, default: null },
  discountAmount: { type: Number, default: 0 },

  // Cancellation
  cancelledBy:  { type: String, enum: ['CUSTOMER', 'VENDOR', 'ADMIN'], default: null },
  cancelReason: { type: String, default: null },

  // Review (after completion)
  review: {
    rating:    { type: Number, min: 1, max: 5, default: null },
    comment:   { type: String, default: null },
    createdAt: { type: Date, default: null },
  },

  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  countryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    default: null
  },
  stateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    default: null
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    default: null
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    default: null
  },
  pincodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pincode',
    default: null
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledSlot: {
    type: String, // 'Morning', 'Afternoon', 'Evening'
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING_PAYMENT', 'REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING_PAYMENT'
  },
  paymentDetails: {
    cashfreeOrderId: String,
    cashfreePaymentSessionId: String,
    amount: Number,
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING'
    }
  },
  otp: {
    type: String, // 4-digit OTP for start-job verification
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  customerPlatformFee: {
    type: Number,
    default: 0
  },
  beforePhotoUrl: {
    type: String,
    default: null
  },
  afterPhotoUrl: {
    type: String,
    default: null
  },
  rejectionLog: [{
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServicePartner' },
    reason: String,
    rejectedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
