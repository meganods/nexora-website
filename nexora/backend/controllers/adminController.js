const Admin = require("../models/Admin");
const User = require("../models/User");
const ServicePartner = require("../models/ServicePartner");
const AdminSettings = require("../models/AdminSettings");
const Review = require("../models/Review");
const SupportTicket = require("../models/SupportTicket");
const Payout = require("../models/Payout");
const { createNotification } = require("./notificationController");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");
const { findBestPartner, runBatchAutoAssign } = require("../services/assignmentEngine");

// @desc    Admin login with email & password
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");

  if (!admin || !admin.isActive) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials.",
    });
  }

  const isMatch = await admin.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials.",
    });
  }

  const token = generateToken({ id: admin._id, role: admin.role });

  res.status(200).json({
    success: true,
    message: "Login successful.",
    token,
    admin: admin.toJSON(),
  });
});

// @desc    List all vendors
// @route   GET /api/admin/vendors
// @access  Private (admin roles)
const listVendors = asyncHandler(async (req, res) => {
  const { kycStatus, category, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (kycStatus && kycStatus !== 'ALL') {
    filter.kycStatus = kycStatus;
  } else {
    filter.kycStatus = { $nin: ["NOT_STARTED", "REGISTERED", "KYC_NOT_STARTED", "KYC_IN_PROGRESS"] };
  }
  if (category) filter.category = category;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [vendors, total] = await Promise.all([
    ServicePartner.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ServicePartner.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: vendors.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    vendors,
  });
});

// @desc    List all users
// @route   GET /api/admin/users
// @access  Private (admin roles)
const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    users,
  });
});

// @desc    Verify or reject vendor KYC
// @route   PATCH /api/admin/vendors/:id/verify
// @access  Private (super_admin, admin)
const verifyVendorKyc = asyncHandler(async (req, res) => {
  const { action, reviewNote } = req.body;

  if (!["verify", "reject"].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "action must be 'verify' or 'reject'.",
    });
  }

  const vendor = await ServicePartner.findById(req.params.id);

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: "Vendor not found.",
    });
  }

  if (vendor.kycStatus !== "PENDING_ADMIN_APPROVAL") {
    return res.status(400).json({
      success: false,
      message: `Cannot review KYC with status '${vendor.kycStatus}'. Expected 'PENDING_ADMIN_APPROVAL'.`,
    });
  }

  vendor.kycStatus = action === "verify" ? "APPROVED" : "REJECTED";
  vendor.kycDetails = vendor.kycDetails || {};
  vendor.kycDetails.reviewedAt = new Date();
  vendor.kycDetails.reviewNote = reviewNote || "";

  if (action === "reject") {
    vendor.isOnline = false;
    vendor.rejectionReason = reviewNote || "Your application requires correction. Please review and resubmit.";
  } else {
    vendor.rejectionReason = null; // Clear on approval
  }

  await vendor.save();

  const { createNotification } = require('./notificationController');
  await createNotification(
    vendor._id,
    "vendor",
    action === "verify" ? "KYC Approved!" : "KYC Rejected",
    action === "verify" 
      ? "Congratulations! Your profile has been approved. You are now active on Nexora." 
      : `Your KYC profile has been rejected. Reason: ${reviewNote || "Information mismatch."}`,
    "approval",
    { vendorId: vendor._id }
  );

  res.status(200).json({
    success: true,
    message: `Vendor KYC ${action === "verify" ? "verified" : "rejected"} successfully.`,
    vendor,
  });
});

const Category = require("../models/Category");
const Service = require("../models/Service");
const Booking = require("../models/Booking");

