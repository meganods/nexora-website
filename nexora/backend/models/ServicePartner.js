const mongoose = require("mongoose");

const KYC_STATUS = [
  "NOT_STARTED",
  "REGISTERED",
  "KYC_NOT_STARTED",
  "KYC_IN_PROGRESS",
  "KYC_SUBMITTED",
  "PENDING_ADMIN_APPROVAL",
  "APPROVED",
  "REJECTED"
];

const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: [true, "Coordinates [longitude, latitude] are required"],
      validate: {
        validator: (coords) =>
          Array.isArray(coords) &&
          coords.length === 2 &&
          coords[0] >= -180 &&
          coords[0] <= 180 &&
          coords[1] >= -90 &&
          coords[1] <= 90,
        message: "Coordinates must be [longitude, latitude] within valid ranges",
      },
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

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

const servicePartnerSchema = new mongoose.Schema(
  {
    addresses: {
      type: [addressSchema],
      default: [],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian mobile number"],
    },
    name: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
      maxlength: [150, "Name cannot exceed 150 characters"],
    },
    dob: {
      type: Date,
      required: [true, "Date of Birth is required"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },
    category: {
      type: String,
      required: [true, "Service category is required"],
      trim: true,
      index: true,
    },
    kycStatus: {
      type: String,
      enum: {
        values: KYC_STATUS,
        message: "Invalid KYC status",
      },
      default: "KYC_NOT_STARTED",
    },
    kycDetails: {
      aadharNumber: { type: String, trim: true },
      panNumber: { type: String, trim: true },
      gstNumber: { type: String, trim: true },
      businessName: { type: String, trim: true },
      aadharVerified: { type: Boolean, default: false },
      panVerified: { type: Boolean, default: false },
      gstVerified: { type: Boolean, default: false },
      aadharName: { type: String, default: "" },
      aadharDob: { type: String, default: "" },
      panName: { type: String, default: "" },
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      reviewNote: { type: String, trim: true },
    },
    businessType: {
      type: String,
      enum: ['Individual', 'Proprietorship', 'Partnership', 'Company'],
      default: 'Individual'
    },
    experience: {
      type: Number,
      default: 0
    },
    teamSize: {
      type: Number,
      default: 1
    },
    businessDescription: {
      type: String,
      default: ""
    },
    primaryContact: {
      type: String,
      default: ""
    },
    bankDetails: {
      accountHolderName: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      accountType: { type: String, default: "" }
    },
    onboardingStep: {
      type: Number,
      default: 1
    },
    rejectionReason: {
      type: String,
      default: null
    },

    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    location: {
      type: locationSchema,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    customServices: [{
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      customPrice: { type: Number, default: null },
      isActive: { type: Boolean, default: true }
    }],
    availability: {
      days: { 
        type: [String], 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      slots: { 
        type: [String], 
        enum: ['Morning', 'Afternoon', 'Evening'],
        default: ['Morning', 'Afternoon', 'Evening']
      },
      customTimes: {
        type: [String],
        default: []
      }
    },
    serviceAreas: {
      type: [String],
      default: ['Delhi NCR']
    },
    serviceAreaIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area'
    }],
    profilePictureUrl: {
      type: String,
      default: ""
    },
    aboutMe: {
      type: String,
      default: ""
    },
    skills: {
      type: [String],
      default: []
    },
    certifications: {
      type: [String],
      default: []
    },
    languages: {
      type: [String],
      default: ['English', 'Hindi']
    },
    workingHours: {
      type: String,
      default: "Monday - Sunday: 9:00 AM - 8:00 PM"
    }
  },
  {
    timestamps: true,
  }
);

const bcrypt = require('bcryptjs');

servicePartnerSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

servicePartnerSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

servicePartnerSchema.index({ location: "2dsphere" });
servicePartnerSchema.index({ category: 1, isOnline: 1 });

module.exports = mongoose.model("ServicePartner", servicePartnerSchema);
