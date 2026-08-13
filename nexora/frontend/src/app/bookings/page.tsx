"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, CalendarDays, Clock, IndianRupee, Loader2, PackageSearch } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700' },
  REQUESTED:       { label: 'Finding Partner',  color: 'bg-blue-100 text-blue-700' },
  ASSIGNED:        { label: 'Partner Assigned', color: 'bg-indigo-100 text-indigo-700' },
  ARRIVED:         { label: 'Partner Arrived',  color: 'bg-purple-100 text-purple-700' },
  IN_PROGRESS:     { label: 'In Progress',      color: 'bg-orange-100 text-orange-700' },
  COMPLETED:       { label: 'Completed',         color: 'bg-green-100 text-green-700' },
  CANCELLED:       { label: 'Cancelled',         color: 'bg-red-100 text-red-700' },
};

export default function BookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/bookings');
      return;
    }
    if (!authLoading && user) fetchBookings();
  }, [authLoading, user]);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings');
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden">
      {/* Header */}
      <div className="bg-primary text-white pt-10 pb-20 px-4 sm:px-8 lg:px-12 rounded-b-[2rem] sm:rounded-b-[3rem]">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">My Bookings</h1>
          <p className="text-white/70 text-sm sm:text-base">
            {bookings.length > 0
              ? `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} found`
              : 'No bookings yet'}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-8 lg:px-12 -mt-10 pb-24 w-full">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gold/20 text-center">
            <PackageSearch className="w-14 h-14 text-gold mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold text-primary mb-2">No Bookings Yet</h3>
            <p className="text-foreground/60 mb-6 text-sm">
              You haven't booked any services. Browse our services to get started!
            </p>
            <Link href="/"
              className="inline-block px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors text-sm">
              Explore Services
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {bookings.map((booking: any) => {
              const status = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700' };
              const isActive = !['COMPLETED', 'CANCELLED', 'PENDING_PAYMENT'].includes(booking.status);

              return (
                <Link key={booking._id} href={`/bookings/${booking._id}`}
                  className="block bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gold/20 shadow-sm hover:shadow-md hover:border-gold/40 transition-all group w-full">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Service name + status row */}
                      <div className="flex flex-wrap items-start gap-2 mb-3">
                        <h3 className="font-bold text-base sm:text-lg text-primary group-hover:text-primary/80 transition-colors break-words min-w-0">
                          {booking.serviceId?.name || 'Service'}
                        </h3>
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${status.color}`}>
                          {status.label}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>

                      {/* Meta info: date / slot / amount */}
                      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-foreground/60">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CalendarDays className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                          <span className="truncate">
                            {new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                          <span>{booking.scheduledSlot}</span>
                        </div>
                        {booking.paymentDetails?.amount !== undefined && (
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                            <span className="font-semibold text-foreground">{booking.paymentDetails.amount}</span>
                          </div>
                        )}
                      </div>

                      {booking.vendorId && (
                        <p className="mt-2 text-xs text-foreground/50">
                          Partner: <span className="font-medium text-foreground/70">{booking.vendorId.name}</span>
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-foreground/30 group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
