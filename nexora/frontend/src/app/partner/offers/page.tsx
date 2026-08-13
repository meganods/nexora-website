"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Percent, Plus, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/partner/offers');
      setOffers(data?.offers || data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load promotional offers.');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gold/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">My Offers</h1>
          <p className="text-xs text-foreground/50">Manage discount and cashback campaigns</p>
        </div>
        <button 
          onClick={() => router.push('/partner/offers/new')}
          className="px-5 py-2.5 bg-[#1D3B31] text-white hover:bg-[#1D3B31]/95 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Offer
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {offers.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <Percent className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">No offers created</h3>
          <p className="text-xs text-foreground/50 leading-relaxed">
            Click "Create Offer" to design a promotional campaign. All vendor offers require Admin approval before showing up on the public website.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map(off => (
            <div key={off._id} className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-primary text-base">
                    {off.discountType === 'PERCENTAGE' ? `${off.discountValue}% Off` : `₹${off.discountValue} Off`}
                  </span>
                  
                  {off.approvalStatus === 'APPROVED' ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  ) : off.approvalStatus === 'REJECTED' ? (
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Approval
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-primary">{off.title}</h4>
                  <p className="text-xs text-foreground/50 mt-1">{off.description || 'Promotional offer campaign'}</p>
                </div>

                {off.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                    <span className="text-[9px] font-bold text-red-700 uppercase tracking-wider block">Admin Reason:</span>
                    <p className="text-xs text-red-800 font-semibold mt-0.5">{off.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gold/10 mt-6 justify-end">
                <button 
                  onClick={() => router.push(`/partner/offers/${off._id}/edit`)}
                  className="px-4 py-2 border border-gold/30 hover:bg-[#F8F4EE] text-xs font-bold rounded-full transition-all text-primary"
                >
                  Edit Offer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
