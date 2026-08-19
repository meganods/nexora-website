const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./backend/.env" });

const Country = require("./backend/models/Country");
const State = require("./backend/models/State");
const City = require("./backend/models/City");
const Area = require("./backend/models/Area");
const Pincode = require("./backend/models/Pincode");
const Notification = require("./backend/models/Notification");
const Payout = require("./backend/models/Payout");
const Booking = require("./backend/models/Booking");
const ServicePartner = require("./backend/models/ServicePartner");
const User = require("./backend/models/User");
const Service = require("./backend/models/Service");

async function testMetrics() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");

    const [
      totalRevenueAggr,
      activeBookings,
      completedBookings,
      cancelledBookings,
      pendingPaymentBookings,
      verifiedVendors,
      totalPartners,
      pendingApprovals,
      totalUsers,
      totalServices,
      totalBookings,
      totalCountries,
      totalStates,
      totalCities,
      totalAreas,
      totalPincodes,
      activeLocationsCount
    ] = await Promise.all([
      Booking.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $group: { _id: null, totalRevenue: { $sum: "$paymentDetails.amount" }, totalCommission: { $sum: "$commissionAmount" } } }
      ]),
      Booking.countDocuments({ status: { $in: ['REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS'] } }),
      Booking.countDocuments({ status: 'COMPLETED' }),
      Booking.countDocuments({ status: 'CANCELLED' }),
      Booking.countDocuments({ status: 'PENDING_PAYMENT' }),
      ServicePartner.countDocuments({ kycStatus: 'APPROVED' }),
      ServicePartner.countDocuments(),
      ServicePartner.countDocuments({ kycStatus: 'PENDING_ADMIN_APPROVAL' }),
      User.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Country.countDocuments({ isDeleted: false }),
      State.countDocuments({ isDeleted: false }),
      City.countDocuments({ isDeleted: false }),
      Area.countDocuments({ isDeleted: false }),
      Pincode.countDocuments({ isDeleted: false }),
      City.countDocuments({ isActive: true, isDeleted: false })
    ]);

    console.log("Success! Data lengths:", {
      totalRevenueAggr: totalRevenueAggr.length,
      activeBookings,
      totalUsers,
    });
  } catch (err) {
    console.error("Error in test:", err);
  } finally {
    await mongoose.disconnect();
  }
}

testMetrics();
