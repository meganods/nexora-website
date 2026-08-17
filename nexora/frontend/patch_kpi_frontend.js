const fs = require('fs');
let content = fs.readFileSync('src/app/admin/dashboard/page.tsx', 'utf8');

const targetState = `  const [metrics, setMetrics] = useState({ revenue: 0, commission: 0, activeBookings: 0, verifiedPartners: 0, totalUsers: 0, totalServices: 0, totalBookings: 0 });`;
const replacementState = `  const [metrics, setMetrics] = useState({ revenue: 0, commission: 0, activeBookings: 0, completedBookings: 0, cancelledBookings: 0, verifiedPartners: 0, totalPartners: 0, pendingApprovals: 0, totalUsers: 0, totalServices: 0, totalBookings: 0 });`;

content = content.replace(targetState, replacementState);

const targetFetch = `        revenue: data.totalRevenue || 0,
        commission: data.totalCommission || 0,
        activeBookings: data.activeBookings || 0,
        verifiedPartners: data.verifiedVendors || 0,
        totalUsers: data.totalUsers || 0,
        totalServices: data.totalServices || 0,
        totalBookings: data.totalBookings || 0,`;

const replacementFetch = `        revenue: data.totalRevenue || 0,
        commission: data.totalCommission || 0,
        activeBookings: data.activeBookings || 0,
        completedBookings: data.completedBookings || 0,
        cancelledBookings: data.cancelledBookings || 0,
        verifiedPartners: data.verifiedVendors || 0,
        totalPartners: data.totalPartners || 0,
        pendingApprovals: data.pendingApprovals || 0,
        totalUsers: data.totalUsers || 0,
        totalServices: data.totalServices || 0,
        totalBookings: data.totalBookings || 0,`;

content = content.replace(targetFetch, replacementFetch);

const targetCards = `              <DashboardKPICard label="Total Revenue" value={metrics.revenue ? \`₹\${metrics.revenue.toLocaleString('en-IN')}\` : "₹12,45,680"} icon={IndianRupee} bg="bg-green-100" text="text-green-700" trend="+18.6%" />
              <DashboardKPICard label="Platform Commission" value={metrics.commission ? \`₹\${metrics.commission.toLocaleString('en-IN')}\` : "₹1,86,852"} icon={IndianRupee} bg="bg-gold/20" text="text-primary" trend="+16.2%" />
              <DashboardKPICard label="Total Bookings" value={metrics.totalBookings || 2847} icon={BookOpen} bg="bg-indigo-100" text="text-indigo-700" trend="+15.7%" />
              <DashboardKPICard label="Active Bookings" value={metrics.activeBookings || 124} icon={ShoppingBag} bg="bg-blue-100" text="text-blue-700" trend="+8.3%" />
              <DashboardKPICard label="Completed Bookings" value={(metrics.totalBookings - metrics.activeBookings) || 2523} icon={CheckCircle2} bg="bg-green-100" text="text-green-700" trend="+20.1%" />
              <DashboardKPICard label="Cancelled Bookings" value={Math.floor(metrics.totalBookings * 0.04) || 200} icon={X} bg="bg-red-100" text="text-red-700" trend="-6.4%" />
              <DashboardKPICard label="Total Customers" value={metrics.totalUsers || 5200} icon={Users} bg="bg-pink-100" text="text-pink-700" trend="+22.8%" />
              <DashboardKPICard label="Total Service Partners" value={(metrics.verifiedPartners + 50) || 430} icon={UserCheck} bg="bg-purple-100" text="text-purple-700" trend="+14.3%" />
              <DashboardKPICard label="Verified Partners" value={metrics.verifiedPartners || 358} icon={ShieldCheck} bg="bg-emerald-100" text="text-emerald-700" trend="+18.9%" />
              <DashboardKPICard label="Pending Approvals" value={72} icon={AlertCircle} bg="bg-amber-100" text="text-amber-700" trend="-4.7%" />`;

const replacementCards = `              <DashboardKPICard label="Total Revenue" value={\`₹\${(metrics.revenue || 0).toLocaleString('en-IN')}\`} icon={IndianRupee} bg="bg-green-100" text="text-green-700" trend="+18.6%" />
              <DashboardKPICard label="Platform Commission" value={\`₹\${(metrics.commission || 0).toLocaleString('en-IN')}\`} icon={IndianRupee} bg="bg-gold/20" text="text-primary" trend="+16.2%" />
              <DashboardKPICard label="Total Bookings" value={metrics.totalBookings || 0} icon={BookOpen} bg="bg-indigo-100" text="text-indigo-700" trend="+15.7%" />
              <DashboardKPICard label="Active Bookings" value={metrics.activeBookings || 0} icon={ShoppingBag} bg="bg-blue-100" text="text-blue-700" trend="+8.3%" />
              <DashboardKPICard label="Completed Bookings" value={metrics.completedBookings || 0} icon={CheckCircle2} bg="bg-green-100" text="text-green-700" trend="+20.1%" />
              <DashboardKPICard label="Cancelled Bookings" value={metrics.cancelledBookings || 0} icon={X} bg="bg-red-100" text="text-red-700" trend="-6.4%" />
              <DashboardKPICard label="Total Customers" value={metrics.totalUsers || 0} icon={Users} bg="bg-pink-100" text="text-pink-700" trend="+22.8%" />
              <DashboardKPICard label="Total Service Partners" value={metrics.totalPartners || 0} icon={UserCheck} bg="bg-purple-100" text="text-purple-700" trend="+14.3%" />
              <DashboardKPICard label="Verified Partners" value={metrics.verifiedPartners || 0} icon={ShieldCheck} bg="bg-emerald-100" text="text-emerald-700" trend="+18.9%" />
              <DashboardKPICard label="Pending Approvals" value={metrics.pendingApprovals || 0} icon={AlertCircle} bg="bg-amber-100" text="text-amber-700" trend="-4.7%" />`;

content = content.replace(targetCards, replacementCards);

fs.writeFileSync('src/app/admin/dashboard/page.tsx', content);
