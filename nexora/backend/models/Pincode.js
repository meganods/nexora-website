const mongoose = require("mongoose");

const pincodeSchema = new mongoose.Schema(
  {
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: [true, "City ID is required"],
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      required: [true, "Area ID is required"],
    },
    code: {
      type: String,
      required: [true, "Pincode code is required"],
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
  },
  {
    timestamps: true,
  }
);

pincodeSchema.index({ areaId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Pincode", pincodeSchema);
