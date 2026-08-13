const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema(
  {
    countryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: [true, "Country ID is required"],
    },
    name: {
      type: String,
      required: [true, "State name is required"],
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
  },
  {
    timestamps: true,
  }
);

stateSchema.index({ countryId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("State", stateSchema);
