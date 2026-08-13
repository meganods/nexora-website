"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Tag, AlertTriangle, Loader2, ArrowRight, XCircle } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function ActiveBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/user/dashboard/bookings?type=active');
      if (data?.success) {
        setBookings(data.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load active bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      setErrorMsg('');
      const { data } = await api.post(`/bookings/${bookingId}/cancel`);
      if (data?.success || data?.message === 'Booking cancelled successfully') {
        alert('Booking cancelled successfully.');
        fetchBookings();
      } else {
        alert(data?.message || 'Failed to cancel booking.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error occurred while cancelling booking.');
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
        <h1 className="font-serif text-2xl font-bold text-primary">Active Bookings</h1>
        <p className="text-xs text-foreground/50">Track your current service orders, timelines, and OTP details</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center">
          <Calendar className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">No active bookings</h3>
          <p className="text-xs text-foreground/50 leading-relaxed max-w-md mx-auto">
            You don't have any bookings currently scheduled. Visit the homepage to browse available services and book!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const serviceName = b.serviceId?.name || b.packageId?.name || 'Home Service';
            const price = b.finalPrice || b.serviceId?.basePrice || b.packageId?.basePrice || 0;
            const canCancel = ['PENDING_PAYMENT', 'REQUESTED'].includes(b.status);

            return (
              <div key={b._id} className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gold/30 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-sm text-primary">{serviceName}</h3>
                    <span className="text-[10px] bg-gold/10 text-gold px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/55 font-mono">
                    ID: {String(b._id).toUpperCase()} · Scheduled for: {new Date(b.scheduledDate).toLocaleDateString()} at {b.scheduledSlot || 'Slot TBD'}
                  </p>
                  <p className="text-xs font-bold text-primary">Total: ₹{price.toLocaleString('en-IN')}</p>

                  {b.otp && (
                    <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 px-3 py-1 rounded-xl text-xs font-bold font-mono">
                      Verification OTP: {b.otp}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/bookings/${b._id}`} className="text-xs font-bold bg-primary/5 text-primary border border-primary/10 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all">
                    View Details
                  </Link>
                  <Link href={`/bookings/${b._id}/track`} className="text-xs font-bold bg-[#C3AB84] text-primary px-4 py-2 rounded-xl hover:bg-[#b09772] transition-all">
                    Track Timeline
                  </Link>
                  {canCancel && (
                    <button
                      onClick={() => handleCancelBooking(b._id)}
                      className="text-xs font-bold bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" /> Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
