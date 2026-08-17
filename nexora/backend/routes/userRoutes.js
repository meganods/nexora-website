const express = require("express");
const {
  loginUser,
  requestSignupOtp,
  verifySignupOtp,
  loginUserPassword,
  loginGoogle,
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/userController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.post("/login", loginUser);
router.post("/request-signup-otp", requestSignupOtp);
router.post("/verify-signup-otp", verifySignupOtp);
router.post("/login-password", loginUserPassword);
router.post("/login-google", loginGoogle);

router
  .route("/profile")
  .get(protect, getProfile)
  .put(protect, updateProfile);

router
  .route("/addresses")
  .get(protect, getAddresses)
  .post(protect, addAddress);

router
  .route("/addresses/:addressId")
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

module.exports = router;
