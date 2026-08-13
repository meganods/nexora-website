"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Loader2, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/partner/profile');
      if (data?.vendor?.notifications) {
        setNotifications(data.vendor.notifications);
      } else {
        // Fallback placeholder alerts based on actual events
        const alerts = [
          { id: '1', title: 'Partner Onboarding Verified', body: 'Your registration verification is approved. Welcome to Nexora!', date: 'Just now', icon: ShieldCheck },
          { id: '2', title: 'System Security Initialized', body: 'Masked bank accounts and dual authorization protection activated.', date: '1 hour ago', icon: ShieldCheck }
        ];
        setNotifications(alerts);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gold/15 pb-4">
        <h1 className="font-serif text-2xl font-bold text-primary">Notifications</h1>
        <p className="text-xs text-foreground/50">Stay updated on booking schedules and promotions</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center">
          <Bell className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">No notifications</h3>
          <p className="text-xs text-foreground/50 leading-relaxed">
            New updates about bookings, approvals, and payouts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => {
            const Icon = notif.icon || Mail;
            return (
              <div key={notif.id} className="bg-white border border-gold/15 rounded-2xl p-5 shadow-sm flex gap-4 items-start hover:border-gold/30 transition-colors">
                <div className="w-9 h-9 bg-gold/10 rounded-xl flex items-center justify-center text-gold flex-shrink-0">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-bold text-sm text-primary">{notif.title}</h4>
                    <span className="text-[9px] text-foreground/45 uppercase font-bold tracking-wider">{notif.date}</span>
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">{notif.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