// @desc    Get dashboard metrics
// @route   GET /api/admin/metrics
// @access  Private (admin roles)
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const Country = require('../models/Country');
  const State = require('../models/State');
  const City = require('../models/City');
  const Area = require('../models/Area');
  const Pincode = require('../models/Pincode');
  const Notification = require('../models/Notification');
  const Payout = require('../models/Payout');

  const [
    totalRevenueAggr,
    activeBookings,
    completedBookings,
    cancelledBookings,
    pendingPaymentBookings,
    verifiedVendors,
    totalPartners,
    pendingApprovals,
    totalUsers,
    totalServices,
    totalBookings,
    totalCountries,
    totalStates,
    totalCities,
    totalAreas,
    totalPincodes,
    activeLocationsCount
  ] = await Promise.all([
    Booking.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, totalRevenue: { $sum: "$paymentDetails.amount" }, totalCommission: { $sum: "$commissionAmount" } } }
    ]),
    Booking.countDocuments({ status: { $in: ['REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS'] } }),
    Booking.countDocuments({ status: 'COMPLETED' }),
    Booking.countDocuments({ status: 'CANCELLED' }),
    Booking.countDocuments({ status: 'PENDING_PAYMENT' }),
    ServicePartner.countDocuments({ kycStatus: 'APPROVED' }),
    ServicePartner.countDocuments(),
    ServicePartner.countDocuments({ kycStatus: 'PENDING_ADMIN_APPROVAL' }),
    User.countDocuments({ isActive: true }),
    Service.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Country.countDocuments({ isDeleted: false }),
    State.countDocuments({ isDeleted: false }),
    City.countDocuments({ isDeleted: false }),
    Area.countDocuments({ isDeleted: false }),
    Pincode.countDocuments({ isDeleted: false }),
    City.countDocuments({ isActive: true, isDeleted: false })
  ]);

  const revenueData = totalRevenueAggr[0] || { totalRevenue: 0, totalCommission: 0 };

  // Aggregate stats by city
  let partnersByCity = [];
  let bookingsByCity = [];
  let revenueByCity = [];

  if (totalCities > 0) {
    partnersByCity = await ServicePartner.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$location.city", count: { $sum: 1 } } }
    ]);

    bookingsByCity = await Booking.aggregate([
      { $group: { _id: "$address.city", count: { $sum: 1 } } }
    ]);

    revenueByCity = await Booking.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: "$address.city", total: { $sum: "$paymentDetails.amount" } } }
    ]);
  }

  // Query lists for the Dashboard Overview
  const [
    recentBookings,
    topPartnersList,
    recentActivity,
    recentPayouts,
    totalPayoutsAggr,
    pendingPayoutsAggr
  ] = await Promise.all([
    Booking.find().sort({ createdAt: -1 }).limit(5).populate('customerId', 'name').populate('serviceId', 'name'),
    ServicePartner.find({ kycStatus: 'APPROVED' }).sort({ rating: -1, totalBookings: -1 }).limit(4),
    Notification.find({ recipientType: 'admin' }).sort({ createdAt: -1 }).limit(5),
    Payout.find().sort({ createdAt: -1 }).limit(4).populate('vendorId', 'businessName'),
    Payout.aggregate([{ $match: { status: 'COMPLETED' } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payout.aggregate([{ $match: { status: 'PENDING' } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
  ]);

  const walletPayoutOverview = {
    totalPayouts: totalPayoutsAggr[0]?.total || 0,
    pendingPayouts: pendingPayoutsAggr[0]?.total || 0,
    availableBalance: totalRevenueAggr[0]?.totalCommission || 0 // Proxy for platform earnings
  };

  // Real MongoDB Aggregations for top cities and areas
  const topCities = await Booking.aggregate([
    { $group: { _id: "$address.city", count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$paymentDetails.amount", 0] } } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { name: "$_id", count: 1, revenue: 1, _id: 0 } }
  ]);

  const topAreas = await Booking.aggregate([
    { $group: { _id: "$address.area", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { name: "$_id", count: 1, _id: 0 } }
  ]);

  // Real MongoDB aggregations for Chart Data (Last 30 Days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyBookingsAggr = await Booking.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$paymentDetails.amount", 0] } }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  const chartBookingData = dailyBookingsAggr.map(d => ({ label: d._id, value: d.count }));
  const chartRevenueData = dailyBookingsAggr.map(d => ({ label: d._id, value: d.revenue }));

  const categoryAggr = await Booking.aggregate([
    {
      $lookup: {
        from: 'services',
        localField: 'serviceId',
        foreignField: '_id',
        as: 'service'
      }
    },
    { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'service.categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$category.name", count: { $sum: 1 } } }
  ]);

  const colors = ['#0F3D30', '#C3AB84', '#3B82F6', '#8B5CF6', '#EC4899', '#9CA3AF'];
  let totalCatBookings = categoryAggr.reduce((acc, curr) => acc + curr.count, 0);
  const chartCategoryData = categoryAggr.map((cat, i) => ({
    name: cat._id || 'Uncategorized',
    percentage: totalCatBookings > 0 ? Math.round((cat.count / totalCatBookings) * 100) : 0,
    color: colors[i % colors.length]
  }));

  res.json({
    success: true,
    totalRevenue: revenueData.totalRevenue,
    totalCommission: revenueData.totalCommission,
    activeBookings,
    completedBookings,
    cancelledBookings,
    pendingPaymentBookings,
    verifiedVendors,
    totalPartners,
    pendingApprovals,
    totalUsers,
    totalServices,
    totalBookings,
    locationMetrics: {
      totalCountries: totalCountries || 0,
      totalStates: totalStates || 0,
      totalCities: totalCities || 0,
      totalAreas: totalAreas || 0,
      totalPincodes: totalPincodes || 0,
      activeLocations: activeLocationsCount || 0,
      partnersByCity,
      bookingsByCity,
      revenueByCity,
      topCities,
      topAreas
    },
    chartBookingData,
    chartRevenueData,
    chartCategoryData,
    recentBookings,
    topPartnersList,
    recentActivity,
    recentPayouts,
    walletPayoutOverview
  });
});

// @desc    Add a Category
// @route   POST /api/admin/categories
// @access  Private (admin)
const addCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category });
});

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private (admin)
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

// @desc    Get single category by ID
// @route   GET /api/admin/categories/:id
// @access  Private (admin)
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ success: true, category });
});

