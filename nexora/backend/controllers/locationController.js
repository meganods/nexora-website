const Country = require("../models/Country");
const State = require("../models/State");
const City = require("../models/City");
const Area = require("../models/Area");
const Pincode = require("../models/Pincode");
const Category = require("../models/Category");
const ServicePartner = require("../models/ServicePartner");
const mongoose = require("mongoose");

// ==========================================
// ADMIN LOCATION CONTROLLERS
// ==========================================

// ─── Country CRUD ─────────────────────────
exports.createCountry = async (req, res) => {
  try {
    const { name, code, isActive } = req.body;
    const country = new Country({ name, code, isActive });
    await country.save();
    res.status(201).json({ success: true, data: country });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getCountries = async (req, res) => {
  try {
    const { q, page = 1, limit = 10, isActive } = req.query;
    const filter = { isDeleted: false };
    if (q) filter.name = { $regex: q, $options: "i" };
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const total = await Country.countDocuments(filter);
    const countries = await Country.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, total, pages: Math.ceil(total / limit), data: countries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCountry = async (req, res) => {
  try {
    const country = await Country.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!country) return res.status(404).json({ success: false, message: "Country not found" });
    res.json({ success: true, data: country });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteCountry = async (req, res) => {
  try {
    const country = await Country.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!country) return res.status(404).json({ success: false, message: "Country not found" });
    res.json({ success: true, message: "Country soft-deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── State CRUD ───────────────────────────
exports.createState = async (req, res) => {
  try {
    const { countryId, name, isActive } = req.body;
    const state = new State({ countryId, name, isActive });
    await state.save();
    res.status(201).json({ success: true, data: state });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getStates = async (req, res) => {
  try {
    const { q, countryId, page = 1, limit = 10, isActive } = req.query;
    const filter = { isDeleted: false };
    if (q) filter.name = { $regex: q, $options: "i" };
    if (countryId) filter.countryId = countryId;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const total = await State.countDocuments(filter);
    const states = await State.find(filter)
      .populate("countryId", "name code")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, total, pages: Math.ceil(total / limit), data: states });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateState = async (req, res) => {
  try {
    const state = await State.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!state) return res.status(404).json({ success: false, message: "State not found" });
    res.json({ success: true, data: state });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteState = async (req, res) => {
  try {
    const state = await State.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!state) return res.status(404).json({ success: false, message: "State not found" });
    res.json({ success: true, message: "State soft-deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createCity = async (req, res) => {
  try {
    let { stateId, name, image, banner, popular, isActive, latitude, longitude, displayOrder, slug, supportedServices } = req.body;
    
    if (!stateId) {
      let country = await Country.findOne({ name: "India" });
      if (!country) {
        country = await Country.create({ name: "India", code: "IN", isActive: true });
      }
      let state = await State.findOne({ countryId: country._id });
      if (!state) {
        state = await State.create({ countryId: country._id, name: "Delhi NCR", isActive: true });
      }
      stateId = state._id;
    }

    const city = new City({
      stateId,
      name,
      image,
      banner,
      popular,
      isActive,
      latitude,
      longitude,
      displayOrder,
      slug,
      supportedServices,
    });
    await city.save();
    res.status(201).json({ success: true, data: city });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getCities = async (req, res) => {
  try {
    const { q, stateId, popular, page = 1, limit = 10, isActive } = req.query;
    const filter = { isDeleted: false };
    if (q) filter.name = { $regex: q, $options: "i" };
    if (stateId) filter.stateId = stateId;
    if (popular !== undefined) filter.popular = popular === "true";
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const total = await City.countDocuments(filter);
    const cities = await City.find(filter)
      .populate("stateId", "name")
      .populate("supportedServices", "name slug")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ displayOrder: 1, name: 1 });

    res.json({ success: true, total, pages: Math.ceil(total / limit), data: cities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCity = async (req, res) => {
  try {
    const city = await City.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!city) return res.status(404).json({ success: false, message: "City not found" });
    res.json({ success: true, data: city });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteCity = async (req, res) => {
  try {
    const city = await City.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!city) return res.status(404).json({ success: false, message: "City not found" });
    res.json({ success: true, message: "City soft-deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── Area CRUD ────────────────────────────
exports.createArea = async (req, res) => {
  try {
    const { cityId, name, isActive, latitude, longitude, displayOrder, slug } = req.body;
    const area = new Area({ cityId, name, isActive, latitude, longitude, displayOrder, slug });
    await area.save();

    const { broadcastToAll } = require('./notificationController');
    await broadcastToAll(
      "New Service Area Added!",
      `Nexora has launched services in a new area: ${name}!`,
      "system",
      { areaId: area._id }
    );

    res.status(201).json({ success: true, data: area });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAreas = async (req, res) => {
  try {
    const { q, cityId, page = 1, limit = 10, isActive } = req.query;
    const filter = { isDeleted: false };
    if (q) filter.name = { $regex: q, $options: "i" };
    if (cityId) filter.cityId = cityId;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const total = await Area.countDocuments(filter);
    const areas = await Area.find(filter)
      .populate("cityId", "name slug stateId")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ displayOrder: 1, name: 1 });

    res.json({ success: true, total, pages: Math.ceil(total / limit), data: areas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateArea = async (req, res) => {
  try {
    const area = await Area.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!area) return res.status(404).json({ success: false, message: "Area not found" });
    res.json({ success: true, data: area });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteArea = async (req, res) => {
  try {
    const area = await Area.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!area) return res.status(404).json({ success: false, message: "Area not found" });
    res.json({ success: true, message: "Area soft-deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── Pincode CRUD ─────────────────────────
exports.createPincode = async (req, res) => {
  try {
    const { cityId, areaId, code, isActive, latitude, longitude } = req.body;
    const pincode = new Pincode({ cityId, areaId, code, isActive, latitude, longitude });
    await pincode.save();
    res.status(201).json({ success: true, data: pincode });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getPincodes = async (req, res) => {
  try {
    const { q, areaId, cityId, page = 1, limit = 10, isActive } = req.query;
    const filter = { isDeleted: false };
    if (q) filter.code = { $regex: q, $options: "i" };
    if (areaId) filter.areaId = areaId;
    if (cityId) filter.cityId = cityId;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const total = await Pincode.countDocuments(filter);
    const pincodes = await Pincode.find(filter)
      .populate("cityId", "name")
      .populate("areaId", "name")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ code: 1 });

    res.json({ success: true, total, pages: Math.ceil(total / limit), data: pincodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePincode = async (req, res) => {
  try {
    const pincode = await Pincode.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!pincode) return res.status(404).json({ success: false, message: "Pincode not found" });
    res.json({ success: true, data: pincode });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deletePincode = async (req, res) => {
  try {
    const pincode = await Pincode.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!pincode) return res.status(404).json({ success: false, message: "Pincode not found" });
    res.json({ success: true, message: "Pincode soft-deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// PUBLIC & VENDOR LOCATION CONTROLLERS
// ==========================================

// Get public hierarchy wise locations
exports.getPublicLocations = async (req, res) => {
  try {
    // Return structured locations: Countries -> States -> Cities -> Areas -> Pincodes (only isActive: true)
    const countries = await Country.find({ isActive: true, isDeleted: false });
    const states = await State.find({ isActive: true, isDeleted: false });
    const cities = await City.find({ isActive: true, isDeleted: false }).sort({ displayOrder: 1, name: 1 });
    const areas = await Area.find({ isActive: true, isDeleted: false }).sort({ displayOrder: 1, name: 1 });
    const pincodes = await Pincode.find({ isActive: true, isDeleted: false }).sort({ code: 1 });

    res.json({
      success: true,
      data: {
        countries,
        states,
        cities,
        areas,
        pincodes,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Customer and Partner Search Auto-complete
exports.searchLocations = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.json({ success: true, data: [] });
    }

    const regex = { $regex: q, $options: "i" };

    const matchingCities = await City.find({ name: regex, isActive: true, isDeleted: false }).limit(5);
    const matchingAreas = await Area.find({ name: regex, isActive: true, isDeleted: false }).populate("cityId").limit(5);
    const matchingPincodes = await Pincode.find({ code: regex, isActive: true, isDeleted: false }).populate("areaId cityId").limit(5);

    const results = [];

    matchingCities.forEach(c => {
      results.push({ type: "city", id: c._id, name: c.name, slug: c.slug, display: c.name });
    });

    matchingAreas.forEach(a => {
      const cityName = a.cityId ? a.cityId.name : "";
      results.push({ type: "area", id: a._id, name: a.name, slug: a.slug, cityId: a.cityId ? a.cityId._id : null, display: `${a.name}, ${cityName}` });
    });

    matchingPincodes.forEach(p => {
      const areaName = p.areaId ? p.areaId.name : "";
      const cityName = p.cityId ? p.cityId.name : "";
      results.push({ type: "pincode", id: p._id, name: p.code, code: p.code, areaId: p.areaId ? p.areaId._id : null, cityId: p.cityId ? p.cityId._id : null, display: `${p.code} (${areaName}, ${cityName})` });
    });

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
