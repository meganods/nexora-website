"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User, LayoutDashboard, FileText, History, MapPin, Tag, Bell, Star, LifeBuoy, Settings, LogOut, Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        setChecked(true);
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !checked) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const sidebarLinks = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/profile' },
    { label: 'My Bookings', icon: FileText, href: '/profile/bookings' },
    { label: 'Booking History', icon: History, href: '/profile/history' },
    { label: 'Saved Addresses', icon: MapPin, href: '/profile/addresses' },
    { label: 'Coupons & Offers', icon: Tag, href: '/profile/coupons' },
    { label: 'Notifications', icon: Bell, href: '/profile/notifications' },
    { label: 'Reviews & Ratings', icon: Star, href: '/profile/reviews' },
    { label: 'Help & Support', icon: LifeBuoy, href: '/profile/support' },
    { label: 'Profile Settings', icon: Settings, href: '/profile/settings' },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] md:h-[calc(100vh-80px)] bg-cream flex flex-col md:flex-row md:overflow-hidden">
      {/* Desktop Profile Sidebar */}
      <aside className="w-full md:w-64 bg-[#1D3B31] text-white flex-shrink-0 flex flex-col md:h-full border-r border-gold/15 overflow-y-auto">
        <div className="p-6 border-b border-gold/15 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-bold text-gold uppercase">
            {user?.name?.slice(0, 2)}
          </div>
          <div>
            <h2 className="font-serif text-sm font-semibold truncate max-w-[140px]">{user?.name}</h2>
            <p className="text-[10px] text-white/50 truncate max-w-[140px]">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive ? 'bg-[#C3AB84] text-primary shadow-lg shadow-black/10' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gold/15">
          <button
            onClick={() => {
              logout();
              router.replace('/');
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold text-red-300 hover:text-red-200 hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 md:h-full md:overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
