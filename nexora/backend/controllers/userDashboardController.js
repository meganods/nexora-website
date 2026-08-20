const User = require("../models/User");
const Booking = require("../models/Booking");
const Coupon = require("../models/Coupon");
const Review = require("../models/Review");
const SupportTicket = require("../models/SupportTicket");
const ServicePartner = require("../models/ServicePartner");
const Admin = require("../models/Admin");
const asyncHandler = require("../utils/asyncHandler");
const Service = require("../models/Service");
const Deal = require("../models/Deal");
const Package = require("../models/Package");
const { createNotification } = require("./notificationController");
const mongoose = require("mongoose");

// ─── Analytics / Overview stats ────────────────────────────────────────────────
exports.getDashboardOverview = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [activeBookingsCount, completedBookingsCount, cancelledBookingsCount, addressesCount, availableCouponsCount, recentBookings, recentNotifications] = await Promise.all([
    Booking.countDocuments({ customerId: userId, status: { $in: ["REQUESTED", "ASSIGNED", "PARTNER_ACCEPTED", "ON_THE_WAY", "ARRIVED", "OTP_VERIFICATION", "IN_PROGRESS"] } }),
    Booking.countDocuments({ customerId: userId, status: "COMPLETED" }),
    Booking.countDocuments({ customerId: userId, status: "CANCELLED" }),
    (async () => {
      const u = await User.findById(userId) || await ServicePartner.findById(userId) || await Admin.findById(userId);
      return u?.addresses?.length || 0;
    })(),
    Coupon.countDocuments({ isActive: true }),
    Booking.find({ customerId: userId })
      .populate("serviceId", "name basePrice")
      .populate("vendorId", "name phone")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    require("../models/Notification").find({ recipientId: userId, recipientType: "user" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ]);

  // Aggregate total savings (difference between basePrice/original and finalPrice paid, or flat savings)
  const savingsAggregate = await Booking.aggregate([
    { $match: { customerId: new mongoose.Types.ObjectId(userId), status: "COMPLETED" } },
    { $group: { _id: null, totalSavings: { $sum: "$discountAmount" } } }
  ]);
  const totalSavings = savingsAggregate[0]?.totalSavings || 0;

  res.json({
    success: true,
    data: {
      stats: {
        activeBookings: activeBookingsCount,
        completedBookings: completedBookingsCount,
        cancelledBookings: cancelledBookingsCount,
        savedAddresses: addressesCount,
        availableCoupons: availableCouponsCount,
        totalSavings
      },
      recentBookings,
      recentNotifications
    }
  });
});

// ─── Booking List ──────────────────────────────────────────────────────────────
exports.getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type = "active", page = 1, limit = 10, status, categoryId } = req.query;

  const filter = { customerId: userId };

  if (type === "active") {
    filter.status = { $in: ["PENDING_PAYMENT", "REQUESTED", "ASSIGNED", "PARTNER_ACCEPTED", "ON_THE_WAY", "ARRIVED", "OTP_VERIFICATION", "IN_PROGRESS"] };
  } else if (type === "history") {
    filter.status = { $in: ["COMPLETED", "CANCELLED"] };
  }

  if (status && status !== "ALL") {
    filter.status = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate("serviceId", "name basePrice duration image")
    .populate("vendorId", "name phone profilePhoto rating")
    .populate("packageId", "name basePrice")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  res.json({
    success: true,
    total,
    pages: Math.ceil(total / limitNum),
    page: pageNum,
    data: bookings
  });
});

// ─── Address CRUD ──────────────────────────────────────────────────────────────
exports.addAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { label, fullName, phone, houseNo, street, landmark, countryId, stateId, cityId, areaId, pincodeId, city, state, pincode, isDefault } = req.body;

  const user = await User.findById(userId) || await ServicePartner.findById(userId) || await Admin.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  if (isDefault) {
    user.addresses.forEach(addr => { addr.isDefault = false; });
  }

  const newAddress = {
    label: label || "Home",
    fullName,
    phone,
    houseNo,
    street,
    landmark,
    countryId,
    stateId,
    cityId,
    areaId,
    pincodeId,
    city,
    state,
    pincode,
    isDefault: !!isDefault || user.addresses.length === 0
  };

  user.addresses.push(newAddress);
  await user.save();

  res.status(201).json({ success: true, message: "Address added successfully", data: user.addresses });
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { addressId } = req.params;
  const updates = req.body;

  const user = await User.findById(userId) || await ServicePartner.findById(userId) || await Admin.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const addr = user.addresses.id(addressId);
  if (!addr) return res.status(404).json({ success: false, message: "Address not found" });

  if (updates.isDefault) {
    user.addresses.forEach(a => { a.isDefault = false; });
  }

  Object.assign(addr, updates);
  await user.save();

  res.json({ success: true, message: "Address updated successfully", data: user.addresses });
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { addressId } = req.params;

  const user = await User.findById(userId) || await ServicePartner.findById(userId) || await Admin.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.addresses.pull({ _id: addressId });
  await user.save();

  res.json({ success: true, message: "Address deleted successfully", data: user.addresses });
});

