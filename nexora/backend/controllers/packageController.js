const asyncHandler = require('../utils/asyncHandler');
const Package = require('../models/Package');
const applyCampaignDiscounts = require('../utils/campaignHelper');

// ─── Admin: Package CRUD ──────────────────────────────────────────────────────

// @desc    List all packages (admin)
// @route   GET /api/admin/packages
const listPackages = asyncHandler(async (req, res) => {
  const packages = await Package.find()
    .populate('includedServices', 'name basePrice imageUrl slug')
    .populate('categoryIds', 'name slug')
    .sort({ displayOrder: 1, createdAt: -1 });
  res.json({ success: true, packages });
});

// @desc    Create a package
// @route   POST /api/admin/packages
const addPackage = asyncHandler(async (req, res) => {
  const pkg = await Package.create(req.body);
  res.status(201).json({ success: true, package: pkg });
});

// @desc    Update a package
// @route   PUT /api/admin/packages/:id
const updatePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('includedServices', 'name basePrice imageUrl slug');
  if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
  res.json({ success: true, package: pkg });
});

// @desc    Delete a package
// @route   DELETE /api/admin/packages/:id
const deletePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findByIdAndDelete(req.params.id);
  if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
  res.json({ success: true, message: 'Package deleted successfully' });
});

// ─── Public: Package Endpoints ────────────────────────────────────────────────

// @desc    Get all active packages (public)
// @route   GET /api/public/packages
const getPublicPackages = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.featured === 'true') filter.isFeatured = true;

  const packages = await Package.find(filter)
    .populate('includedServices', 'name basePrice imageUrl slug estimatedDurationMins')
    .populate('categoryIds', 'name slug')
    .sort({ displayOrder: 1, createdAt: -1 });

  const discounted = await applyCampaignDiscounts(packages, true);
  res.json({ success: true, packages: discounted });
});

// @desc    Get a single package by slug (public)
// @route   GET /api/public/packages/:slug
const getPublicPackageBySlug = asyncHandler(async (req, res) => {
  const pkg = await Package.findOne({ slug: req.params.slug, isActive: true })
    .populate('includedServices', 'name basePrice imageUrl slug estimatedDurationMins description inclusions')
    .populate('categoryIds', 'name slug');

  if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
  const discounted = await applyCampaignDiscounts(pkg, true);
  res.json({ success: true, package: discounted });
});

module.exports = {
  listPackages,
  addPackage,
  updatePackage,
  deletePackage,
  getPublicPackages,
  getPublicPackageBySlug,
};
