"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingBag, Tag, CheckCircle2, Package, ListCollapse, Gift, BookOpen, Users, UserCheck, ShieldCheck, Percent, Star, CalendarDays, Megaphone, Zap, Wallet, Bell, TrendingUp, Settings2, ArrowLeft, Menu, MapPin
} from 'lucide-react';
import api from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  /** Where the Back button goes — usually /admin/dashboard?tab=xxx */
  backHref: string;
  backLabel?: string;
  children: React.ReactNode;
}

const TABS = [
  { id: 'metrics',            label: 'Overview',              icon: ShoppingBag },
  { id: 'locations',          label: 'Locations',             icon: MapPin },
  { id: 'categories',         label: 'Service Categories',    icon: Tag },
  { id: 'service_approvals',   label: 'Service Approvals',    icon: CheckCircle2 },
  { id: 'services',           label: 'Services',              icon: Package },
  { id: 'sub_services',       label: 'Sub Services',          icon: ListCollapse },
  { id: 'packages',           label: 'Packages',              icon: Gift },
  { id: 'bookings',           label: 'Bookings',              icon: BookOpen },
  { id: 'users',              label: 'Customers',             icon: Users },
  { id: 'partners',           label: 'Service Partners',      icon: UserCheck },
  { id: 'verification',       label: 'Partner KYC',           icon: ShieldCheck },
  { id: 'coupons',            label: 'Coupons',               icon: Percent },
  { id: 'offers',             label: 'Offers',                icon: Star },
  { id: 'campaigns',          label: 'Sale Campaigns',        icon: CalendarDays },
  { id: 'deals',              label: 'Best Deals',            icon: Tag },
  { id: 'banners',            label: 'Banners',               icon: Megaphone },
  { id: 'reviews',            label: 'Reviews & Ratings',     icon: Star },
  { id: 'assignment',         label: 'Auto Assign Engine',    icon: Zap },
  { id: 'wallet',             label: 'Wallet & Payouts',      icon: Wallet },
  { id: 'notifications',      label: 'Notifications',         icon: Bell },
  { id: 'reports',            label: 'Reports & Analytics',   icon: TrendingUp },
  { id: 'settings',           label: 'Settings',              icon: Settings2 },
];

export default function AdminPageLayout({
  title,
  subtitle,
  backHref,
  backLabel = 'Back to Dashboard',
  children,
}: AdminPageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [counts, setCounts] = useState({ pendingKycCount: 0, pendingServiceCount: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        const { data } = await api.get('/admin/dashboard/pending-counts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data?.success) {
          setCounts({
            pendingKycCount: data.pendingKycCount || 0,
            pendingServiceCount: data.pendingServiceCount || 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch pending counts:", err);
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  let activeTab = 'metrics';
  if (pathname?.includes('/admin/categories')) activeTab = 'categories';
  else if (pathname?.includes('/admin/locations')) activeTab = 'locations';
  else if (pathname?.includes('/admin/services')) activeTab = 'services';
  else if (pathname?.includes('/admin/sub-services')) activeTab = 'sub_services';
  else if (pathname?.includes('/admin/packages')) activeTab = 'packages';
  else if (pathname?.includes('/admin/coupons')) activeTab = 'coupons';
  else if (pathname?.includes('/admin/offers')) activeTab = 'offers';
  else if (pathname?.includes('/admin/sale-campaigns')) activeTab = 'campaigns';
  else if (pathname?.includes('/admin/deals')) activeTab = 'deals';
  else if (pathname?.includes('/admin/banners')) activeTab = 'banners';

  return (
    <div className="min-h-screen bg-[#F8F4EE] flex flex-col md:flex-row h-screen overflow-hidden relative">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-primary text-white px-4 py-3.5 flex items-center justify-between border-b border-white/10 z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="p-1.5 hover:bg-white/5 rounded-xl transition-colors">
            <Menu className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-serif text-base font-bold tracking-tight text-white">Nexora Admin</h1>
            <p className="text-white/50 text-[10px]">Command &amp; Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#1D3B31] px-3 py-1 rounded-full border border-gold/30">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-white/80 font-bold">Online</span>
        </div>
      </header>

      {/* Mobile Sidebar Backdrop Drawer */}
      {isMobileSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-fade-in" onClick={() => setIsMobileSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-primary text-white z-50 flex flex-col border-r-4 border-gold h-full overflow-hidden shadow-2xl animate-slide-in md:hidden">
            <div className="p-6 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
              <div>
                <h1 className="font-serif text-lg font-bold tracking-tight text-white">Nexora Admin</h1>
                <p className="text-white/60 text-[10px]">Command Center</p>
              </div>
              <button onClick={() => setIsMobileSidebarOpen(false)} className="text-white/70 hover:text-white font-bold text-lg">×</button>
            </div>
            <nav className="flex-grow p-4 space-y-1 overflow-y-auto scrollbar-none">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => {
                    if (tab.id === 'locations') {
                      router.push('/admin/locations');
                    } else {
                      router.push(`/admin/dashboard?tab=${tab.id}`);
                    }
                    setIsMobileSidebarOpen(false);
                  }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-left ${isActive ? 'bg-[#1D3B31] text-white shadow-lg border border-gold/40' : 'bg-transparent text-white/70 hover:text-white hover:bg-white/5'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                    {tab.id === 'verification' && counts.pendingKycCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center animate-pulse">
                        {counts.pendingKycCount}
                      </span>
                    )}
                    {tab.id === 'service_approvals' && counts.pendingServiceCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center animate-pulse">
                        {counts.pendingServiceCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10 bg-black/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-white/80 font-medium">Active: Super Admin</span>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Desktop Sidebar (Always Visible on Large Screens) */}
      <aside className="hidden md:flex md:w-64 bg-primary text-white flex-shrink-0 flex-col border-r-4 border-gold h-full overflow-hidden">
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white">Nexora Admin</h1>
          <p className="text-white/60 text-xs mt-1">Command &amp; Control Center</p>
        </div>
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto scrollbar-none">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => {
                if (tab.id === 'locations') {
                  router.push('/admin/locations');
                } else {
                  router.push(`/admin/dashboard?tab=${tab.id}`);
                }
              }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-left ${isActive ? 'bg-[#1D3B31] text-white shadow-lg border border-gold/40' : 'bg-transparent text-white/70 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
                {tab.id === 'verification' && counts.pendingKycCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center animate-pulse">
                    {counts.pendingKycCount}
                  </span>
                )}
                {tab.id === 'service_approvals' && counts.pendingServiceCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center animate-pulse">
                    {counts.pendingServiceCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto p-4 border-t border-white/10 bg-black/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white/80 font-medium">Active: Super Admin</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 w-full min-w-0 max-w-full overflow-y-auto h-full">
        {/* Back button */}
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-2 text-sm font-semibold text-[#0F3D30] hover:text-[#0F3D30]/70 mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {backLabel}
        </button>

        {/* Page heading */}
        <div className="mb-8 flex justify-between items-center border-b border-gold/10 pb-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F3D30]">{title}</h1>
            {subtitle && <p className="text-sm text-foreground/55 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell tokenKey="admin_token" theme="light" />
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
