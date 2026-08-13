"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerEditDealPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [city, setCity] = useState('Delhi');
  const [tagline, setTagline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchDealDetails();
  }, [id]);

  const fetchDealDetails = async () => {
    try {
      setLoading(true);
      const [catRes, dealsRes] = await Promise.all([
        api.get('/public/categories'),
        api.get('/partner/deals')
      ]);

      setCategories(catRes.data || []);
      const list = dealsRes.data?.deals || dealsRes.data || [];
      const deal = list.find((d: any) => d._id === id);
      if (deal) {
        setSelectedServiceId(deal.serviceId?._id || deal.serviceId || '');
        setDiscountPercent(deal.discountPercent || 0);
        setCity(deal.city || 'Delhi');
        setTagline(deal.tagline || '');
        if (deal.startDate) setStartDate(new Date(deal.startDate).toISOString().split('T')[0]);
        if (deal.endDate) setEndDate(new Date(deal.endDate).toISOString().split('T')[0]);
      } else {
        setErrorMsg('Deal not found or access denied.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load deal details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      await api.put(`/partner/deals/${id}`, {
        serviceId: selectedServiceId,
        discountPercent,
        city,
        tagline,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null
      });
      router.push('/partner/deals');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update deal.');
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
        <button onClick={() => router.push('/partner/deals')} className="p-1.5 hover:bg-cream rounded-full transition-colors text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Edit Deal</h1>
          <p className="text-xs text-foreground/50">Modify details of your home page promotional deal</p>
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
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Select Service *</label>
          <select 
            value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gold/30 bg-white focus:outline-none text-xs"
          >
            {categories.map(cat => (
              <optgroup key={cat._id} label={cat.name}>
                {cat.services?.map((svc: any) => (
                  <option key={svc._id} value={svc._id}>{svc.name} (Base: ₹{svc.basePrice})</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Discount Percent (%) *</label>
            <input 
              type="number" required value={discountPercent} onChange={e => setDiscountPercent(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Target City *</label>
            <input 
              type="text" required value={city} onChange={e => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Tagline *</label>
          <input 
            type="text" required value={tagline} onChange={e => setTagline(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
          />
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
