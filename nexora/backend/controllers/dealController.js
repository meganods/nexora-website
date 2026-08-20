const asyncHandler = require('../utils/asyncHandler');
const Deal = require('../models/Deal');
const Service = require('../models/Service');
const Package = require('../models/Package');

// ─── Utility: compute finalPrice server-side (never trust frontend) ──────────
function computeFinalPrice(originalPrice, discountType, discountValue) {
  let final;
  if (discountType === 'PERCENTAGE') {
    const pct = Math.min(100, Math.max(0, discountValue));
    final = Math.round(originalPrice * (1 - pct / 100));
  } else {
    final = Math.max(0, originalPrice - discountValue);
  }
  return Math.max(0, final);
}

// ─── Utility: validate and fetch price from service or package ───────────────
async function resolveOriginalPrice(dealType, serviceId, packageId) {
  if (dealType === 'SERVICE') {
    if (!serviceId) throw { statusCode: 400, message: 'serviceId is required for SERVICE deal type.' };
    const svc = await Service.findById(serviceId);
    if (!svc || !svc.isActive) throw { statusCode: 404, message: 'Service not found or inactive.' };
    return { originalPrice: svc.basePrice, categoryId: svc.categoryId, refName: svc.name };
  }
  if (dealType === 'PACKAGE') {
    if (!packageId) throw { statusCode: 400, message: 'packageId is required for PACKAGE deal type.' };
    const pkg = await Package.findById(packageId);
    if (!pkg || !pkg.isActive) throw { statusCode: 404, message: 'Package not found or inactive.' };
    return { originalPrice: pkg.basePrice, categoryId: null, refName: pkg.name };
  }
  throw { statusCode: 400, message: 'Invalid dealType. Must be SERVICE or PACKAGE.' };
}

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

// @desc   List all deals (admin, with filters)
// @route  GET /api/admin/deals
const listAdminDeals = asyncHandler(async (req, res) => {
  const { search, status, featured, page = 1, limit = 50 } = req.query;
  const filter = {};
  const now = new Date();

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  if (status === 'active')   filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (status === 'pending')  filter.approvalStatus = 'PENDING';
  if (status === 'approved') filter.approvalStatus = 'APPROVED';
  if (status === 'rejected') filter.approvalStatus = 'REJECTED';
  if (status === 'expired')  { filter.endDate = { $lt: now }; filter.isActive = true; }
  if (featured === 'true')   filter.isFeatured = true;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Deal.countDocuments(filter);
  const deals = await Deal.find(filter)
    .populate('serviceId', 'name slug basePrice imageUrl')
    .populate('packageId', 'name slug basePrice imageUrl')
    .populate('categoryId', 'name slug')
    .populate('vendorId', 'name email')
    .populate('approvedBy', 'name email')
    .sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, deals, total, page: parseInt(page), limit: parseInt(limit) });
});

// @desc   Create a deal (admin)
// @route  POST /api/admin/deals
const createAdminDeal = asyncHandler(async (req, res) => {
  const {
    title, description, imageUrl, imagePublicId,
    dealType, serviceId, packageId,
    discountType, discountValue,
    startDate, endDate, displayOrder, isFeatured, isActive,
    termsAndConditions,
  } = req.body;

  if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });
  if (!dealType) return res.status(400).json({ success: false, message: 'Deal type is required.' });
  if (discountValue === undefined || discountValue === null) {
    return res.status(400).json({ success: false, message: 'Discount value is required.' });
  }

  // Validate dates
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
  }

  // Resolve price from service/package (backend always fetches it)
  let originalPrice, categoryId;
  try {
    const resolved = await resolveOriginalPrice(dealType, serviceId, packageId);
    originalPrice = resolved.originalPrice;
    categoryId = resolved.categoryId;
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }

  // Compute final price server-side
  const finalPrice = computeFinalPrice(originalPrice, discountType || 'PERCENTAGE', Number(discountValue));

  // Validate discount won't exceed price
  if (finalPrice < 0) {
    return res.status(400).json({ success: false, message: 'Discount exceeds original price.' });
  }

  const deal = await Deal.create({
    title, description, imageUrl, imagePublicId,
    dealType,
    serviceId: dealType === 'SERVICE' ? serviceId : null,
    packageId: dealType === 'PACKAGE' ? packageId : null,
    categoryId: req.body.categoryId || categoryId,
    originalPrice,
    discountType: discountType || 'PERCENTAGE',
    discountValue: Number(discountValue),
    finalPrice,
    startDate: startDate || new Date(),
    endDate: endDate || null,
    displayOrder: displayOrder || 0,
    isFeatured: isFeatured || false,
    isActive: isActive !== undefined ? isActive : true,
    createdBy: req.user._id,
    createdByRole: req.user.role,
    requiresAdminApproval: false,
    approvalStatus: 'APPROVED',
    approvedBy: req.user._id,
    approvedAt: new Date(),
    termsAndConditions: termsAndConditions || '',
  });

  res.status(201).json({ success: true, deal });
});

