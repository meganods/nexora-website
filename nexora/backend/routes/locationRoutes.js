const express = require("express");
const router = express.Router();
const {
  createCountry, getCountries, updateCountry, deleteCountry,
  createState, getStates, updateState, deleteState,
  createCity, getCities, updateCity, deleteCity,
  createArea, getAreas, updateArea, deleteArea,
  createPincode, getPincodes, updatePincode, deletePincode,
  getPublicLocations, searchLocations
} = require("../controllers/locationController");

const { protect, authorize } = require("../middlewares/auth");

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/public", getPublicLocations);
router.get("/public/search", searchLocations);

// Fallbacks for public listings
router.get("/public/countries", getCountries);
router.get("/public/states", getStates);
router.get("/public/cities", getCities);
router.get("/public/areas", getAreas);
router.get("/public/pincodes", getPincodes);

// ─── Partner Routes ───────────────────────────────────────────────────────────
// Return active cities, areas, pincodes for selection
router.get("/partner/cities", protect, authorize("vendor"), getCities);
router.get("/partner/areas", protect, authorize("vendor"), getAreas);
router.get("/partner/pincodes", protect, authorize("vendor"), getPincodes);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
// Countries
router.post("/admin/countries", protect, authorize("super_admin", "admin"), createCountry);
router.get("/admin/countries", protect, authorize("super_admin", "admin", "support"), getCountries);
router.put("/admin/countries/:id", protect, authorize("super_admin", "admin"), updateCountry);
router.delete("/admin/countries/:id", protect, authorize("super_admin", "admin"), deleteCountry);

// States
router.post("/admin/states", protect, authorize("super_admin", "admin"), createState);
router.get("/admin/states", protect, authorize("super_admin", "admin", "support"), getStates);
router.put("/admin/states/:id", protect, authorize("super_admin", "admin"), updateState);
router.delete("/admin/states/:id", protect, authorize("super_admin", "admin"), deleteState);

// Cities
router.post("/admin/cities", protect, authorize("super_admin", "admin"), createCity);
router.get("/admin/cities", protect, authorize("super_admin", "admin", "support"), getCities);
router.put("/admin/cities/:id", protect, authorize("super_admin", "admin"), updateCity);
router.delete("/admin/cities/:id", protect, authorize("super_admin", "admin"), deleteCity);

// Areas
router.post("/admin/areas", protect, authorize("super_admin", "admin"), createArea);
router.get("/admin/areas", protect, authorize("super_admin", "admin", "support"), getAreas);
router.put("/admin/areas/:id", protect, authorize("super_admin", "admin"), updateArea);
router.delete("/admin/areas/:id", protect, authorize("super_admin", "admin"), deleteArea);

// Pincodes
router.post("/admin/pincodes", protect, authorize("super_admin", "admin"), createPincode);
router.get("/admin/pincodes", protect, authorize("super_admin", "admin", "support"), getPincodes);
router.put("/admin/pincodes/:id", protect, authorize("super_admin", "admin"), updatePincode);
router.delete("/admin/pincodes/:id", protect, authorize("super_admin", "admin"), deletePincode);

module.exports = router;
