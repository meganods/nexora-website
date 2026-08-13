const asyncHandler = require('../utils/asyncHandler');
const Coupon = require('../models/Coupon');
const Banner = require('../models/Banner');
const Offer = require('../models/Offer');
const SaleCampaign = require('../models/SaleCampaign');
const Booking = require('../models/Booking');
const Package = require('../models/Package');

// ─── Coupon Validation (Backend-Enforced) ─────────────────────────────────────

// @desc    Validate a coupon code for a given order
// @route   POST /api/promotions/validate-coupon
// @access  Private (user)
const validateCoupon = asyncHandler(async (req, res) => {
  const code = req.body.code || req.body.couponCode;
  const orderAmount = req.body.orderAmount !== undefined ? req.body.orderAmount : req.body.cartAmount;
  const { serviceId, packageId } = req.body;
  const userId = req.user._id || req.user.id;

  if (!code || orderAmount === undefined || orderAmount === null) {
    return res.status(400).json({ success: false, message: 'Coupon code and order amount are required.' });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
  }

  const now = new Date();

  // Date validity
  if (coupon.startDate && coupon.startDate > now) {
    return res.status(400).json({ success: false, message: 'This coupon is not yet active.' });
  }
  if (coupon.endDate && coupon.endDate < now) {
    return res.status(400).json({ success: false, message: 'This coupon has expired.' });
  }

  // Min order value
  if (orderAmount < coupon.minOrderValue) {
    return res.status(400).json({
      success: false,
      message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`
    });
  }

  // Global usage limit
  if (coupon.usageLimit !== null && coupon.totalUsed >= coupon.usageLimit) {
    return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });
  }

  // Per-user usage limit
  const userUsageCount = coupon.usageLogs.filter(log => log.userId?.toString() === userId.toString()).length;
  if (userUsageCount >= coupon.perUserLimit) {
    return res.status(400).json({ success: false, message: `You have already used this coupon ${coupon.perUserLimit} time(s).` });
  }

  // First-time user check
  if (coupon.isFirstTimeOnly) {
    const previousBookings = await Booking.countDocuments({
      customerId: userId,
      status: { $in: ['COMPLETED', 'REQUESTED', 'ASSIGNED', 'IN_PROGRESS'] }
    });
    if (previousBookings > 0) {
      return res.status(400).json({ success: false, message: 'This coupon is valid for first-time customers only.' });
    }
  }

  // Scope restrictions
  if (coupon.applicableServices?.length > 0 && serviceId) {
    const appliesToService = coupon.applicableServices.some(id => id.toString() === serviceId);
    if (!appliesToService) {
      return res.status(400).json({ success: false, message: 'This coupon is not applicable to the selected service.' });
    }
  }

  if (coupon.applicablePackages?.length > 0 && packageId) {
    const appliesToPackage = coupon.applicablePackages.some(id => id.toString() === packageId);
    if (!appliesToPackage) {
      return res.status(400).json({ success: false, message: 'This coupon is not applicable to the selected package.' });
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = Math.round(orderAmount * coupon.discountValue / 100);
    if (coupon.maxDiscountAmount !== null) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, orderAmount);
  }

  const finalAmount = Math.max(0, orderAmount - discountAmount);

  res.json({
    success: true,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
    },
    discountAmount,
    finalAmount,
    message: `Coupon applied! ₹${discountAmount} off your order.`
  });
});

// @desc    Check first-time booking eligibility
// @route   GET /api/promotions/first-time-eligible
// @access  Private (user)
const checkFirstTimeEligibility = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const count = await Booking.countDocuments({
    customerId: userId,
    status: { $in: ['COMPLETED', 'REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_PAYMENT'] }
  });
  res.json({ success: true, isFirstTimeCustomer: count === 0 });
});

// ─── Admin: Coupon CRUD ────────────────────────────────────────────────────────

const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

const addCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  res.json({ success: true, coupon });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  res.json({ success: true, message: 'Coupon deleted' });
});

// ─── Admin: Banner CRUD ────────────────────────────────────────────────────────

const listBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
  res.json({ success: true, banners });
});

const addBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  if (banner.isActive) {
    await Banner.updateMany(
      { position: banner.position || 'CAROUSEL', _id: { $ne: banner._id } },
      { $set: { isActive: false } }
    );
  }
  res.status(201).json({ success: true, banner });
});

const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
  if (banner.isActive) {
    await Banner.updateMany(
      { position: banner.position || 'CAROUSEL', _id: { $ne: banner._id } },
      { $set: { isActive: false } }
    );
  }
  res.json({ success: true, banner });
});

const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
  res.json({ success: true, message: 'Banner deleted' });
});

// Public: active banners only (within date range)
const getActiveBanners = asyncHandler(async (req, res) => {
  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    $or: [
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: null }, // never expires
    ]
  }).sort({ displayOrder: 1 });
  res.json({ success: true, banners });
});

// ─── Admin: Offer CRUD ─────────────────────────────────────────────────────────

const listOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find()
    .populate('applicableCategories', 'name')
    .populate('applicableServices', 'name')
    .populate('vendorId', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, offers });
});

const addOffer = asyncHandler(async (req, res) => {
  // Admin-created offers are auto-approved
  const offer = await Offer.create({ ...req.body, source: 'ADMIN', approvalStatus: 'APPROVED' });
  res.status(201).json({ success: true, offer });
});

const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
  res.json({ success: true, offer });
});

const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);
  if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
  res.json({ success: true, message: 'Offer deleted' });
});

// Admin: approve/reject vendor offer
const reviewVendorOffer = asyncHandler(async (req, res) => {
  const { action, approvalStatus, rejectionReason } = req.body;
  const offer = await Offer.findById(req.params.id);
  if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

  const isApprove = action === 'approve' || approvalStatus === 'APPROVED';
  const isReject = action === 'reject' || approvalStatus === 'REJECTED';

  if (!isApprove && !isReject) {
    return res.status(400).json({ success: false, message: 'Action must be approve/APPROVED or reject/REJECTED' });
  }

  offer.approvalStatus = isApprove ? 'APPROVED' : 'REJECTED';
  offer.isActive = isApprove ? true : false;
  offer.approvedBy = req.user._id;
  offer.approvedAt = isApprove ? new Date() : null;
  offer.rejectionReason = isReject ? (rejectionReason || 'Rejected by admin') : null;
  await offer.save();
  res.json({ success: true, offer });
});

// Public: active approved offers within date range
const getActiveOffers = asyncHandler(async (req, res) => {
  const now = new Date();
  const offers = await Offer.find({
    isActive: true,
    approvalStatus: 'APPROVED',
    $or: [
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: null },
    ]
  }).populate('applicableCategories', 'name slug').populate('applicableServices', 'name slug');
  res.json({ success: true, offers });
});

// ─── Admin: SaleCampaign CRUD ─────────────────────────────────────────────────

const listSaleCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await SaleCampaign.find().sort({ startDate: -1 });
  res.json({ success: true, campaigns });
});

const addSaleCampaign = asyncHandler(async (req, res) => {
  const campaign = await SaleCampaign.create(req.body);
  res.status(201).json({ success: true, campaign });
});

const updateSaleCampaign = asyncHandler(async (req, res) => {
  const campaign = await SaleCampaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  res.json({ success: true, campaign });
});

const deleteSaleCampaign = asyncHandler(async (req, res) => {
  const campaign = await SaleCampaign.findByIdAndDelete(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  res.json({ success: true, message: 'Campaign deleted' });
});

// Public: active running campaigns (backend enforced, NOT frontend date math)
const getActiveCampaigns = asyncHandler(async (req, res) => {
  const now = new Date();
  const campaigns = await SaleCampaign.find({
    isActive: true,
    startDate: { $lte: now },
    endDate:   { $gte: now },
  }).populate('applicableCategories', 'name slug').populate('applicableServices', 'name slug');
  res.json({ success: true, campaigns });
});

// Admin: approve/reject vendor coupon
const reviewVendorCoupon = asyncHandler(async (req, res) => {
  const { action, approvalStatus, rejectionReason } = req.body;
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

  const isApprove = action === 'approve' || approvalStatus === 'APPROVED';
  const isReject = action === 'reject' || approvalStatus === 'REJECTED';

  if (!isApprove && !isReject) {
    return res.status(400).json({ success: false, message: 'Action must be approve/APPROVED or reject/REJECTED' });
  }

  coupon.approvalStatus = isApprove ? 'APPROVED' : 'REJECTED';
  coupon.isActive = isApprove ? true : false;
  coupon.rejectionReason = isReject ? (rejectionReason || 'Rejected by admin') : null;
  await coupon.save();
  res.json({ success: true, coupon });
});

module.exports = {
  validateCoupon,
  checkFirstTimeEligibility,
  // Coupon
  listCoupons,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  reviewVendorCoupon,
  // Banner
  listBanners,
  addBanner,
  updateBanner,
  deleteBanner,
  getActiveBanners,
  // Offer
  listOffers,
  addOffer,
  updateOffer,
  deleteOffer,
  reviewVendorOffer,
  getActiveOffers,
  // SaleCampaign
  listSaleCampaigns,
  addSaleCampaign,
  updateSaleCampaign,
  deleteSaleCampaign,
  getActiveCampaigns,
};
