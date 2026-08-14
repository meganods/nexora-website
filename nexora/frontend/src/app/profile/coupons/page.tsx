"use client";

import React, { useState, useEffect } from 'react';
import { Tag, Calendar, ShieldCheck, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function CouponsOffersPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCouponsAndOffers();
  }, []);

  const fetchCouponsAndOffers = async () => {
    try {
      setLoading(true);
      const [cpRes, ofRes] = await Promise.all([
        api.get('/public/coupons'),
        api.get('/public/offers').catch(() => ({ data: { offers: [] } }))
      ]);

      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('nexora_user') : null;
      let currentUserId = '';
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          currentUserId = parsed.id || parsed._id || '';
        } catch {}
      }

      if (cpRes.data?.success) {
        let allCoupons = cpRes.data.data || [];
        if (currentUserId) {
          allCoupons = allCoupons.filter((c: any) => {
            const userUsedCount = c.usageLogs?.filter((log: any) => log.userId === currentUserId || log.userId?._id === currentUserId || log.userId?.toString() === currentUserId.toString()).length || 0;
            return userUsedCount < c.perUserLimit;
          });
        }
        setCoupons(allCoupons);
      }
      if (ofRes.data?.success) {
        setOffers(ofRes.data.offers || []);
      }
    } catch (err) {
      console.error(err);
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
    <div className="space-y-8">
      <div className="border-b border-gold/15 pb-4">
        <h1 className="font-serif text-2xl font-bold text-primary">Coupons &amp; Offers</h1>
        <p className="text-xs text-foreground/50">Browse available discount codes and category promotional campaigns</p>
      </div>

      {/* Coupons Section */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
          <Tag className="w-5 h-5 text-gold" /> Active Discount Codes
        </h2>

        {coupons.length === 0 ? (
          <p className="text-xs text-foreground/45 italic py-4">No active coupon codes right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coupons.map((coupon) => (
              <div
                key={coupon._id}
                className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4 hover:border-gold/30 transition-all relative overflow-hidden"
              >
                {/* Visual discount ribbon badge */}
                <div className="absolute top-0 right-0 bg-[#C3AB84] text-primary text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase font-mono tracking-wider">
                  {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                </div>

                <div className="space-y-2">
                  <span className="inline-block text-xs font-bold text-primary bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-xl font-mono uppercase tracking-wider select-all cursor-pointer">
                    {coupon.code}
                  </span>
                  <p className="text-sm font-bold text-primary mt-2">
                    {coupon.discountType === 'PERCENT' ? `Save ${coupon.discountValue}%` : `Save flat ₹${coupon.discountValue}`} on your order
                  </p>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Min transaction value required: ₹{(coupon.minOrderAmount || 0).toLocaleString('en-IN')}.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-foreground/45 pt-4 border-t border-gold/10 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Expires: {new Date(coupon.endDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-green-700">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offers Section */}
      <div className="space-y-4 pt-4 border-t border-gold/10">
        <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
          <Tag className="w-5 h-5 text-gold" /> Category Offers
        </h2>

        {offers.length === 0 ? (
          <p className="text-xs text-foreground/45 italic py-4">No active category promotions right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div
                key={offer._id}
                className="bg-white border border-gold/15 rounded-3xl p-5 shadow-sm space-y-3 hover:border-gold/30 transition-all"
              >
                <div className="w-9 h-9 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
                  <Tag className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-primary">{offer.title}</h4>
                <p className="text-xs text-foreground/60 leading-relaxed">{offer.description}</p>
                {offer.couponCode && (
                  <p className="text-[10px] font-bold text-gold">Use code: <span className="uppercase font-mono font-extrabold">{offer.couponCode}</span></p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
