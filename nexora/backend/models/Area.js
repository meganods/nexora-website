const mongoose = require("mongoose");

const areaSchema = new mongoose.Schema(
  {
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: [true, "City ID is required"],
    },
    name: {
      type: String,
      required: [true, "Area name is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    slug: {
      type: String,
      required: [true, "Area slug is required for SEO"],
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

areaSchema.index({ cityId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Area", areaSchema);
