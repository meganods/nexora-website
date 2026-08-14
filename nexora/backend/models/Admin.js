const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ADMIN_ROLES = ["super_admin", "admin", "support"];

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

const adminSchema = new mongoose.Schema(
  {
    addresses: {
      type: [addressSchema],
      default: [],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ADMIN_ROLES,
        message: "Invalid admin role",
      },
      default: "admin",
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

adminSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.toJSON = function toJSON() {
  const admin = this.toObject();
  delete admin.password;
  return admin;
};

module.exports = mongoose.model("Admin", adminSchema);
