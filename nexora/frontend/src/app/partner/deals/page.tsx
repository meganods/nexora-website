"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Percent, Plus, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/partner/deals');
      setDeals(data?.deals || data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load deals.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gold/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">My Deals</h1>
          <p className="text-xs text-foreground/50">Manage homepage premium service deals</p>
        </div>
        <button 
          onClick={() => router.push('/partner/deals/new')}
          className="px-5 py-2.5 bg-[#1D3B31] text-white hover:bg-[#1D3B31]/95 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Deal
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
      ) : deals.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <Percent className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">No deals created</h3>
          <p className="text-xs text-foreground/50 leading-relaxed">
            Click "Create Deal" to propose a discount deal for specific services on the platform homepage. Requires Admin validation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map(dl => (
            <div key={dl._id} className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1D3B31] bg-cream px-3 py-1 rounded border border-gold/25 text-xs">
                    {dl.discountPercent}% Off
                  </span>
                  
                  {dl.approvalStatus === 'APPROVED' ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Active
                    </span>
                  ) : dl.approvalStatus === 'REJECTED' ? (
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
                  <p><span className="font-bold text-primary">Service:</span> {dl.serviceId?.name || 'General Service'}</p>
                  <p><span className="font-bold text-primary">City:</span> {dl.city}</p>
                  <p className="text-[10px] italic">"{dl.tagline || 'Limited time premium discount'}"</p>
                </div>

                {dl.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                    <span className="text-[9px] font-bold text-red-700 uppercase tracking-wider block">Rejection Feedback:</span>
                    <p className="text-xs text-red-800 font-semibold mt-0.5">{dl.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gold/10 mt-6 justify-end">
                <button 
                  onClick={() => router.push(`/partner/deals/${dl._id}/edit`)}
                  className="px-4 py-2 border border-gold/30 hover:bg-[#F8F4EE] text-xs font-bold rounded-full transition-all text-primary"
                >
                  Edit Deal
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
