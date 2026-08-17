const express = require("express");
const {
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
} = require("../controllers/adminController");

const {
  listCoupons, addCoupon, updateCoupon, deleteCoupon, reviewVendorCoupon,
  listBanners, addBanner, updateBanner, deleteBanner,
  listOffers, addOffer, updateOffer, deleteOffer, reviewVendorOffer,
  listSaleCampaigns, addSaleCampaign, updateSaleCampaign, deleteSaleCampaign,
} = require("../controllers/promotionController");

const {
  listPackages, addPackage, updatePackage, deletePackage,
} = require("../controllers/packageController");

const {
  listAdminDeals, createAdminDeal, getAdminDeal,
  updateAdminDeal, deleteAdminDeal, toggleDealStatus,
  toggleDealFeatured, reviewVendorDeal: reviewVendorDealAdmin,
} = require("../controllers/dealController");

const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post("/login", loginAdmin);

// ─── Vendors ──────────────────────────────────────────────────────────────────
router.get("/vendors", protect, authorize("super_admin", "admin", "support"), listVendors);
router.patch("/vendors/:id/verify", protect, authorize("super_admin", "admin"), verifyVendorKyc);
router.put("/vendors/:id/availability", protect, authorize("super_admin", "admin"), updateVendorAvailabilityByAdmin);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get("/users", protect, authorize("super_admin", "admin", "support"), listUsers);
router.patch("/users/:id/toggle", protect, authorize("super_admin", "admin"), toggleUserStatus);

// ─── Metrics ──────────────────────────────────────────────────────────────────
router.get("/metrics", protect, authorize("super_admin", "admin"), getDashboardMetrics);
router.get("/dashboard/pending-counts", protect, authorize("super_admin", "admin", "support"), getPendingCounts);

// ─── Categories ──────────────────────────────────────────────────────────────────────
router.get("/categories", protect, authorize("super_admin", "admin", "support"), getCategories);
router.get("/categories/:id", protect, authorize("super_admin", "admin", "support"), getCategoryById);
router.post("/categories", protect, authorize("super_admin", "admin"), addCategory);
router.put("/categories/:id", protect, authorize("super_admin", "admin"), updateCategory);
router.delete("/categories/:id", protect, authorize("super_admin", "admin"), deleteCategory);

// ─── Services ───────────────────────────────────────────────────────────────────────
router.get("/services", protect, authorize("super_admin", "admin", "support"), listServices);
router.get("/services/:id", protect, authorize("super_admin", "admin", "support"), async (req, res) => {
  const Service = require('../models/Service');
  const svc = await Service.findById(req.params.id).populate('categoryId', 'name');
  if (!svc) return res.status(404).json({ message: 'Service not found' });
  res.json({ success: true, service: svc });
});
router.post("/services", protect, authorize("super_admin", "admin"), addService);
router.put("/services/:id", protect, authorize("super_admin", "admin"), updateService);
router.delete("/services/:id", protect, authorize("super_admin", "admin"), deleteService);
router.patch("/services/:id/review", protect, authorize("super_admin", "admin"), reviewPartnerService);

// ─── Packages ───────────────────────────────────────────────────────────────────────
router.get("/packages", protect, authorize("super_admin", "admin", "support"), listPackages);
router.get("/packages/:id", protect, authorize("super_admin", "admin", "support"), async (req, res) => {
  const Package = require('../models/Package');
  const pkg = await Package.findById(req.params.id).populate('categoryIds', 'name').populate('includedServices', 'name basePrice');
  if (!pkg) return res.status(404).json({ message: 'Package not found' });
  res.json({ success: true, package: pkg });
});
router.post("/packages", protect, authorize("super_admin", "admin"), addPackage);
router.put("/packages/:id", protect, authorize("super_admin", "admin"), updatePackage);
router.delete("/packages/:id", protect, authorize("super_admin", "admin"), deletePackage);

// ─── Bookings ─────────────────────────────────────────────────────────────────
router.get("/bookings", protect, authorize("super_admin", "admin", "support"), listAllBookings);
router.post("/bookings/:id/cancel", protect, authorize("super_admin", "admin"), adminCancelBooking);
router.delete("/bookings/:id", protect, authorize("super_admin", "admin"), adminDeleteBooking);

// ─── Promotions: Coupons ───────────────────────────────────────────────────
router.get("/coupons", protect, authorize("super_admin", "admin"), listCoupons);
router.get("/coupons/:id", protect, authorize("super_admin", "admin"), async (req, res) => {
  const Coupon = require('../models/Coupon');
  const doc = await Coupon.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Coupon not found' });
  res.json({ success: true, coupon: doc });
});
router.post("/coupons", protect, authorize("super_admin", "admin"), addCoupon);
router.put("/coupons/:id", protect, authorize("super_admin", "admin"), updateCoupon);
router.delete("/coupons/:id", protect, authorize("super_admin", "admin"), deleteCoupon);
router.patch("/coupons/:id/review", protect, authorize("super_admin", "admin"), reviewVendorCoupon);

