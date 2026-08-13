"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, User, Phone, MapPin, CreditCard, ArrowLeft, Loader2, ClipboardCheck, Clock } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [bookingId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get(`/bookings/${bookingId}`);
      if (data) {
        setBooking(data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to load booking details.');
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
        <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
        <h2 className="font-serif text-lg font-bold text-primary mb-2">Error Loading Details</h2>
        <p className="text-xs text-foreground/50 max-w-sm mb-6">{errorMsg || 'Booking not found.'}</p>
        <button onClick={() => router.back()} className="text-xs font-bold bg-primary text-white px-5 py-2.5 rounded-xl">
          Go Back
        </button>
      </div>
    );
  }

  const serviceName = booking.serviceId?.name || booking.packageId?.name || 'Home Service';
  const price = booking.finalPrice || booking.serviceId?.basePrice || booking.packageId?.basePrice || 0;
  const originalPrice = booking.serviceId?.basePrice || booking.packageId?.basePrice || price;

  return (
    <div className="min-h-screen bg-cream pb-12">
      {/* Top Navbar */}
      <header className="bg-[#1D3B31] text-white py-4 px-6 border-b border-gold/15 flex items-center gap-4 sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-1 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gold" />
        </button>
        <div>
          <h1 className="font-serif text-base font-bold">Booking Details</h1>
          <p className="text-[10px] text-white/55 font-mono">ID: {String(booking._id).toUpperCase()}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Service & Partner card */}
            <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {booking.status}
                  </span>
                  <h2 className="font-serif text-xl font-bold text-primary mt-2">{serviceName}</h2>
                </div>
                <Link
                  href={`/bookings/${booking._id}/track`}
                  className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-xl hover:bg-primary/95 transition-all shadow-sm"
                >
                  Track Job
                </Link>
              </div>

              {booking.vendorId ? (
                <div className="pt-4 border-t border-gold/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cream border border-gold/25 overflow-hidden">
                    <img src={booking.vendorId.profilePicture || `https://api.dicebear.com/7.x/notionists/svg?seed=${booking.vendorId.name}`} alt="vendor" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/45">Assigned Service Partner</p>
                    <p className="text-sm font-bold text-primary">{booking.vendorId.name}</p>
                    <p className="text-xs text-foreground/60 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-gold" /> {booking.vendorId.phone}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-gold/10 text-xs text-foreground/50 italic flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gold animate-pulse" /> Awaiting Service Partner allocation...
                </div>
              )}
            </div>

            {/* Address Details */}
            <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-serif text-sm font-bold text-primary flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" /> Service Delivery Address
              </h3>
              <div className="text-xs text-foreground/60 leading-relaxed font-medium">
                {booking.addressId ? (
                  <>
                    <p className="font-bold text-primary text-xs mb-1">{booking.addressId.fullName}</p>
                    <p>{booking.addressId.houseNo}, {booking.addressId.street}, {booking.addressId.landmark}</p>
                    <p>{booking.addressId.city}, {booking.addressId.state} - {booking.addressId.pincode}</p>
                    <p className="text-[10px] text-foreground/45 mt-1 font-mono">Phone: {booking.addressId.phone}</p>
                  </>
                ) : (
                  <p className="italic">Standard address details not configured.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Invoice & Schedule Info */}
          <div className="space-y-6">
            {/* Schedule details */}
            <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-serif text-sm font-bold text-primary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" /> Schedule &amp; OTP
              </h3>
              <p className="text-xs font-bold text-primary">
                Date: {new Date(booking.scheduledDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-foreground/60 font-medium">
                Time slot: {booking.scheduledSlot}
              </p>
              {booking.otp && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Verification OTP</p>
                  <p className="text-lg font-bold text-green-700 font-mono tracking-widest mt-0.5">{booking.otp}</p>
                </div>
              )}
            </div>

            {/* Bill details */}
            <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-serif text-sm font-bold text-primary flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold" /> Invoice Summary
              </h3>

              <div className="space-y-2 text-xs divide-y divide-gold/10">
                <div className="flex justify-between py-2 first:pt-0">
                  <span className="text-foreground/60">Base Price</span>
                  <span className="font-semibold">₹{originalPrice.toLocaleString('en-IN')}</span>
                </div>
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between py-2 text-green-700">
                    <span>Coupon Discount</span>
                    <span className="font-semibold">-₹{booking.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 font-bold text-primary text-sm pt-3">
                  <span>Grand Total</span>
                  <span>₹{price.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Fallback Alert component to satisfy compiler
function AlertTriangle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