// @desc    Add a Service
// @route   POST /api/admin/services
// @access  Private (admin)
const addService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);

  const { broadcastToAll } = require('./notificationController');
  await broadcastToAll(
    "New Service Available!",
    `A new service "${service.name}" has been launched on Nexora! Check it out.`,
    "system",
    { serviceId: service._id }
  );

  res.status(201).json({ success: true, service });
});

// @desc    Get admin settings (singleton)
// @route   GET /api/admin/settings
// @access  Private (admin)
const getSettings = asyncHandler(async (req, res) => {
  const settings = await AdminSettings.getSingleton();
  res.json({ success: true, settings });
});

// @desc    Update admin settings weights / bounds
// @route   PUT /api/admin/settings
// @access  Private (super_admin, admin)
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await AdminSettings.getSingleton();
  const { weights, maxRadiusKm, platformFee, partnerCommission, autoAssignEnabled, promoCode, promoText } = req.body;

  if (weights) {
    const total = Object.values(weights).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({ success: false, message: `Weights must sum to 100. Current sum: ${total.toFixed(1)}` });
    }
    Object.assign(settings.weights, weights);
  }
  if (maxRadiusKm !== undefined) settings.maxRadiusKm = maxRadiusKm;
  if (platformFee)        Object.assign(settings.platformFee, platformFee);
  if (partnerCommission)  Object.assign(settings.partnerCommission, partnerCommission);
  if (autoAssignEnabled !== undefined) settings.autoAssignEnabled = autoAssignEnabled;
  if (promoCode !== undefined) settings.promoCode = promoCode;
  if (promoText !== undefined) settings.promoText = promoText;

  settings.markModified('weights');
  await settings.save();
  res.json({ success: true, settings });
});

// @desc    Trigger batch auto-assignment for all REQUESTED bookings
// @route   POST /api/admin/assign/run
// @access  Private (super_admin, admin)
const triggerBatchAssign = asyncHandler(async (req, res) => {
  const results = await runBatchAutoAssign();
  res.json({
    success: true,
    message: `Processed ${results.length} booking(s).`,
    results,
  });
});

