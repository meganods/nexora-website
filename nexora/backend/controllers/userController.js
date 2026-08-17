const User = require("../models/User");
const ServicePartner = require("../models/ServicePartner");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");
const { storeOtp, verifyOtp } = require("../utils/mockOtp");
const asyncHandler = require("../utils/asyncHandler");

const PHONE_REGEX = /^[6-9]\d{9}$/;

const { sendOTP } = require("../services/emailService");

const pendingUsers = new Map();

// @desc    Request OTP for User Signup
// @route   POST /api/user/request-signup-otp
// @access  Public
const requestSignupOtp = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email, and password are required." });
  }

  // Check unique constraints
  let existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    return res.status(400).json({ success: false, message: "An account with this email address already exists." });
  }

  if (phone) {
    let existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: "An account with this phone number already exists." });
    }
  }

  const generatedOtp = storeOtp(email.toLowerCase());
  pendingUsers.set(email.toLowerCase(), { name, email: email.toLowerCase(), phone, password });
  
  const emailSent = await sendOTP(email.toLowerCase(), generatedOtp);
  if (!emailSent) {
    return res.status(500).json({ success: false, message: "Failed to send OTP to email. Please try again." });
  }

  res.status(200).json({
    success: true,
    message: "OTP sent to email successfully.",
    ...(process.env.NODE_ENV !== "production" && { otp: generatedOtp }),
  });
});

// @desc    Verify OTP and Create User
// @route   POST /api/user/verify-signup-otp
// @access  Public
const verifySignupOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required." });
  }

  const otpResult = verifyOtp(email.toLowerCase(), otp);
  if (!otpResult.valid) {
    return res.status(400).json({ success: false, message: otpResult.message });
  }

  const pendingUserData = pendingUsers.get(email.toLowerCase());
  if (!pendingUserData) {
    return res.status(400).json({ success: false, message: "Signup session expired. Please register again." });
  }

  const user = await User.create({
    name: pendingUserData.name.trim(),
    email: pendingUserData.email,
    phone: pendingUserData.phone || undefined,
    password: pendingUserData.password
  });

  pendingUsers.delete(email.toLowerCase());

  res.status(201).json({
    success: true,
    message: "Registration successful.",
  });
});

// @desc    Login a customer using Email/Phone and Password
// @route   POST /api/user/login-password
// @access  Public
const loginUserPassword = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: "Email/Phone and password are required." });
  }

  // Find user by email or phone
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phone: identifier }
    ]
  }).select("+password");

  if (!user || !user.password) {
    return res.status(401).json({ success: false, message: "Invalid email, phone, or password." });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid email, phone, or password." });
  }

  const token = generateToken({ id: user._id, role: "user" });

  res.status(200).json({
    success: true,
    message: "Login successful.",
    token,
    user
  });
});

// @desc    Request OTP or verify OTP & login/signup
// @route   POST /api/user/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { phone, otp, name, email } = req.body;

  if (!phone || !PHONE_REGEX.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "A valid 10-digit phone number is required.",
    });
  }

  if (!otp) {
    const generatedOtp = storeOtp(phone);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
      ...(process.env.NODE_ENV !== "production" && { otp: generatedOtp }),
    });
  }

  const otpResult = verifyOtp(phone, otp);

  if (!otpResult.valid) {
    return res.status(401).json({
      success: false,
      message: otpResult.message,
    });
  }

  let user = await User.findOne({ phone });
  const isNewUser = !user;

  if (isNewUser) {
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required for new user registration.",
      });
    }

    user = await User.create({ phone, name: name.trim(), email });
  }

  const token = generateToken({ id: user._id, role: "user" });

  res.status(isNewUser ? 201 : 200).json({
    success: true,
    message: isNewUser ? "Account created successfully." : "Login successful.",
    token,
    user,
  });
});

// @desc    Get logged-in user profile
// @route   GET /api/user/profile
// @access  Private (user)
const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.account,
  });
});

// @desc    Update logged-in user profile
// @route   PUT /api/user/profile
// @access  Private (user)
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, profilePhoto, password } = req.body;
  
  let user;
  if (req.user.role === "user") {
    user = await User.findById(req.user.id);
  } else if (req.user.role === "vendor") {
    user = await ServicePartner.findById(req.user.id);
  } else {
    user = await Admin.findById(req.user.id);
  }

  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
  if (password !== undefined && password.trim() !== "") user.password = password;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user,
  });
});

// @desc    Get all addresses
// @route   GET /api/user/addresses
// @access  Private (user)
const getAddresses = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    addresses: req.user.account.addresses,
  });
});

// @desc    Add a new address
// @route   POST /api/user/addresses
// @access  Private (user)
const addAddress = asyncHandler(async (req, res) => {
  const user = req.user.account;
  const { label, line1, line2, city, state, pincode, isDefault } = req.body;

  if (!line1 || !city || !state || !pincode) {
    return res.status(400).json({
      success: false,
      message: "line1, city, state, and pincode are required.",
    });
  }

  if (isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  user.addresses.push({ label, line1, line2, city, state, pincode, isDefault });

  if (user.addresses.length === 1) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.status(201).json({
    success: true,
    message: "Address added successfully.",
    addresses: user.addresses,
  });
});

// @desc    Update an address
// @route   PUT /api/user/addresses/:addressId
// @access  Private (user)
const updateAddress = asyncHandler(async (req, res) => {
  const user = req.user.account;
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    return res.status(404).json({
      success: false,
      message: "Address not found.",
    });
  }

  const { label, line1, line2, city, state, pincode, isDefault } = req.body;

  if (label !== undefined) address.label = label;
  if (line1 !== undefined) address.line1 = line1;
  if (line2 !== undefined) address.line2 = line2;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (pincode !== undefined) address.pincode = pincode;

  if (isDefault === true) {
    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === address._id.toString();
    });
  } else if (isDefault === false) {
    address.isDefault = false;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Address updated successfully.",
    addresses: user.addresses,
  });
});

// @desc    Delete an address
// @route   DELETE /api/user/addresses/:addressId
// @access  Private (user)
const deleteAddress = asyncHandler(async (req, res) => {
  const user = req.user.account;
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    return res.status(404).json({
      success: false,
      message: "Address not found.",
    });
  }

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Address deleted successfully.",
    addresses: user.addresses,
  });
});

// @desc    Verify Google login token and register/login user
// @route   POST /api/user/login-google
// @access  Public
const loginGoogle = asyncHandler(async (req, res) => {
  const { googleId, email, name, profilePhoto } = req.body;

  if (!googleId || !email) {
    return res.status(400).json({
      success: false,
      message: "googleId and email are required for social login."
    });
  }

  // 1. Search for existing user with this googleId
  let user = await User.findOne({ googleId });

  if (!user) {
    // 2. Fallback search by email
    user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // User exists with email but no googleId attached — link them
      user.googleId = googleId;
      if (profilePhoto && !user.profilePhoto) {
        user.profilePhoto = profilePhoto;
      }
      await user.save();
    } else {
      // 3. New User Registration
      user = await User.create({
        googleId,
        email: email.toLowerCase(),
        name: name || 'Google User',
        profilePhoto: profilePhoto || null
      });
    }
  }

  const token = generateToken({ id: user._id, role: "user" });

  res.status(200).json({
    success: true,
    message: "Google login successful.",
    token,
    user
  });
});

module.exports = {
  requestSignupOtp,
  verifySignupOtp,
  loginUserPassword,
  loginUser,
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  loginGoogle
};
