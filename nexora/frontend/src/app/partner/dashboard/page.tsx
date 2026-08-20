"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Power, Wallet, IndianRupee, Briefcase, FileText, Wrench, Calendar, Tag, Percent,
  Star, ArrowRight, CheckCircle2, ChevronDown, Clock, Activity, ShieldCheck, Bell, TrendingUp
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '@/lib/api';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';

const STATUS_COLORS = {
  'ASSIGNED': '#1F4037',     // Dark green
  'IN_PROGRESS': '#F59E0B',  // Orange/gold
  'COMPLETED': '#7BA07A',    // Light green
  'CANCELLED': '#EF4444'     // Red
};

export default function PartnerDashboard() {
  const router = useRouter();

  const [vendor, setVendor] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dropdown states
  const [timePeriod, setTimePeriod] = useState('This Month');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const [bookingsPeriod, setBookingsPeriod] = useState('Daily');
  const [showBookingsDropdown, setShowBookingsDropdown] = useState(false);

  const [earningsPeriod, setEarningsPeriod] = useState('Weekly');
  const [showEarningsDropdown, setShowEarningsDropdown] = useState(false);

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchDashboardDetails();
  }, []);

  const fetchDashboardDetails = async () => {
    try {
      setLoading(true);
      const profRes = await api.get('/partner/profile');
      if (profRes.data?.vendor) {
        const v = profRes.data.vendor;
        setVendor(v);
        setIsOnline(v.isOnline || false);

        if (v.kycStatus !== 'APPROVED') {
          router.replace('/partner/status');
          return;
        }

        const statsRes = await api.get('/partner/dashboard-stats');
        if (statsRes.data?.success) {
          setStats(statsRes.data);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  const getBookingsChartData = () => {
    if (!stats || !stats.bookingsForCharts) return [];
    const data = stats.bookingsForCharts;
    
    // Grouping helper
    const grouped: Record<string, { Bookings: number, Completed: number }> = {};
    
    data.forEach((b: any) => {
      const d = new Date(b.createdAt);
      let key = '';
      if (bookingsPeriod === 'Monthly') {
        key = d.toLocaleString('en-US', { month: 'short' });
      } else if (bookingsPeriod === 'Weekly') {
        // Simple week grouping for demo
        key = `Week ${Math.ceil(d.getDate() / 7)}`;
      } else {
        key = d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      }
      
      if (!grouped[key]) grouped[key] = { Bookings: 0, Completed: 0 };
      grouped[key].Bookings++;
      if (b.status === 'COMPLETED') grouped[key].Completed++;
    });

    return Object.entries(grouped).map(([name, counts]) => ({ name, ...counts }));
  };

  const getEarningsChartData = () => {
    if (!stats || !stats.bookingsForCharts) return [];
    const data = stats.bookingsForCharts;
    
    const grouped: Record<string, { Earnings1: number }> = {};
    
    data.forEach((b: any) => {
      const d = new Date(b.createdAt);
      let key = '';
      if (earningsPeriod === 'Monthly') {
        key = d.toLocaleString('en-US', { month: 'short' });
      } else if (earningsPeriod === 'Weekly') {
        key = `Week ${Math.ceil(d.getDate() / 7)}`;
      } else if (earningsPeriod === 'Yearly') {
        key = d.getFullYear().toString();
      } else {
        // Today (hourly)
        key = `${d.getHours()} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
      }
      
      if (!grouped[key]) grouped[key] = { Earnings1: 0 };
      grouped[key].Earnings1 += (b.earning || 0);
    });

    return Object.entries(grouped).map(([name, counts]) => ({ name, ...counts }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
      case 'PARTNER_ACCEPTED':
      case 'REQUESTED':
        return 'bg-blue-100 text-blue-700';
      case 'ON_THE_WAY':
      case 'ARRIVED':
      case 'OTP_VERIFICATION':
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-700';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
      case 'REJECTED':
      case 'NO_SHOW':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading || !stats) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-cream rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-cream rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const { kpis, recentBookings, upcomingSchedule, recentTransactions, statusChartData, topServicesData } = stats;

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto text-foreground/80">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <p className="text-sm font-semibold mb-1 text-gray-600">Welcome back,</p>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
              {vendor?.name || 'Nexora Partner'}
            </h1>
            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              VERIFIED
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Here's what's happening with your business today.</p>
        </div>

        <div className="flex items-center gap-6">
          {/* Time Period Filter */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold hover:border-gray-300 transition-colors shadow-sm"
            >
              {timePeriod} <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {showPeriodDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                {['Today', 'This Week', 'This Month', 'Last Month', 'All Time'].map(p => (
                  <button
                    key={p}
                    onClick={() => { setTimePeriod(p); setShowPeriodDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${timePeriod === p ? 'font-bold text-primary' : 'text-gray-600'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <NotificationBell tokenKey="nexora_token" theme="light" userRole="vendor" />


        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[140px]">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-orange-50 text-orange-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-bold mb-0.5">Total Bookings</p>
            <h3 className="font-serif text-3xl font-bold text-primary">{kpis.total.count}</h3>
            <p className="text-[10px] font-bold text-green-600 mt-1 flex flex-wrap items-center gap-1">
              <TrendingUp className="w-3 h-3 flex-shrink-0" /> <span>{kpis.total.trend}</span> <span className="text-gray-400 font-medium">vs last 30 days</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[140px]">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-bold mb-0.5">Active Bookings</p>
            <h3 className="font-serif text-3xl font-bold text-primary">{kpis.active.count}</h3>
            <p className="text-[10px] font-bold text-green-600 mt-1 flex flex-wrap items-center gap-1">
              <TrendingUp className="w-3 h-3 flex-shrink-0" /> <span>{kpis.active.trend}</span> <span className="text-gray-400 font-medium">vs last 30 days</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[140px]">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-green-50 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-bold mb-0.5">Completed Bookings</p>
            <h3 className="font-serif text-3xl font-bold text-primary">{kpis.completed.count}</h3>
            <p className="text-[10px] font-bold text-green-600 mt-1 flex flex-wrap items-center gap-1">
              <TrendingUp className="w-3 h-3 flex-shrink-0" /> <span>{kpis.completed.trend}</span> <span className="text-gray-400 font-medium">vs last 30 days</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[140px]">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-green-50 text-green-700">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-bold mb-0.5">Total Earnings</p>
            <h3 className="font-serif text-3xl font-bold text-primary">₹{kpis.earnings.count.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-green-600 mt-1 flex flex-wrap items-center gap-1">
              <TrendingUp className="w-3 h-3 flex-shrink-0" /> <span>{kpis.earnings.trend}</span> <span className="text-gray-400 font-medium">vs last 30 days</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[140px]">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-bold mb-0.5">Wallet Balance</p>
            <h3 className="font-serif text-3xl font-bold text-primary mb-1">₹{kpis.wallet.toLocaleString()}</h3>
            <button className="text-[10px] font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors w-fit">Withdraw</button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[140px]">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-orange-50 text-orange-500">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-bold mb-0.5">Rating</p>
            <h3 className="font-serif text-3xl font-bold text-primary">{kpis.rating}</h3>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">({kpis.reviews} reviews)</p>
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Bookings Overview (Area Chart) */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] lg:col-span-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-[15px] font-bold text-primary">Bookings Overview</h2>
            <div className="relative">
              <button
                onClick={() => setShowBookingsDropdown(!showBookingsDropdown)}
                className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100"
              >
                {bookingsPeriod} <ChevronDown className="w-3 h-3" />
              </button>
              {showBookingsDropdown && (
                <div className="absolute right-0 mt-1 w-24 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                  {['Daily', 'Weekly', 'Monthly'].map(p => (
                    <button
                      key={p}
                      onClick={() => { setBookingsPeriod(p); setShowBookingsDropdown(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${bookingsPeriod === p ? 'font-bold text-primary' : 'text-gray-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-[250px]">
            {getBookingsChartData().length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getBookingsChartData()} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1F4037" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#1F4037" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C3AB84" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#C3AB84" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#4b5563', paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="Bookings" stroke="#1F4037" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
                  <Area type="monotone" dataKey="Completed" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-xs text-gray-400">No data available</div>
            )}
          </div>
        </div>

        {/* Earnings Overview (Grouped Bar Chart) */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] lg:col-span-4 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-[15px] font-bold text-primary">Earnings Overview</h2>
            <div className="relative">
              <button
                onClick={() => setShowEarningsDropdown(!showEarningsDropdown)}
                className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100"
              >
                {earningsPeriod} <ChevronDown className="w-3 h-3" />
              </button>
              {showEarningsDropdown && (
                <div className="absolute right-0 mt-1 w-24 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                  {['Today', 'Weekly', 'Monthly', 'Yearly'].map(p => (
                    <button
                      key={p}
                      onClick={() => { setEarningsPeriod(p); setShowEarningsDropdown(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${earningsPeriod === p ? 'font-bold text-primary' : 'text-gray-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-[250px]">
             {getEarningsChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getEarningsChartData()} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                    <Bar dataKey="Earnings1" name="Earnings (₹)" fill="#1F4037" radius={[2, 2, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">No data available</div>
              )}
          </div>
        </div>

        {/* Bookings by Status (Donut Chart) */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] lg:col-span-3 flex flex-col overflow-hidden">
          <h2 className="font-serif text-[15px] font-bold text-primary mb-6">Bookings by Status</h2>
          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            {statusChartData && statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#4b5563', fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
             ) : (
              <div className="text-xs text-gray-400">No data available</div>
             )}
          </div>
        </div>
      </div>

      {/* Tables Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Recent Bookings */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] xl:col-span-7 flex flex-col overflow-hidden p-6">
          <h2 className="font-serif text-[15px] font-bold text-primary mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto flex-1 mb-4">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[10px] font-bold text-gray-500 border-b border-gray-100">
                  <th className="pb-3">Booking ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((r: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 font-bold text-[11px] text-gray-700">{r.id}</td>
                    <td className="py-3.5 text-xs text-gray-700 font-medium">{r.customer}</td>
                    <td className="py-3.5 text-xs text-gray-700">{r.service}</td>
                    <td className="py-3.5 text-[11px] text-gray-600 font-medium">{r.date}</td>
                    <td className="py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${getStatusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-gray-700">{r.amount}</td>
                    <td className="py-3.5">
                      <Link href="/partner/bookings" className="text-[10px] font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200">View</Link>
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                   <tr>
                     <td colSpan={7} className="py-8 text-center text-xs text-gray-400">No recent bookings found</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
          <Link href="/partner/bookings" className="text-[11px] font-bold text-primary hover:text-gold transition-colors flex items-center justify-center gap-1 mx-auto w-fit">
            View All Bookings <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] xl:col-span-5 flex flex-col">
          <h2 className="font-serif text-[15px] font-bold text-primary mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto flex-1 mb-4">
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead>
                <tr className="text-[10px] font-bold text-gray-500 border-b border-gray-100">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-3.5 text-xs font-medium text-gray-700">{tx.type}</td>
                    <td className={`py-3.5 text-xs font-bold ${tx.amountColor}`}>{tx.amount}</td>
                    <td className="py-3.5 text-[11px] font-medium text-gray-600">{tx.date}</td>
                    <td className="py-3.5 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tx.status === 'Success' ? 'text-green-700 bg-green-100' : 'text-gray-700 bg-gray-100'}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentTransactions.length === 0 && (
                   <tr>
                     <td colSpan={4} className="py-8 text-center text-xs text-gray-400">No recent transactions found</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
          <Link href="/partner/wallet" className="text-[11px] font-bold text-primary hover:text-gold transition-colors flex items-center justify-center gap-1 mx-auto w-fit">
            View All Transactions <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Top Services */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] lg:col-span-4 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-[15px] font-bold text-primary">Top Services</h2>
            <button className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
              All Time <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 min-h-[220px]">
            {topServicesData && topServicesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServicesData} layout="vertical" margin={{ top: 0, right: 10, left: 15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563', fontWeight: 600 }} width={90} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="Bookings" fill="#1F4037" radius={[0, 2, 2, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">No data available</div>
             )}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] lg:col-span-4 flex flex-col">
          <h2 className="font-serif text-[15px] font-bold text-primary mb-4">Upcoming Schedule</h2>
          <div className="flex-1">
            <table className="w-full text-left border-collapse">
              <tbody>
                {upcomingSchedule.map((s: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 text-[11px] font-bold text-gray-700 w-20">{s.time}</td>
                    <td className="py-3 text-[11px] font-medium text-gray-600">{s.customer}</td>
                    <td className="py-3 text-[11px] font-medium text-gray-600">{s.service}</td>
                    <td className="py-3 text-right">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${getStatusColor(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {upcomingSchedule.length === 0 && (
                  <tr>
                     <td colSpan={4} className="py-8 text-center text-xs text-gray-400">No upcoming active bookings</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
          <Link href="/partner/bookings" className="text-[11px] font-bold text-primary hover:text-gold transition-colors flex items-center justify-center gap-1 mx-auto w-fit mt-4">
            View Full Schedule <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-transparent lg:col-span-4 flex flex-col">
          <h2 className="font-serif text-[15px] font-bold text-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4 flex-1">
            {[
              { label: 'Accept Bookings', sub: 'View new requests', icon: FileText, href: '/partner/requests', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active Bookings', sub: 'Manage current jobs', icon: Briefcase, href: '/partner/bookings', color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'My Services', sub: 'Update pricing', icon: Wrench, href: '/partner/services', color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Earnings & Wallet', sub: 'View payouts', icon: Wallet, href: '/partner/wallet', color: 'text-orange-500', bg: 'bg-orange-50' },
              { label: 'Create Offer', sub: 'New promotion', icon: Percent, href: '/partner/offers/new', color: 'text-orange-500', bg: 'bg-orange-50' },
              { label: 'Availability', sub: 'Set your schedule', icon: Calendar, href: '/partner/availability', color: 'text-green-600', bg: 'bg-green-50' }
            ].map((act, i) => (
              <Link
                key={i}
                href={act.href}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${act.bg} ${act.color}`}>
                  <act.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-gray-800 leading-tight">
                    {act.label}
                  </h4>
                  <p className="text-[9px] text-gray-500 mt-0.5">{act.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
