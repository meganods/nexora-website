const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

// ─── Internal helper used by other controllers ─────────────────────────────────
/**
 * createNotification — call this from booking/partner controllers to trigger live alerts.
 * @param {string} recipientId   - ObjectId of the recipient
 * @param {string} recipientType - "admin" | "vendor" | "user"
 * @param {string} title
 * @param {string} body
 * @param {string} type          - "booking" | "approval" | "payment" | "system" | "promo"
 * @param {object} metadata      - optional extra data (bookingId, etc.)
 */
const createNotification = async (recipientId, recipientType, title, body, type = "system", metadata = {}) => {
  try {
    await Notification.create({ recipientId, recipientType, title, body, type, metadata });
  } catch (err) {
    // Never throw — notifications must not break core flows
    console.error("[Notification] Failed to create:", err.message);
  }
};

// ─── GET /api/notifications ────────────────────────────────────────────────────
// Returns last 50 notifications for the authenticated user (any role)
const getNotifications = asyncHandler(async (req, res) => {
  const { id, role } = req.user;

  // Determine recipientType from role
  let recipientType;
  if (role === "user") recipientType = "user";
  else if (role === "vendor") recipientType = "vendor";
  else recipientType = "admin"; // super_admin, admin, support

  const notifications = await Notification.find({
    recipientId: id,
    recipientType,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const unreadCount = await Notification.countDocuments({
    recipientId: id,
    recipientType,
    isRead: false,
  });

  res.json({ success: true, data: notifications, unreadCount });
});

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
const markOneRead = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  let recipientType = role === "user" ? "user" : role === "vendor" ? "vendor" : "admin";

  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: userId, recipientType },
    { isRead: true },
    { new: true }
  );

  if (!notif) return res.status(404).json({ success: false, message: "Notification not found." });

  res.json({ success: true, data: notif });
});

// ─── PATCH /api/notifications/read-all ────────────────────────────────────────
const markAllRead = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  let recipientType = role === "user" ? "user" : role === "vendor" ? "vendor" : "admin";

  await Notification.updateMany(
    { recipientId: userId, recipientType, isRead: false },
    { isRead: true }
  );

  res.json({ success: true, message: "All notifications marked as read." });
});

// ─── POST /api/notifications/admin/broadcast ──────────────────────────────────
// Admin-only: send a system notification to all users/vendors
const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, body, recipientType, type } = req.body;

  if (!title || !body || !recipientType) {
    return res.status(400).json({ success: false, message: "title, body and recipientType are required." });
  }

  let Model;
  if (recipientType === "user") Model = require("../models/User");
  else if (recipientType === "vendor") Model = require("../models/ServicePartner");
  else return res.status(400).json({ success: false, message: "recipientType must be 'user' or 'vendor'." });

  const recipients = await Model.find({ isActive: true }).select("_id").lean();

  const docs = recipients.map((r) => ({
    recipientId: r._id,
    recipientType,
    title,
    body,
    type: type || "system",
  }));

  await Notification.insertMany(docs, { ordered: false });

  res.json({ success: true, message: `Broadcast sent to ${docs.length} ${recipientType}s.` });
});

module.exports = {
  createNotification,
  getNotifications,
  markOneRead,
  markAllRead,
  broadcastNotification,
};