// @desc    Manually assign best partner to a single booking
// @route   POST /api/admin/assign/:bookingId
// @access  Private (super_admin, admin)
const assignSingleBooking = asyncHandler(async (req, res) => {
  const Booking = require('../models/Booking');
  const ServicePartner = require('../models/ServicePartner');

  const booking = await Booking.findById(req.params.bookingId)
    .populate('serviceId')
    .populate('packageId');

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
    return res.status(400).json({ success: false, message: 'Cannot assign a completed or cancelled booking.' });
  }

  const oldVendorId = booking.vendorId;
  const vendorId = req.body.vendorId || req.body.partnerId;

  let assignedPartner = null;

  if (vendorId) {
    // Manual specific vendor assignment
    const partner = await ServicePartner.findById(vendorId);
    if (!partner) return res.status(404).json({ success: false, message: 'Vendor not found' });

    booking.vendorId = partner._id;
    booking.status = 'ASSIGNED';
    booking.tripLocation = {
      coordinates: null,
      address: 'New partner assigned',
      etaMins: null,
      lastUpdated: new Date()
    };
    await booking.save();
    assignedPartner = partner;
  } else {
    // Fallback to running auto-assign engine for this single booking
    const best = await findBestPartner(booking);
    if (!best) return res.status(404).json({ success: false, message: 'No eligible partner found near the booking location.' });

    booking.vendorId = best.partner._id;
    booking.status = 'ASSIGNED';
    booking.tripLocation = {
      coordinates: null,
      address: 'New partner assigned',
      etaMins: null,
      lastUpdated: new Date()
    };
    await booking.save();
    assignedPartner = best.partner;
  }

  // ── Send notifications for Assignment / Reassignment ──
  const isReassigned = oldVendorId && oldVendorId.toString() !== assignedPartner._id.toString();

  // 1. Notify Customer
  if (booking.customerId) {
    createNotification(
      booking.customerId, 'user',
      isReassigned ? 'Service Partner Reassigned 🔄' : 'Service Partner Assigned 💼',
      isReassigned 
        ? `Your service partner has been updated to ${assignedPartner.name}.` 
        : `Your service partner ${assignedPartner.name} has been assigned to your booking.`,
      'booking', { bookingId: booking._id }
    );
  }

  // 2. Notify Old Partner (if reassigned)
  if (isReassigned) {
    createNotification(
      oldVendorId, 'vendor',
      'Booking Cancelled ❌',
      `Your assignment for booking ID ${booking._id} has been cancelled.`,
      'system', { bookingId: booking._id }
    );
  }

  // 3. Notify New Partner
  createNotification(
    assignedPartner._id, 'vendor',
    'New Booking Assigned 💼',
    `You have been assigned a new booking (ID: ${booking._id}). Please check your job details.`,
    'booking', { bookingId: booking._id }
  );

  res.json({
    success: true,
    message: isReassigned 
      ? `Booking manually reassigned to ${assignedPartner.name}.` 
      : `Booking manually assigned to ${assignedPartner.name}.`,
    partner: { id: assignedPartner._id, name: assignedPartner.name, phone: assignedPartner.phone },
  });
});

// @desc    Preview top-5 candidates for a booking (dry-run, no DB write)
// @route   GET /api/admin/assign/:bookingId/preview
// @access  Private (admin)
const previewAssignment = asyncHandler(async (req, res) => {
  const Booking = require('../models/Booking');
  const booking = await Booking.findById(req.params.bookingId)
    .populate('serviceId')
    .populate('packageId');

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  
  // Return all scored candidates sorted by score
  const candidates = await findBestPartner(booking, true);
  
  res.json({
    success: true,
    candidates: candidates.slice(0, 5) // Return top 5
  });
});

// ─── Services CRUD ────────────────────────────────────────────────────────────

// @desc    List all services (admin, paginated)
// @route   GET /api/admin/services
// @access  Private (admin)
const listServices = asyncHandler(async (req, res) => {
  const { categoryId, page = 1, limit = 20, q, approvalStatus, createdByPartnerId } = req.query;
  const filter = { isDeleted: false };
  if (categoryId) filter.categoryId = categoryId;
  if (approvalStatus) filter.approvalStatus = approvalStatus;
  if (createdByPartnerId) {
    if (createdByPartnerId === 'partner') {
      filter.createdByPartnerId = { $ne: null };
    } else {
      filter.createdByPartnerId = createdByPartnerId;
    }
  }
  if (req.query.hasParent === 'true') {
    filter.parentId = { $ne: null };
  } else if (req.query.hasParent === 'false') {
    filter.parentId = null;
  }
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } }
  ];

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [services, total] = await Promise.all([
    Service.find(filter)
      .populate('categoryId', 'name slug')
      .populate('createdByPartnerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Service.countDocuments(filter)
  ]);

  res.json({ success: true, count: services.length, total, page: pageNum, pages: Math.ceil(total / limitNum), services });
});

// @desc    Update a service
// @route   PUT /api/admin/services/:id
// @access  Private (admin)
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  res.json({ success: true, service });
});

// @desc    Delete a service (soft delete)
// @route   DELETE /api/admin/services/:id
// @access  Private (admin)
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true, isActive: false }, { new: true });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  res.json({ success: true, message: 'Service deleted successfully' });
});

