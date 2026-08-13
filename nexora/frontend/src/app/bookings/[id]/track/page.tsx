"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle2, Clock, HelpCircle, Star } from 'lucide-react';
import api from '@/lib/api';

export default function BookingTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States
  const timelineStates = [
    { key: 'PENDING_PAYMENT', label: 'Payment Pending', desc: 'Awaiting customer payment confirmation' },
    { key: 'REQUESTED', label: 'Booking Requested', desc: 'Booking received, finding matching partners' },
    { key: 'ASSIGNED', label: 'Partner Assigned', desc: 'Partner scored and auto-assigned' },
    { key: 'PARTNER_ACCEPTED', label: 'Partner Accepted', desc: 'Partner accepted the booking details' },
    { key: 'ON_THE_WAY', label: 'Partner On The Way', desc: 'Partner has started transit to location' },
    { key: 'ARRIVED', label: 'Partner Arrived', desc: 'Partner arrived at service location' },
    { key: 'OTP_VERIFICATION', label: 'OTP Verified', desc: 'Secure OTP validation complete' },
    { key: 'IN_PROGRESS', label: 'Service In Progress', desc: 'Service execution started' },
    { key: 'COMPLETED', label: 'Service Completed', desc: 'Job execution successful' },
  ];

  useEffect(() => {
    fetchStatus();
    // Poll status every 10 seconds for real-time tracking updates
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get(`/bookings/${bookingId}`);
      if (data) {
        setBooking(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-cream p-6 flex flex-col items-center justify-center text-center">
        <h2 className="font-serif text-lg font-bold text-primary mb-2">Booking Not Found</h2>
        <button onClick={() => router.back()} className="text-xs font-bold bg-primary text-white px-5 py-2.5 rounded-xl">
          Go Back
        </button>
      </div>
    );
  }

  // Determine current active state index
  const currentStatusIndex = timelineStates.findIndex(s => s.key === booking.status);

  return (
    <div className="min-h-screen bg-cream pb-12">
      {/* Header bar */}
      <header className="bg-[#1D3B31] text-white py-4 px-6 border-b border-gold/15 flex items-center gap-4 sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-1 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gold" />
        </button>
        <div>
          <h1 className="font-serif text-base font-bold">Booking Tracking</h1>
          <p className="text-[10px] text-white/55 font-mono">Job ID: {String(booking._id).toUpperCase()}</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-8">
        {/* Partner Info Header snippet */}
        {booking.vendorId && (
          <div className="bg-white border border-gold/15 rounded-3xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-cream overflow-hidden border border-gold/20 flex-shrink-0">
              <img src={booking.vendorId.profilePicture || `https://api.dicebear.com/7.x/notionists/svg?seed=${booking.vendorId.name}`} alt="vendor" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs text-foreground/45">Partner assigned to your service:</p>
              <p className="text-sm font-bold text-primary">{booking.vendorId.name}</p>
            </div>
          </div>
        )}

        {/* Stepper Timeline */}
        <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-serif text-base font-bold text-primary border-b border-gold/10 pb-3">Service Timeline</h3>

          <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gold/20">
            {timelineStates.map((step, idx) => {
              const isPast = idx < currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              
              let badgeColor = 'bg-cream text-gold/45 border-gold/20';
              if (isPast) badgeColor = 'bg-[#1D3B31] text-white border-primary';
              if (isCurrent) badgeColor = 'bg-[#C3AB84] text-primary border-gold ring-4 ring-[#C3AB84]/15';

              return (
                <div key={step.key} className="flex gap-4 relative z-10 items-start">
                  <div className={`w-6.5 h-6.5 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0 ${badgeColor}`}>
                    {isPast ? <CheckCircle2 className="w-4 h-4 text-[#C3AB84] fill-[#1D3B31]" /> : (idx + 1)}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isCurrent ? 'text-primary' : 'text-primary/75'}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-foreground/50 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Redirect for completion/feedback reviews */}
        {booking.status === 'COMPLETED' && (
          <div className="bg-[#1D3B31] text-white rounded-3xl p-6 text-center space-y-3 shadow-md border border-gold/20">
            <h3 className="font-serif font-bold text-sm">Service Successfully Completed!</h3>
            <p className="text-[11px] text-white/70 leading-normal max-w-sm mx-auto">
              Please share your experience with this service partner. Your feedback helps improve service quality!
            </p>
            <button
              onClick={() => router.push('/profile/history')}
              className="text-xs font-bold text-primary bg-[#C3AB84] px-5 py-2 rounded-xl hover:bg-[#b09772] transition-colors"
            >
              Leave a Review
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
