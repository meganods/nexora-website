"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import AdminPageLayout from '../../../_components/AdminPageLayout';
import ImageUpload from '../../../_components/ImageUpload';
import api from '@/lib/api';

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

export default function EditOfferPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    startDate: '',
    endDate: '',
    isActive: true,
    isFeatured: false,
    applicableCategories: [] as string[],
    imageUrl: '',
    imagePublicId: '',
  });

  useEffect(() => {
    const loadDependenciesAndOffer = async () => {
      try {
        const [catRes, offerRes] = await Promise.all([
          api.get('/admin/categories'),
          api.get(`/admin/offers/${id}`)
        ]);

        setCategories(catRes.data.categories || catRes.data || []);

        const o = offerRes.data.offer || offerRes.data;
        setForm({
          title: o.title || '',
          description: o.description || '',
          discountType: o.discountType || 'PERCENTAGE',
          discountValue: String(o.discountValue || ''),
          startDate: o.startDate ? new Date(o.startDate).toISOString().split('T')[0] : '',
          endDate: o.endDate ? new Date(o.endDate).toISOString().split('T')[0] : '',
          isActive: o.isActive !== false,
          isFeatured: o.isFeatured === true,
          applicableCategories: (o.applicableCategories || []).map((c: any) => c._id || c),
          imageUrl: o.imageUrl || '',
          imagePublicId: o.imagePublicId || '',
        });
      } catch (err: any) {
        setError('Failed to load offer data.');
      } finally {
        setLoading(false);
      }
    };
    if (id) loadDependenciesAndOffer();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Offer title is required.'); return; }
    if (!form.discountValue) { setError('Discount value is required.'); return; }
    setSaving(true); setError(''); setSuccess('');

    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        startDate: form.startDate ? new Date(form.startDate) : new Date(),
        endDate: form.endDate ? new Date(form.endDate) : null,
      };

      await api.put(`/admin/offers/${id}`, payload);
      setSuccess('Offer updated successfully!');
      setTimeout(() => router.push('/admin/dashboard?tab=offers'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update offer.');
    } finally { setSaving(false); }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
    setForm(p => ({ ...p, applicableCategories: selected }));
  };

  if (loading) {
    return (
      <AdminPageLayout title="Edit Offer" backHref="/admin/dashboard?tab=offers" backLabel="Back to Offers">
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#0F3D30]" /></div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title={`Edit Offer: ${form.title}`} subtitle="Modify platform-wide promotional offer settings" backHref="/admin/dashboard?tab=offers" backLabel="Back to Offers">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-[#C3AB84]/20 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#0F3D30] border-b border-gold/10 pb-2">Offer Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Title *</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inp} placeholder="Festival Special Offer" />
            </div>
            <div>
              <label className={lbl}>Description</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inp} placeholder="Get amazing discount on top services" />
            </div>
            
            <div>
              <label className={lbl}>Discount Type *</label>
              <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))} className={inp}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Discount Value *</label>
              <input required type="number" min={0} value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} className={inp} />
            </div>

            <div>
              <label className={lbl}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inp} placeholder="No expiry if blank" />
            </div>
          </div>

          {/* Applicable Categories — Interactive Multi-Select Pill Layout */}
          <div>
            <label className={lbl}>Applicable Categories</label>
            <div className="flex flex-wrap gap-2.5 mt-2 bg-[#F8F4EE] border border-[#C3AB84]/30 rounded-2xl p-4">
              {categories.map((c) => {
                const isSelected = form.applicableCategories.includes(c._id);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      const selected = form.applicableCategories.includes(c._id)
                        ? form.applicableCategories.filter(id => id !== c._id)
                        : [...form.applicableCategories, c._id];
                      setForm(p => ({ ...p, applicableCategories: selected }));
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[#0F3D30] text-white border-[#0F3D30] shadow-sm'
                        : 'bg-white text-foreground/70 border-gold/30 hover:border-gold/60'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-foreground/40 mt-2">Click to select/deselect categories. Leave empty to apply to all.</p>
          </div>

          <div>
            <ImageUpload 
              label="Offer Banner Image"
              imageUrl={form.imageUrl}
              imagePublicId={form.imagePublicId}
              onChange={(url, pubId) => setForm(p => ({ ...p, imageUrl: url, imagePublicId: pubId }))}
            />
          </div>


          <div className="flex gap-8 pt-2">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div className={`w-10 h-6 rounded-full transition-colors relative ${form.isFeatured ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFeatured ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-semibold text-foreground/70">Featured Offer</span>
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="hidden" />
            </label>

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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.push('/admin/dashboard?tab=offers')} className="px-8 py-3 border border-[#C3AB84]/40 text-foreground/70 rounded-full font-semibold text-sm hover:bg-[#F8F4EE] transition-colors">Cancel</button>
        </div>
      </form>
    </AdminPageLayout>
  );
}