// @desc   Get single deal by ID (admin)
// @route  GET /api/admin/deals/:id
const getAdminDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id)
    .populate('serviceId', 'name slug basePrice imageUrl')
    .populate('packageId', 'name slug basePrice imageUrl')
    .populate('categoryId', 'name slug')
    .populate('vendorId', 'name email');
  if (!deal) return res.status(404).json({ success: false, message: 'Deal not found.' });
  res.json({ success: true, deal });
});

// @desc   Update a deal (admin)
// @route  PUT /api/admin/deals/:id
const updateAdminDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) return res.status(404).json({ success: false, message: 'Deal not found.' });

  const {
    title, description, imageUrl, imagePublicId,
    dealType, serviceId, packageId,
    discountType, discountValue,
    startDate, endDate, displayOrder, isFeatured, isActive,
    termsAndConditions, categoryId,
  } = req.body;

  // Validate dates
  const sDate = startDate || deal.startDate;
  const eDate = endDate || deal.endDate;
  if (sDate && eDate && new Date(eDate) < new Date(sDate)) {
    return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
  }

  // Re-resolve price if service/package changed
  const newDealType = dealType || deal.dealType;
  const newServiceId = serviceId || deal.serviceId;
  const newPackageId = packageId || deal.packageId;

  let originalPrice = deal.originalPrice;
  let resolvedCategoryId = deal.categoryId;
  try {
    const resolved = await resolveOriginalPrice(newDealType, newServiceId, newPackageId);
    originalPrice = resolved.originalPrice;
    resolvedCategoryId = resolved.categoryId;
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }

  const newDiscountType = discountType || deal.discountType;
  const newDiscountValue = discountValue !== undefined ? Number(discountValue) : deal.discountValue;
  const finalPrice = computeFinalPrice(originalPrice, newDiscountType, newDiscountValue);

  Object.assign(deal, {
    title: title || deal.title,
    description: description !== undefined ? description : deal.description,
    imageUrl: imageUrl !== undefined ? imageUrl : deal.imageUrl,
    imagePublicId: imagePublicId !== undefined ? imagePublicId : deal.imagePublicId,
    dealType: newDealType,
    serviceId: newDealType === 'SERVICE' ? newServiceId : null,
    packageId: newDealType === 'PACKAGE' ? newPackageId : null,
    categoryId: categoryId || resolvedCategoryId || deal.categoryId,
    originalPrice,
    discountType: newDiscountType,
    discountValue: newDiscountValue,
    finalPrice,
    startDate: startDate || deal.startDate,
    endDate: endDate !== undefined ? endDate : deal.endDate,
    displayOrder: displayOrder !== undefined ? displayOrder : deal.displayOrder,
    isFeatured: isFeatured !== undefined ? isFeatured : deal.isFeatured,
    isActive: isActive !== undefined ? isActive : deal.isActive,
    termsAndConditions: termsAndConditions !== undefined ? termsAndConditions : deal.termsAndConditions,
  });

  await deal.save();
  res.json({ success: true, deal });
});

// @desc   Delete a deal (admin)
// @route  DELETE /api/admin/deals/:id
const deleteAdminDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findByIdAndDelete(req.params.id);
  if (!deal) return res.status(404).json({ success: false, message: 'Deal not found.' });
  res.json({ success: true, message: 'Deal deleted successfully.' });
});

// @desc   Toggle deal active status (admin)
// @route  PATCH /api/admin/deals/:id/status
const toggleDealStatus = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) return res.status(404).json({ success: false, message: 'Deal not found.' });
  deal.isActive = req.body.isActive !== undefined ? req.body.isActive : !deal.isActive;
  await deal.save();
  res.json({ success: true, deal });
});

// @desc   Toggle deal featured flag (admin)
// @route  PATCH /api/admin/deals/:id/featured
const toggleDealFeatured = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) return res.status(404).json({ success: false, message: 'Deal not found.' });
  deal.isFeatured = req.body.isFeatured !== undefined ? req.body.isFeatured : !deal.isFeatured;
  await deal.save();
  res.json({ success: true, deal });
});