// @desc    Approve/Reject Service Partner Service
// @route   PATCH /api/admin/services/:id/review
// @access  Private (admin)
const reviewPartnerService = asyncHandler(async (req, res) => {
  const { action, rejectionReason } = req.body;
  const service = await Service.findOne({ _id: req.params.id, isDeleted: false });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

  const isApprove = action === 'approve';
  const isReject = action === 'reject';

  if (!isApprove && !isReject) {
    return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
  }

  service.approvalStatus = isApprove ? 'APPROVED' : 'REJECTED';
  service.isActive = isApprove ? true : false;
  service.approvedBy = req.user._id;
  service.approvedAt = isApprove ? new Date() : null;
  service.rejectionReason = isReject ? (rejectionReason || 'Rejected by admin') : null;
  await service.save();

  res.json({ success: true, service });
});

// ─── Bookings (Admin view) ────────────────────────────────────────────────────

// @desc    List all bookings (admin, paginated, filterable)
// @route   GET /api/admin/bookings
// @access  Private (admin)
const listAllBookings = asyncHandler(async (req, res) => {
  const { status, serviceId, vendorId, date, q, page = 1, limit = 15 } = req.query;
  const filter = {};

  if (status && status !== 'ALL') filter.status = status;
  if (serviceId) filter.serviceId = serviceId;
  if (vendorId) filter.vendorId = vendorId;

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
  }

  if (q) {
    const [users, partners] = await Promise.all([
      User.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } }
        ]
      }).select('_id'),
      ServicePartner.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } }
        ]
      }).select('_id')
    ]);

    const userIds = users.map(u => u._id);
    const partnerIds = partners.map(p => p._id);

    filter.$or = [
      { customerId: { $in: userIds } },
      { vendorId: { $in: partnerIds } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'name basePrice')
      .populate('packageId', 'name basePrice')
      .populate('vendorId', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments(filter)
  ]);

  res.json({ success: true, count: bookings.length, total, page: pageNum, pages: Math.ceil(total / limitNum), bookings });
});

// @desc    Admin cancel a booking
// @route   POST /api/admin/bookings/:id/cancel
// @access  Private (admin)
const adminCancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
    return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });
  }
  booking.status = 'CANCELLED';
  await booking.save();
  res.json({ success: true, message: 'Booking cancelled', booking });
});

// @desc    Admin delete a booking
// @route   DELETE /api/admin/bookings/:id
// @access  Private (admin)
const adminDeleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  
  if (booking.status !== 'CANCELLED') {
    return res.status(400).json({ success: false, message: 'Only cancelled bookings can be deleted.' });
  }

  await Booking.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Booking permanently deleted' });
});

// ─── Categories CRUD ──────────────────────────────────────────────────────────

// @desc    Update a category
// @route   PUT /api/admin/categories/:id
// @access  Private (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, category });
});

// @desc    Delete a category
// @route   DELETE /api/admin/categories/:id
// @access  Private (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Service.countDocuments({ categoryId: req.params.id });
  if (inUse > 0) {
    return res.status(400).json({ success: false, message: `Cannot delete: ${inUse} service(s) use this category. Deactivate them first.` });
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, message: 'Category deleted' });
});

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle
// @access  Private (admin)
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
});

// @desc    Update Service Partner Availability by Admin
// @route   PUT /api/admin/vendors/:id/availability
// @access  Private (admin/super_admin)
const updateVendorAvailabilityByAdmin = asyncHandler(async (req, res) => {
  const { days, slots, customTimes, serviceAreaIds } = req.body;
  const partner = await ServicePartner.findById(req.params.id);
  if (!partner) {
    return res.status(404).json({ success: false, message: "Service Partner not found." });
  }

  let serviceAreas = [];
  if (serviceAreaIds && serviceAreaIds.length > 0) {
    const Area = require("../models/Area");
    const areas = await Area.find({ _id: { $in: serviceAreaIds } });
    serviceAreas = areas.map(a => a.name);
  }

  partner.availability = {
    days: days || partner.availability?.days || [],
    slots: slots || partner.availability?.slots || [],
    customTimes: customTimes || partner.availability?.customTimes || []
  };

  partner.serviceAreaIds = serviceAreaIds || partner.serviceAreaIds;
  partner.serviceAreas = serviceAreas;

  await partner.save();

  res.json({ success: true, message: "Vendor availability and service areas updated successfully.", vendor: partner });
});

const getPendingCounts = asyncHandler(async (req, res) => {
  const [pendingKycCount, pendingServiceCount] = await Promise.all([
    ServicePartner.countDocuments({ kycStatus: "PENDING_ADMIN_APPROVAL" }),
    Service.countDocuments({ approvalStatus: "PENDING", isDeleted: false }),
  ]);
  res.json({ success: true, pendingKycCount, pendingServiceCount });
});

