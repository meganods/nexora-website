const ServicePartner = require("../models/ServicePartner");
const generateToken = require("../utils/generateToken");
const { storeOtp, verifyOtp } = require("../utils/mockOtp");
const asyncHandler = require("../utils/asyncHandler");
const { createNotification } = require('./notificationController');
const Admin = require('../models/Admin');

const PHONE_REGEX = /^[6-9]\d{9}$/;

// @desc    Register a new partner/vendor with password
// @route   POST /api/partner/signup
// @access  Public
const registerVendor = asyncHandler(async (req, res) => {
  const { name, email, phone, category, password } = req.body;

  if (!name || !email || !phone || !category || !password) {
    return res.status(400).json({ success: false, message: "Required fields: name, email, phone, category, password" });
  }

  // Check unique constraints
  let existingEmail = await ServicePartner.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    return res.status(400).json({ success: false, message: "An account with this email address already exists." });
  }

  let existingPhone = await ServicePartner.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({ success: false, message: "An account with this phone number already exists." });
  }

  // Create new ServicePartner with status REGISTERED / KYC_NOT_STARTED
  const vendor = await ServicePartner.create({
    name: name.trim(),
    email: email.toLowerCase(),
    phone,
    category,
    password,
    kycStatus: "KYC_NOT_STARTED",
    kycDetails: {
      aadharNumber: "",
      panNumber: "",
      gstNumber: "",
      businessName: name.trim()
    }
  });

  const token = generateToken({ id: vendor._id, role: "vendor" });

  res.status(201).json({
    success: true,
    message: "Registration completed successfully!",
    token,
    vendor
  });
});

// @desc    Verify partner password & login
// @route   POST /api/partner/login
// @access  Public
const loginVendor = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: "Email or phone, and password are required.",
    });
  }

  // Find vendor by email or phone
  const vendor = await ServicePartner.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phone: identifier }
    ]
  }).select("+password");

  if (!vendor) {
    return res.status(401).json({
      success: false,
      message: "Invalid email, phone, or password.",
    });
  }

  const isMatch = await vendor.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email, phone, or password.",
    });
  }

  // Generate JWT token
  const token = generateToken({ id: vendor._id, role: "vendor" });

  // Allow login so they can access the KYC dashboard wizard, but restrict actual dashboard access on the client unless APPROVED
  res.status(200).json({
    success: true,
    message: "Login successful.",
    token,
    vendor,
  });
});

// @desc    Submit Aadhaar number & trigger mock verification OTP
// @route   POST /api/partner/kyc/aadhar
// @access  Private (ServicePartner)
const submitAadhar = asyncHandler(async (req, res) => {
  const vendor = await ServicePartner.findById(req.user.userId);
  if (!vendor) return res.status(404).json({ success: false, message: "Service Partner not found" });

  const { aadharNumber } = req.body;
  if (!aadharNumber || !/^\d{12}$/.test(aadharNumber)) {
    return res.status(400).json({ success: false, message: "Please provide a valid 12-digit Aadhaar number." });
  }

  vendor.kycDetails = vendor.kycDetails || {};
  vendor.kycDetails.aadharNumber = aadharNumber;
  vendor.kycStatus = "KYC_IN_PROGRESS";
  await vendor.save();

  // Return a mock OTP code for the wizard verification
  res.json({
    success: true,
    message: "Aadhaar verification OTP sent successfully.",
    otp: "1234"
  });
});

// @desc    Confirm Aadhaar OTP
// @route   POST /api/partner/kyc/aadhar/verify
// @access  Private (ServicePartner)
const verifyAadharOtp = asyncHandler(async (req, res) => {
  const vendor = await ServicePartner.findById(req.user.userId);
  if (!vendor) return res.status(404).json({ success: false, message: "Service Partner not found" });

  const { otp } = req.body;
  if (otp !== "1234") {
    return res.status(400).json({ success: false, message: "Invalid Aadhaar Verification OTP. Please try again." });
  }

  vendor.kycDetails = vendor.kycDetails || {};
  vendor.kycDetails.aadharVerified = true;
  await vendor.save();

  res.json({
    success: true,
    message: "Aadhaar successfully verified.",
    vendor
  });
});

