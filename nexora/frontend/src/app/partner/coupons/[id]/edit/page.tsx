"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerEditCouponPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchCoupon();
  }, [id]);

  const fetchCoupon = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/partner/coupons');
      const list = data?.coupons || [];
      const coupon = list.find((c: any) => c._id === id);
      if (coupon) {
        setCode(coupon.code || '');
        setDescription(coupon.description || '');
        setDiscountType(coupon.discountType || 'PERCENTAGE');
        setDiscountValue(coupon.discountValue || 0);
        setMinOrderValue(coupon.minOrderValue || 0);
        setMaxDiscountAmount(coupon.maxDiscountAmount || 0);
        if (coupon.startDate) setStartDate(new Date(coupon.startDate).toISOString().split('T')[0]);
        if (coupon.endDate) setEndDate(new Date(coupon.endDate).toISOString().split('T')[0]);
      } else {
        setErrorMsg('Coupon not found or access denied.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load coupon details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      await api.put(`/partner/coupons/${id}`, {
        description,
        discountType,
        discountValue,
        minOrderValue,
        maxDiscountAmount,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null
      });
      router.push('/partner/coupons');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update coupon.');
    } finally {
      setSaving(false);
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
      <div className="flex items-center gap-3 border-b border-gold/15 pb-4">
        <button onClick={() => router.push('/partner/coupons')} className="p-1.5 hover:bg-cream rounded-full transition-colors text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Edit Coupon: <span className="font-mono text-gold font-bold">{code}</span></h1>
          <p className="text-xs text-foreground/50">Edit details of your promotional discount code</p>
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
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Coupon Code (Read-Only)</label>
          <input 
            type="text" disabled value={code}
            className="w-full px-4 py-2.5 rounded-xl border border-gold/30 bg-cream/50 text-foreground/50 focus:outline-none font-mono uppercase"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Description *</label>
          <textarea 
            required value={description} onChange={e => setDescription(e.target.value)}
            rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
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
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Min Booking Value (₹) *</label>
            <input 
              type="number" required value={minOrderValue} onChange={e => setMinOrderValue(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Max Discount Amount (₹)</label>
            <input 
              type="number" value={maxDiscountAmount} onChange={e => setMaxDiscountAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
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
          type="submit" disabled={saving}
          className="w-full py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition-all text-xs flex items-center justify-center gap-1.5 mt-4"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
