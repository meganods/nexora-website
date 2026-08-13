"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function UserNotificationsPage() {
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
      const { data } = await api.get('/notifications');
      if (data?.success) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      if (data?.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const { data } = await api.patch('/notifications/read-all');
      if (data?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to mark all as read.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data } = await api.delete(`/notifications/${id}`);
      if (data?.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete notification.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="border-b border-gold/15 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Notifications Inbox</h1>
          <p className="text-xs text-foreground/50">Stay updated on your booking status changes and promotional offers</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-primary bg-gold px-4 py-2.5 rounded-full hover:bg-gold/80 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark All as Read
          </button>
        )}
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
          <h3 className="font-serif text-base font-bold text-primary mb-1">Your inbox is empty</h3>
          <p className="text-xs text-foreground/50 leading-relaxed max-w-sm mx-auto">
            You will receive updates here when your bookings are accepted, completed, or when we have offers for you.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => { if (!n.isRead) handleMarkRead(n._id); }}
              className={`bg-white border rounded-3xl p-5 shadow-sm flex items-start justify-between gap-6 transition-all cursor-pointer ${
                n.isRead ? 'border-gold/15 opacity-75' : 'border-primary shadow-md'
              }`}
            >
              <div className="space-y-1.5 flex-grow">
                <div className="flex items-center gap-2">
                  {!n.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  )}
                  <h4 className="font-bold text-sm text-primary leading-snug">{n.title}</h4>
                </div>
                <p className="text-xs text-foreground/60 leading-normal">{n.body}</p>
                <p className="text-[10px] text-foreground/40 font-mono pt-1">
                  {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                className="p-2 text-foreground/40 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                title="Delete Notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
