"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Trash2, CheckCircle2, AlertTriangle, Loader2, BookOpen, ShieldCheck, IndianRupee, Megaphone, Star, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type NotifType = 'all' | 'booking' | 'payment' | 'promo' | 'approval' | 'review' | 'support' | 'system';

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  booking:  { label: 'Booking',  icon: BookOpen,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
  payment:  { label: 'Payment',  icon: IndianRupee, color: 'text-amber-600',  bg: 'bg-amber-50'  },
  promo:    { label: 'Promo',    icon: Megaphone,   color: 'text-purple-600', bg: 'bg-purple-50' },
  approval: { label: 'Approval', icon: ShieldCheck, color: 'text-emerald-600',bg: 'bg-emerald-50'},
  review:   { label: 'Review',   icon: Star,        color: 'text-yellow-600', bg: 'bg-yellow-50' },
  support:  { label: 'Support',  icon: Bell,        color: 'text-pink-600',   bg: 'bg-pink-50'   },
  system:   { label: 'System',   icon: Bell,        color: 'text-slate-600',  bg: 'bg-slate-50'  },
};

const FILTER_TABS: { key: NotifType; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'booking', label: 'Bookings' }, { key: 'payment', label: 'Payments' },
  { key: 'promo', label: 'Promos' }, { key: 'review', label: 'Reviews' }, { key: 'support', label: 'Support' }, { key: 'system', label: 'System' },
];

function getDeepLink(n: any): string | null {
  const meta = n.metadata || {};
  if (n.type === 'booking'  && meta.bookingId) return `/bookings/${meta.bookingId}`;
  if (n.type === 'payment'  && meta.bookingId) return `/bookings/${meta.bookingId}`;
  if (n.type === 'approval' && meta.serviceId) return `/services/${meta.serviceId}`;
  if (n.type === 'promo')  return '/services';
  if (n.type === 'review') return '/profile/reviews';
  if (n.type === 'support') return '/profile/support';
  return null;
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function UserNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeFilter, setActiveFilter] = useState<NotifType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (filterType: NotifType, pageNum: number, append = false) => {
    try {
      if (!append) setLoading(true); else setLoadingMore(true);
      setErrorMsg('');
      const params = new URLSearchParams({ page: String(pageNum), limit: '15' });
      if (filterType !== 'all') params.set('type', filterType);
      const { data } = await api.get(`/notifications?${params.toString()}`);
      if (data?.success) {
        setNotifications(prev => append ? [...prev, ...(data.data || [])] : (data.data || []));
        setHasMore(data.pagination?.hasMore ?? false);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch { setErrorMsg('Failed to load notifications.'); }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { setPage(1); fetchNotifications(activeFilter, 1, false); }, [activeFilter, fetchNotifications]);

  const loadMore = () => { const next = page + 1; setPage(next); fetchNotifications(activeFilter, next, true); };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { alert('Failed to mark all as read.'); }
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/notifications/${id}`); setNotifications(prev => prev.filter(n => n._id !== id)); }
    catch { alert('Failed to delete notification.'); }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) await handleMarkRead(n._id);
    const link = getDeepLink(n);
    if (link) router.push(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-gold/15 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Notifications</h1>
          <p className="text-xs text-foreground/50 mt-0.5">
            {unreadCount > 0 ? <span className="text-primary font-semibold">{unreadCount} unread</span> : 'All caught up!'} — bookings, payments & offers
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead}
            className="text-xs font-bold text-primary bg-gold px-4 py-2.5 rounded-full hover:bg-gold/80 transition-all flex items-center gap-1.5 shadow-sm self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTER_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0 ${
              activeFilter === tab.key ? 'bg-primary text-white border-primary' : 'border-gold/30 text-foreground/70 hover:border-primary hover:text-primary bg-white'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white border border-gold/15 rounded-3xl p-5 flex items-start gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-2.5 bg-gray-100 rounded w-4/5" />
                <div className="h-2 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center">
          <Bell className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">
            {activeFilter === 'all' ? 'Your inbox is empty' : `No ${activeFilter} notifications`}
          </h3>
          <p className="text-xs text-foreground/50 leading-relaxed max-w-sm mx-auto">
            {activeFilter === 'all' ? 'Updates about your bookings, payments and offers will appear here.' : 'Switch to "All" to see everything.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map(n => {
              const meta = TYPE_META[n.type] ?? TYPE_META.system;
              const Icon = meta.icon;
              const hasLink = !!getDeepLink(n);
              return (
                <div key={n._id} onClick={() => handleNotificationClick(n)}
                  className={`bg-white border rounded-3xl p-4 sm:p-5 flex items-start gap-4 transition-all group ${hasLink ? 'cursor-pointer' : 'cursor-default'} ${n.isRead ? 'border-gold/15 opacity-80 hover:opacity-100 hover:border-gold/30' : 'border-primary/30 shadow-md'}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <Icon className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0 mt-1.5" />}
                      <h4 className="font-bold text-sm text-primary leading-snug">{n.title}</h4>
                    </div>
                    <p className="text-xs text-foreground/60 leading-normal">{n.body}</p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                      <span className="text-[10px] text-foreground/40">{timeAgo(n.createdAt)}</span>
                      <span className="text-[10px] text-foreground/30">•</span>
                      <span className="text-[10px] text-foreground/30">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(n._id); }}
                    className="p-2 text-foreground/30 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button onClick={loadMore} disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gold/40 text-sm font-bold text-primary hover:bg-gold/10 transition-all disabled:opacity-50">
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

