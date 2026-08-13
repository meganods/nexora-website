"use client";

import React, { useState, useEffect } from 'react';
import {
  Calendar, FileText, CheckCircle2, XCircle, MapPin, Tag, IndianRupee, Bell, ArrowRight, Loader2, Award, Zap
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function ProfileDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ovRes, dealsRes] = await Promise.all([
        api.get('/user/dashboard/overview'),
        api.get('/public/deals?limit=3').catch(() => ({ data: [] }))
      ]);
      if (ovRes.data?.success) {
        setData(ovRes.data.data);
      }
      if (dealsRes.data?.success) {
        setDeals(dealsRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load user dashboard overview:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || {
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    savedAddresses: 0,
    availableCoupons: 0,
    totalSavings: 0
  };

  const statCards = [
    { label: 'Active Bookings', value: stats.activeBookings, icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { label: 'Completed Bookings', value: stats.completedBookings, icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-100' },
    { label: 'Cancelled Bookings', value: stats.cancelledBookings, icon: XCircle, color: 'text-red-600 bg-red-50 border-red-100' },
    { label: 'Saved Addresses', value: stats.savedAddresses, icon: MapPin, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { label: 'Available Coupons', value: stats.availableCoupons, icon: Tag, color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { label: 'Total Savings', value: `₹${stats.totalSavings.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="border-b border-gold/15 pb-4">
        <h1 className="font-serif text-3xl font-bold text-primary">Overview Dashboard</h1>
        <p className="text-xs text-foreground/50">Access your active jobs, booking history, and system announcements</p>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={`border rounded-3xl p-5 flex flex-col justify-between h-[130px] shadow-sm bg-white ${card.color}`}>
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{card.label}</span>
              <card.icon className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-xl font-bold font-serif leading-none mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Upcoming / Recent Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif font-bold text-primary text-base">Recent Bookings</h3>
              <Link href="/profile/bookings" className="text-xs font-bold text-gold hover:text-primary flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data?.recentBookings?.length === 0 ? (
              <p className="text-xs text-foreground/45 italic py-4">No recent bookings found. Book a service on the homepage!</p>
            ) : (
              <div className="divide-y divide-gold/10">
                {data?.recentBookings?.map((b: any) => (
                  <div key={b._id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center gap-4">
                    <div>
                      <p className="text-xs font-bold text-primary">{b.serviceId?.name || 'Package Booking'}</p>
                      <p className="text-[10px] text-foreground/45 mt-1 font-mono">ID: {String(b._id).slice(-8).toUpperCase()} · {new Date(b.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        b.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {b.status}
                      </span>
                      <Link href={`/bookings/${b._id}`} className="text-xs font-bold bg-primary/5 text-primary border border-primary/10 px-3.5 py-1.5 rounded-xl hover:bg-primary hover:text-white transition-all">
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deals & Coupons */}
          <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-primary text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-gold" /> Best Deals For You
            </h3>
            {deals.length === 0 ? (
              <p className="text-xs text-foreground/45 italic">No active deals right now. Check back later!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {deals.map((deal: any) => (
                  <div key={deal._id} className="border border-gold/15 rounded-2xl p-4 bg-cream/10 space-y-2">
                    <p className="text-xs font-bold text-primary truncate">{deal.title}</p>
                    <p className="text-[10px] text-foreground/50 line-clamp-2">{deal.description}</p>
                    <Link href={`/services/${deal.serviceId?.slug || deal.serviceId?._id || ''}`} className="text-[10px] font-bold text-gold hover:text-primary flex items-center gap-0.5 mt-2">
                      Book Now <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Notifications & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-primary text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-gold" /> Recent Notifications
            </h3>

            {data?.recentNotifications?.length === 0 ? (
              <p className="text-xs text-foreground/45 italic">No new notifications.</p>
            ) : (
              <div className="space-y-3">
                {data?.recentNotifications?.map((n: any) => (
                  <div key={n._id} className="border-b border-gold/10 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs font-bold text-primary">{n.title}</p>
                    <p className="text-[10px] text-foreground/60 leading-normal mt-0.5">{n.body}</p>
                    <p className="text-[9px] text-foreground/40 mt-1 font-mono">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Support Card */}
          <div className="bg-[#1D3B31] text-white rounded-3xl p-6 border border-gold/20 space-y-4 shadow-sm">
            <h3 className="font-serif font-bold text-sm flex items-center gap-2">
              <Award className="w-5 h-5 text-gold" /> Customer Helpdesk
            </h3>
            <p className="text-[11px] text-white/70 leading-normal">
              Facing issues with service delays or payouts? Open a priority ticket with Nexora support.
            </p>
            <Link href="/profile/support" className="inline-block text-xs font-bold text-primary bg-[#C3AB84] px-4 py-2 rounded-xl hover:bg-[#b09772] transition-colors">
              Create Support Ticket
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