// @desc   Admin approve/reject a vendor deal
// @route  PATCH /api/admin/deals/:id/review
const reviewVendorDeal = asyncHandler(async (req, res) => {
  const { action, approvalStatus, rejectionReason } = req.body;
  const deal = await Deal.findById(req.params.id);
  if (!deal) return res.status(404).json({ success: false, message: 'Deal not found.' });

  const isApprove = action === 'approve' || approvalStatus === 'APPROVED';
  const isReject  = action === 'reject'  || approvalStatus === 'REJECTED';

  if (!isApprove && !isReject) {
    return res.status(400).json({ success: false, message: 'Action must be approve or reject.' });
  }

  deal.approvalStatus  = isApprove ? 'APPROVED' : 'REJECTED';
  deal.approvedBy      = req.user._id;
  deal.approvedAt      = isApprove ? new Date() : null;
  deal.rejectionReason = isReject ? (rejectionReason || 'Rejected by admin.') : null;

  await deal.save();
  res.json({ success: true, deal });
});

// ════════════════════════════════════════════════════════════════════════════
//  VENDOR FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

// @desc   Get vendor's own deals
// @route  GET /api/partner/deals
const getMyDeals = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const deals = await Deal.find({ vendorId })
    .populate('serviceId', 'name slug basePrice')
    .populate('packageId', 'name slug basePrice')
    .sort({ createdAt: -1 });
  res.json({ success: true, deals });
});

// @desc   Vendor creates a deal (auto PENDING)
// @route  POST /api/partner/deals
const createVendorDeal = asyncHandler(async (req, res) => {
  const {
    title, description, imageUrl, imagePublicId,
    serviceId, serviceIds,
    discountType, discountValue,
    startDate, endDate,
    termsAndConditions,
  } = req.body;

  const vendorId = req.user._id;

  if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });
  
  const finalServiceIds = Array.isArray(serviceIds) ? serviceIds : (serviceId ? [serviceId] : []);
  if (finalServiceIds.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one service is required for vendor deals.' });
  }

  if (discountValue === undefined) return res.status(400).json({ success: false, message: 'Discount value is required.' });

  // Validate dates
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
  }

  // Verify services exist
  const svcs = await Service.find({ _id: { $in: finalServiceIds }, isActive: true });
  if (svcs.length === 0) {
    return res.status(404).json({ success: false, message: 'None of the selected services were found or active.' });
  }

  // Compute final price server-side (sum of all selected services)
  const originalPrice = svcs.reduce((sum, s) => sum + s.basePrice, 0);
  const finalPrice = computeFinalPrice(originalPrice, discountType || 'PERCENTAGE', Number(discountValue));

  const deal = await Deal.create({
    title, description,
    imageUrl: imageUrl || null,
    imagePublicId: imagePublicId || null,
    dealType: 'SERVICE',
    serviceId: finalServiceIds[0],
    serviceIds: finalServiceIds,
    categoryId: svcs[0].categoryId || null,
    originalPrice,
    discountType: discountType || 'PERCENTAGE',
    discountValue: Number(discountValue),
    finalPrice,
    startDate: startDate || new Date(),
    endDate: endDate || null,
    displayOrder: 0,
    isFeatured: false,
    isActive: true,
    createdBy: vendorId,
    createdByRole: 'vendor',
    vendorId,
    requiresAdminApproval: false,
    approvalStatus: 'APPROVED',
    termsAndConditions: termsAndConditions || '',
  });

  res.status(201).json({ success: true, deal, message: 'Deal created successfully.' });
});

// @desc   Vendor updates own deal (only if PENDING or REJECTED)
// @route  PUT /api/partner/deals/:id
const updateVendorDeal = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const deal = await Deal.findOne({ _id: req.params.id, vendorId });
  if (!deal) return res.status(404).json({ success: false, message: 'Deal not found or not your deal.' });

  // Vendor cannot change approvalStatus or admin-controlled fields
  const {
    title, description, imageUrl, imagePublicId,
    serviceId, serviceIds,
    discountType, discountValue,
    startDate, endDate,
    termsAndConditions,
    isActive,
  } = req.body;

  const finalServiceIds = Array.isArray(serviceIds) ? serviceIds : (serviceId ? [serviceId] : (deal.serviceIds && deal.serviceIds.length > 0 ? deal.serviceIds : [deal.serviceId]));
  if (finalServiceIds.length === 0 || !finalServiceIds[0]) {
    return res.status(400).json({ success: false, message: 'At least one service is required.' });
  }

  // Re-resolve price
  const svcs = await Service.find({ _id: { $in: finalServiceIds } });
  if (svcs.length === 0) return res.status(404).json({ success: false, message: 'Associated services not found.' });
  
  const originalPrice = svcs.reduce((sum, s) => sum + s.basePrice, 0);
  const newDiscountType  = discountType  || deal.discountType;
  const newDiscountValue = discountValue !== undefined ? Number(discountValue) : deal.discountValue;
  const finalPrice = computeFinalPrice(originalPrice, newDiscountType, newDiscountValue);

  // Validate dates
  const sDate = startDate || deal.startDate;
  const eDate = endDate || deal.endDate;
  if (sDate && eDate && new Date(eDate) < new Date(sDate)) {
    return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
  }

  Object.assign(deal, {
    title: title || deal.title,
    description: description !== undefined ? description : deal.description,
    imageUrl: imageUrl !== undefined ? imageUrl : deal.imageUrl,
    imagePublicId: imagePublicId !== undefined ? imagePublicId : deal.imagePublicId,
    serviceId: finalServiceIds[0],
    serviceIds: finalServiceIds,
    discountType: newDiscountType,
    discountValue: newDiscountValue,
    finalPrice,
    originalPrice,
    startDate: startDate || deal.startDate,
    endDate: endDate !== undefined ? endDate : deal.endDate,
    isActive: isActive !== undefined ? isActive : deal.isActive,
    termsAndConditions: termsAndConditions !== undefined ? termsAndConditions : deal.termsAndConditions,
    // Auto-approve after edit
    approvalStatus: 'APPROVED',
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
  });

  await deal.save();
  res.json({ success: true, message: 'Deal updated successfully.', deal });
});
// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

