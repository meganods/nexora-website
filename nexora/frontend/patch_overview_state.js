const fs = require('fs');
let content = fs.readFileSync('src/app/admin/dashboard/page.tsx', 'utf8');

const targetState = `  const [chartCategoryData, setChartCategoryData] = useState<any[]>([]);`;
const replacementState = `  const [chartCategoryData, setChartCategoryData] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [topPartnersList, setTopPartnersList] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<any[]>([]);
  const [walletPayoutOverview, setWalletPayoutOverview] = useState<any>({ totalPayouts: 0, pendingPayouts: 0, availableBalance: 0 });`;

content = content.replace(targetState, replacementState);

const targetFetch = `      if (data.chartCategoryData) setChartCategoryData(data.chartCategoryData);`;
const replacementFetch = `      if (data.chartCategoryData) setChartCategoryData(data.chartCategoryData);
      if (data.recentBookings) setRecentBookings(data.recentBookings);
      if (data.topPartnersList) setTopPartnersList(data.topPartnersList);
      if (data.recentActivity) setRecentActivity(data.recentActivity);
      if (data.recentPayouts) setRecentPayouts(data.recentPayouts);
      if (data.walletPayoutOverview) setWalletPayoutOverview(data.walletPayoutOverview);`;

content = content.replace(targetFetch, replacementFetch);

fs.writeFileSync('src/app/admin/dashboard/page.tsx', content);
