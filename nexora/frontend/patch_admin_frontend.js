const fs = require('fs');
let content = fs.readFileSync('src/app/admin/dashboard/page.tsx', 'utf8');

// Add states for the chart data
content = content.replace(
  `  const [locationMetrics, setLocationMetrics] = useState<any>(null);`,
  `  const [locationMetrics, setLocationMetrics] = useState<any>(null);
  const [chartBookingData, setChartBookingData] = useState<any[]>([]);
  const [chartRevenueData, setChartRevenueData] = useState<any[]>([]);
  const [chartCategoryData, setChartCategoryData] = useState<any[]>([]);`
);

// Update fetchMetrics to save chart data
content = content.replace(
  `      if (data.locationMetrics) {
        setLocationMetrics(data.locationMetrics);
      }`,
  `      if (data.locationMetrics) {
        setLocationMetrics(data.locationMetrics);
      }
      if (data.chartBookingData) setChartBookingData(data.chartBookingData);
      if (data.chartRevenueData) setChartRevenueData(data.chartRevenueData);
      if (data.chartCategoryData) setChartCategoryData(data.chartCategoryData);`
);

// Update DashboardCharts prop passing
content = content.replace(
  `<DashboardCharts />`,
  `<DashboardCharts revenueData={chartRevenueData} bookingData={chartBookingData} categoryData={chartCategoryData} />`
);

fs.writeFileSync('src/app/admin/dashboard/page.tsx', content);
