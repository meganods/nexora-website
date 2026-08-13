"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminPageLayout from '../../_components/AdminPageLayout';
import ImageUpload from '../../_components/ImageUpload';
import api from '@/lib/api';

const autoSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

export default function NewPackagePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '', slug: '', description: '', basePrice: '',
    discountPercentage: 0, estimatedDurationMins: 120,
    inclusions: '', imageUrl: '', imagePublicId: '',
    categoryIds: [] as string[], includedServices: [] as string[],
    displayOrder: 0, isActive: true, isFeatured: false,
  });

  useEffect(() => {
    api.get('/admin/categories').then(r => setCategories(r.data || [])).catch(console.error);
    api.get('/admin/services?limit=1000').then(r => setAllServices(r.data.services || [])).catch(console.error);
  }, []);

  const toggleCat = (id: string) => setForm(p => ({
    ...p, categoryIds: p.categoryIds.includes(id) ? p.categoryIds.filter(x => x !== id) : [...p.categoryIds, id]
  }));

  const toggleSvc = (id: string) => setForm(p => ({
    ...p, includedServices: p.includedServices.includes(id) ? p.includedServices.filter(x => x !== id) : [...p.includedServices, id]
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Package name is required.'); return; }
    if (!form.basePrice) { setError('Base price is required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        ...form,
        slug: form.slug || autoSlug(form.name),
        basePrice: Number(form.basePrice),
        discountPercentage: Number(form.discountPercentage),
        estimatedDurationMins: Number(form.estimatedDurationMins),
        displayOrder: Number(form.displayOrder),
        inclusions: form.inclusions.split('\n').map((s: string) => s.trim()).filter(Boolean),
      };
      await api.post('/admin/packages', payload);
      setSuccess('Package created successfully!');
      setTimeout(() => router.push('/admin/dashboard?tab=packages'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create package.');
    } finally { setSaving(false); }
  };

  return (
    <AdminPageLayout title="Add New Package" subtitle="Create a bundled service package" backHref="/admin/dashboard?tab=packages" backLabel="Back to Packages">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-[#C3AB84]/20 shadow-sm p-6 space-y-5">
          <h2 className="font-serif text-lg font-bold text-[#0F3D30]">Package Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div><label className={lbl}>Package Name *</label><input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: autoSlug(e.target.value) }))} className={inp} placeholder="e.g. Complete Home Care" /></div>
            <div><label className={lbl}>Slug</label><input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className={`${inp} font-mono`} /></div>
            <div><label className={lbl}>Base Price (₹) *</label><input required type="number" min={0} value={form.basePrice} onChange={e => setForm(p => ({ ...p, basePrice: e.target.value }))} className={inp} /></div>
            <div><label className={lbl}>Discount %</label><input type="number" min={0} max={100} value={form.discountPercentage} onChange={e => setForm(p => ({ ...p, discountPercentage: Number(e.target.value) }))} className={inp} /></div>
            <div><label className={lbl}>Duration (mins)</label><input type="number" min={1} value={form.estimatedDurationMins} onChange={e => setForm(p => ({ ...p, estimatedDurationMins: Number(e.target.value) }))} className={inp} /></div>
            <div><label className={lbl}>Display Order</label><input type="number" value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: Number(e.target.value) }))} className={inp} /></div>
          </div>
          <div><label className={lbl}>Description</label><textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={`${inp} resize-none`} /></div>
          <div><label className={lbl}>Inclusions (one per line)</label><textarea rows={4} value={form.inclusions} onChange={e => setForm(p => ({ ...p, inclusions: e.target.value }))} className={`${inp} resize-none font-mono`} /></div>

          {/* Categories */}
          <div>
            <label className={lbl}>Applicable Categories</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 border border-[#C3AB84]/20 rounded-2xl bg-[#F8F4EE]/60">
              {categories.map(c => {
                const checked = form.categoryIds.includes(c._id);
                return (
                  <label key={c._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${checked ? 'bg-[#0F3D30] text-white border-[#0F3D30]' : 'bg-white border-[#C3AB84]/20 text-foreground/60'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleCat(c._id)} className="hidden" />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Services */}
          <div>
            <label className={lbl}>Included Services</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-[#C3AB84]/20 rounded-2xl bg-[#F8F4EE]/60">
              {allServices.map(s => {
                const checked = form.includedServices.includes(s._id);
                return (
                  <label key={s._id} className={`flex items-center gap-3 p-2 rounded-xl border text-xs cursor-pointer transition-all ${checked ? 'bg-[#0F3D30]/5 border-[#0F3D30] text-[#0F3D30] font-semibold' : 'bg-white border-[#C3AB84]/20 text-foreground/60'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleSvc(s._id)} className="hidden" />
                    <div className="w-2 h-2 rounded-full bg-current" style={{ opacity: checked ? 1 : 0.2 }} />
                    <span className="truncate">{s.name} ({s.categoryId?.name || 'Service'})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <ImageUpload imageUrl={form.imageUrl} imagePublicId={form.imagePublicId} onChange={(url, pid) => setForm(p => ({ ...p, imageUrl: url, imagePublicId: pid }))} label="Package Image" folder="nexora/packages" />

          <div className="grid grid-cols-2 gap-3">
            {([{ key: 'isActive', label: 'Active' }, { key: 'isFeatured', label: 'Featured' }] as const).map(({ key, label }) => (
              <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${form[key] ? 'border-[#0F3D30] bg-[#0F3D30]/5 text-[#0F3D30]' : 'border-[#C3AB84]/20 text-foreground/60'}`}>
                <input type="checkbox" checked={!!form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="hidden" />
                {form[key] ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                <span className="text-xs font-semibold">{label}</span>
              </label>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-2xl">✓ {success}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-[#0F3D30] text-white rounded-full font-semibold text-sm hover:bg-[#0F3D30]/90 disabled:opacity-60 transition-colors shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Creating...' : 'Create Package'}
          </button>
          <button type="button" onClick={() => router.push('/admin/dashboard?tab=packages')} className="px-8 py-3 border border-[#C3AB84]/40 text-foreground/70 rounded-full font-semibold text-sm hover:bg-[#F8F4EE] transition-colors">Cancel</button>
        </div>
      </form>
    </AdminPageLayout>
  );
}
