"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu, X, LayoutDashboard, FileText, Briefcase, Wrench, Calendar, Tag, Percent, IndianRupee, Star, Bell, User, Settings, LogOut, Loader2, Package, ListCollapse
} from 'lucide-react';
import api from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checked, setChecked] = useState(false);
  const [vendor, setVendor] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthRoute = pathname === '/partner/login' || pathname === '/partner/register' || pathname === '/partner/signup';
  const isPublicProfile = /^\/partner\/[a-f\d]{24}$/i.test(pathname || '');

  useEffect(() => {
    if (isAuthRoute || isPublicProfile) {
      setChecked(true);
      return;
    }

    checkAuthAndStatus();
  }, [pathname]);

  const checkAuthAndStatus = async () => {
    const token = localStorage.getItem('nexora_token');

    // Only pre-check token presence; role validation is done by the API
    if (!token) {
      router.replace('/partner/login');
      return;
    }

    try {
      const { data } = await api.get('/partner/profile');
      if (data?.vendor) {
        setVendor(data.vendor);

        // Handle PENDING or REJECTED status redirection
        const status = data.vendor.kycStatus || 'KYC_NOT_STARTED';
        if (status !== 'APPROVED') {
          if (pathname !== '/partner/status') {
            router.replace('/partner/status');
            return;
          }
        } else {
          // If approved but visiting status page, send to dashboard
          if (pathname === '/partner/status') {
            router.replace('/partner/dashboard');
            return;
          }
        }
        setChecked(true);
      } else {
        router.replace('/partner/login');
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      router.replace('/partner/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_role');
    router.replace('/partner/login');
  };

  if (!checked) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // If on login/register/signup or public profile, just render children directly without sidebar layout
  if (isAuthRoute || isPublicProfile || pathname === '/partner/status') {
    return <>{children}</>;
  }

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/partner/dashboard' },
    { label: 'Accept Bookings', icon: FileText, href: '/partner/requests' },
    { label: 'Active Bookings', icon: Briefcase, href: '/partner/bookings' },
    { label: 'Services', icon: Package, href: '/partner/services' },
    { label: 'Sub Services', icon: ListCollapse, href: '/partner/sub-services' },
    { label: 'Availability & Areas', icon: Calendar, href: '/partner/availability' },
    { label: 'Offers', icon: Percent, href: '/partner/offers' },
    { label: 'Coupons', icon: Tag, href: '/partner/coupons' },
    { label: 'My Deals', icon: Percent, href: '/partner/deals' },
    { label: 'Earnings & Wallet', icon: IndianRupee, href: '/partner/wallet' },
    { label: 'Reviews & Ratings', icon: Star, href: '/partner/reviews' },
    { label: 'Notifications', icon: Bell, href: '/partner/notifications' },
    { label: 'Profile', icon: User, href: '/partner/profile' },
    { label: 'Settings', icon: Settings, href: '/partner/settings' },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row">

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1D3B31] text-white fixed h-screen top-0 left-0 border-r border-gold/10 z-30 select-none">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gold/15 flex items-center justify-between">
          <span className="font-serif text-xl font-bold tracking-tight text-white">Nexora</span>
          <span className="text-[10px] uppercase font-bold text-gold bg-gold/10 border border-gold/25 px-2.5 py-0.5 rounded-full">Service Partner</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${isActive ? 'bg-[#C3AB84] text-primary shadow-lg shadow-black/10' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-gold/15">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-xs font-bold text-red-300 hover:text-red-200 hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* --- MOBILE/TABLET HEADER & MENU --- */}
      <header className="flex md:hidden items-center justify-between bg-[#1D3B31] text-white px-6 py-4 fixed top-0 left-0 w-full z-40 border-b border-gold/15 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="p-1 hover:text-gold transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-serif text-lg font-bold text-white">Nexora</span>
        </div>
        <span className="text-[9px] uppercase font-bold text-gold bg-gold/10 border border-gold/25 px-2 py-0.5 rounded-full">Service Partner</span>
      </header>

      {/* --- MOBILE DRAWER BACKDROP --- */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* --- MOBILE DRAWER SIDEBAR --- */}
      <aside className={`md:hidden fixed top-0 left-0 h-screen w-64 bg-[#1D3B31] text-white z-50 flex flex-col transition-transform duration-300 transform border-r border-gold/10 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="p-6 border-b border-gold/15 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-white">Nexora</Link>
          <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:text-gold transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${isActive ? 'bg-[#C3AB84] text-primary' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gold/15">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-xs font-bold text-red-300 hover:text-red-200 hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT WINDOW --- */}
      <div className="flex-1 md:pl-64 flex flex-col pt-[68px] md:pt-0 min-h-screen">
        <main className="flex-1 p-6 md:p-10 mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