// ─── Reviews & Ratings ──────────────────────────────────────────────────────────
exports.submitReview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { bookingId, rating, reviewText, images } = req.body;

  const booking = await Booking.findOne({ _id: bookingId, customerId: userId });
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

  if (booking.status !== "COMPLETED") {
    return res.status(400).json({ success: false, message: "You can only review completed bookings." });
  }

  const existingReview = await Review.findOne({ bookingId });
  if (existingReview) {
    return res.status(400).json({ success: false, message: "You have already reviewed this booking." });
  }

  // Look up Service & Category IDs dynamically from the database
  let serviceId = booking.serviceId;
  let categoryId = null;

  if (serviceId) {
    const Service = require('../models/Service');
    const service = await Service.findById(serviceId);
    if (service) {
      categoryId = service.categoryId;
    }
  } else if (booking.packageId) {
    const Package = require('../models/Package');
    const pkg = await Package.findById(booking.packageId);
    if (pkg && pkg.categoryIds && pkg.categoryIds.length > 0) {
      categoryId = pkg.categoryIds[0];
    }
  }

  const review = await Review.create({
    bookingId,
    userId,
    vendorId: booking.vendorId,
    serviceId: serviceId || null,
    categoryId,
    rating,
    reviewText,
    images: images || [],
    approvalStatus: "PENDING"
  });

  // Notify admins of new review pending approval
  const Admin = require("../models/Admin");
  const admins = await Admin.find().select("_id");
  admins.forEach(a => createNotification(
    a._id,
    "admin",
    "New Review Pending Approval",
    `A new review has been submitted for booking ${bookingId} and is pending approval.`,
    "approval",
    { reviewId: review._id }
  ));

  res.status(201).json({ success: true, message: "Review submitted successfully! Awaiting admin approval.", review });
});

// ─── Support Tickets ───────────────────────────────────────────────────────────
exports.createSupportTicket = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { subject, message, attachments } = req.body;

  const ticket = await SupportTicket.create({
    userId,
    subject,
    status: "OPEN",
    messages: [
      {
        senderType: "user",
        senderId: userId,
        message,
        attachments: attachments || []
      }
    ]
  });

  // Notify admins
  const Admin = require("../models/Admin");
  const admins = await Admin.find().select("_id");
  admins.forEach(a => createNotification(
    a._id,
    "admin",
    "New Support Ticket Created",
    `Ticket #${ticket._id}: "${subject}" has been opened.`,
    "system",
    { ticketId: ticket._id }
  ));

  res.status(201).json({ success: true, message: "Support ticket created successfully", ticket });
});

exports.listTickets = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const tickets = await SupportTicket.find({ userId }).sort({ updatedAt: -1 }).lean();
  res.json({ success: true, data: tickets });
});

exports.getTicketDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, userId }).lean();
  if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
  res.json({ success: true, data: ticket });
});

exports.replyToTicket = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { message, attachments } = req.body;

  const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, userId });
  if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });

  ticket.messages.push({
    senderType: "user",
    senderId: userId,
    message,
    attachments: attachments || []
  });
  ticket.status = "OPEN"; // Reset status to open when customer replies
  await ticket.save();

  res.json({ success: true, message: "Reply added successfully", ticket });
});

exports.getUserReviews = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const reviews = await Review.find({ userId })
    .populate("serviceId", "name")
    .populate("vendorId", "name")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: reviews });
});

exports.editTicketMessage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;
  const { ticketId, messageId } = req.params;

  const ticket = await SupportTicket.findOne({ _id: ticketId, userId });
  if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });

  const msg = ticket.messages.id(messageId);
  if (!msg) return res.status(404).json({ success: false, message: "Message not found." });

  if (msg.senderId.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: "Access denied. You can only edit your own messages." });
  }

  msg.message = message;
  await ticket.save();

  res.json({ success: true, message: "Message updated successfully", ticket });
});

exports.deleteTicketMessage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { ticketId, messageId } = req.params;

  const ticket = await SupportTicket.findOne({ _id: ticketId, userId });
  if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });

  const msg = ticket.messages.id(messageId);
  if (!msg) return res.status(404).json({ success: false, message: "Message not found." });

  if (msg.senderId.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: "Access denied. You can only delete your own messages." });
  }

  ticket.messages.pull(messageId);
  await ticket.save();

  res.json({ success: true, message: "Message deleted successfully", ticket });
});

