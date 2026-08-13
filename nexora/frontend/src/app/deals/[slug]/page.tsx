"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { IndianRupee, Star, Calendar, ShieldCheck, Clock, CheckCircle2, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DealDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expiredState, setExpiredState] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/public/deals/${slug}`)
      .then(res => {
        if (res.data?.success) {
          setDeal(res.data.deal);
        }
      })
      .catch(err => {
        if (err.response?.status === 410) {
          setExpiredState(err.response.data?.deal || { title: 'Expired Deal' });
        } else {
          console.error("Deal load error", err);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (expiredState) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-20 max-w-xl text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary mb-2">{expiredState.title}</h1>
          <p className="text-sm text-foreground/60 mb-8">This deal has reached its expiration date or is no longer active.</p>
          <Link href="/deals" className="px-6 py-3 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary/95 transition-all">
            Browse Live Deals
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-20 max-w-xl text-center">
          <h1 className="font-serif text-2xl font-bold text-primary mb-2">Deal Not Found</h1>
          <p className="text-sm text-foreground/60 mb-8">The deal you are looking for does not exist or has been removed.</p>
          <Link href="/deals" className="px-6 py-3 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary/95 transition-all">
            Browse All Deals
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const original = deal.originalPrice;
  const final = deal.finalPrice;
  const discountStr = deal.discountType === 'PERCENTAGE' ? `${deal.discountValue}% OFF` : `₹${deal.discountValue} OFF`;
  const rating = deal.serviceId?.rating || deal.packageId?.rating || 4.7;
  const reviewCount = deal.serviceId?.reviewCount || deal.packageId?.reviewCount || 150;
  const imageUrl = deal.imageUrl || deal.serviceId?.imageUrl || deal.packageId?.imageUrl || 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=500&q=80';
  const targetCheckout = deal.dealType === 'SERVICE'
    ? `/checkout?serviceId=${deal.serviceId?._id || deal.serviceId}`
    : `/checkout?packageId=${deal.packageId?._id || deal.packageId}`;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 sm:px-8 lg:px-12 py-10 max-w-6xl">
        {/* Navigation */}
        <div className="mb-6 flex justify-between items-center">
          <Link href="/deals" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-gold transition-colors uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> Back To Deals
          </Link>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-[2rem] overflow-hidden border border-gold/25 shadow-md bg-white">
              <img
                src={imageUrl}
                alt={deal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 left-6 bg-red-500 text-white text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow">
                {discountStr}
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-3xl border border-gold/20 p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-xl font-bold text-primary">About this Deal</h2>
              <p className="text-sm text-foreground/75 leading-relaxed">
                {deal.description || 'Enjoy premium booking overrides with verified, high-quality luxury support specialists.'}
              </p>

              {/* What is included / Service specifics */}
              {deal.serviceId?.inclusions?.length > 0 && (
                <div className="pt-4 border-t border-gold/10">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Service Inclusions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {deal.serviceId.inclusions.map((inc: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deal.packageId?.inclusions?.length > 0 && (
                <div className="pt-4 border-t border-gold/10">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Package Inclusions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {deal.packageId.inclusions.map((inc: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Terms and Conditions */}
            {deal.termsAndConditions && (
              <div className="bg-white rounded-3xl border border-gold/20 p-6 sm:p-8">
                <h2 className="font-serif text-sm font-bold text-primary uppercase tracking-wider mb-3">Terms & Conditions</h2>
                <p className="text-xs text-foreground/60 leading-relaxed whitespace-pre-line">
                  {deal.termsAndConditions}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Pricing & Purchase Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-[2.5rem] border-2 border-gold/25 p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
              {/* Background badge */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full translate-x-10 -translate-y-10" />

              <div className="space-y-2">
                <span className="text-[10px] font-extrabold tracking-widest text-gold bg-gold/15 px-3 py-1 rounded-full uppercase">
                  {deal.dealType === 'SERVICE' ? 'Service Deal' : 'Package Deal'}
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight leading-tight">
                  {deal.title}
                </h1>
                <p className="text-xs font-semibold text-foreground/50">
                  Bookable item: {deal.serviceId?.name || deal.packageId?.name}
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1.5 text-sm bg-cream/50 w-fit px-3 py-1.5 rounded-full border border-gold/15">
                <Star className="w-4 h-4 fill-gold text-gold" />
                <span className="font-bold text-primary">{rating.toFixed(1)}</span>
                <span className="text-foreground/45 text-xs">({reviewCount}+ bookings)</span>
              </div>

              {/* Price Details */}
              <div className="p-5 bg-cream/70 rounded-2xl border border-gold/10 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-foreground/55 uppercase">Regular Price:</span>
                  <span className="text-sm text-foreground/55 line-through flex items-center">
                    <IndianRupee className="w-3.5 h-3.5" />{original}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-bold text-primary uppercase">Deal Price:</span>
                  <span className="text-2xl sm:text-3xl font-serif font-black text-emerald-600 flex items-center">
                    <IndianRupee className="w-5 h-5" />{final}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1 text-center font-bold uppercase tracking-wider">
                  You Save ₹{original - final}!
                </div>
              </div>

              {/* Validity info */}
              <div className="space-y-2.5 text-xs text-foreground/70">
                <div className="flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-gold" />
                  <span>Valid from: <strong>{new Date(deal.startDate).toLocaleDateString()}</strong></span>
                </div>
                {deal.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-gold" />
                    <span>Valid until: <strong className="text-red-600">{new Date(deal.endDate).toLocaleDateString()}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-gold" />
                  <span>Premium Nexora Luxury Booking Guarantee</span>
                </div>
              </div>

              {/* Call to action */}
              <Link
                href={targetCheckout}
                className="block w-full py-4 bg-primary text-white text-center rounded-full font-bold text-sm hover:bg-primary/95 transition-all shadow-md active:scale-98"
              >
                Book This Deal Now
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