// @desc    Submit and Validate PAN
// @route   POST /api/partner/kyc/pan
// @access  Private (ServicePartner)
const submitPan = asyncHandler(async (req, res) => {
  const vendor = await ServicePartner.findById(req.user.userId);
  if (!vendor) return res.status(404).json({ success: false, message: "Service Partner not found" });

  const { panNumber } = req.body;
  if (!panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
    return res.status(400).json({ success: false, message: "Please provide a valid PAN number format (e.g. ABCDE1234F)." });
  }

  vendor.kycDetails = vendor.kycDetails || {};
  vendor.kycDetails.panNumber = panNumber;
  vendor.kycDetails.panVerified = true;
  await vendor.save();

  res.json({
    success: true,
    message: "PAN details verified and saved successfully.",
    vendor
  });
});

// @desc    Submit GST Details
// @route   POST /api/partner/kyc/gst
// @access  Private (ServicePartner)
const submitGst = asyncHandler(async (req, res) => {
  const vendor = await ServicePartner.findById(req.user.userId);
  if (!vendor) return res.status(404).json({ success: false, message: "Service Partner not found" });

  const { gstNumber } = req.body;
  if (gstNumber) {
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
      return res.status(400).json({ success: false, message: "Please enter a valid 15-digit GSTIN format or leave blank." });
    }
    vendor.kycDetails = vendor.kycDetails || {};
    vendor.kycDetails.gstNumber = gstNumber;
    vendor.kycDetails.gstVerified = true;
  }
  await vendor.save();

  res.json({
    success: true,
    message: "GST details updated successfully.",
    vendor
  });
});

// @desc    Submit Final KYC for Admin Approval
// @route   POST /api/partner/kyc/submit
// @access  Private (ServicePartner)
const submitKycFinal = asyncHandler(async (req, res) => {
  const vendor = await ServicePartner.findById(req.user.userId);
  if (!vendor) return res.status(404).json({ success: false, message: "Service Partner not found" });

  // Allow resubmission from REJECTED state as well
  if (vendor.kycStatus === 'APPROVED') {
    return res.status(400).json({ success: false, message: "Your profile is already approved." });
  }

  if (!vendor.kycDetails?.aadharNumber && !vendor.kycDetails?.aadharVerified) {
    return res.status(400).json({ success: false, message: "Aadhaar number is required before final submission." });
  }

  if (!vendor.kycDetails?.panNumber && !vendor.kycDetails?.panVerified) {
    return res.status(400).json({ success: false, message: "PAN number is required before final submission." });
  }

  vendor.kycStatus = "PENDING_ADMIN_APPROVAL";
  vendor.rejectionReason = null; // Clear any previous rejection reason
  vendor.kycDetails = vendor.kycDetails || {};
  vendor.kycDetails.submittedAt = new Date();
  await vendor.save();

  res.json({
    success: true,
    message: "KYC profile submitted successfully! Awaiting administrator approval.",
    vendor
  });
});

// @desc    Toggle online/offline status
// @route   PATCH /api/vendor/status
// @access  Private (vendor)
const toggleOnlineStatus = asyncHandler(async (req, res) => {
  const vendor = req.user.account;
  const { isOnline } = req.body;

  if (typeof isOnline !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isOnline must be a boolean value.",
    });
  }

  if (isOnline && vendor.kycStatus !== "APPROVED") {
    return res.status(403).json({
      success: false,
      message: "Cannot go online until KYC is APPROVED.",
    });
  }

  vendor.isOnline = isOnline;
  await vendor.save();

  res.status(200).json({
    success: true,
    message: `Vendor is now ${isOnline ? "online" : "offline"}.`,
    vendor,
  });
});