// Get User Wishlist
exports.getUserWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user || !user.wishlist || user.wishlist.length === 0) {
    return res.json({ success: true, wishlist: [] });
  }

  // Fetch all services, deals, and packages matching the wishlist IDs in parallel
  const wishlistIds = user.wishlist;
  const [services, deals, packages] = await Promise.all([
    Service.find({ _id: { $in: wishlistIds } }).lean(),
    Deal.find({ _id: { $in: wishlistIds } }).lean(),
    Package.find({ _id: { $in: wishlistIds } }).lean()
  ]);

  // Combine and normalize properties so the frontend can render them seamlessly
  const combined = [
    ...services.map(s => ({
      _id: s._id,
      name: s.name,
      slug: s.slug,
      basePrice: s.basePrice,
      imageUrl: s.imageUrl,
      rating: s.rating || 4.7,
      reviewCount: s.reviewCount || 120,
      description: s.description || 'Verified professional home service.',
      type: 'service'
    })),
    ...deals.map(d => ({
      _id: d._id,
      name: d.title,
      slug: d.slug,
      basePrice: d.finalPrice,
      imageUrl: d.imageUrl,
      rating: d.rating || 4.8,
      reviewCount: d.reviewCount || 10,
      description: d.description || 'Special Deal',
      type: 'deal'
    })),
    ...packages.map(p => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      basePrice: p.basePrice,
      imageUrl: p.imageUrl,
      rating: p.rating || 4.7,
      reviewCount: p.reviewCount || 15,
      description: p.description || 'Exclusive Package Deal',
      type: 'package'
    }))
  ];

  res.json({ success: true, wishlist: combined });
});

// Toggle Wishlist Item
exports.toggleWishlist = asyncHandler(async (req, res) => {
  const { serviceId } = req.body;
  if (!serviceId) return res.status(400).json({ success: false, message: "Service ID is required." });

  // Only regular users (not vendors/admins) can use the wishlist
  if (req.user?.role !== 'user') {
    return res.status(403).json({ success: false, message: "Only customer accounts can use the wishlist." });
  }

  const userId = req.user?.id || req.user?.userId;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const userWishlist = user.wishlist || [];
  const index = userWishlist.findIndex(id => id && id.toString() === serviceId.toString());
  let added = false;
  
  if (index > -1) {
    await User.findByIdAndUpdate(userId, { $pull: { wishlist: serviceId } });
  } else {
    await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: serviceId } });
    added = true;
  }

  const updatedUser = await User.findById(userId).select('wishlist');
  return res.json({ success: true, wishlist: updatedUser.wishlist, added });
});

// ─── Search History ──────────────────────────────────────────────────────────

// GET /user/search-history — fetch last 10 recent searches
exports.getSearchHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('searchHistory').lean();
  if (!user) {
    return res.json({ success: true, data: [] });
  }

  const history = (user.searchHistory || [])
    .sort((a, b) => new Date(b.searchedAt) - new Date(a.searchedAt))
    .slice(0, 10);

  res.json({ success: true, data: history });
});

// POST /user/search-history — save a search query (max 10 unique)
exports.saveSearchHistory = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) return res.status(400).json({ success: false, message: 'Query is required.' });

  const trimmedQuery = query.trim();

  await User.findByIdAndUpdate(req.user.id, {
    // Remove existing duplicate entry for same query (case-insensitive)
    $pull: { searchHistory: { query: { $regex: new RegExp(`^${trimmedQuery}$`, 'i') } } }
  });

  // Push new entry at top
  await User.findByIdAndUpdate(req.user.id, {
    $push: {
      searchHistory: {
        $each: [{ query: trimmedQuery, searchedAt: new Date() }],
        $position: 0,
        $slice: 10   // keep only last 10
      }
    }
  });

  res.json({ success: true, message: 'Search saved.' });
});

// DELETE /user/search-history — clear all or one entry
exports.clearSearchHistory = asyncHandler(async (req, res) => {
  const { query } = req.body;

  if (query) {
    // Clear specific entry
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { searchHistory: { query: { $regex: new RegExp(`^${query.trim()}$`, 'i') } } }
    });
    return res.json({ success: true, message: 'Entry removed.' });
  }

  // Clear all
  await User.findByIdAndUpdate(req.user.id, { $set: { searchHistory: [] } });
  res.json({ success: true, message: 'Search history cleared.' });
});

