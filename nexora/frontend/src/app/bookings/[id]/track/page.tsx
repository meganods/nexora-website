"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle2, Clock, HelpCircle, Star, MapPin } from 'lucide-react';
import api from '@/lib/api';

export default function BookingTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // States
  const timelineStates = [
    { key: 'PENDING_PAYMENT', label: 'Payment Pending', desc: 'Awaiting customer payment' },
    { key: 'REQUESTED', label: 'Booking Confirmed', desc: 'Booking received and verified' },
    { key: 'ASSIGNED', label: 'Partner Assigned', desc: 'Partner matched and assigned' },
    { key: 'PARTNER_ACCEPTED', label: 'Partner Accepted', desc: 'Partner accepted the booking details' },
    { key: 'ON_THE_WAY', label: 'On The Way', desc: 'Partner has started transit' },
    { key: 'ARRIVED', label: 'Arrived', desc: 'Partner reached your location' },
    { key: 'OTP_VERIFICATION', label: 'OTP Verification', desc: 'Secure OTP validation complete' },
    { key: 'IN_PROGRESS', label: 'Work Started', desc: 'Service execution is in progress' },
    { key: 'COMPLETED', label: 'Service Completed', desc: 'Service execution successful' },
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
        setErrorMsg('');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Booking not found or access denied.');
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

  if (errorMsg || !booking) {
    return (
      <div className="min-h-screen bg-cream p-6 flex flex-col items-center justify-center text-center">
        <h2 className="font-serif text-lg font-bold text-primary mb-2">Booking Not Found</h2>
        <p className="text-xs text-foreground/50 max-w-sm mb-6">{errorMsg || 'Booking not found or access denied.'}</p>
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
      <header className="bg-[#1D3B31] text-white py-4 px-6 border-b border-gold/15 sticky top-0 z-40">
        <div className="max-w-xl mx-auto w-full flex items-center gap-4">
          <button onClick={() => router.back()} className="p-1 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gold" />
          </button>
          <div>
            <h1 className="font-serif text-base font-bold">Booking Tracking</h1>
            <p className="text-[10px] text-white/55 font-mono">Booking ID: {String(booking._id).toUpperCase()}</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-8">
        {/* Partner Info Header snippet */}
        {booking.vendorId && (
          <div className="space-y-4">
            <div className="bg-white border border-gold/15 rounded-3xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-cream overflow-hidden border border-gold/20 flex-shrink-0">
                <img src={booking.vendorId.profilePicture || `https://api.dicebear.com/7.x/notionists/svg?seed=${booking.vendorId.name}`} alt="vendor" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs text-foreground/45">Partner assigned to your service:</p>
                <p className="text-sm font-bold text-primary">{booking.vendorId.name}</p>
              </div>
            </div>

            {booking.tripLocation && booking.status === 'ON_THE_WAY' && (
              <div className="bg-white border border-gold/15 rounded-3xl p-5 shadow-sm space-y-2">
                <h4 className="text-xs font-bold text-[#0F3D30] uppercase tracking-wide">Live Trip Location</h4>
                <p className="text-xs text-foreground/60 flex items-start gap-1.5 leading-normal">
                  <MapPin className="w-4 h-4 text-[#C3AB84] flex-shrink-0 mt-0.5" />
                  <span>{booking.tripLocation.address || 'Partner in transit...'}</span>
                </p>
                {booking.tripLocation.etaMins !== null && (
                  <p className="text-xs text-foreground/60 font-semibold pl-5">
                    Estimated Arrival: <span className="text-[#C3AB84] font-bold">{booking.tripLocation.etaMins} mins</span>
                  </p>
                )}
                {booking.tripLocation.lastUpdated && (
                  <p className="text-[9px] text-foreground/45 pl-5">
                    Last Updated: {new Date(booking.tripLocation.lastUpdated).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
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
