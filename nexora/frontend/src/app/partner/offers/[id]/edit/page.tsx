"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import ImageUpload from '@/app/admin/_components/ImageUpload';

export default function PartnerEditOfferPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applicableCategories, setApplicableCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchOfferAndDeps();
  }, [id]);

  const fetchOfferAndDeps = async () => {
    try {
      setLoading(true);
      const [catRes, offerRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/partner/offers')
      ]);

      setCategories(catRes.data.categories || catRes.data || []);

      const list = offerRes.data?.offers || offerRes.data || [];
      const offer = list.find((o: any) => o._id === id);
      if (offer) {
        setTitle(offer.title || '');
        setDescription(offer.description || '');
        setDiscountType(offer.discountType || 'PERCENTAGE');
        setDiscountValue(offer.discountValue || 0);
        setImageUrl(offer.imageUrl || '');
        setImagePublicId(offer.imagePublicId || '');
        setApplicableCategories((offer.applicableCategories || []).map((c: any) => c._id || c));
        if (offer.startDate) setStartDate(new Date(offer.startDate).toISOString().split('T')[0]);
        if (offer.endDate) setEndDate(new Date(offer.endDate).toISOString().split('T')[0]);
      } else {
        setErrorMsg('Offer not found or access denied.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load offer details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      await api.put(`/partner/offers/${id}`, {
        title,
        description,
        discountType,
        discountValue,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        applicableCategories,
        imageUrl,
        imagePublicId,
      });
      router.push('/partner/offers');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update offer.');
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
        <button onClick={() => router.push('/partner/offers')} className="p-1.5 hover:bg-cream rounded-full transition-colors text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Edit Offer</h1>
          <p className="text-xs text-foreground/50">Edit details of your promotional offer</p>
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
            className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
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

        {/* Applicable Categories — Interactive Multi-Select Pill Layout */}
        <div>
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Applicable Category</label>
          <div className="flex flex-wrap gap-2.5 mt-2 bg-cream/20 border border-gold/30 rounded-2xl p-4">
            {categories.map((c) => {
              const isSelected = applicableCategories.includes(c._id);
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => {
                    const selected = applicableCategories.includes(c._id)
                      ? applicableCategories.filter(id => id !== c._id)
                      : [...applicableCategories, c._id];
                    setApplicableCategories(selected);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-foreground/70 border-gold/30 hover:border-gold/60'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-foreground/40 mt-2">Click to select/deselect categories. Leave empty to apply to all categories.</p>
        </div>

        <div>
          <ImageUpload 
            label="Offer Banner Image"
            imageUrl={imageUrl}
            imagePublicId={imagePublicId}
            onChange={(url, pubId) => { setImageUrl(url); setImagePublicId(pubId); }}
          />
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
