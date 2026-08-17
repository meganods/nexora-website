require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Nexora API is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/public", require("./routes/publicRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/user/dashboard", require("./routes/userDashboardRoutes"));
app.use("/api/partner", require("./routes/partnerRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/promotions", require("./routes/promotionRoutes"));
app.use("/api/webhooks", require("./routes/webhookRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/locations", require("./routes/locationRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `${field} already exists.` });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Nexora API listening on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    
    // Prevent Render Free Tier from sleeping
    const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    setInterval(() => {
      fetch(`${BACKEND_URL}/api/health`).catch(err => console.error("Ping failed:", err.message));
    }, 14 * 60 * 1000); // 14 minutes
  });
};

startServer();

module.exports = app;
