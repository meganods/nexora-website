const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: "Home",
    },
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    houseNo: { type: String, trim: true },
    street: { type: String, trim: true },
    landmark: { type: String, trim: true },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
    stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
    pincodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pincode' },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      match: [/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian mobile number"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const bcrypt = require('bcryptjs');

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