// @desc    Update vendor GeoJSON location
// @route   PUT /api/vendor/location
// @access  Private (vendor)
const updateLocation = asyncHandler(async (req, res) => {
  const vendor = req.user.account;
  const { longitude, latitude, address, city } = req.body;

  if (longitude === undefined || latitude === undefined) {
    return res.status(400).json({
      success: false,
      message: "longitude and latitude are required.",
    });
  }

  const lng = Number(longitude);
  const lat = Number(latitude);

  if (
    Number.isNaN(lng) ||
    Number.isNaN(lat) ||
    lng < -180 ||
    lng > 180 ||
    lat < -90 ||
    lat > 90
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid coordinates. longitude must be [-180, 180], latitude must be [-90, 90].",
    });
  }

  vendor.location = {
    type: "Point",
    coordinates: [lng, lat],
    address: address || "",
    city: city || "",
  };

  await vendor.save();

  res.status(200).json({
    success: true,
    message: "Location updated successfully.",
    vendor,
  });
});

const Booking = require("../models/Booking");

// @desc    Get available requests (REQUESTED status)
// @route   GET /api/partner/available-requests
// @access  Private (vendor)
const getAvailableRequests = asyncHandler(async (req, res) => {
  const requests = await Booking.find({ 
    status: 'REQUESTED',
    vendorId: null
  }).populate('serviceId', 'name basePrice estimatedDurationMins category')
    .populate('customerId', 'name phone')
    .sort({ createdAt: 1 });

  res.json(requests);
});

// @desc    Accept a request
// @route   POST /api/partner/requests/:id/accept
// @access  Private (vendor)
const acceptRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const vendorId = req.user.userId;

  let booking = await Booking.findOneAndUpdate(
    { _id: requestId, status: 'REQUESTED', vendorId: null },
    { $set: { status: 'ASSIGNED', vendorId: vendorId } },
    { new: true }
  );

  if (!booking) {
    booking = await Booking.findOne({ _id: requestId, vendorId, status: 'ASSIGNED' });
    if (!booking) {
      return res.status(400).json({ success: false, message: 'Request is no longer available or already accepted.' });
    }
  }

  // ── Notify the vendor they have a new assignment ──
  createNotification(
    vendorId, 'vendor',
    'New Booking Assigned 💼',
    `You have been assigned a new booking (ID: ${requestId}). Please check your job details and prepare to arrive.`,
    'booking', { bookingId: requestId }
  );

  // ── Notify the customer their partner is on the way ──
  if (booking.customerId) {
    createNotification(
      booking.customerId, 'user',
      'Partner Assigned!',
      'Great news! A service partner has been assigned to your booking and will be with you soon.',
      'booking', { bookingId: requestId }
    );
  }

  res.json({ success: true, booking });
});

