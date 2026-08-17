const express = require("express");
const {
  requestLoginOtp,
  verifyLoginOtp,
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
  updateTripLocation,
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
  deletePartnerService,
  getPartnerReviews,
  replyToReview,
  getDashboardStats
} = require("../controllers/partnerController");
const { getMyDeals, createVendorDeal, updateVendorDeal } = require("../controllers/dealController");
const { protect, authorize, requireApprovedVendor } = require("../middlewares/auth");

const router = express.Router();

router.post("/login", requestLoginOtp);
router.post("/request-login-otp", requestLoginOtp);
router.post("/verify-login-otp", verifyLoginOtp);
router.post("/signup", registerVendor);

router.post("/kyc/aadhar", protect, authorize("vendor"), submitAadhar);
router.post("/kyc/aadhar/verify", protect, authorize("vendor"), verifyAadharOtp);
router.post("/kyc/pan", protect, authorize("vendor"), submitPan);
router.post("/kyc/gst", protect, authorize("vendor"), submitGst);
router.post("/kyc/submit", protect, authorize("vendor"), submitKycFinal);
router.patch("/status", protect, authorize("vendor"), toggleOnlineStatus);
router.put("/location", protect, authorize("vendor"), updateLocation);

// Onboarding progress (accessible before full KYC approval)
router.put("/onboarding", protect, authorize("vendor"), updateOnboarding);

// Dashboard Stats
router.get("/dashboard-stats", protect, authorize("vendor"), requireApprovedVendor, getDashboardStats);

// Request Management (Operational - requires approval)
router.get("/available-requests", protect, authorize("vendor"), requireApprovedVendor, getAvailableRequests);
router.post("/requests/:id/accept", protect, authorize("vendor"), requireApprovedVendor, acceptRequest);
router.post("/requests/:id/reject", protect, authorize("vendor"), requireApprovedVendor, rejectRequest);
router.patch("/requests/:id/status", protect, authorize("vendor"), requireApprovedVendor, updateRequestStatus);
router.put("/bookings/:id/trip-location", protect, authorize("vendor"), requireApprovedVendor, updateTripLocation);
router.get("/my-requests", protect, authorize("vendor"), requireApprovedVendor, getMyRequests);
router.get("/profile", protect, authorize("vendor"), getPartnerProfile); // Profile can be loaded by anyone

// Service & Pricing Override Management
router.get("/services", protect, authorize("vendor"), requireApprovedVendor, getPartnerServices);
router.put("/services", protect, authorize("vendor"), requireApprovedVendor, updatePartnerServices);

// Availability & Service Areas Management
router.put("/availability", protect, authorize("vendor"), requireApprovedVendor, updatePartnerAvailability);

// Vendor Offers
router.get("/offers", protect, authorize("vendor"), requireApprovedVendor, getPartnerOffers);
router.post("/offers", protect, authorize("vendor"), requireApprovedVendor, createPartnerOffer);
router.put("/offers/:id", protect, authorize("vendor"), requireApprovedVendor, updatePartnerOffer);

// Vendor Deals
router.get("/deals", protect, authorize("vendor"), requireApprovedVendor, getMyDeals);
router.post("/deals", protect, authorize("vendor"), requireApprovedVendor, createVendorDeal);
router.put("/deals/:id", protect, authorize("vendor"), requireApprovedVendor, updateVendorDeal);

// Vendor Coupons
router.get("/coupons", protect, authorize("vendor"), requireApprovedVendor, getPartnerCoupons);
router.post("/coupons", protect, authorize("vendor"), requireApprovedVendor, createPartnerCoupon);
router.put("/coupons/:id", protect, authorize("vendor"), requireApprovedVendor, updatePartnerCoupon);

// Partner Created Services CRUD
router.get("/created-services", protect, authorize("vendor"), requireApprovedVendor, getPartnerCreatedServices);
router.post("/created-services", protect, authorize("vendor"), requireApprovedVendor, createPartnerService);
router.put("/created-services/:id", protect, authorize("vendor"), requireApprovedVendor, updatePartnerService);
router.delete("/created-services/:id", protect, authorize("vendor"), requireApprovedVendor, deletePartnerService);

// Reviews & Replies
router.get("/reviews", protect, authorize("vendor"), requireApprovedVendor, getPartnerReviews);
router.post("/reviews/:id/reply", protect, authorize("vendor"), requireApprovedVendor, replyToReview);

module.exports = router;
