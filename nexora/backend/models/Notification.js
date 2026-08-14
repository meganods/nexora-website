const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipientType: {
      type: String,
      enum: ["admin", "vendor", "user"],
      required: true,
    },

    // Content
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },

    // Category / type — used for icon selection on the frontend
    type: {
      type: String,
      enum: ["booking", "approval", "payment", "system", "promo", "review", "support"],
      default: "system",
    },

    // Optional metadata (bookingId, vendorId, etc.)
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound index for fast per-recipient queries
notificationSchema.index({ recipientId: 1, recipientType: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
