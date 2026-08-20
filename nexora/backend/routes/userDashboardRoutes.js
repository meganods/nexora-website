const express = require("express");
const {
  getDashboardOverview,
  getUserBookings,
  addAddress,
  updateAddress,
  deleteAddress,
  submitReview,
  getUserReviews,
  createSupportTicket,
  listTickets,
  getTicketDetails,
  replyToTicket,
  editTicketMessage,
  deleteTicketMessage,
  getUserWishlist,
  toggleWishlist,
  getSearchHistory,
  saveSearchHistory,
  clearSearchHistory,
} = require("../controllers/userDashboardController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);
router.use(authorize('user'));

router.get("/overview", getDashboardOverview);
router.get("/bookings", getUserBookings);

// Addresses CRUD
router.post("/addresses", addAddress);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);

// Reviews & Ratings
router.get("/reviews", getUserReviews);
router.post("/reviews", submitReview);

// Wishlist — user accounts only
router.get("/wishlist", authorize('user'), getUserWishlist);
router.post("/wishlist/toggle", authorize('user'), toggleWishlist);

// Search History
router.get("/search-history", getSearchHistory);
router.post("/search-history", saveSearchHistory);
router.delete("/search-history", clearSearchHistory);

// Support tickets
router.post("/tickets", createSupportTicket);
router.get("/tickets", listTickets);
router.get("/tickets/:ticketId", getTicketDetails);
router.post("/tickets/:ticketId/reply", replyToTicket);
router.put("/tickets/:ticketId/messages/:messageId", editTicketMessage);
router.delete("/tickets/:ticketId/messages/:messageId", deleteTicketMessage);

module.exports = router;

