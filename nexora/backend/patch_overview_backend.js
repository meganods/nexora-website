const fs = require('fs');
let content = fs.readFileSync('controllers/adminController.js', 'utf8');

// We need to require Notification and Payout at the top of getDashboardMetrics
content = content.replace(
  `  const Pincode = require('../models/Pincode');`,
  `  const Pincode = require('../models/Pincode');
  const Notification = require('../models/Notification');
  const Payout = require('../models/Payout');`
);

// We need to add the new queries to the Promise.all
// But we should just do them after the first Promise.all to avoid changing too much indentation
const targetAfterPromiseAll = `  // Real MongoDB Aggregations for top cities and areas`;

const replacementAfterPromiseAll = `  // Query lists for the Dashboard Overview
  const [
    recentBookings,
    topPartnersList,
    recentActivity,
    recentPayouts,
    totalPayoutsAggr,
    pendingPayoutsAggr
  ] = await Promise.all([
    Booking.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name').populate('serviceId', 'name'),
    ServicePartner.find({ kycStatus: 'APPROVED' }).sort({ rating: -1, totalBookings: -1 }).limit(4),
    Notification.find({ recipientType: 'admin' }).sort({ createdAt: -1 }).limit(5),
    Payout.find().sort({ createdAt: -1 }).limit(4).populate('vendorId', 'businessName'),
    Payout.aggregate([{ $match: { status: 'COMPLETED' } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payout.aggregate([{ $match: { status: 'PENDING' } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
  ]);

  const walletPayoutOverview = {
    totalPayouts: totalPayoutsAggr[0]?.total || 0,
    pendingPayouts: pendingPayoutsAggr[0]?.total || 0,
    availableBalance: totalRevenueAggr[0]?.totalCommission || 0 // Proxy for platform earnings
  };

  // Real MongoDB Aggregations for top cities and areas`;

content = content.replace(targetAfterPromiseAll, replacementAfterPromiseAll);

// Add the new fields to res.json
const targetResJsonEnd = `    chartBookingData,
    chartRevenueData,
    chartCategoryData
  });`;

const replacementResJsonEnd = `    chartBookingData,
    chartRevenueData,
    chartCategoryData,
    recentBookings,
    topPartnersList,
    recentActivity,
    recentPayouts,
    walletPayoutOverview
  });`;

content = content.replace(targetResJsonEnd, replacementResJsonEnd);

fs.writeFileSync('controllers/adminController.js', content);
