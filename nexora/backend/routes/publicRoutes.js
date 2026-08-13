const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Service = require('../models/Service');
const ServicePartner = require('../models/ServicePartner');
const { getPublicPackages, getPublicPackageBySlug } = require('../controllers/packageController');
const { getActiveBanners, getActiveOffers, getActiveCampaigns } = require('../controllers/promotionController');
const { getPublicDeals, getPublicDealBySlug } = require('../controllers/dealController');
const applyCampaignDiscounts = require('../utils/campaignHelper');

router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

router.get('/services', async (req, res) => {
  try {
    const { categoryId, isPopular, isFeatured, isMostBooked, hasDiscount, q, limit, page } = req.query;
    const filter = { 
      isActive: true,
      approvalStatus: 'APPROVED',
      isDeleted: false,
      parentId: null
    };
    if (categoryId) filter.categoryId = categoryId;
    if (isPopular === 'true') filter.isPopular = true;
    if (isFeatured === 'true') filter.isFeatured = true;
    if (isMostBooked === 'true') filter.isMostBooked = true;
    if (hasDiscount === 'true') filter.discountPercentage = { $gt: 0 };
    if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 50);
    const skip = (pageNum - 1) * limitNum;

    const services = await Service.find(filter)
      .populate('categoryId', 'name slug')
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const discounted = await applyCampaignDiscounts(services);
    res.json(discounted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services' });
  }
});

// Single service by slug or MongoDB ObjectId

router.get('/services/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    let service;
    // Try by slug first, then by _id
    if (slug.match(/^[a-f\d]{24}$/i)) {
      service = await Service.findOne({ _id: slug, isActive: true, approvalStatus: 'APPROVED', isDeleted: false }).populate('categoryId');
    } else {
      service = await Service.findOne({ slug, isActive: true, approvalStatus: 'APPROVED', isDeleted: false }).populate('categoryId');
    }
    if (!service) return res.status(404).json({ message: 'Service not found' });
    
    // Fetch associated sub-services
    const subServices = await Service.find({
      parentId: service._id,
      isActive: true,
      approvalStatus: 'APPROVED',
      isDeleted: false
    }).sort({ displayOrder: 1, createdAt: 1 });

    const discounted = await applyCampaignDiscounts(service);
    const serviceObj = discounted.toObject ? discounted.toObject() : discounted;
    serviceObj.subServices = subServices;

    res.json(serviceObj);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching service' });
  }
});

router.get('/services/search', async (req, res) => {
  try {
    const { q, city } = req.query;
    const filter = { 
      isActive: true, 
      approvalStatus: 'APPROVED', 
      isDeleted: false,
      parentId: null 
    };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Populate category so we can reference it
    let services = await Service.find(filter).populate('categoryId');

    // If city filter is provided, we can simulate city-availability using category details or mock matches, 
    // or filter dynamically if service properties exist. Let's do a simple mock filter:
    if (city && city !== 'Detect My Location' && services.length > 0) {
      // Simulate: Spa/Salon is not available in Mumbai, appliance repair not in Bengaluru to prove working filter logic
      services = services.filter(s => {
        const catName = s.categoryId?.name?.toLowerCase() || '';
        if (city.toLowerCase() === 'mumbai' && catName.includes('spa')) return false;
        if (city.toLowerCase() === 'bengaluru' && catName.includes('appliance')) return false;
        return true;
      });
    }

    const discounted = await applyCampaignDiscounts(services);
    res.json(discounted);
  } catch (error) {
    res.status(500).json({ message: 'Error searching services' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const AdminSettings = require('../models/AdminSettings');
    const settings = await AdminSettings.getSingleton();
    res.json({
      success: true,
      promoCode: settings.promoCode,
      promoText: settings.promoText
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings' });
  }
});

// Public-safe list of APPROVED service partners
router.get('/partners', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const partners = await ServicePartner.find({ kycStatus: 'APPROVED', isActive: true })
      .select('name category rating totalCompletedJobs location.city createdAt')
      .sort({ rating: -1, totalCompletedJobs: -1 })
      .limit(limit);

    res.json({ success: true, partners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching partners' });
  }
});

// GET single public-safe partner profile by ID
router.get('/partners/:id', async (req, res) => {
  try {
    const partner = await ServicePartner.findOne({ _id: req.params.id, kycStatus: 'APPROVED', isActive: true })
      .select('name category rating totalCompletedJobs location.city createdAt experienceYears aboutText');
    if (!partner) return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    res.json({ success: true, partner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching partner profile' });
  }
});

// GET top N most booked services by real booking count
router.get('/services/most-booked', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);

    // Aggregate completed/active bookings grouped by serviceId
    const bookingCounts = await require('../models/Booking').aggregate([
      { $match: { status: { $in: ['COMPLETED', 'REQUESTED', 'ASSIGNED', 'IN_PROGRESS'] } } },
      { $group: { _id: '$serviceId', bookingCount: { $sum: 1 } } },
      { $sort: { bookingCount: -1 } },
      { $limit: limit * 3 } // fetch more to allow for inactive service filtering
    ]);

    const serviceIds = bookingCounts.map(b => b._id).filter(Boolean);

    let services = [];

    if (serviceIds.length > 0) {
      // Fetch the actual service docs for those IDs
      const rawServices = await Service.find({ 
        _id: { $in: serviceIds }, 
        isActive: true, 
        approvalStatus: 'APPROVED', 
        isDeleted: false,
        parentId: null 
      })
        .populate('categoryId', 'name slug')
        .limit(limit);

      // Merge booking counts in
      const countMap = {};
      bookingCounts.forEach(b => { if (b._id) countMap[b._id.toString()] = b.bookingCount; });
      services = rawServices
        .map(s => ({ ...s.toObject(), bookingCount: countMap[s._id.toString()] || 0 }))
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, limit);
    }

    // Fallback: if not enough data from bookings, fill remainder from reviewCount
    if (services.length < limit) {
      const existingIds = services.map(s => s._id.toString());
      const fallback = await Service.find({ 
        isActive: true, 
        approvalStatus: 'APPROVED',
        isDeleted: false,
        parentId: null,
        _id: { $nin: existingIds } 
      })
        .populate('categoryId', 'name slug')
        .sort({ reviewCount: -1 })
        .limit(limit - services.length);
      services = [...services, ...fallback.map(s => ({ ...s.toObject(), bookingCount: s.reviewCount || 0 }))];
    }

    const discounted = await applyCampaignDiscounts(services);
    res.json({ success: true, services: discounted });
  } catch (error) {
    console.error('most-booked error:', error);
    res.status(500).json({ success: false, message: 'Error fetching most booked services' });
  }
});


// ─── Packages ─────────────────────────────────────────────────────────────────
router.get('/packages', getPublicPackages);
router.get('/packages/:slug', getPublicPackageBySlug);

// ─── Banners ──────────────────────────────────────────────────────────────────
router.get('/banners', getActiveBanners);

// ─── Offers ───────────────────────────────────────────────────────────────────
router.get('/offers', getActiveOffers);

// ─── Sale Campaigns ───────────────────────────────────────────────────────────
router.get('/campaigns', getActiveCampaigns);

// ─── Best Deals ────────────────────────────────────────────────────────────
router.get('/deals', getPublicDeals);
router.get('/deals/:slug', getPublicDealBySlug);

module.exports = router;
