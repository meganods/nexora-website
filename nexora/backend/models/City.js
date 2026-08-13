const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: [true, "State ID is required"],
    },
    name: {
      type: String,
      required: [true, "City name is required"],
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    banner: {
      type: String,
      default: "",
    },
    popular: {
      type: Boolean,
      default: false,
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
      required: [true, "City slug is required for SEO"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    supportedServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
  },
  {
    timestamps: true,
  }
);

citySchema.index({ stateId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("City", citySchema);
