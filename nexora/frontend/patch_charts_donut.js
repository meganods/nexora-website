const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/DashboardCharts.tsx', 'utf8');

// 1. Remove +18.6% and +15.7% labels
content = content.replace(/<span className="text-sm font-bold text-green-500 ml-2">\+18\.6%<\/span>/, '');
content = content.replace(/<span className="text-sm font-bold text-green-500 ml-2">\+15\.7%<\/span>/, '');
// Handle hardcoded ₹0 in revenue and 0 in bookings
content = content.replace(/<p className="text-sm font-bold text-primary mt-1">₹0/, '<p className="text-sm font-bold text-primary mt-1">₹{totalRevenueVal.toLocaleString(\'en-IN\')}');
content = content.replace(/<p className="text-sm font-bold text-primary mt-1">0/, '<p className="text-sm font-bold text-primary mt-1">{totalBookingsVal}');

// 2. Fix the hardcoded Donut Chart label
const donutMockLabel = `<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
            <span className="text-lg font-bold text-primary font-serif">2,847</span>
            <span className="text-[8px] font-bold text-foreground/40 uppercase tracking-widest mt-0.5">Bookings</span>
          </div>`;

const donutRealLabel = `<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
            <span className="text-lg font-bold text-primary font-serif">{totalBookingsVal.toLocaleString('en-IN')}</span>
            <span className="text-[8px] font-bold text-foreground/40 uppercase tracking-widest mt-0.5">Bookings</span>
          </div>`;

content = content.replace(donutMockLabel, donutRealLabel);

fs.writeFileSync('src/components/dashboard/DashboardCharts.tsx', content);