module.exports = {
  getPendingCounts,
  loginAdmin,
  listVendors,
  listUsers,
  verifyVendorKyc,
  getDashboardMetrics,
  updateVendorAvailabilityByAdmin,
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  addService,
  listServices,
  updateService,
  deleteService,
  reviewPartnerService,
  listAllBookings,
  adminCancelBooking,
  toggleUserStatus,
  getSettings,
  updateSettings,
  triggerBatchAssign,
  assignSingleBooking,
  previewAssignment,
};

// ─── Support Tickets (Admin) ──────────────────────────────────────────────────
const listSupportTickets = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const tickets = await SupportTicket.find(filter)
    .populate({ path: "userId", select: "name email phone", strictPopulate: false })
    .sort({ updatedAt: -1 })
    .lean();

  res.json({ success: true, data: tickets });
});

const getSupportTicketDetails = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate({ path: "userId", select: "name email phone", strictPopulate: false })
    .lean();

  if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
  res.json({ success: true, data: ticket });
});

const replyToSupportTicketByAdmin = asyncHandler(async (req, res) => {
  const { message, attachments, status } = req.body;
  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });

  ticket.messages.push({
    senderType: "admin",
    senderId: req.user._id || req.user.id,
    message,
    attachments: attachments || []
  });

  if (status) {
    ticket.status = status;
  } else {
    ticket.status = "IN_PROGRESS";
  }

  await ticket.save();

  // Notify customer
  createNotification(
    ticket.userId,
    "user",
    "Support Ticket Update",
    `Support team has replied to ticket #${ticket._id}.`,
    "system",
    { ticketId: ticket._id }
  );

  res.json({ success: true, message: "Reply sent successfully", ticket });
});

const editSupportTicketMessageByAdmin = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const { ticketId, messageId } = req.params;

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });

  const msg = ticket.messages.id(messageId);
  if (!msg) return res.status(404).json({ success: false, message: "Message not found." });

  if (msg.senderType !== "admin" && msg.senderType !== "support") {
    return res.status(403).json({ success: false, message: "Access denied. You can only edit admin replies." });
  }

  msg.message = message;
  await ticket.save();

  res.json({ success: true, message: "Message updated successfully", ticket });
});

const deleteSupportTicketMessageByAdmin = asyncHandler(async (req, res) => {
  const { ticketId, messageId } = req.params;

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });

  const msg = ticket.messages.id(messageId);
  if (!msg) return res.status(404).json({ success: false, message: "Message not found." });

  ticket.messages.pull(messageId);
  await ticket.save();

  res.json({ success: true, message: "Message deleted successfully", ticket });
});

const getWalletBalances = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const [partners, total] = await Promise.all([
    ServicePartner.find({}, "name businessName email phone walletBalance").sort({ walletBalance: -1 }).skip(skip).limit(limitNum).lean(),
    ServicePartner.countDocuments()
  ]);

  res.json({ success: true, data: partners, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

const getPayoutLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const [payouts, total] = await Promise.all([
    Payout.find({}).populate("vendorId", "name businessName email").sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Payout.countDocuments()
  ]);

  res.json({ success: true, data: payouts, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

const createPayout = asyncHandler(async (req, res) => {
  const { vendorId, amount, notes } = req.body;

  if (!vendorId || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Valid vendorId and amount are required." });
  }

  const partner = await ServicePartner.findById(vendorId);
  if (!partner) {
    return res.status(404).json({ success: false, message: "Service partner not found." });
  }

  if ((partner.walletBalance || 0) < amount) {
    return res.status(400).json({ success: false, message: `Insufficient wallet balance. Current balance is ₹${partner.walletBalance || 0}.` });
  }

  partner.walletBalance = (partner.walletBalance || 0) - amount;
  await partner.save();

  const payout = await Payout.create({
    vendorId,
    amount,
    notes: notes || "",
    status: "COMPLETED",
    referenceId: "PAY-" + Math.random().toString(36).substring(2, 10).toUpperCase()
  });

  // Notify partner
  createNotification(
    vendorId,
    "vendor",
    "Payout Processed",
    `A payout of ₹${amount} has been successfully processed and transferred.`,
    "payment",
    { payoutId: payout._id }
  );

  res.json({ success: true, message: "Payout processed and saved successfully.", payout, walletBalance: partner.walletBalance });
});

// ─── Reviews Approvals (Admin) ─────────────────────────────────────────────────
const getPendingReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ approvalStatus: "PENDING" })
    .populate({ path: "userId", select: "name email", strictPopulate: false })
    .populate({ path: "vendorId", select: "name", strictPopulate: false })
    .populate({ path: "serviceId", select: "name", strictPopulate: false })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: reviews });
});

