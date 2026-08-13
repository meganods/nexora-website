const express = require("express");
const {
  getNotifications,
  markOneRead,
  markAllRead,
  broadcastNotification,
  deleteNotification,
} = require("../controllers/notificationController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

// All authenticated users (user, vendor, admin) can fetch their notifications
router.get("/", protect, getNotifications);

// Mark single notification as read (must be own notification — enforced in controller)
router.patch("/:id/read", protect, markOneRead);

// Mark all notifications as read
router.patch("/read-all", protect, markAllRead);

// Admin-only: broadcast a notification to all users or vendors
router.post(
  "/admin/broadcast",
  protect,
  authorize("super_admin", "admin"),
  broadcastNotification
);

router.delete("/:id", protect, deleteNotification);

module.exports = router;
