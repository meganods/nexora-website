"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Plus, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerCouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/partner/coupons');
      setCoupons(data?.coupons || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gold/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">My Coupons</h1>
          <p className="text-xs text-foreground/50">Manage custom discount codes for clients</p>
        </div>
        <button 
          onClick={() => router.push('/partner/coupons/new')}
          className="px-5 py-2.5 bg-[#1D3B31] text-white hover:bg-[#1D3B31]/95 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <Tag className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">No coupons created</h3>
          <p className="text-xs text-foreground/50 leading-relaxed">
            Click "Create Coupon" to register a discount promo code (e.g. WELCOME10). Requires Admin verification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map(cp => (
            <div key={cp._id} className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#1D3B31] bg-cream px-3 py-1 rounded border border-gold/25 text-sm uppercase">
                    {cp.code}
                  </span>
                  
                  {cp.approvalStatus === 'APPROVED' ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Active
                    </span>
                  ) : cp.approvalStatus === 'REJECTED' ? (
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Approval
                    </span>
                  )}
                </div>

                <div className="text-xs text-foreground/60 space-y-1">
                  <p><span className="font-bold text-primary">Promo:</span> {cp.discountType === 'PERCENTAGE' ? `${cp.discountValue}% Discount` : `₹${cp.discountValue} Flat Off`}</p>
                  <p><span className="font-bold text-primary">Min Order:</span> ₹{cp.minOrderValue}</p>
                  <p className="text-[10px] italic">{cp.description || 'Valid for home painting services'}</p>
                </div>

                {cp.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                    <span className="text-[9px] font-bold text-red-700 uppercase tracking-wider block">Rejection Feedback:</span>
                    <p className="text-xs text-red-800 font-semibold mt-0.5">{cp.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gold/10 mt-6 justify-end">
                <button 
                  onClick={() => router.push(`/partner/coupons/${cp._id}/edit`)}
                  className="px-4 py-2 border border-gold/30 hover:bg-[#F8F4EE] text-xs font-bold rounded-full transition-all text-primary"
                >
                  Edit Coupon
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
