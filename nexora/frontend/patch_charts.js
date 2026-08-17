const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/DashboardCharts.tsx', 'utf8');

// Strip out the mock data constants (lines 26 to 109 roughly)
// It's safer to use regex replacement to remove the block between `// Today (hourly)` and `const TIMEFRAME_LABELS`
content = content.replace(/\/\/ Today \(hourly\)[\s\S]*?(?=const TIMEFRAME_LABELS)/, '');

// Update getRevenueDataset and getBookingDataset to just use the props or empty array
content = content.replace(
  `  const getRevenueDataset = () => {
    if (revenueData && revenueData.length > 0) return revenueData;
    switch (revenueTimeframe) {
      case 'today': return todayRevenue;
      case 'week': return weekRevenue;
      case 'year': return yearRevenue;
      case 'month':
      default: return monthRevenue;
    }
  };`,
  `  const getRevenueDataset = () => {
    if (revenueData && revenueData.length > 0) return revenueData;
    return [];
  };`
);

content = content.replace(
  `  const getBookingDataset = () => {
    if (bookingData && bookingData.length > 0) return bookingData;
    switch (bookingTimeframe) {
      case 'today': return todayBookings;
      case 'week': return weekBookings;
      case 'year': return yearBookings;
      case 'month':
      default: return monthBookings;
    }
  };`,
  `  const getBookingDataset = () => {
    if (bookingData && bookingData.length > 0) return bookingData;
    return [];
  };`
);

content = content.replace(
  `  const activeCategoryData = categoryData && categoryData.length > 0 
    ? categoryData.map(c => ({ name: c.name, value: c.percentage, color: c.color })) 
    : defaultCategoryData;`,
  `  const activeCategoryData = categoryData && categoryData.length > 0 
    ? categoryData.map(c => ({ name: c.name, value: c.percentage, color: c.color })) 
    : [];`
);

fs.writeFileSync('src/components/dashboard/DashboardCharts.tsx', content);