// @desc    Reject a request — routes it back to REQUESTED so admin pool can re-assign
// @route   POST /api/partner/requests/:id/reject
// @access  Private (vendor)
const rejectRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const vendorId = req.user.userId;
  const { reason } = req.body;

  const booking = await Booking.findOneAndUpdate(
    { _id: requestId, vendorId, status: 'ASSIGNED' },
    {
      $set: { 
        vendorId: null,
        status: 'REQUESTED',
      },
      $push: {
        rejectionLog: {
          vendorId,
          reason: reason || 'No reason provided',
          rejectedAt: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found or you are not the assigned partner.' });
  }

  res.json({ success: true, message: 'Request rejected and returned to the pool.', booking });
});

// @desc    Update request status (ARRIVED, IN_PROGRESS, COMPLETED)
// @route   PATCH /api/partner/requests/:id/status
// @access  Private (vendor)
const updateRequestStatus = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const vendorId = req.user.userId;
  const { status, otp, beforePhotoUrl, afterPhotoUrl } = req.body;

  const booking = await Booking.findOne({ _id: requestId, vendorId });
  if (!booking) return res.status(404).json({ success: false, message: 'Request not found' });

  // ── Status transitions ─────────────────────────────────────────────────────
  if (status === 'ARRIVED' && booking.status === 'ASSIGNED') {
    booking.status = 'ARRIVED';

  } else if (status === 'IN_PROGRESS' && booking.status === 'ARRIVED') {
    // OTP verification
    if (!otp || booking.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please ask the customer for their 4-digit start code.' });
    }
    // Attach optional before photo
    if (beforePhotoUrl) booking.beforePhotoUrl = beforePhotoUrl;
    booking.status = 'IN_PROGRESS';

  } else if (status === 'COMPLETED' && booking.status === 'IN_PROGRESS') {
    // ── Photo Lock ─────────────────────────────────────────────────────────
    const hasBefore = booking.beforePhotoUrl || beforePhotoUrl;
    const hasAfter  = afterPhotoUrl;
    if (!hasBefore || !hasAfter) {
      return res.status(400).json({
        success: false,
        message: 'Before and after photos are required to mark the job as completed.',
        photoLock: true,
      });
    }
    if (beforePhotoUrl) booking.beforePhotoUrl = beforePhotoUrl;
    booking.afterPhotoUrl = afterPhotoUrl;
    booking.status = 'COMPLETED';

    // Update vendor earnings (Financial separation: Platform Fee is not touched by Partner)
    const vendor = await ServicePartner.findById(vendorId);
    const platformFee = booking.customerPlatformFee || 0;
    const basePrice = (booking.paymentDetails?.amount || 0) - platformFee;
    const earnings = basePrice - (booking.commissionAmount || 0);
    
    vendor.walletBalance = (vendor.walletBalance || 0) + earnings;
    await vendor.save();

    // ── Notify user: job done! ──
    if (booking.customerId) {
      createNotification(
        booking.customerId, 'user',
        'Service Completed ✅',
        'Your service has been completed! Please leave a review for your service partner.',
        'booking', { bookingId: booking._id }
      );
    }

    // ── Notify admin: job done ──
    try {
      const admins = await Admin.find({ isActive: true }).select('_id').lean();
      admins.forEach(a => createNotification(
        a._id, 'admin',
        'Booking Completed',
        `Booking ${booking._id} has been completed by vendor ${vendorId}.`,
        'booking', { bookingId: booking._id }
      ));
    } catch (_) {}

  } else {
    return res.status(400).json({ success: false, message: `Invalid status transition: ${booking.status} → ${status}` });
  }

  await booking.save();
  res.json({ success: true, booking });
});

// @desc    Get active and completed requests for vendor
// @route   GET /api/partner/my-requests
// @access  Private (vendor)
const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await Booking.find({ vendorId: req.user.userId })
    .populate('serviceId')
    .populate('customerId', 'name phone')
    .sort({ scheduledDate: 1 });
    
  res.json(requests);
});

// @desc    Get current partner profile details (including wallet)
// @route   GET /api/partner/profile
// @access  Private (vendor)
const getPartnerProfile = asyncHandler(async (req, res) => {
  const vendor = await ServicePartner.findById(req.user.userId);
  if (!vendor) return res.status(404).json({ success: false, message: 'Service Partner not found' });
  res.json({ success: true, vendor });
});

