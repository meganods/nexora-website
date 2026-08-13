"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import AdminPageLayout from '../../_components/AdminPageLayout';
import ImageUpload from '../../_components/ImageUpload';
import api from '@/lib/api';

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

export default function NewSaleCampaignPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    imagePublicId: '',
    discountPercentage: '',
    startDate: '',
    endDate: '',
    isActive: true,
    applicableCategories: [] as string[],
    applicableServices: [] as string[],
  });

  useEffect(() => {
    api.get('/admin/categories').then(r => setCategories(r.data.categories || r.data || [])).catch(() => {});
    api.get('/admin/services?limit=1000').then(r => setServices(r.data.services || r.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Campaign name is required.'); return; }
    if (!form.discountPercentage) { setError('Discount percentage is required.'); return; }
    if (!form.startDate || !form.endDate) { setError('Start and end dates are required.'); return; }
    setSaving(true); setError(''); setSuccess('');

    try {
      const payload = {
        ...form,
        discountPercentage: Number(form.discountPercentage),
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
      };

      await api.post('/admin/sale-campaigns', payload);
      setSuccess('Sale campaign created successfully!');
      setTimeout(() => router.push('/admin/dashboard?tab=campaigns'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create sale campaign.');
    } finally { setSaving(false); }
  };

  const toggleCategory = (catId: string) => {
    setForm(p => ({
      ...p,
      applicableCategories: p.applicableCategories.includes(catId)
        ? p.applicableCategories.filter(id => id !== catId)
        : [...p.applicableCategories, catId]
    }));
  };

  const toggleService = (svcId: string) => {
    setForm(p => ({
      ...p,
      applicableServices: p.applicableServices.includes(svcId)
        ? p.applicableServices.filter(id => id !== svcId)
        : [...p.applicableServices, svcId]
    }));
  };

  return (
    <AdminPageLayout title="Add New Sale Campaign" subtitle="Create a store-wide promotional sale event" backHref="/admin/dashboard?tab=campaigns" backLabel="Back to Campaigns">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-[#C3AB84]/20 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#0F3D30] border-b border-gold/10 pb-2">Campaign Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Campaign Name *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inp} placeholder="Monsoon Makeover Sale" />
            </div>
            <div>
              <label className={lbl}>Description</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inp} placeholder="Get flat discounts across categories" />
            </div>
            
            <div>
              <label className={lbl}>Discount Percentage (%) *</label>
              <input required type="number" min={0} max={100} value={form.discountPercentage} onChange={e => setForm(p => ({ ...p, discountPercentage: e.target.value }))} className={inp} placeholder="e.g. 20" />
            </div>
            <div />

            <div>
              <label className={lbl}>Start Date *</label>
              <input required type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>End Date *</label>
              <input required type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inp} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={lbl}>Applicable Categories (Empty = All)</label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-3 border border-gold/20 rounded-2xl bg-cream/10">
                {categories.map(c => {
                  const sel = form.applicableCategories.includes(c._id);
                  return (
                    <button type="button" key={c._id} onClick={() => toggleCategory(c._id)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${sel ? 'bg-primary text-white border-primary shadow-sm' : 'border-gold/25 text-foreground/60 hover:bg-cream'}`}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={lbl}>Applicable Services (Empty = All)</label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-3 border border-gold/20 rounded-2xl bg-cream/10">
                {services.map(s => {
                  const sel = form.applicableServices.includes(s._id);
                  return (
                    <button type="button" key={s._id} onClick={() => toggleService(s._id)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${sel ? 'bg-primary text-white border-primary shadow-sm' : 'border-gold/25 text-foreground/60 hover:bg-cream'}`}>
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <ImageUpload
              imageUrl={form.imageUrl}
              imagePublicId={form.imagePublicId}
              onChange={(url, pid) => setForm(p => ({ ...p, imageUrl: url, imagePublicId: pid }))}
              label="Campaign Banner Image"
              folder="nexora/campaigns"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div className={`w-10 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-[#0F3D30]' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-semibold text-foreground/70">{form.isActive ? 'Active' : 'Inactive'}</span>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="hidden" />
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-bold">{error}</p>
          </div>
        )}
        
        {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-2xl font-bold">✓ {success}</p>}
        
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-[#0F3D30] text-white rounded-full font-semibold text-sm hover:bg-[#0F3D30]/90 disabled:opacity-60 transition-colors shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
          <button type="button" onClick={() => router.push('/admin/dashboard?tab=campaigns')} className="px-8 py-3 border border-[#C3AB84]/40 text-foreground/70 rounded-full font-semibold text-sm hover:bg-[#F8F4EE] transition-colors">Cancel</button>
        </div>
      </form>
    </AdminPageLayout>
  );
}
