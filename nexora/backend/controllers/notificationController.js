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
// Returns paginated notifications. Supports ?type=booking&page=1&limit=20&unreadOnly=true
const getNotifications = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  const { type, page = 1, limit = 20, unreadOnly } = req.query;

  // Determine recipientType from role
  let recipientType;
  if (role === "user") recipientType = "user";
  else if (role === "vendor") recipientType = "vendor";
  else recipientType = "admin"; // super_admin, admin, support

  const filter = { recipientId: id, recipientType };
  if (type && type !== "all") filter.type = type;
  if (unreadOnly === "true") filter.isRead = false;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientId: id, recipientType, isRead: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasMore: pageNum * limitNum < total,
    },
  });
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

const broadcastToAll = async (title, body, type = "system", metadata = {}) => {
  try {
    const User = require("../models/User");
    const ServicePartner = require("../models/ServicePartner");
    const [users, vendors] = await Promise.all([
      User.find({ isActive: true }).select("_id").lean(),
      ServicePartner.find({ isActive: true }).select("_id").lean()
    ]);
    const docs = [
      ...users.map(u => ({ recipientId: u._id, recipientType: "user", title, body, type, metadata })),
      ...vendors.map(v => ({ recipientId: v._id, recipientType: "vendor", title, body, type, metadata }))
    ];
    if (docs.length > 0) {
      await Notification.insertMany(docs, { ordered: false });
    }
  } catch (err) {
    console.error("[Notification] Broadcast all failed:", err.message);
  }
};

const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { role } = req.user;
  const recipientType = role === "user" ? "user" : role === "vendor" ? "vendor" : "admin";

  const notif = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipientId: userId,
    recipientType
  });

  if (!notif) {
    return res.status(404).json({ success: false, message: "Notification not found." });
  }

  res.json({ success: true, message: "Notification deleted successfully." });
});

module.exports = {
  createNotification,
  getNotifications,
  markOneRead,
  markAllRead,
  broadcastNotification,
  broadcastToAll,
  deleteNotification,
};