// @desc    Get services under vendor category with active selections
// @route   GET /api/partner/services
// @access  Private (vendor)
const getPartnerServices = asyncHandler(async (req, res) => {
  const vendor = await ServicePartner.findById(req.user.userId);
  if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

  const Service = require('../models/Service');
  const Category = require('../models/Category');

  // Try matching Category by name regex (case-insensitive)
  const matchedCategory = await Category.findOne({ name: { $regex: new RegExp(`^${vendor.category}$`, 'i') } });
  
  let services = [];
  if (matchedCategory) {
    services = await Service.find({ categoryId: matchedCategory._id, isActive: true }).lean();
  } else {
    // fallback
    const allServices = await Service.find({ isActive: true }).populate('categoryId').lean();
    services = allServices.filter(s => s.categoryId?.name?.toLowerCase() === vendor.category.toLowerCase());
  }

  // Create a map of existing vendor selections
  const customMap = {};
  (vendor.customServices || []).forEach(cs => {
    if (cs.serviceId) {
      customMap[cs.serviceId.toString()] = cs;
    }
  });

  const servicesWithSelections = services.map(s => {
    const custom = customMap[s._id.toString()];
    return {
      ...s,
      isSelected: !!custom,
      customPrice: custom ? custom.customPrice : null,
      customActive: custom ? custom.isActive : true
    };
  });

  res.json({ success: true, services: servicesWithSelections });
});

// @desc    Update vendor selected services and custom prices overrides
// @route   PUT /api/partner/services
// @access  Private (vendor)
const updatePartnerServices = asyncHandler(async (req, res) => {
  const vendor = await ServicePartner.findById(req.user.userId);
  if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

  const { customServices } = req.body;
  if (!Array.isArray(customServices)) {
    return res.status(400).json({ success: false, message: 'customServices must be an array' });
  }

  vendor.customServices = customServices.map(cs => ({
    serviceId: cs.serviceId,
    customPrice: cs.customPrice !== null && cs.customPrice !== undefined && cs.customPrice !== '' ? Number(cs.customPrice) : null,
    isActive: cs.isActive !== false
  }));

  await vendor.save();
  res.json({ success: true, message: 'Services and pricing updated successfully', vendor });
});

// @desc    Update vendor availability days/slots and service areas
// @route   PUT /api/partner/availability
// @access  Private (vendor)
const updatePartnerAvailability = asyncHandler(async (req, res) => {
  const vendor = await ServicePartner.findById(req.user.userId);
  if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

  const { days, slots, customTimes, serviceAreas } = req.body;

  if (days) {
    if (!Array.isArray(days)) return res.status(400).json({ success: false, message: 'Days must be an array' });
    vendor.availability.days = days;
  }
  if (slots) {
    if (!Array.isArray(slots)) return res.status(400).json({ success: false, message: 'Slots must be an array' });
    vendor.availability.slots = slots;
  }
  if (customTimes !== undefined) {
    if (!Array.isArray(customTimes)) return res.status(400).json({ success: false, message: 'Custom times must be an array' });
    vendor.availability.customTimes = customTimes;
  }
  if (req.body.serviceAreaIds) {
    if (!Array.isArray(req.body.serviceAreaIds)) return res.status(400).json({ success: false, message: 'serviceAreaIds must be an array' });
    vendor.serviceAreaIds = req.body.serviceAreaIds;
    const Area = require('../models/Area');
    const matchedAreas = await Area.find({ _id: { $in: req.body.serviceAreaIds } });
    vendor.serviceAreas = matchedAreas.map(a => a.name);
  } else if (serviceAreas) {
    if (!Array.isArray(serviceAreas)) return res.status(400).json({ success: false, message: 'Service areas must be an array' });
    vendor.serviceAreas = serviceAreas;
  }

  await vendor.save();
  res.json({ success: true, message: 'Availability & Areas updated successfully', vendor });
});

// @desc    Get offers submitted by vendor
// @route   GET /api/partner/offers
// @access  Private (vendor)
const getPartnerOffers = asyncHandler(async (req, res) => {
  const Offer = require('../models/Offer');
  const offers = await Offer.find({ vendorId: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, offers });
});