const reviewUserReview = asyncHandler(async (req, res) => {
  const { action } = req.body; // "approve" | "reject"
  const review = await Review.findById(req.params.id);

  if (!review) return res.status(404).json({ success: false, message: "Review not found." });

  review.approvalStatus = action === "approve" ? "APPROVED" : "REJECTED";
  review.approvedBy = req.user._id || req.user.id;
  review.approvedAt = new Date();
  await review.save();

  if (action === "approve") {
    // Recalculate average rating for the service
    const ServiceModel = require("../models/Service");
    const service = await ServiceModel.findById(review.serviceId);
    if (service) {
      const allApprovedReviews = await Review.find({ serviceId: service._id, approvalStatus: "APPROVED" });
      const totalRatingsSum = allApprovedReviews.reduce((sum, r) => sum + r.rating, 0);
      const count = allApprovedReviews.length;
      
      service.reviewCount = count;
      service.rating = count > 0 ? Number((totalRatingsSum / count).toFixed(1)) : 4.5;
      await service.save();
    }
    
    // Also recalculate for the Service Partner/Vendor
    const ServicePartnerModel = require("../models/ServicePartner");
    const partner = await ServicePartnerModel.findById(review.vendorId);
    if (partner) {
      const partnerApprovedReviews = await Review.find({ vendorId: partner._id, approvalStatus: "APPROVED" });
      const totalPartnerRatingsSum = partnerApprovedReviews.reduce((sum, r) => sum + r.rating, 0);
      const partnerCount = partnerApprovedReviews.length;
      
      partner.reviewCount = partnerCount;
      partner.rating = partnerCount > 0 ? Number((totalPartnerRatingsSum / partnerCount).toFixed(1)) : 4.5;
      await partner.save();
    }

    // Notify vendor
    createNotification(
      review.vendorId,
      "vendor",
      "New Review Approved",
      `A new customer review has been approved and published for your profile.`,
      "system",
      { reviewId: review._id }
    );
  }

  res.json({ success: true, message: `Review ${action}d successfully.`, review });
});

const deleteVendorReply = asyncHandler(async (req, res) => {
  const Review = require('../models/Review');
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: "Review not found." });

  review.vendorReply = "";
  await review.save();

  res.json({ success: true, message: "Vendor reply deleted successfully.", review });
});

// @desc    List Contact Messages
// @route   GET /api/admin/contact-messages
// @access  Private (admin roles)
const getContactMessages = asyncHandler(async (req, res) => {
  const ContactMessage = require("../models/ContactMessage");
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, messages });
});

// @desc    Update Contact Message Status
// @route   PUT /api/admin/contact-messages/:id/status
// @access  Private (admin roles)
const updateContactMessageStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const ContactMessage = require("../models/ContactMessage");

  const message = await ContactMessage.findById(req.params.id);
  if (!message) {
    return res.status(404).json({ success: false, message: "Message not found" });
  }

  message.status = status;
  await message.save();

  res.status(200).json({ success: true, message: "Status updated successfully", data: message });
});

module.exports = {
  getPendingCounts,
  loginAdmin,
  listVendors,
  listUsers,
  verifyVendorKyc,
  getDashboardMetrics,
  updateVendorAvailabilityByAdmin,
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  addService,
  listServices,
  updateService,
  deleteService,
  reviewPartnerService,
  listAllBookings,
  adminCancelBooking,
  adminDeleteBooking,
  toggleUserStatus,
  getSettings,
  updateSettings,
  triggerBatchAssign,
  assignSingleBooking,
  previewAssignment,
  listSupportTickets,
  getSupportTicketDetails,
  replyToSupportTicketByAdmin,
  editSupportTicketMessageByAdmin,
  deleteSupportTicketMessageByAdmin,
  getWalletBalances,
  getPayoutLogs,
  createPayout,
  getPendingReviews,
  reviewUserReview,
  deleteVendorReply,
  getContactMessages,
  updateContactMessageStatus,
};

