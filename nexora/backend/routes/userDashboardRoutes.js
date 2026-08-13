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
} = require("../controllers/userDashboardController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.get("/overview", getDashboardOverview);
router.get("/bookings", getUserBookings);

// Addresses CRUD
router.post("/addresses", addAddress);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);

// Reviews & Ratings
router.get("/reviews", getUserReviews);
router.post("/reviews", submitReview);

// Support tickets
router.post("/tickets", createSupportTicket);
router.get("/tickets", listTickets);
router.get("/tickets/:ticketId", getTicketDetails);
router.post("/tickets/:ticketId/reply", replyToTicket);

module.exports = router;
