require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Country = require("../models/Country");
const State = require("../models/State");
const City = require("../models/City");
const Area = require("../models/Area");
const Pincode = require("../models/Pincode");
const ServicePartner = require("../models/ServicePartner");

const clearAllLocations = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB. Clearing location records...");

    const pDel = await Pincode.deleteMany({});
    console.log(`Deleted ${pDel.deletedCount} Pincodes.`);

    const aDel = await Area.deleteMany({});
    console.log(`Deleted ${aDel.deletedCount} Areas.`);

    const cDel = await City.deleteMany({});
    console.log(`Deleted ${cDel.deletedCount} Cities.`);

    const sDel = await State.deleteMany({});
    console.log(`Deleted ${sDel.deletedCount} States.`);

    const coDel = await Country.deleteMany({});
    console.log(`Deleted ${coDel.deletedCount} Countries.`);

    // Reset ServicePartner selections
    const partnerReset = await ServicePartner.updateMany(
      {},
      { $set: { serviceAreaIds: [], serviceAreas: [] } }
    );
    console.log(`Reset service locations for ${partnerReset.modifiedCount} Service Partners.`);

    console.log("Location database successfully cleared!");
    process.exit(0);
  } catch (err) {
    console.error("Error clearing location database:", err);
    process.exit(1);
  }
};

clearAllLocations();
