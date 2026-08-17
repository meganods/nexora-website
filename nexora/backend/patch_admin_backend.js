const fs = require('fs');
let content = fs.readFileSync('controllers/adminController.js', 'utf8');

const targetContent = `  // Fallbacks to realistic dummy data if no real records exist
  if (partnersByCity.length === 0 || partnersByCity.every(p => !p._id)) {
    partnersByCity = [
      { _id: 'Delhi', count: 12 },
      { _id: 'Noida', count: 8 },
      { _id: 'Gurugram', count: 10 },
      { _id: 'Ghaziabad', count: 5 }
    ];
  }
  if (bookingsByCity.length === 0 || bookingsByCity.every(b => !b._id)) {
    bookingsByCity = [
      { _id: 'Delhi', count: 120 },
      { _id: 'Noida', count: 85 },
      { _id: 'Gurugram', count: 95 },
      { _id: 'Ghaziabad', count: 40 }
    ];
  }
  if (revenueByCity.length === 0 || revenueByCity.every(r => !r._id)) {
    revenueByCity = [
      { _id: 'Delhi', total: 240000 },
      { _id: 'Noida', total: 170000 },
      { _id: 'Gurugram', total: 190000 },
      { _id: 'Ghaziabad', total: 80000 }
    ];
  }

  const topCities = [
    { name: 'Delhi', count: 120, revenue: 240000 },
    { name: 'Gurugram', count: 95, revenue: 190000 },
    { name: 'Noida', count: 85, revenue: 170000 }
  ];

  const topAreas = [
    { name: 'Sector 62', count: 45 },
    { name: 'DLF Phase 3', count: 38 },
    { name: 'Connaught Place', count: 32 }
  ];`;

const replacementContent = `  // Real MongoDB Aggregations for top cities and areas
  const topCities = await Booking.aggregate([
    { $group: { _id: "$address.city", count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$paymentDetails.amount", 0] } } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { name: "$_id", count: 1, revenue: 1, _id: 0 } }
  ]);

  const topAreas = await Booking.aggregate([
    { $group: { _id: "$address.area", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { name: "$_id", count: 1, _id: 0 } }
  ]);

  // Real MongoDB aggregations for Chart Data (Last 30 Days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyBookingsAggr = await Booking.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$paymentDetails.amount", 0] } }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  const chartBookingData = dailyBookingsAggr.map(d => ({ label: d._id, value: d.count }));
  const chartRevenueData = dailyBookingsAggr.map(d => ({ label: d._id, value: d.revenue }));

  const categoryAggr = await Booking.aggregate([
    {
      $lookup: {
        from: 'services',
        localField: 'serviceId',
        foreignField: '_id',
        as: 'service'
      }
    },
    { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'service.categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$category.name", count: { $sum: 1 } } }
  ]);

  const colors = ['#0F3D30', '#C3AB84', '#3B82F6', '#8B5CF6', '#EC4899', '#9CA3AF'];
  let totalCatBookings = categoryAggr.reduce((acc, curr) => acc + curr.count, 0);
  const chartCategoryData = categoryAggr.map((cat, i) => ({
    name: cat._id || 'Uncategorized',
    percentage: totalCatBookings > 0 ? Math.round((cat.count / totalCatBookings) * 100) : 0,
    color: colors[i % colors.length]
  }));`;

content = content.replace(targetContent, replacementContent);

// Add chart data to res.json
const oldResJson = `      totalCountries: totalCountries || 1,
      totalStates: totalStates || 1,
      totalCities: totalCities || 1,
      totalAreas: totalAreas || 3,
      totalPincodes: totalPincodes || 3,
      activeLocations: activeLocationsCount || 1,
      partnersByCity,
      bookingsByCity,
      revenueByCity,
      topCities,
      topAreas
    }
  });`;

const newResJson = `      totalCountries: totalCountries || 0,
      totalStates: totalStates || 0,
      totalCities: totalCities || 0,
      totalAreas: totalAreas || 0,
      totalPincodes: totalPincodes || 0,
      activeLocations: activeLocationsCount || 0,
      partnersByCity,
      bookingsByCity,
      revenueByCity,
      topCities,
      topAreas
    },
    chartBookingData,
    chartRevenueData,
    chartCategoryData
  });`;

content = content.replace(oldResJson, newResJson);

fs.writeFileSync('controllers/adminController.js', content);