// @desc   Get all active approved valid deals (public)
// @route  GET /api/public/deals
const getPublicDeals = asyncHandler(async (req, res) => {
  const { categoryId, search, featured, limit, page = 1, sort, city } = req.query;
  const now = new Date();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const filter = {
    isActive: true,
    approvalStatus: 'APPROVED',
    startDate: { $lte: endOfToday },
    $or: [
      { endDate: { $gte: now } },
      { endDate: null },
    ],
  };

  if (city) {
    // Show deals specifically targeted to this city, or nation-wide deals (no city specified)
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { city: { $regex: new RegExp('^' + city.trim() + '$', 'i') } },
        { city: null },
        { city: '' }
      ]
    });
  }

  if (categoryId) filter.categoryId = categoryId;
  if (featured === 'true') filter.isFeatured = true;
  if (search) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ],
    });
  }

  const pageNum  = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, parseInt(limit) || 12);
  const skip     = (pageNum - 1) * limitNum;
  const total    = await Deal.countDocuments(filter);

  // Sort logic
  let sortObj = {};
  if (sort === 'highest_discount') sortObj = { discountValue: -1 };
  else if (sort === 'lowest_price')    sortObj = { finalPrice: 1 };
  else if (sort === 'newest')          sortObj = { createdAt: -1 };
  else                                  sortObj = { isFeatured: -1, displayOrder: 1, createdAt: -1 }; // recommended

  const deals = await Deal.find(filter)
    .populate('serviceId', 'name slug basePrice imageUrl rating reviewCount categoryId')
    .populate('packageId', 'name slug basePrice imageUrl includedServices')
    .populate('categoryId', 'name slug')
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  res.json({ success: true, deals, total, page: pageNum, limit: limitNum });
});

// @desc   Get single public deal by slug
// @route  GET /api/public/deals/:slug
const getPublicDealBySlug = asyncHandler(async (req, res) => {
  const now = new Date();
  const deal = await Deal.findOne({
    slug: req.params.slug,
    isActive: true,
    approvalStatus: 'APPROVED',
    startDate: { $lte: now },
    $or: [
      { endDate: { $gte: now } },
      { endDate: null },
    ],
  })
    .populate('serviceId', 'name slug basePrice imageUrl rating reviewCount inclusions categoryId')
    .populate('packageId', 'name slug basePrice imageUrl inclusions includedServices categoryIds')
    .populate('categoryId', 'name slug');

  if (!deal) {
    // Check if it exists but is expired/inactive — to show expired state on frontend
    const expiredDeal = await Deal.findOne({ slug: req.params.slug })
      .populate('serviceId', 'name slug')
      .populate('packageId', 'name slug');
    if (expiredDeal) {
      return res.status(410).json({ success: false, message: 'This deal has expired or is no longer active.', deal: { title: expiredDeal.title, slug: expiredDeal.slug } });
    }
    return res.status(404).json({ success: false, message: 'Deal not found.' });
  }

  res.json({ success: true, deal });
});

module.exports = {
  // Admin
  listAdminDeals,
  createAdminDeal,
  getAdminDeal,
  updateAdminDeal,
  deleteAdminDeal,
  toggleDealStatus,
  toggleDealFeatured,
  reviewVendorDeal,
  // Vendor
  getMyDeals,
  createVendorDeal,
  updateVendorDeal,
  // Public
  getPublicDeals,
  getPublicDealBySlug,
};
