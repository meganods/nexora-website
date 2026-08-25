const crypto = require('crypto');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Category = require('../models/Category');
const { createNotification } = require('./notificationController');
const Admin = require('../models/Admin');
const AdminSettings = require('../models/AdminSettings');
const { findBestPartner } = require('../services/assignmentEngine');

exports.createOrder = async (req, res) => {
  try {
    const { serviceId, packageId, address, scheduledDate, scheduledSlot, couponCode, addons, quantity } = req.body;
    const qty = Math.max(1, parseInt(quantity) || 1);

    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Authentication required. Please login to book a service.' });
    }
    const customerId = req.user.userId;

    if (!serviceId && !packageId) {
      return res.status(400).json({ message: 'Either serviceId or packageId is required.' });
    }

    const AdminSettings = require('../models/AdminSettings');
    const settings = await AdminSettings.getSingleton();
    const platformFee = settings.platformFee?.minRupees ?? 15;

    let basePrice = 0;
    let commissionAmount = 0;
    let isPackageBooking = false;
    let bookingServiceId = null;
    let bookingPackageId = null;

    const applyCampaignDiscounts = require('../utils/campaignHelper');

    if (packageId) {
      // ── Package Booking ──
      const Package = require('../models/Package');
      let pkg = await Package.findById(packageId);
      if (!pkg || !pkg.isActive) return res.status(404).json({ message: 'Package not found or inactive.' });
      
      // Apply active campaign discounts
      pkg = await applyCampaignDiscounts(pkg, true);

      basePrice = pkg.basePrice * qty;
      if (pkg.discountPercentage > 0) {
        basePrice = Math.round((pkg.basePrice * (1 - pkg.discountPercentage / 100)) * qty);
      }
      commissionAmount = Math.round(basePrice * 0.10); // default 10% commission for packages
      isPackageBooking = true;
      bookingPackageId = pkg._id;
    } else {
      // ── Single Service Booking ──
      let service = await Service.findById(serviceId).populate('categoryId');
      if (!service) return res.status(404).json({ message: 'Service not found' });
      
      // Apply active campaign discounts
      service = await applyCampaignDiscounts(service, false);

      basePrice = service.basePrice * qty;
      if (service.discountPercentage > 0) {
        basePrice = Math.round((service.basePrice * (1 - service.discountPercentage / 100)) * qty);
      }
      const platformFeePercentage = service.categoryId?.platformFeePercentage || 10;
      commissionAmount = Math.round(basePrice * platformFeePercentage / 100);
      bookingServiceId = service._id;
    }

    // ── Coupon Validation (backend-enforced) ──
    let discountAmount = 0;
    let appliedCouponCode = null;
    if (couponCode) {
      const Coupon = require('../models/Coupon');
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), isActive: true });
      if (coupon) {
        const now = new Date();
        const validDate = (!coupon.startDate || coupon.startDate <= now) && (!coupon.endDate || coupon.endDate >= now);
        const validLimit = coupon.usageLimit === null || coupon.totalUsed < coupon.usageLimit;
        const userUsed = coupon.usageLogs.filter(l => l.userId?.toString() === customerId.toString()).length;
        const validPerUser = userUsed < coupon.perUserLimit;

        let validFirstTime = true;
        if (coupon.isFirstTimeOnly) {
          const previousBookings = await Booking.countDocuments({
            customerId,
            status: { $in: ['COMPLETED', 'REQUESTED', 'ASSIGNED', 'IN_PROGRESS'] }
          });
          if (previousBookings > 0) validFirstTime = false;
        }

        let validScope = true;
        if (coupon.applicableServices?.length > 0 && bookingServiceId) {
          validScope = coupon.applicableServices.some(id => id.toString() === bookingServiceId.toString());
        }
        if (coupon.applicablePackages?.length > 0 && bookingPackageId) {
          validScope = coupon.applicablePackages.some(id => id.toString() === bookingPackageId.toString());
        }

        if (validDate && validLimit && validPerUser && validFirstTime && validScope && basePrice >= coupon.minOrderValue) {
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = Math.round(basePrice * coupon.discountValue / 100);
            if (coupon.maxDiscountAmount !== null) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          } else {
            discountAmount = Math.min(coupon.discountValue, basePrice);
          }
          appliedCouponCode = coupon.code;
          coupon.usageLogs.push({ userId: customerId });
          coupon.totalUsed += 1;
          await coupon.save();
        } else {
          return res.status(400).json({ message: 'Coupon code is invalid or not applicable for this order.' });
        }
      } else {
        return res.status(404).json({ message: 'Coupon code not found.' });
      }
    }

    const addonsPriceTotal = addons && Array.isArray(addons) ? addons.reduce((sum, a) => sum + Number(a.price), 0) : 0;
    const totalAmount = Math.max(0, basePrice + addonsPriceTotal + platformFee - discountAmount);
    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // ── Lookup Location IDs based on Address strings ──
    let countryId = null;
    let stateId = null;
    let cityId = null;
    let areaId = null;
    let pincodeId = null;

    try {
      if (address && address.pincode) {
        const Pincode = require('../models/Pincode');
        const matchedPincode = await Pincode.findOne({ code: address.pincode.trim(), isActive: true, isDeleted: false })
          .populate({
            path: 'cityId',
            populate: { path: 'stateId' }
          })
          .populate('areaId');
        
        if (matchedPincode) {
          pincodeId = matchedPincode._id;
          areaId = matchedPincode.areaId?._id;
          cityId = matchedPincode.cityId?._id;
          stateId = matchedPincode.cityId?.stateId?._id;
          countryId = matchedPincode.cityId?.stateId?.countryId;
        }
      }

      if (!cityId && address && address.city) {
        const City = require('../models/City');
        const matchedCity = await City.findOne({ name: { $regex: `^${address.city.trim()}$`, $options: 'i' }, isActive: true, isDeleted: false })
          .populate('stateId');
        if (matchedCity) {
          cityId = matchedCity._id;
          stateId = matchedCity.stateId?._id;
          countryId = matchedCity.stateId?.countryId;
        }
      }
    } catch (locErr) {
      console.warn("Location references lookup failed:", locErr);
    }

    // Create Booking (single document for both service and package bookings)
    const booking = new Booking({
      customerId,
      serviceId: bookingServiceId,
      packageId: bookingPackageId,
      isPackageBooking,
      address,
      scheduledDate,
      scheduledSlot,
      otp,
      commissionAmount,
      customerPlatformFee: platformFee,
      couponCode: appliedCouponCode,
      discountAmount,
      countryId,
      stateId,
      cityId,
      areaId,
      pincodeId,
      addons: addons || [],
      quantity: qty,
      status: 'REQUESTED',
      paymentDetails: {
        orderId: orderId,
        amount: totalAmount,
        status: 'PENDING'
      }
    });

    await booking.save();

    // Auto-assign logic
    const adminSettingsObj = await AdminSettings.getSingleton();
    if (adminSettingsObj.autoAssignEnabled) {
      const best = await findBestPartner(booking);
      if (best) {
        booking.vendorId = best.partner._id;
        booking.status = 'ASSIGNED';
        await booking.save();
      }
    }

    // ── Notify user that their booking was created ──
    createNotification(
      customerId,
      'user',
      'Booking Initiated',
      `Your booking has been placed successfully. Awaiting payment confirmation.`,
      'booking',
      { bookingId: booking._id }
    );

    // ── Notify all admins ──
    try {
      const admins = await Admin.find({ isActive: true }).select('_id').lean();
      admins.forEach(a => createNotification(
        a._id, 'admin',
        'New Booking Received',
        `A new booking order (${orderId}) has been placed and is pending payment.`,
        'booking', { bookingId: booking._id }
      ));
    } catch (_) {}

    res.status(201).json({
      success: true,
      orderId,
      amount: totalAmount,
      currency: "INR",
      bookingId: booking._id,
      discountAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    // Payment is removed, we just return success to not break frontend immediately
    // Ideally frontend should also be updated to not call this.
    return res.status(200).json({ message: "Payment skipped successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
};

exports.getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.userId })
      .populate('serviceId')
      .populate('packageId')
      .populate('vendorId', 'name phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId')
      .populate('packageId')
      .populate('vendorId', 'name phone profilePicture location')
      .populate('customerId', 'name phone');
      
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    // Auth check: Only customer or assigned vendor or admin can view
    const isCustomer = req.user.role === 'customer' || req.user.role === 'user';
    const isVendor = req.user.role === 'vendor' || req.user.role === 'partner';

    if (isCustomer && booking.customerId && booking.customerId._id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (isVendor && booking.vendorId && booking.vendorId._id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    // Auth check: only customer or admin can cancel
    if (req.user.role === 'customer' && booking.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!['PENDING_PAYMENT', 'REQUESTED'].includes(booking.status)) {
      return res.status(400).json({ message: 'Can only cancel pending or requested bookings. Partner has already accepted.' });
    }

    booking.status = 'CANCELLED';
    await booking.save();

    // ── Notify the customer ──
    createNotification(
      booking.customerId, 'user',
      'Booking Cancelled',
      'Your booking has been cancelled. If you have any questions, contact support.',
      'booking', { bookingId: booking._id }
    );

    // ── Notify admins ──
    try {
      const admins = await Admin.find({ isActive: true }).select('_id').lean();
      admins.forEach(a => createNotification(
        a._id, 'admin',
        'Booking Cancelled',
        `Booking ${booking._id} has been cancelled by the customer.`,
        'booking', { bookingId: booking._id }
      ));
    } catch (_) {}
    
    res.json({ success: true, booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
