require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Country = require("../models/Country");
const State = require("../models/State");
const City = require("../models/City");
const Area = require("../models/Area");
const Pincode = require("../models/Pincode");
const ServicePartner = require("../models/ServicePartner");

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

const runMigration = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for service areas migration...");

    // Create a default Country
    let country = await Country.findOne({ code: "IN" });
    if (!country) {
      country = new Country({ name: "India", code: "IN", isActive: true });
      await country.save();
      console.log("Default Country (India/IN) created.");
    }

    // Create a default State
    let state = await State.findOne({ countryId: country._id, name: "Delhi NCR" });
    if (!state) {
      state = new State({ countryId: country._id, name: "Delhi NCR", isActive: true });
      await state.save();
      console.log("Default State (Delhi NCR) created.");
    }

    // Create a default City
    let city = await City.findOne({ stateId: state._id, name: "Delhi" });
    if (!city) {
      city = new City({
        stateId: state._id,
        name: "Delhi",
        isActive: true,
        slug: "delhi",
        popular: true,
        latitude: 28.6139,
        longitude: 77.209,
      });
      await city.save();
      console.log("Default City (Delhi) created.");
    }

    const partners = await ServicePartner.find({});
    console.log(`Found ${partners.length} partners to migrate.`);

    for (let partner of partners) {
      if (partner.serviceAreas && partner.serviceAreas.length > 0) {
        console.log(`Migrating service areas for partner ${partner.name}: ${partner.serviceAreas.join(", ")}`);
        const areaIds = [];

        for (let areaStr of partner.serviceAreas) {
          const trimmedName = areaStr.trim();
          if (!trimmedName) continue;

          let area = await Area.findOne({ cityId: city._id, name: { $regex: `^${trimmedName}$`, $options: "i" } });
          if (!area) {
            area = new Area({
              cityId: city._id,
              name: trimmedName,
              isActive: true,
              slug: slugify(trimmedName),
              latitude: city.latitude,
              longitude: city.longitude,
            });
            await area.save();
            console.log(`Created Area: ${trimmedName}`);
          }
          areaIds.push(area._id);
        }

        partner.serviceAreaIds = areaIds;
        await partner.save();
        console.log(`Updated partner ${partner.name} with ${areaIds.length} serviceAreaIds.`);
      }
    }

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