// @desc    Submit a new vendor offer for admin approval
// @route   POST /api/partner/offers
// @access  Private (vendor)
const createPartnerOffer = asyncHandler(async (req, res) => {
  const Offer = require('../models/Offer');
  const { title, description, imageUrl, discountType, discountValue, startDate, endDate } = req.body;

  if (!title || !discountValue) {
    return res.status(400).json({ success: false, message: 'Title and discount value are required' });
  }

  const offer = await Offer.create({
    title,
    description,
    imageUrl,
    discountType: discountType || 'PERCENTAGE',
    discountValue,
    startDate: startDate || new Date(),
    endDate: endDate || null,
    source: 'VENDOR',
    vendorId: req.user.userId,
    requiresAdminApproval: true,
    approvalStatus: 'PENDING'
  });

  res.status(201).json({ success: true, message: 'Offer submitted for admin approval', offer });
});

// @desc    Update a vendor offer and re-submit for approval
// @route   PUT /api/partner/offers/:id
// @access  Private (vendor)
const updatePartnerOffer = asyncHandler(async (req, res) => {
  const Offer = require('../models/Offer');
  const offer = await Offer.findOne({ _id: req.params.id, vendorId: req.user.userId });

  if (!offer) {
    return res.status(404).json({ success: false, message: "Offer not found or access denied." });
  }

  const { title, description, imageUrl, discountType, discountValue, startDate, endDate } = req.body;

  if (title !== undefined) offer.title = title;
  if (description !== undefined) offer.description = description;
  if (imageUrl !== undefined) offer.imageUrl = imageUrl;
  if (discountType !== undefined) offer.discountType = discountType;
  if (discountValue !== undefined) offer.discountValue = discountValue;
  if (startDate !== undefined) offer.startDate = startDate;
  if (endDate !== undefined) offer.endDate = endDate;

  // Force it back to pending approval when edited by vendor and clear rejection reason
  offer.approvalStatus = 'PENDING';
  offer.isActive = false;
  offer.rejectionReason = null;

  await offer.save();
  res.json({ success: true, message: "Offer updated and re-submitted for approval.", offer });
});


// @desc    Save/Resume Onboarding Progress step-by-step
// @route   PUT /api/partner/onboarding
// @access  Private (ServicePartner)
const updateOnboarding = asyncHandler(async (req, res) => {
  const vendor = await ServicePartner.findById(req.user.userId);
  if (!vendor) {
    return res.status(404).json({ success: false, message: "Service Partner not found." });
  }

  const {
    businessType, experience, teamSize, businessDescription, primaryContact,
    location, bankDetails, onboardingStep, kycDetails, availability, serviceAreas,
    customServices // ← Step 3: service selection & pricing overrides (onboarding only)
  } = req.body;

  if (businessType !== undefined) vendor.businessType = businessType;
  if (experience !== undefined) vendor.experience = experience;
  if (teamSize !== undefined) vendor.teamSize = teamSize;
  if (businessDescription !== undefined) vendor.businessDescription = businessDescription;
  if (primaryContact !== undefined) vendor.primaryContact = primaryContact;
  if (location !== undefined) vendor.location = location;
  if (onboardingStep !== undefined) vendor.onboardingStep = onboardingStep;
  if (availability !== undefined) vendor.availability = availability;
  if (req.body.serviceAreaIds !== undefined) {
    vendor.serviceAreaIds = req.body.serviceAreaIds;
    const Area = require('../models/Area');
    const matchedAreas = await Area.find({ _id: { $in: req.body.serviceAreaIds } });
    vendor.serviceAreas = matchedAreas.map(a => a.name);
  } else if (serviceAreas !== undefined) {
    vendor.serviceAreas = serviceAreas;
  }

  if (kycDetails !== undefined) {
    vendor.kycDetails = { ...vendor.kycDetails, ...kycDetails };
  }

  if (bankDetails !== undefined) {
    vendor.bankDetails = { ...vendor.bankDetails, ...bankDetails };
  }

  // Step 3: persist selected service IDs and pricing overrides during onboarding
  // This does NOT require requireApprovedVendor — the admin validates services during KYC review
  if (Array.isArray(customServices)) {
    vendor.customServices = customServices
      .filter(cs => cs.serviceId) // safety: must have a valid serviceId
      .map(cs => ({
        serviceId: cs.serviceId,
        customPrice: cs.customPrice !== null && cs.customPrice !== undefined && cs.customPrice !== ''
          ? Number(cs.customPrice)
          : null,
        isActive: cs.isActive !== false
      }));
  }

  await vendor.save();
  res.status(200).json({ success: true, message: "Progress saved successfully.", vendor });
});


