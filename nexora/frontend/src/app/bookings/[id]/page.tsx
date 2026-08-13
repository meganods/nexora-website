"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, CheckCircle2, Clock, User, Phone, MapPin, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';

export default function LiveTrackingPage({ params }: { params: { id: string } }) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBooking();
    // Refresh periodically
    const interval = setInterval(fetchBooking, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBooking = async () => {
    try {
      const { data } = await api.get(`/bookings/${params.id}`);
      setBooking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(true);
    try {
      await api.post(`/bookings/${params.id}/cancel`);
      alert("Booking cancelled successfully.");
      fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center font-serif text-xl text-primary">Loading...</div>;
  }

  if (!booking) {
    return <div className="min-h-screen bg-cream flex items-center justify-center font-serif text-xl text-primary">Booking not found</div>;
  }

  const statusFlow = [
    { key: 'REQUESTED', label: 'Booking Requested' },
    { key: 'ASSIGNED', label: 'Professional Assigned' },
    { key: 'ARRIVED', label: 'Professional Arrived' },
    { key: 'IN_PROGRESS', label: 'Service In Progress' },
    { key: 'COMPLETED', label: 'Service Completed' }
  ];

  let currentStatusIndex = statusFlow.findIndex(s => s.key === booking.status);
  
  if (booking.status === 'CANCELLED') {
    statusFlow.forEach(s => s.label = s.label.replace('Professional', '').replace('Service', '') + ' (Cancelled)');
    currentStatusIndex = -1; // No active step
  }

  return (
    <div className="min-h-screen bg-cream pt-8 pb-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/" className="mr-4 p-2 hover:bg-white rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-primary" />
            </Link>
            <h1 className="font-serif text-3xl font-bold text-primary">Live Tracking</h1>
          </div>
          {(booking.status === 'PENDING' || booking.status === 'REQUESTED') && (
            <button 
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Request'}
            </button>
          )}
        </div>

        {/* Status Timeline Card */}
        <div className="bg-white rounded-3xl p-8 border border-gold/20 shadow-sm mb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-xl font-bold text-primary mb-1">{booking.serviceId?.name || "Service"}</h2>
              <p className="text-sm text-foreground/60">Order ID: {booking._id}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'}`}>
                {booking.status === 'CANCELLED' ? 'CANCELLED' : statusFlow[Math.max(0, currentStatusIndex)]?.label}
              </span>
            </div>
          </div>

          <div className="relative pl-6 space-y-8">
            {/* Vertical Line */}
            <div className="absolute left-[29px] top-4 bottom-4 w-0.5 bg-gray-200 z-0"></div>
            
            {statusFlow.map((step, index) => {
              const isCompleted = booking.status !== 'CANCELLED' && index <= currentStatusIndex;
              const isCurrent = booking.status !== 'CANCELLED' && index === currentStatusIndex;
              
              return (
                <div key={step.key} className="relative z-10 flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCompleted ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <h3 className={`font-medium ${isCurrent ? 'text-primary font-bold' : (isCompleted ? 'text-foreground' : 'text-gray-400')}`}>
                      {step.label}
                    </h3>
                    {isCurrent && step.key === 'ASSIGNED' && (
                      <p className="text-sm text-foreground/60 mt-1">
                        Professional is on the way to your location.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* OTP Card - Super Important for Start Job */}
        {(booking.status === 'ASSIGNED' || booking.status === 'ARRIVED') && (
          <div className="bg-primary text-white rounded-3xl p-8 shadow-lg mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-serif text-xl font-bold mb-2">Secure Start Code</h3>
              <p className="text-primary-light text-sm opacity-90">
                Share this PIN with the professional when they arrive to begin the service.
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 font-mono text-4xl font-bold tracking-widest text-center">
              {booking.otp}
            </div>
          </div>
        )}

        {/* Professional Details */}
        {booking.vendorId && (
          <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center border-2 border-gold/30 overflow-hidden">
                {booking.vendorId.profilePicture ? (
                   <img src={booking.vendorId.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <User className="w-8 h-8 text-primary/50" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{booking.vendorId.name}</h3>
                <div className="flex items-center gap-2 text-sm text-foreground/60 mt-1">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Background verified
                </div>
              </div>
            </div>
            <a href={`tel:${booking.vendorId.phone}`} className="p-3 bg-cream hover:bg-beige rounded-full transition-colors text-primary border border-gold/20">
              <Phone className="w-5 h-5" />
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
