import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChevronDown as ArrowDown } from 'lucide-react';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface DashboardChartsProps {
  revenueData?: ChartDataPoint[];
  bookingData?: ChartDataPoint[];
  categoryData?: { name: string; percentage: number; color: string }[];
}

const TIMEFRAME_LABELS = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year'
};

export default function DashboardCharts({
  revenueData,
  bookingData,
  categoryData
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  // Timeframe selector states
  const [revenueTimeframe, setRevenueTimeframe] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [isRevDropdownOpen, setIsRevDropdownOpen] = useState(false);

  const [bookingTimeframe, setBookingTimeframe] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm h-72 animate-pulse" />
        <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm h-72 animate-pulse" />
        <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm h-72 animate-pulse" />
      </div>
    );
  }

  // Get active dataset based on selection
  const getRevenueDataset = () => {
    if (revenueData && revenueData.length > 0) return revenueData;
    return [];
  };

  const getBookingDataset = () => {
    if (bookingData && bookingData.length > 0) return bookingData;
    return [];
  };

  const activeRevenueData = getRevenueDataset();
  const activeBookingData = getBookingDataset();

  const activeCategoryData = categoryData && categoryData.length > 0
    ? categoryData.map(c => ({ name: c.name, value: c.percentage, color: c.color }))
    : [];

  const totalBookingsVal = activeBookingData.reduce((acc, curr) => acc + curr.value, 0);
  const totalRevenueVal = activeRevenueData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Revenue Overview */}
      <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm flex flex-col justify-between h-80 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold text-primary text-sm mb-0.5">Revenue Overview</h3>
            <p className="text-xs font-semibold text-foreground/50">
              <span className="text-primary font-bold">
                ₹{totalRevenueVal.toLocaleString('en-IN')}
              </span>{" "}
              <span className="text-green-500 font-bold">+18.6%</span>
            </p>
          </div>
          {/* Custom Timeframe Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRevDropdownOpen(!isRevDropdownOpen)}
              className="border border-gold/30 rounded-xl px-3 py-1.5 text-[10px] font-bold text-foreground/75 bg-cream/30 hover:bg-cream/50 transition-colors flex items-center gap-1 focus:outline-none"
            >
              {TIMEFRAME_LABELS[revenueTimeframe]}
              <ArrowDown className="w-3 h-3 text-foreground/50" />
            </button>
            {isRevDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsRevDropdownOpen(false)} />
                <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gold/20 rounded-xl shadow-lg z-30 py-1 divide-y divide-gold/5 font-semibold text-foreground/80 text-[10px] overflow-hidden">
                  {(['today', 'week', 'month', 'year'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setRevenueTimeframe(opt);
                        setIsRevDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-cream/40 transition-colors ${revenueTimeframe === opt ? 'text-primary bg-cream/20 font-bold' : ''}`}
                    >
                      {TIMEFRAME_LABELS[opt]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex-grow w-full h-full relative -left-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeRevenueData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F3D30" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0F3D30" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="value" stroke="#0F3D30" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Booking Overview */}
      <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm flex flex-col justify-between h-80 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold text-primary text-sm mb-0.5">Booking Overview</h3>
            <p className="text-xs font-semibold text-foreground/50">
              <span className="text-primary font-bold">
                {totalBookingsVal}
              </span>{" "}
              <span className="text-green-500 font-bold">+15.7%</span>
            </p>
          </div>
          {/* Custom Timeframe Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBookDropdownOpen(!isBookDropdownOpen)}
              className="border border-gold/30 rounded-xl px-3 py-1.5 text-[10px] font-bold text-foreground/75 bg-cream/30 hover:bg-cream/50 transition-colors flex items-center gap-1 focus:outline-none"
            >
              {TIMEFRAME_LABELS[bookingTimeframe]}
              <ArrowDown className="w-3 h-3 text-foreground/55" />
            </button>
            {isBookDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsBookDropdownOpen(false)} />
                <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gold/20 rounded-xl shadow-lg z-30 py-1 divide-y divide-gold/5 font-semibold text-foreground/80 text-[10px] overflow-hidden">
                  {(['today', 'week', 'month', 'year'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setBookingTimeframe(opt);
                        setIsBookDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-cream/40 transition-colors ${bookingTimeframe === opt ? 'text-primary bg-cream/20 font-bold' : ''}`}
                    >
                      {TIMEFRAME_LABELS[opt]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex-grow w-full h-full relative -left-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeBookingData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorBooking" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C3AB84" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C3AB84" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value: any) => [value, 'Bookings']} />
              <Area type="monotone" dataKey="value" stroke="#C3AB84" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBooking)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Top Service Categories */}
      <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm flex flex-col justify-between h-80">
        <div>
          <h3 className="font-serif font-bold text-primary text-sm mb-0.5">Top Service Categories</h3>
          <p className="text-[9px] text-foreground/45 font-semibold uppercase tracking-wider mb-2">Platform booking share</p>
        </div>
        <div className="flex flex-row items-center justify-between gap-2 flex-grow">
          {/* Donut Chart container */}
          <div className="w-[120px] h-[120px] relative flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={52}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {activeCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#0F3D30'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Absolute Label inside Donut hole */}
            {/* <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[14px] font-bold text-primary font-serif leading-none">

              </span>
              <span className="text-[8px] text-foreground/40 font-bold uppercase mt-0.5">Bookings</span>
            </div> */}
          </div>
          {/* Legend Items */}
          <div className="flex-grow space-y-1.5 text-[10px] font-semibold text-foreground/75 min-w-0 pr-1">
            {activeCategoryData.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between gap-1.5 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div style={{ backgroundColor: c.color || '#0F3D30' }} className="w-2 h-2 rounded-full flex-shrink-0" />
                  <span className="truncate max-w-[80px]">{c.name}</span>
                </div>
                <span className="text-primary font-bold flex-shrink-0">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