// ─── Promotions: Banners ──────────────────────────────────────────────────
router.get("/banners", protect, authorize("super_admin", "admin"), listBanners);
router.get("/banners/:id", protect, authorize("super_admin", "admin"), async (req, res) => {
  const Banner = require('../models/Banner');
  const doc = await Banner.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Banner not found' });
  res.json({ success: true, banner: doc });
});
router.post("/banners", protect, authorize("super_admin", "admin"), addBanner);
router.put("/banners/:id", protect, authorize("super_admin", "admin"), updateBanner);
router.delete("/banners/:id", protect, authorize("super_admin", "admin"), deleteBanner);

// ─── Promotions: Offers ────────────────────────────────────────────────────
router.get("/offers", protect, authorize("super_admin", "admin"), listOffers);
router.get("/offers/:id", protect, authorize("super_admin", "admin"), async (req, res) => {
  const Offer = require('../models/Offer');
  const doc = await Offer.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Offer not found' });
  res.json({ success: true, offer: doc });
});
router.post("/offers", protect, authorize("super_admin", "admin"), addOffer);
router.put("/offers/:id", protect, authorize("super_admin", "admin"), updateOffer);
router.delete("/offers/:id", protect, authorize("super_admin", "admin"), deleteOffer);
router.post("/offers/:id/review", protect, authorize("super_admin", "admin"), reviewVendorOffer);
router.patch("/offers/:id/review", protect, authorize("super_admin", "admin"), reviewVendorOffer);

// ─── Promotions: Sale Campaigns ───────────────────────────────────────────
router.get("/sale-campaigns", protect, authorize("super_admin", "admin"), listSaleCampaigns);
router.get("/sale-campaigns/:id", protect, authorize("super_admin", "admin"), async (req, res) => {
  const SaleCampaign = require('../models/SaleCampaign');
  const doc = await SaleCampaign.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Sale campaign not found' });
  res.json({ success: true, campaign: doc });
});
router.post("/sale-campaigns", protect, authorize("super_admin", "admin"), addSaleCampaign);
router.put("/sale-campaigns/:id", protect, authorize("super_admin", "admin"), updateSaleCampaign);
router.delete("/sale-campaigns/:id", protect, authorize("super_admin", "admin"), deleteSaleCampaign);

// ─── Promotions: Best Deals ───────────────────────────────────────────────────
router.get("/deals", protect, authorize("super_admin", "admin", "support"), listAdminDeals);
router.post("/deals", protect, authorize("super_admin", "admin"), createAdminDeal);
router.get("/deals/:id", protect, authorize("super_admin", "admin", "support"), getAdminDeal);
router.put("/deals/:id", protect, authorize("super_admin", "admin"), updateAdminDeal);
router.delete("/deals/:id", protect, authorize("super_admin", "admin"), deleteAdminDeal);
router.patch("/deals/:id/status", protect, authorize("super_admin", "admin"), toggleDealStatus);
router.patch("/deals/:id/featured", protect, authorize("super_admin", "admin"), toggleDealFeatured);
router.patch("/deals/:id/review", protect, authorize("super_admin", "admin"), reviewVendorDealAdmin);

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get("/settings", protect, authorize("super_admin", "admin"), getSettings);
router.put("/settings", protect, authorize("super_admin", "admin"), updateSettings);

// ─── Assignment Engine ────────────────────────────────────────────────────────
router.post("/assign/run", protect, authorize("super_admin", "admin"), triggerBatchAssign);
router.post("/assign/:bookingId", protect, authorize("super_admin", "admin"), assignSingleBooking);
router.get("/assign/:bookingId/preview", protect, authorize("super_admin", "admin"), previewAssignment);

// ─── Support Tickets (Admin) ──────────────────────────────────────────────────
router.get("/tickets", protect, authorize("super_admin", "admin", "support"), listSupportTickets);
router.get("/tickets/:id", protect, authorize("super_admin", "admin", "support"), getSupportTicketDetails);
router.post("/tickets/:id/reply", protect, authorize("super_admin", "admin"), replyToSupportTicketByAdmin);
router.put("/tickets/:ticketId/messages/:messageId", protect, authorize("super_admin", "admin"), editSupportTicketMessageByAdmin);
router.delete("/tickets/:ticketId/messages/:messageId", protect, authorize("super_admin", "admin"), deleteSupportTicketMessageByAdmin);

// ─── Contact Messages ─────────────────────────────────────────────────────────
router.get("/contact-messages", protect, authorize("super_admin", "admin", "support"), getContactMessages);
router.put("/contact-messages/:id/status", protect, authorize("super_admin", "admin"), updateContactMessageStatus);

// ─── Wallet & Payouts (Admin) ─────────────────────────────────────────────────
router.get("/wallet/balances", protect, authorize("super_admin", "admin"), getWalletBalances);
router.get("/wallet/payouts", protect, authorize("super_admin", "admin"), getPayoutLogs);
router.post("/wallet/payouts", protect, authorize("super_admin", "admin"), createPayout);

// ─── Reviews Approvals (Admin) ─────────────────────────────────────────────────
router.get("/reviews/pending", protect, authorize("super_admin", "admin", "support"), getPendingReviews);
router.patch("/reviews/:id/review", protect, authorize("super_admin", "admin"), reviewUserReview);
router.delete("/reviews/:id/reply", protect, authorize("super_admin", "admin"), deleteVendorReply);

module.exports = router;
