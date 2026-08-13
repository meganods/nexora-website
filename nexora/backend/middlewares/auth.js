const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ServicePartner = require("../models/ServicePartner");
const Admin = require("../models/Admin");
const asyncHandler = require("../utils/asyncHandler");

const ACCOUNT_TYPES = {
  user: User,
  vendor: ServicePartner,
};

const ADMIN_ROLES = ["super_admin", "admin", "support"];

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token.",
    });
  }

  const { id, role } = decoded;

  if (!id || !role) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid token payload.",
    });
  }

  let account;

  if (role === "user" || role === "vendor") {
    account = await ACCOUNT_TYPES[role].findById(id);

    if (!account || !account.isActive) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Account not found or deactivated.",
      });
    }

    req.user = {
      id: account._id,
      _id: account._id,
      userId: account._id,
      role,
      account,
    };
  } else if (ADMIN_ROLES.includes(role)) {
    account = await Admin.findById(id);

    if (!account || !account.isActive) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Account not found or deactivated.",
      });
    }

    req.user = {
      id: account._id,
      _id: account._id,
      userId: account._id,
      role: account.role,
      account,
    };
  } else {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Unknown role.",
    });
  }

  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized.",
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(" or ")}.`,
    });
  }

  next();
};

const requireApprovedVendor = asyncHandler(async (req, res, next) => {
  if (req.user?.role === 'vendor') {
    // If they are a vendor, they MUST have kycStatus === 'APPROVED' to access operational routes
    if (req.user?.account?.kycStatus !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Your partner application is not approved yet."
      });
    }
  }
  next();
});

module.exports = { protect, authorize, requireApprovedVendor };