// @desc    List all coupons created by this vendor
// @route   GET /api/partner/coupons
// @access  Private (ServicePartner)
const getPartnerCoupons = asyncHandler(async (req, res) => {
  const Coupon = require('../models/Coupon');
  const coupons = await Coupon.find({ vendorId: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

// @desc    Create a new coupon (always PENDING & inactive)
// @route   POST /api/partner/coupons
// @access  Private (ServicePartner)
const createPartnerCoupon = asyncHandler(async (req, res) => {
  const Coupon = require('../models/Coupon');
  const { code, description, discountType, discountValue, maxDiscountAmount, minOrderValue, startDate, endDate, usageLimit } = req.body;

  if (!code || !discountType || !discountValue) {
    return res.status(400).json({ success: false, message: "Required fields: code, discountType, discountValue" });
  }

  // Check uniqueness of code
  const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (existing) {
    return res.status(400).json({ success: false, message: "A coupon with this code already exists." });
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderValue: minOrderValue || 0,
    startDate: startDate || new Date(),
    endDate: endDate || null,
    usageLimit: usageLimit || null,
    vendorId: req.user.userId,
    approvalStatus: 'PENDING',
    isActive: false // Deactivated until approved by Admin
  });

  res.status(201).json({ success: true, message: "Coupon created and submitted for Admin approval.", coupon });
});

// @desc    Update a coupon owned by this vendor (forces it back to PENDING)
// @route   PUT /api/partner/coupons/:id
// @access  Private (ServicePartner)
const updatePartnerCoupon = asyncHandler(async (req, res) => {
  const Coupon = require('../models/Coupon');
  const coupon = await Coupon.findOne({ _id: req.params.id, vendorId: req.user.userId });

  if (!coupon) {
    return res.status(404).json({ success: false, message: "Coupon not found or access denied." });
  }

  const { description, discountType, discountValue, maxDiscountAmount, minOrderValue, startDate, endDate, usageLimit } = req.body;

  if (description !== undefined) coupon.description = description;
  if (discountType !== undefined) coupon.discountType = discountType;
  if (discountValue !== undefined) coupon.discountValue = discountValue;
  if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
  if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
  if (startDate !== undefined) coupon.startDate = startDate;
  if (endDate !== undefined) coupon.endDate = endDate;
  if (usageLimit !== undefined) coupon.usageLimit = usageLimit;

  // Force it back to pending approval when edited by vendor
  coupon.approvalStatus = 'PENDING';
  coupon.isActive = false;
  coupon.rejectionReason = null;

  await coupon.save();
  res.json({ success: true, message: "Coupon updated and re-submitted for approval.", coupon });
});

// @desc    Get services created by this Service Partner
// @route   GET /api/partner/created-services
// @access  Private (ServicePartner)
const getPartnerCreatedServices = asyncHandler(async (req, res) => {
  const Service = require('../models/Service');
  const services = await Service.find({ 
    createdByPartnerId: req.user.userId,
    isDeleted: false
  }).populate('categoryId', 'name slug').sort({ createdAt: -1 });
  res.json({ success: true, services });
});

// @desc    Create a new service/sub-service by Service Partner (PENDING_APPROVAL)
// @route   POST /api/partner/created-services
// @access  Private (ServicePartner)
const createPartnerService = asyncHandler(async (req, res) => {
  const Service = require('../models/Service');
  const { name, categoryId, description, basePrice, estimatedDurationMins, inclusions, imageUrl, imagePublicId, parentId } = req.body;

  if (!name || !categoryId || basePrice === undefined || !estimatedDurationMins) {
    return res.status(400).json({ success: false, message: "Required fields: name, categoryId, basePrice, estimatedDurationMins" });
  }

  // Generate unique slug
  let slug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  const existing = await Service.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const service = await Service.create({
    name,
    slug,
    categoryId,
    description,
    basePrice,
    estimatedDurationMins,
    inclusions: Array.isArray(inclusions) ? inclusions : [],
    imageUrl: imageUrl || null,
    imagePublicId: imagePublicId || null,
    parentId: parentId || null,
    createdByPartnerId: req.user.userId,
    approvalStatus: 'PENDING_APPROVAL',
    isActive: false,
    isDeleted: false
  });

  res.status(201).json({ success: true, message: "Service submitted for Admin approval.", service });
});

// @desc    Update partner created service (resets approval status)
// @route   PUT /api/partner/created-services/:id
// @access  Private (ServicePartner)
const updatePartnerService = asyncHandler(async (req, res) => {
  const Service = require('../models/Service');
  const { name, categoryId, description, basePrice, estimatedDurationMins, inclusions, imageUrl, imagePublicId, parentId } = req.body;
  
  const service = await Service.findOne({ _id: req.params.id, createdByPartnerId: req.user.userId, isDeleted: false });
  if (!service) {
    return res.status(404).json({ success: false, message: "Service not found or unauthorized" });
  }

  if (name) {
    service.name = name;
    // Re-generate slug if name changed
    let slug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    const existing = await Service.findOne({ slug, _id: { $ne: service._id } });
    if (existing) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    service.slug = slug;
  }

  if (categoryId) service.categoryId = categoryId;
  if (description !== undefined) service.description = description;
  if (basePrice !== undefined) service.basePrice = basePrice;
  if (estimatedDurationMins !== undefined) service.estimatedDurationMins = estimatedDurationMins;
  if (Array.isArray(inclusions)) service.inclusions = inclusions;
  if (imageUrl !== undefined) service.imageUrl = imageUrl;
  if (imagePublicId !== undefined) service.imagePublicId = imagePublicId;
  if (parentId !== undefined) service.parentId = parentId || null;

  // Reset approval status on edit
  service.approvalStatus = 'PENDING_APPROVAL';
  service.rejectionReason = null;
  service.isActive = false;

  await service.save();
  res.json({ success: true, message: "Service updated and resubmitted for approval.", service });
});

// @desc    Soft delete partner created service
// @route   DELETE /api/partner/created-services/:id
// @access  Private (ServicePartner)
const deletePartnerService = asyncHandler(async (req, res) => {
  const Service = require('../models/Service');
  const service = await Service.findOne({ _id: req.params.id, createdByPartnerId: req.user.userId, isDeleted: false });
  if (!service) {
    return res.status(404).json({ success: false, message: "Service not found or unauthorized" });
  }

  service.isDeleted = true;
  service.isActive = false;
  await service.save();

  res.json({ success: true, message: "Service soft deleted successfully." });
});

module.exports = {
  loginVendor,
  registerVendor,
  submitAadhar,
  verifyAadharOtp,
  submitPan,
  submitGst,
  submitKycFinal,
  toggleOnlineStatus,
  updateLocation,
  getAvailableRequests,
  acceptRequest,
  rejectRequest,
  updateRequestStatus,
  getMyRequests,
  getPartnerProfile,
  getPartnerServices,
  updatePartnerServices,
  updatePartnerAvailability,
  getPartnerOffers,
  createPartnerOffer,
  updatePartnerOffer,
  updateOnboarding,
  getPartnerCoupons,
  createPartnerCoupon,
  updatePartnerCoupon,
  getPartnerCreatedServices,
  createPartnerService,
  updatePartnerService,
  deletePartnerService
};

