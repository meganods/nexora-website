const fs = require('fs');
let content = fs.readFileSync('controllers/adminController.js', 'utf8');

const targetDestructure = `  const [
    totalRevenueAggr,
    activeBookings,
    verifiedVendors,
    totalUsers,
    totalServices,
    totalBookings,
    totalCountries,
    totalStates,
    totalCities,
    totalAreas,
    totalPincodes,
    activeLocationsCount
  ] = await Promise.all([`;

const replacementDestructure = `  const [
    totalRevenueAggr,
    activeBookings,
    completedBookings,
    cancelledBookings,
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
  ] = await Promise.all([`;

content = content.replace(targetDestructure, replacementDestructure);

const targetPromises = `    Booking.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, totalRevenue: { $sum: "$paymentDetails.amount" }, totalCommission: { $sum: "$commissionAmount" } } }
    ]),
    Booking.countDocuments({ status: { $in: ['REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS'] } }),
    ServicePartner.countDocuments({ kycStatus: 'APPROVED' }),
    User.countDocuments({ isActive: true }),
    Service.countDocuments({ isActive: true }),
    Booking.countDocuments(),`;

const replacementPromises = `    Booking.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, totalRevenue: { $sum: "$paymentDetails.amount" }, totalCommission: { $sum: "$commissionAmount" } } }
    ]),
    Booking.countDocuments({ status: { $in: ['REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS'] } }),
    Booking.countDocuments({ status: 'COMPLETED' }),
    Booking.countDocuments({ status: 'CANCELLED' }),
    ServicePartner.countDocuments({ kycStatus: 'APPROVED' }),
    ServicePartner.countDocuments(),
    ServicePartner.countDocuments({ kycStatus: 'PENDING_ADMIN_APPROVAL' }),
    User.countDocuments({ isActive: true }),
    Service.countDocuments({ isActive: true }),
    Booking.countDocuments(),`;

content = content.replace(targetPromises, replacementPromises);

const targetResJson = `  res.json({
    success: true,
    totalRevenue: revenueData.totalRevenue,
    totalCommission: revenueData.totalCommission,
    activeBookings,
    verifiedVendors,
    totalUsers,
    totalServices,
    totalBookings,`;

const replacementResJson = `  res.json({
    success: true,
    totalRevenue: revenueData.totalRevenue,
    totalCommission: revenueData.totalCommission,
    activeBookings,
    completedBookings,
    cancelledBookings,
    verifiedVendors,
    totalPartners,
    pendingApprovals,
    totalUsers,
    totalServices,
    totalBookings,`;

content = content.replace(targetResJson, replacementResJson);

fs.writeFileSync('controllers/adminController.js', content);
