const express = require("express");
const {
  loginUser,
  signupUser,
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
router.post("/signup", signupUser);
router.post("/login-password", loginUserPassword);
router.post("/login-google", loginGoogle);

router
  .route("/profile")
  .get(protect, authorize("user"), getProfile)
  .put(protect, authorize("user"), updateProfile);

router
  .route("/addresses")
  .get(protect, authorize("user"), getAddresses)
  .post(protect, authorize("user"), addAddress);

router
  .route("/addresses/:addressId")
  .put(protect, authorize("user"), updateAddress)
  .delete(protect, authorize("user"), deleteAddress);

module.exports = router;
