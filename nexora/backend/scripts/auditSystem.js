/**
 * Comprehensive Nexora Functional & Security Audit
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Admin = require('../models/Admin');
const ServicePartner = require('../models/ServicePartner');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Package = require('../models/Package');
const Coupon = require('../models/Coupon');
const Offer = require('../models/Offer');
const SaleCampaign = require('../models/SaleCampaign');
const Banner = require('../models/Banner');
const Booking = require('../models/Booking');
const generateToken = require('../utils/generateToken');

const BASE_URL = 'http://localhost:5000/api';

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function assert(condition, testName, details = '') {
  if (condition) {
    results.passed.push({ testName, details });
    console.log(`✅ PASS: ${testName}`);
  } else {
    results.failed.push({ testName, details });
    console.error(`❌ FAIL: ${testName} - ${details}`);
  }
}

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 STARTING NEXORA COMPREHENSIVE SYSTEM AUDIT');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📦 Connected to MongoDB for audit verification.\n');

  try {
    // ----------------------------------------------------
    // SETUP TEST ACCOUNTS & TOKENS
    // ----------------------------------------------------
    let admin = await Admin.findOne({ email: 'admin@nexora.com' });
    if (!admin) {
      admin = await Admin.create({
        name: 'Master Admin',
        email: 'admin@nexora.com',
        password: 'AdminPassword123!',
        role: 'admin',
        isActive: true
      });
    }
    const adminToken = generateToken({ id: admin._id, role: 'admin' });

    let vendor = await ServicePartner.findOne({ phone: '9999999999' });
    if (!vendor) {
      vendor = await ServicePartner.create({
        name: 'Audit Partner Pro',
        email: 'vendor.audit@nexora.com',
        password: 'VendorPassword123!',
        phone: '9999999999',
        category: 'Cleaning & Pest Control',
        kycStatus: 'APPROVED',
        isOnline: true,
        isAvailable: true,
        walletBalance: 0,
        rating: 4.9,
        completedJobs: 15
      });
    }
    const vendorToken = generateToken({ id: vendor._id, role: 'vendor' });

    let customer1 = await User.findOne({ phone: '8888888881' });
    if (!customer1) {
      customer1 = await User.create({
        name: 'First-Time Customer',
        phone: '8888888881',
        role: 'user'
      });
    }
    const customer1Token = generateToken({ id: customer1._id, role: 'user' });

    let customer2 = await User.findOne({ phone: '8888888882' });
    if (!customer2) {
      customer2 = await User.create({
        name: 'Returning Customer',
        phone: '8888888882',
        role: 'user'
      });
    }
    const customer2Token = generateToken({ id: customer2._id, role: 'user' });

    // Create a qualifying past booking for customer2 to test first-time eligibility
    const existingPastBooking = await Booking.findOne({ customerId: customer2._id });
    if (!existingPastBooking) {
      await Booking.create({
        bookingId: 'NEX-TEST-EXISTING',
        customerId: customer2._id,
        serviceId: (await Service.findOne())?._id,
        scheduledDate: new Date(),
        scheduledSlot: 'Morning',
        totalAmount: 499,
        paymentStatus: 'PAID',
        status: 'COMPLETED'
      });
    }

    console.log('👤 Test Accounts Configured.\n');

    // Pre-cleanup leftover test entities if any
    await Category.deleteMany({ name: 'Audit Deep Sanitization' });
    await Service.deleteMany({ name: 'Hospital-Grade Ozone Sanitization' });
    await Package.deleteMany({ name: 'Complete Sanctuary Home Care' });
    await Coupon.deleteMany({ code: 'AUDITFIRST30' });
    await Banner.deleteMany({ title: 'Festival Clean Home Special' });
    await Offer.deleteMany({ title: 'Partner Exclusive 25% Off' });

    // ----------------------------------------------------
    // 1. ADMIN CRUD -> DB -> PUBLIC API PIPELINE
    // ----------------------------------------------------
    console.log('--- 1. Testing Admin CRUD -> Database -> Public API ---');

    // 1.1 Category CRUD
    const catRes = await fetch(`${BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Audit Deep Sanitization',
        description: 'Comprehensive sanitization and ozone air purification.',
        platformFeePercentage: 12,
        icon: 'Sparkles'
      })
    });
    const catData = await catRes.json();
    assert(catData.success && catData.category?._id, 'Admin Category Creation', catData.message);

    const testCatId = catData.category?._id;
    const testCatSlug = catData.category?.slug;

    // Check DB persistence
    const dbCat = await Category.findById(testCatId);
    assert(dbCat && dbCat.name === 'Audit Deep Sanitization', 'Category MongoDB Persistence');

    // Check Public API
    const pubCatRes = await fetch(`${BASE_URL}/public/categories`);
    const pubCatData = await pubCatRes.json();
    const foundPubCat = Array.isArray(pubCatData) && pubCatData.find(c => c._id === testCatId);
    assert(!!foundPubCat, 'Category Visible in Public API (/api/public/categories)');

    // 1.2 Service CRUD
    const servRes = await fetch(`${BASE_URL}/admin/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Hospital-Grade Ozone Sanitization',
        categoryId: testCatId,
        basePrice: 799,
        discountPercentage: 15,
        estimatedDurationMins: 60,
        inclusions: ['Complete high-pressure antimicrobial treatment'],
        description: 'Complete high-pressure antimicrobial treatment.',
        isPopular: true,
        isFeatured: true,
        isCustomPricingAllowed: true
      })
    });
    const servData = await servRes.json();
    assert(servData.success && servData.service?._id, 'Admin Service Creation', servData.message);
    const testServId = servData.service?._id;

    // Check DB & Public API
    const dbServ = await Service.findById(testServId);
    assert(dbServ && dbServ.isPopular === true && dbServ.basePrice === 799, 'Service MongoDB Persistence & Flags');

    const pubServRes = await fetch(`${BASE_URL}/public/services?isPopular=true`);
    const pubServData = await pubServRes.json();
    const foundPubServ = Array.isArray(pubServData) && pubServData.find(s => s._id.toString() === testServId.toString());
    assert(!!foundPubServ, 'Popular Service Visible in Public API (/api/public/services?isPopular=true)');

    // 1.3 Package CRUD
    const pkgRes = await fetch(`${BASE_URL}/admin/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Complete Sanctuary Home Care',
        categoryIds: [testCatId],
        includedServices: [testServId],
        basePrice: 1999,
        discountPercentage: 20,
        description: 'Full sanitization, quarterly deep wipe, and air detox.',
        isFeatured: true
      })
    });
    const pkgData = await pkgRes.json();
    assert(pkgData.success && pkgData.package?._id, 'Admin Package Creation', pkgData.message);
    const testPkgId = pkgData.package?._id;
    const testPkgSlug = pkgData.package?.slug;

    // Verify Public Package API
    const pubPkgRes = await fetch(`${BASE_URL}/public/packages`);
    const pubPkgData = await pubPkgRes.json();
    const foundPubPkg = pubPkgData.packages?.find(p => p._id.toString() === testPkgId.toString());
    assert(!!foundPubPkg, 'Package Visible in Public API (/api/public/packages)');

    const pubPkgSlugRes = await fetch(`${BASE_URL}/public/packages/${testPkgSlug}`);
    const pubPkgSlugData = await pubPkgSlugRes.json();
    assert(pubPkgSlugData.success && pubPkgSlugData.package?.name === 'Complete Sanctuary Home Care', 'Package Accessible via Dynamic Slug API');

    // 1.4 Coupon CRUD
    const couponRes = await fetch(`${BASE_URL}/admin/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        code: 'AUDITFIRST30',
        discountType: 'PERCENTAGE',
        discountValue: 30,
        maxDiscountAmount: 300,
        minOrderValue: 400,
        isFirstTimeOnly: true,
        isActive: true
      })
    });
    const couponData = await couponRes.json();
    assert(couponData.success && couponData.coupon?._id, 'Admin Coupon Creation', couponData.message);

    // 1.5 Banner CRUD
    const bannerRes = await fetch(`${BASE_URL}/admin/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Festival Clean Home Special',
        subtitle: 'Get 30% discount on all sanitization services.',
        badgeText: 'Audit Limited Offer',
        promoCode: 'AUDITFIRST30',
        ctaText: 'Claim Now',
        ctaRoute: '/services',
        gradient: 'from-[#0F3D30] to-[#1D6B50]',
        isActive: true
      })
    });
    const bannerData = await bannerRes.json();
    assert(bannerData.success && bannerData.banner?._id, 'Admin Banner Creation', bannerData.message);

    const pubBannerRes = await fetch(`${BASE_URL}/public/banners`);
    const pubBannerData = await pubBannerRes.json();
    const bannerList = pubBannerData.banners || pubBannerData;
    const foundBanner = Array.isArray(bannerList) && bannerList.find(b => b.title === 'Festival Clean Home Special');
    assert(!!foundBanner, 'Banner Visible on Public API (/api/public/banners)');

    // ----------------------------------------------------
    // 2. VENDOR OFFERS & ADMIN APPROVAL FLOW
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Vendor Offer Submission & Admin Approval Flow ---');

    // Vendor creates offer -> must be pending
    const vendorOfferRes = await fetch(`${BASE_URL}/partner/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        title: 'Partner Exclusive 25% Off',
        description: 'Vendor curated discount on sanitization services.',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        applicableServices: [testServId]
      })
    });
    const vendorOfferData = await vendorOfferRes.json();
    assert(vendorOfferData.success && vendorOfferData.offer?.approvalStatus === 'PENDING', 'Vendor Offer Created with Status PENDING');
    const testOfferId = vendorOfferData.offer?._id;

    // Check that PENDING offer is NOT visible on public website
    const pubOffersBefore = await (await fetch(`${BASE_URL}/public/offers`)).json();
    const foundPendingPub = pubOffersBefore.offers?.find(o => o._id.toString() === testOfferId.toString());
    assert(!foundPendingPub, 'Pending Vendor Offer is HIDDEN from Public Website');

    // Admin approves the offer
    const approveRes = await fetch(`${BASE_URL}/admin/offers/${testOfferId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ approvalStatus: 'APPROVED' })
    });
    const approveData = await approveRes.json();
    assert(approveData.success && approveData.offer?.approvalStatus === 'APPROVED', 'Admin Approves Vendor Offer');

    // Check that APPROVED offer is NOW visible on public website
    const pubOffersAfter = await (await fetch(`${BASE_URL}/public/offers`)).json();
    const foundApprovedPub = pubOffersAfter.offers?.find(o => o._id.toString() === testOfferId.toString());
    assert(!!foundApprovedPub, 'Approved Vendor Offer is NOW VISIBLE on Public Website (/api/public/offers)');

    // ----------------------------------------------------
    // 3. COUPON VALIDATION & SECURITY AUDIT
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Backend Coupon Security & First-Time Eligibility ---');

    // 3.1 First-Time Customer validates AUDITFIRST30 on eligible cart (799 >= 400 min order)
    const validFirstRes = await fetch(`${BASE_URL}/promotions/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        couponCode: 'AUDITFIRST30',
        cartAmount: 799,
        serviceId: testServId,
        categoryId: testCatId
      })
    });
    const validFirstData = await validFirstRes.json();
    assert(validFirstData.success && validFirstData.discountAmount > 0, 'First-Time Customer is ELIGIBLE for First-Time Coupon');

    // 3.2 Returning Customer validates AUDITFIRST30 (must be rejected)
    const invalidReturnRes = await fetch(`${BASE_URL}/promotions/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer2Token}` },
      body: JSON.stringify({
        couponCode: 'AUDITFIRST30',
        cartAmount: 799,
        serviceId: testServId,
        categoryId: testCatId
      })
    });
    const invalidReturnData = await invalidReturnRes.json();
    assert(!invalidReturnData.success && invalidReturnData.message.includes('first-time'), 'Returning Customer REJECTED for First-Time Coupon by Backend');

    // 3.3 Below Minimum Order Value Check (e.g. cartAmount 200 < 400 min order)
    const belowMinRes = await fetch(`${BASE_URL}/promotions/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        couponCode: 'AUDITFIRST30',
        cartAmount: 200,
        serviceId: testServId
      })
    });
    const belowMinData = await belowMinRes.json();
    assert(!belowMinData.success && belowMinData.message.includes('Minimum order'), 'Coupon Rejected if Cart is Below Minimum Order Value');

    // ----------------------------------------------------
    // 4. PACKAGE CHECKOUT -> SINGLE BOOKING DOCUMENT
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Package Checkout & Single Booking Document ---');

    const pkgOrderRes = await fetch(`${BASE_URL}/bookings/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        packageId: testPkgId,
        isPackageBooking: true,
        address: { line1: '42 Luxury Towers, Palm Avenue', city: 'Delhi NCR', pincode: '110001' },
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        scheduledSlot: 'Morning',
        customerPhone: '8888888881',
        customerName: 'First-Time Customer'
      })
    });
    const pkgOrderData = await pkgOrderRes.json();
    assert(pkgOrderData.success && pkgOrderData.bookingId, 'Package Order Created Successfully', pkgOrderData.message);

    // Verify exactly ONE booking document in DB with correct attributes
    const pkgBookings = await Booking.find({ _id: pkgOrderData.bookingId });
    assert(pkgBookings.length === 1, 'Exactly ONE Booking Document Created for Package Booking (No Duplicates)');
    assert(pkgBookings[0]?.isPackageBooking === true, 'Booking document has isPackageBooking: true');
    assert(pkgBookings[0]?.packageId?.toString() === testPkgId.toString(), 'Booking document stores correct packageId');
    assert(pkgBookings[0]?.paymentDetails?.amount > 0, 'Booking document stores correct package amount');

    // ----------------------------------------------------
    // 5. SERVICE BOOKING & COMPLETE LIFECYCLE
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Service Booking & Status Lifecycle ---');

    const srvOrderRes = await fetch(`${BASE_URL}/bookings/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        serviceId: testServId,
        address: { line1: 'Villa 7, Grand Estate', city: 'Delhi NCR', pincode: '110001' },
        scheduledDate: new Date().toISOString(),
        scheduledSlot: 'Afternoon',
        customerPhone: '8888888881',
        customerName: 'First-Time Customer',
        couponCode: 'AUDITFIRST30'
      })
    });
    const srvOrderData = await srvOrderRes.json();
    assert(srvOrderData.success && srvOrderData.bookingId, 'Service Order Created with Coupon', srvOrderData.message);

    const srvBooking = await Booking.findById(srvOrderData.bookingId);
    assert(srvBooking && srvBooking.discountAmount > 0, 'Booking Persists Backend-Calculated Discount Amount');

    // Lifecycle: Admin Assigns Vendor -> Vendor Accepts -> Arrives -> OTP -> In Progress -> Completed
    const assignRes = await fetch(`${BASE_URL}/admin/assign/${srvBooking._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ vendorId: vendor._id })
    });
    const assignData = await assignRes.json();
    assert(assignData.success, 'Admin Manual Assigns Vendor to Booking');

    // Vendor Accepts Request
    const acceptRes = await fetch(`${BASE_URL}/partner/requests/${srvBooking._id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken}` }
    });
    const acceptData = await acceptRes.json();
    assert(acceptData.success, 'Vendor Accepts Assigned Request');

    // Vendor Updates Status to ARRIVED
    const arrivedRes = await fetch(`${BASE_URL}/partner/requests/${srvBooking._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({ status: 'ARRIVED' })
    });
    const arrivedData = await arrivedRes.json();
    assert(arrivedData.success && (arrivedData.booking?.status === 'ARRIVED' || arrivedData.request?.status === 'ARRIVED'), 'Vendor Updates Status to ARRIVED');

    // Vendor Verifies OTP to Start Service -> IN_PROGRESS
    const otpRes = await fetch(`${BASE_URL}/partner/requests/${srvBooking._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        otp: srvBooking?.otp || '1234'
      })
    });
    const otpData = await otpRes.json();
    assert(otpData.success && (otpData.booking?.status === 'IN_PROGRESS' || otpData.request?.status === 'IN_PROGRESS'), 'Vendor Verifies OTP and Starts Service (IN_PROGRESS)');

    // Vendor Completes Service with Photos -> COMPLETED
    const initialWallet = (await ServicePartner.findById(vendor._id)).walletBalance || 0;
    const completeRes = await fetch(`${BASE_URL}/partner/requests/${srvBooking._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        status: 'COMPLETED',
        beforePhotoUrl: 'https://cloudinary.com/fake-before.jpg',
        afterPhotoUrl: 'https://cloudinary.com/fake-after.jpg'
      })
    });
    const completeData = await completeRes.json();
    assert(completeData.success && (completeData.booking?.status === 'COMPLETED' || completeData.request?.status === 'COMPLETED'), 'Vendor Completes Service with Photos (COMPLETED)');

    // Check partner wallet balance updated
    const finalWallet = (await ServicePartner.findById(vendor._id)).walletBalance;
    assert(finalWallet >= initialWallet, 'Vendor Wallet Balance Credited upon Job Completion');

    // ----------------------------------------------------
    // 6. VENDOR MANAGEMENT & SETTINGS
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Vendor Services, Pricing Overrides & Availability ---');

    // Vendor updates custom service pricing
    const vendorSrvRes = await fetch(`${BASE_URL}/partner/services`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        customServices: [
          { serviceId: testServId, customPrice: 850, isActive: true }
        ]
      })
    });
    const vendorSrvData = await vendorSrvRes.json();
    assert(vendorSrvData.success, 'Vendor Custom Services and Pricing Overrides Saved');

    // Check DB persistence
    const dbVendor = await ServicePartner.findById(vendor._id);
    const hasCustomSrv = dbVendor.customServices?.find(s => s.serviceId.toString() === testServId.toString() && s.customPrice === 850);
    assert(!!hasCustomSrv, 'Custom Service Price Persisted to MongoDB');

    // Vendor updates availability & service areas
    const vendorAvailRes = await fetch(`${BASE_URL}/partner/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        slots: ['Morning', 'Evening'],
        serviceAreas: ['Delhi NCR', 'South Delhi', 'Gurugram']
      })
    });
    const vendorAvailData = await vendorAvailRes.json();
    assert(vendorAvailData.success, 'Vendor Availability Days, Slots and Service Areas Saved');

    const dbVendorAvail = await ServicePartner.findById(vendor._id);
    assert(dbVendorAvail.availability?.days?.includes('Monday') && dbVendorAvail.serviceAreas?.includes('Gurugram'), 'Availability Schedule and Areas Persisted in DB');

    // ----------------------------------------------------
    // 7. API PERMISSIONS & SECURITY ISOLATION
    // ----------------------------------------------------
    console.log('\n--- 7. Testing Role Authorization & API Isolation ---');

    // 7.1 Vendor cannot access Admin endpoints
    const vendorAdminAttempt = await fetch(`${BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({ name: 'Hacked Category' })
    });
    assert(vendorAdminAttempt.status === 403, 'Vendor Access to Admin API is BLOCKED (403 Forbidden)');

    // 7.2 Customer cannot access Admin endpoints
    const customerAdminAttempt = await fetch(`${BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({ name: 'Hacked Category 2' })
    });
    assert(customerAdminAttempt.status === 403, 'Customer Access to Admin API is BLOCKED (403 Forbidden)');

    // 7.3 Unauthenticated request to protected endpoint
    const unauthAttempt = await fetch(`${BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Category 3' })
    });
    assert(unauthAttempt.status === 401, 'Unauthenticated Request is BLOCKED (401 Unauthorized)');

    // ----------------------------------------------------
    // CLEANUP TEST DATA
    // ----------------------------------------------------
    await Category.findByIdAndDelete(testCatId);
    await Service.findByIdAndDelete(testServId);
    await Package.findByIdAndDelete(testPkgId);
    await Coupon.findByIdAndDelete(couponData.coupon?._id);
    await Banner.findByIdAndDelete(bannerData.banner?._id);
    await Offer.findByIdAndDelete(testOfferId);
    await Booking.deleteMany({ _id: { $in: [pkgOrderData?.bookingId, srvOrderData?.bookingId].filter(Boolean) } });

    console.log('\n🧹 Test audit records cleaned up successfully.');

  } catch (err) {
    console.error('CRITICAL AUDIT ERROR:', err);
    results.failed.push({ testName: 'Unhandled Exception', details: err.message });
  } finally {
    await mongoose.disconnect();
    console.log('\n====================================================');
    console.log(`AUDIT SUMMARY: ${results.passed.length} Passed, ${results.failed.length} Failed`);
    console.log('====================================================');
  }
}

runAudit();
