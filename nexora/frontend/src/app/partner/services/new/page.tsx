"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Check, Plus } from 'lucide-react';
import api from '@/lib/api';
import ImageUpload from '@/app/admin/_components/ImageUpload';
import MultiImageUpload from '@/app/admin/_components/MultiImageUpload';

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

export default function PartnerNewServicePage() {
  const router = useRouter();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [estimatedDurationMins, setEstimatedDurationMins] = useState(60);
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [inclusionInput, setInclusionInput] = useState('');
  const [inclusions, setInclusions] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.get('/public/categories')
      .then(res => setCategories(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addInclusion = () => {
    if (inclusionInput.trim()) {
      setInclusions([...inclusions, inclusionInput.trim()]);
      setInclusionInput('');
    }
  };

  const removeInclusion = (index: number) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        name,
        categoryId,
        description,
        basePrice,
        estimatedDurationMins,
        inclusions,
        bannerImageUrl,
        serviceImages,
        parentId: null
      };
      const { data } = await api.post('/partner/created-services', payload);
      if (data.success) {
        router.push('/partner/services');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create service.');
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
        <button onClick={() => router.push('/partner/services')} className="p-1.5 hover:bg-cream rounded-full transition-colors text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Add New Service</h1>
          <p className="text-xs text-foreground/50">Submit a new service for admin verification and approval</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-xs text-red-700 font-bold">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-[#C3AB84]/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={lbl}>Service Name *</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)}
              className={inp} placeholder="e.g. AC General Service" />
          </div>

          <div>
            <label className={lbl}>Category *</label>
            <select required value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className={inp}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Base Price (₹) *</label>
            <input required type="number" min={0} value={basePrice} onChange={e => setBasePrice(Number(e.target.value))}
              className={inp} />
          </div>

          <div>
            <label className={lbl}>Duration (minutes) *</label>
            <input required type="number" min={1} value={estimatedDurationMins} onChange={e => setEstimatedDurationMins(Number(e.target.value))}
              className={inp} />
          </div>
        </div>

        <div>
          <label className={lbl}>Description</label>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
            className={inp} placeholder="Service description details..." />
        </div>

        <div>
          <label className={lbl}>Main Image</label>
          <div className="bg-[#F8F4EE] border border-[#C3AB84]/30 rounded-2xl p-4">
            <ImageUpload label="Main Image" imageUrl={bannerImageUrl} imagePublicId="" onChange={(url) => {
              setBannerImageUrl(url);
            }} />
          </div>
        </div>

        <div>
          <label className={lbl}>Sub Images</label>
          <div className="bg-[#F8F4EE] border border-[#C3AB84]/30 rounded-2xl p-4">
            <MultiImageUpload label="Sub Images" imageUrls={serviceImages} onChange={(urls) => {
              setServiceImages(urls);
            }} />
          </div>
        </div>

        <div>
          <label className={lbl}>Inclusions</label>
          <div className="flex gap-3 mb-3">
            <input type="text" value={inclusionInput} onChange={e => setInclusionInput(e.target.value)}
              className={inp} placeholder="e.g. Complete inner unit cleaning" />
            <button type="button" onClick={addInclusion} className="px-6 bg-cream text-primary rounded-2xl text-xs font-bold border border-gold/15 hover:bg-beige transition-colors flex-shrink-0">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {inclusions.map((inc, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream border border-gold/10 text-primary text-xs font-semibold rounded-full">
                {inc}
                <button type="button" onClick={() => removeInclusion(idx)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button type="button" onClick={() => router.push('/partner/services')} className="px-8 py-3 border border-[#C3AB84]/40 text-foreground/70 rounded-full font-semibold text-sm hover:bg-[#F8F4EE] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-[#0F3D30] text-white rounded-full font-semibold text-sm hover:bg-[#0F3D30]/90 disabled:opacity-60 transition-colors shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
}
