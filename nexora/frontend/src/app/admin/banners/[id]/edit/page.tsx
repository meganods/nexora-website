"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Check, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import AdminPageLayout from '../../../_components/AdminPageLayout';
import ImageUpload from '../../../_components/ImageUpload';
import api from '@/lib/api';

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '', 
    subtitle: '', 
    ctaText: 'Book Now', 
    ctaRoute: '/services',
    imageUrl: '', 
    imagePublicId: '', 
    mobileImageUrl: '',
    mobilePublicId: '',
    promoCode: '',
    promoLabel: '',
    gradient: 'from-[#0F3D30] to-[#1D6B50]',
    badgeText: '',
    startDate: '',
    endDate: '',
    displayOrder: '0', 
    isActive: true,
    position: 'CAROUSEL',
  });

  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data } = await api.get(`/admin/banners/${id}`);
        const b = data.banner || data;
        setForm({
          title: b.title || '',
          subtitle: b.subtitle || '',
          ctaText: b.ctaText || 'Book Now',
          ctaRoute: b.ctaRoute || '/services',
          imageUrl: b.imageUrl || '',
          imagePublicId: b.imagePublicId || '',
          mobileImageUrl: b.mobileImageUrl || '',
          mobilePublicId: b.mobilePublicId || '',
          promoCode: b.promoCode || '',
          promoLabel: b.promoLabel || '',
          gradient: b.gradient || 'from-[#0F3D30] to-[#1D6B50]',
          badgeText: b.badgeText || '',
          displayOrder: String(b.displayOrder || 0),
          startDate: b.startDate ? new Date(b.startDate).toISOString().split('T')[0] : '',
          endDate: b.endDate ? new Date(b.endDate).toISOString().split('T')[0] : '',
          isActive: b.isActive !== false,
          position: b.position || 'CAROUSEL',
        });
      } catch {
        setError('Failed to load banner.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBanner();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Banner title is required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    
    try {
      const payload = {
        ...form,
        displayOrder: Number(form.displayOrder) || 0,
        startDate: form.startDate ? new Date(form.startDate) : new Date(),
        endDate: form.endDate ? new Date(form.endDate) : null,
      };

      await api.put(`/admin/banners/${id}`, payload);
      setSuccess('Banner updated successfully!');
      setTimeout(() => router.push('/admin/dashboard?tab=banners'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update banner.');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <AdminPageLayout title="Edit Banner" backHref="/admin/dashboard?tab=banners" backLabel="Back to Banners">
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#0F3D30]" /></div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title={`Edit Banner: ${form.title}`} subtitle="Update promotional banner details" backHref="/admin/dashboard?tab=banners" backLabel="Back to Banners">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-[#C3AB84]/20 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#0F3D30] border-b border-gold/10 pb-2">Banner Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Title *</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inp} placeholder="Summer Sale — 30% Off" />
            </div>
            <div>
              <label className={lbl}>Subtitle</label>
              <input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} className={inp} placeholder="Limited time offer on all services" />
            </div>
            
            <div>
              <label className={lbl}>CTA Button Text</label>
              <input value={form.ctaText} onChange={e => setForm(p => ({ ...p, ctaText: e.target.value }))} className={inp} placeholder="Book Now" />
            </div>
            <div>
              <label className={lbl}>CTA Route</label>
              <input value={form.ctaRoute} onChange={e => setForm(p => ({ ...p, ctaRoute: e.target.value }))} className={inp} placeholder="/services" />
            </div>

            <div>
              <label className={lbl}>Promo Code</label>
              <input value={form.promoCode} onChange={e => setForm(p => ({ ...p, promoCode: e.target.value }))} className={`${inp} font-mono uppercase tracking-widest`} placeholder="SAVE30" />
            </div>
            <div>
              <label className={lbl}>Promo Label</label>
              <input value={form.promoLabel} onChange={e => setForm(p => ({ ...p, promoLabel: e.target.value }))} className={inp} placeholder="Use code at checkout" />
            </div>

            <div>
              <label className={lbl}>Gradient CSS Classes</label>
              <input value={form.gradient} onChange={e => setForm(p => ({ ...p, gradient: e.target.value }))} className={inp} placeholder="from-[#0F3D30] to-[#1D6B50]" />
            </div>
            <div>
              <label className={lbl}>Badge Text</label>
              <input value={form.badgeText} onChange={e => setForm(p => ({ ...p, badgeText: e.target.value }))} className={inp} placeholder="New" />
            </div>

            <div>
              <label className={lbl}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inp} placeholder="Leave blank for no expiry" />
            </div>

            <div>
              <label className={lbl}>Display Order</label>
              <input type="number" value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: e.target.value }))} className={inp} />
            </div>

            <div>
              <label className={lbl}>Banner Position *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPositionDropdownOpen(!isPositionDropdownOpen)}
                  className="flex items-center justify-between gap-2 border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-[#F8F4EE] focus:outline-none text-foreground/80 hover:border-primary font-medium w-full text-left h-[46px]"
                >
                  <span>
                    {form.position === 'CAROUSEL' ? 'Carousel Slider (Top Banner)' : 'Promo Card (Bottom Strip)'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-foreground/55 flex-shrink-0" />
                </button>
                {isPositionDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsPositionDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-gold/20 rounded-2xl shadow-xl z-20 py-1.5 divide-y divide-gold/5 max-h-60 overflow-y-auto font-semibold text-foreground/80 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setForm(p => ({ ...p, position: 'CAROUSEL' }));
                          setIsPositionDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left hover:bg-cream/40 transition-colors ${form.position === 'CAROUSEL' ? 'text-primary bg-cream/20 font-bold' : 'text-foreground/75'}`}
                      >
                        Carousel Slider (Top Banner)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForm(p => ({ ...p, position: 'PROMO_CARD' }));
                          setIsPositionDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left hover:bg-cream/40 transition-colors ${form.position === 'PROMO_CARD' ? 'text-primary bg-cream/20 font-bold' : 'text-foreground/75'}`}
                      >
                        Promo Card (Bottom Strip)
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <ImageUpload
              imageUrl={form.imageUrl}
              imagePublicId={form.imagePublicId}
              onChange={(url, pid) => setForm(p => ({ ...p, imageUrl: url, imagePublicId: pid }))}
              label="Desktop Banner Image"
              folder="nexora/banners"
            />
            <ImageUpload
              imageUrl={form.mobileImageUrl}
              imagePublicId={form.mobilePublicId}
              onChange={(url, pid) => setForm(p => ({ ...p, mobileImageUrl: url, mobilePublicId: pid }))}
              label="Mobile Banner Image (Optional)"
              folder="nexora/banners/mobile"
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.push('/admin/dashboard?tab=banners')} className="px-8 py-3 border border-[#C3AB84]/40 text-foreground/70 rounded-full font-semibold text-sm hover:bg-[#F8F4EE] transition-colors">Cancel</button>
        </div>
      </form>
    </AdminPageLayout>
  );
}
