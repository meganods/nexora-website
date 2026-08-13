"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Percent, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerNewOfferPage() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        title,
        description,
        discountType,
        discountValue,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null
      };

      const { data } = await api.post('/partner/offers', payload);
      if (data.success) {
        router.push('/partner/offers');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit promotion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-gold/15 pb-4">
        <button onClick={() => router.push('/partner/offers')} className="p-1.5 hover:bg-cream rounded-full transition-colors text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Create New Offer</h1>
          <p className="text-xs text-foreground/50">Submit a promotional discount for admin verification</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gold/15 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Offer Title *</label>
          <input 
            type="text" required value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Festival Special Home Painting Offer"
            className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Description *</label>
          <textarea 
            required value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe the promo details and requirements" rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Discount Type *</label>
            <select 
              value={discountType} onChange={e => setDiscountType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 bg-white focus:outline-none"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT">Flat Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Discount Value *</label>
            <input 
              type="number" required value={discountValue} onChange={e => setDiscountValue(parseInt(e.target.value) || 0)}
              placeholder="e.g. 10" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Start Date</label>
            <input 
              type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">End Date</label>
            <input 
              type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition-all text-xs flex items-center justify-center gap-1.5 mt-4"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
