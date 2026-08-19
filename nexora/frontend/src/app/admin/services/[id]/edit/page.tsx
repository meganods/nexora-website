"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Check, Loader2, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import AdminPageLayout from '../../../_components/AdminPageLayout';
import ImageUpload from '../../../_components/ImageUpload';
import MultiImageUpload from '../../../_components/MultiImageUpload';
import api from '@/lib/api';

const autoSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

const TOGGLES = [
  { key: 'isActive',    label: 'Active' },
  { key: 'isFeatured', label: 'Featured' },
  { key: 'isPopular',  label: 'Popular' },
  { key: 'isMostBooked', label: 'Most Booked' },
] as const;

type ToggleKey = 'isActive' | 'isFeatured' | 'isPopular' | 'isMostBooked';

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<any[]>([]);
  const [parentServices, setParentServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [serviceName, setServiceName] = useState('');

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);

  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [parentSearchQuery, setParentSearchQuery] = useState('');

  const [form, setForm] = useState({
    name: '', slug: '', categoryId: '', description: '', basePrice: '',
    discountPercentage: 0,
    estimatedDurationMins: 60,
    isActive: true, isFeatured: false, isPopular: false, isMostBooked: false,
    parentId: '',
    trending: false, newArrival: false, totalBookings: 0,
    bannerImageUrl: '', warrantyInfo: '',
    inclusions: '',
    imageUrl: '', imagePublicId: '',
    whatsNotIncludedRaw: '[]',
    processStepsRaw: '[]',
    safetyMeasuresRaw: '[]',
    faqsRaw: '[]',
    relatedServicesRaw: '[]',
    recommendedServicesRaw: '[]',
    addonsRaw: '[]',
    seoTitle: '', seoDescription: '', seoKeywords: '',
    serviceImages: [] as string[],
    beforeImages: [] as string[],
    afterImages: [] as string[],
  });

  useEffect(() => {
    api.get('/admin/categories').then(r => setCategories(r.data || [])).catch(console.error);
    api.get('/admin/services?hasParent=false&limit=100').then(r => setParentServices(r.data.services || [])).catch(console.error);
    const fetchService = async () => {
      try {
        const { data } = await api.get(`/admin/services/${id}`);
        const svc = data.service || data;
        setServiceName(svc.name);
        setForm({
          name: svc.name || '',
          slug: svc.slug || '',
          categoryId: svc.categoryId?._id || svc.categoryId || '',
          description: svc.description || '',
          basePrice: svc.basePrice || '',
          estimatedDurationMins: svc.estimatedDurationMins || 60,
          inclusions: (svc.inclusions || []).join('\n'),
          imageUrl: svc.imageUrl || '',
          imagePublicId: svc.imagePublicId || '',
          discountPercentage: svc.discountPercentage || 0,
          isActive: svc.isActive ?? true,
          isFeatured: svc.isFeatured || false,
          isPopular: svc.isPopular || false,
          isMostBooked: svc.isMostBooked || false,
          parentId: svc.parentId || '',
          trending: !!svc.trending,
          newArrival: !!svc.newArrival,
          totalBookings: svc.totalBookings || 0,
          bannerImageUrl: svc.bannerImageUrl || '',
          warrantyInfo: svc.warrantyInfo || '',
          whatsNotIncludedRaw: JSON.stringify(svc.whatsNotIncluded || [], null, 2),
          processStepsRaw: JSON.stringify(svc.processSteps || [], null, 2),
          safetyMeasuresRaw: JSON.stringify(svc.safetyMeasures || [], null, 2),
          faqsRaw: JSON.stringify(svc.faqs || [], null, 2),
          relatedServicesRaw: JSON.stringify(svc.relatedServices || [], null, 2),
          recommendedServicesRaw: JSON.stringify(svc.recommendedServices || [], null, 2),
          addonsRaw: JSON.stringify(svc.addons || [], null, 2),
          seoTitle: svc.seoTitle || '',
          seoDescription: svc.seoDescription || '',
          seoKeywords: svc.seoKeywords || '',
          serviceImages: svc.serviceImages || [],
          beforeImages: svc.beforeImages || [],
          afterImages: svc.afterImages || [],
        });
      } catch (err) {
        setError('Failed to load service.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchService();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Service name is required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload: any = {
        ...form,
        slug: form.slug || autoSlug(form.name),
        basePrice: Number(form.basePrice),
        estimatedDurationMins: Number(form.estimatedDurationMins),
        discountPercentage: Number(form.discountPercentage),
        totalBookings: Number(form.totalBookings),
        inclusions: form.inclusions.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean),
        whatsNotIncluded: JSON.parse(form.whatsNotIncludedRaw || '[]'),
        processSteps: JSON.parse(form.processStepsRaw || '[]'),
        safetyMeasures: JSON.parse(form.safetyMeasuresRaw || '[]'),
        faqs: JSON.parse(form.faqsRaw || '[]'),
        relatedServices: JSON.parse(form.relatedServicesRaw || '[]'),
        recommendedServices: JSON.parse(form.recommendedServicesRaw || '[]'),
        addons: JSON.parse(form.addonsRaw || '[]'),
      };
      await api.put(`/admin/services/${id}`, payload);
      setSuccess('Service updated successfully!');
      setTimeout(() => router.push('/admin/dashboard?tab=services'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update service.');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <AdminPageLayout title="Edit Service" backHref="/admin/dashboard?tab=services" backLabel="Back to Services">
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#0F3D30]" /></div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title={`Edit: ${serviceName}`} subtitle="Update service details, image, pricing, and flags" backHref="/admin/dashboard?tab=services" backLabel="Back to Services">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-[#C3AB84]/20 shadow-sm p-6 space-y-5">
          <h2 className="font-serif text-lg font-bold text-[#0F3D30]">Service Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Service Name *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: autoSlug(e.target.value) }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Slug</label>
              <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className={`${inp} font-mono`} />
            </div>
            <div>
              <label className={lbl}>Category *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    setCategorySearchQuery('');
                  }}
                  className="flex items-center justify-between gap-2 border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-[#F8F4EE] focus:outline-none text-foreground/80 hover:border-primary font-medium w-full text-left h-[46px]"
                >
                  <span className="truncate">
                    {categories.find(c => c._id === form.categoryId)?.name || 'Select category...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-foreground/55 flex-shrink-0" />
                </button>
                {isCategoryDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsCategoryDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-gold/20 rounded-2xl shadow-xl z-20 overflow-hidden font-semibold text-foreground/80 text-xs flex flex-col max-h-72">
                      <div className="p-2 border-b border-gold/10 bg-cream/10 flex-shrink-0">
                        <input
                          type="text"
                          value={categorySearchQuery}
                          onChange={e => setCategorySearchQuery(e.target.value)}
                          placeholder="Type to search category..."
                          className="w-full px-3 py-2 border border-gold/20 rounded-xl text-xs focus:outline-none focus:border-primary bg-white font-medium"
                        />
                      </div>
                      <div className="overflow-y-auto divide-y divide-gold/5 flex-grow">
                        {categories.filter(c => c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())).map(c => (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => {
                              setForm(p => ({ ...p, categoryId: c._id }));
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-cream/40 transition-colors ${form.categoryId === c._id ? 'text-primary bg-cream/20 font-bold' : 'text-foreground/75'}`}
                          >
                            {c.name}
                          </button>
                        ))}
                        {categories.filter(c => c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-foreground/40 text-[10px]">No categories match</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <label className={lbl}>Parent Service (Optional)</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsParentDropdownOpen(!isParentDropdownOpen);
                    setParentSearchQuery('');
                  }}
                  className="flex items-center justify-between gap-2 border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-[#F8F4EE] focus:outline-none text-foreground/80 hover:border-primary font-medium w-full text-left h-[46px]"
                >
                  <span className="truncate">
                    {parentServices.find(s => s._id === form.parentId)?.name || 'None (Top-Level Service)'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-foreground/55 flex-shrink-0" />
                </button>
                {isParentDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsParentDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-gold/20 rounded-2xl shadow-xl z-20 overflow-hidden font-semibold text-foreground/80 text-xs flex flex-col max-h-72">
                      <div className="p-2 border-b border-gold/10 bg-cream/10 flex-shrink-0">
                        <input
                          type="text"
                          value={parentSearchQuery}
                          onChange={e => setParentSearchQuery(e.target.value)}
                          placeholder="Type to search service..."
                          className="w-full px-3 py-2 border border-gold/20 rounded-xl text-xs focus:outline-none focus:border-primary bg-white font-medium"
                        />
                      </div>
                      <div className="overflow-y-auto divide-y divide-gold/5 flex-grow">
                        <button
                          type="button"
                          onClick={() => {
                            setForm(p => ({ ...p, parentId: '' }));
                            setIsParentDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left hover:bg-cream/40 transition-colors ${!form.parentId ? 'text-primary bg-cream/20 font-bold' : 'text-foreground/75'}`}
                        >
                          None (Top-Level Service)
                        </button>
                        {parentServices.filter(s => s._id !== id && s.name.toLowerCase().includes(parentSearchQuery.toLowerCase())).map(p => (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => {
                              setForm(prev => ({
                                ...prev,
                                parentId: p._id,
                                categoryId: p.categoryId?._id || p.categoryId || prev.categoryId
                              }));
                              setIsParentDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-cream/40 transition-colors ${form.parentId === p._id ? 'text-primary bg-cream/20 font-bold' : 'text-foreground/75'}`}
                          >
                            {p.name}
                          </button>
                        ))}
                        {parentServices.filter(s => s._id !== id && s.name.toLowerCase().includes(parentSearchQuery.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-foreground/40 text-[10px]">No services match</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <label className={lbl}>Base Price (₹) *</label>
              <input required type="number" min={0} value={form.basePrice} onChange={e => setForm(p => ({ ...p, basePrice: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Duration (minutes)</label>
              <input type="number" min={1} value={form.estimatedDurationMins} onChange={e => setForm(p => ({ ...p, estimatedDurationMins: Number(e.target.value) }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Discount %</label>
              <input type="number" min={0} max={100} value={form.discountPercentage} onChange={e => setForm(p => ({ ...p, discountPercentage: Number(e.target.value) }))} className={inp} />
            </div>

          </div>
          <div>
            <label className={lbl}>Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={`${inp} resize-none`} />
          </div>
          <div>
            <label className={lbl}>Inclusions (comma or newline separated)</label>
            <textarea rows={4} value={form.inclusions} onChange={e => setForm(p => ({ ...p, inclusions: e.target.value }))} className={`${inp} resize-none font-mono`} placeholder={"AC filter cleaning, Gas pressure check, Coil inspection"} />
          </div>
          <ImageUpload imageUrl={form.imageUrl} imagePublicId={form.imagePublicId} onChange={(url, pid) => setForm(p => ({ ...p, imageUrl: url, imagePublicId: pid }))} label="Service Image" folder="nexora/services" />
          <ImageUpload imageUrl={form.bannerImageUrl} imagePublicId="" onChange={(url) => setForm(p => ({ ...p, bannerImageUrl: url }))} label="Main Banner Image" folder="nexora/banners" />
          <MultiImageUpload imageUrls={form.serviceImages} onChange={(urls) => setForm(p => ({ ...p, serviceImages: urls }))} label="Gallery Images" folder="nexora/gallery" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiImageUpload imageUrls={form.beforeImages} onChange={(urls) => setForm(p => ({ ...p, beforeImages: urls }))} label="Before Images" folder="nexora/before" />
            <MultiImageUpload imageUrls={form.afterImages} onChange={(urls) => setForm(p => ({ ...p, afterImages: urls }))} label="After Images" folder="nexora/after" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TOGGLES.map(({ key, label }) => (
              <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${form[key as ToggleKey] ? 'border-[#0F3D30] bg-[#0F3D30]/5 text-[#0F3D30]' : 'border-[#C3AB84]/20 text-foreground/60'}`}>
                <input type="checkbox" checked={!!form[key as ToggleKey]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="hidden" />
                {form[key as ToggleKey] ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                <span className="text-xs font-semibold">{label}</span>
              </label>
            ))}
            <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${form.trending ? 'border-[#0F3D30] bg-[#0F3D30]/5 text-[#0F3D30]' : 'border-[#C3AB84]/20 text-foreground/60'}`}>
              <input type="checkbox" checked={form.trending} onChange={e => setForm(p => ({ ...p, trending: e.target.checked }))} className="hidden" />
              {form.trending ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span className="text-xs font-semibold font-serif">Trending</span>
            </label>
            <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${form.newArrival ? 'border-[#0F3D30] bg-[#0F3D30]/5 text-[#0F3D30]' : 'border-[#C3AB84]/20 text-foreground/60'}`}>
              <input type="checkbox" checked={form.newArrival} onChange={e => setForm(p => ({ ...p, newArrival: e.target.checked }))} className="hidden" />
              {form.newArrival ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span className="text-xs font-semibold font-serif">New Arrival</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#C3AB84]/20">
            <div>
              <label className={lbl}>Hero Banner Image URL</label>
              <input value={form.bannerImageUrl} onChange={e => setForm(p => ({ ...p, bannerImageUrl: e.target.value }))} className={inp} placeholder="https://example.com/banner.jpg" />
            </div>
            <div>
              <label className={lbl}>Total Bookings Count</label>
              <input type="number" value={form.totalBookings} onChange={e => setForm(p => ({ ...p, totalBookings: Number(e.target.value) }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>SEO Title</label>
              <input value={form.seoTitle} onChange={e => setForm(p => ({ ...p, seoTitle: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>SEO Keywords</label>
              <input value={form.seoKeywords} onChange={e => setForm(p => ({ ...p, seoKeywords: e.target.value }))} className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>SEO Description</label>
            <textarea rows={2} value={form.seoDescription} onChange={e => setForm(p => ({ ...p, seoDescription: e.target.value }))} className={`${inp} resize-none`} />
          </div>

          <div>
            <label className={lbl}>Service Warranty Information</label>
            <input value={form.warrantyInfo} onChange={e => setForm(p => ({ ...p, warrantyInfo: e.target.value }))} className={inp} placeholder="e.g. 30 Days Free Warranty" />
          </div>

          <div className="pt-6 border-t border-[#C3AB84]/20 space-y-4">
            <h3 className="font-serif text-md font-bold text-[#0F3D30]">Service Content Sections (JSON Lists)</h3>
            
            <div>
              <label className={lbl}>Exclusions / What's NOT Included (JSON String Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ "Damage parts replacement cost", "Post-cleaning waste removal" ]</p>
              <textarea rows={3} value={form.whatsNotIncludedRaw} onChange={e => setForm(p => ({ ...p, whatsNotIncludedRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>

            <div>
              <label className={lbl}>Process Steps (JSON Object Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ &#123; "title": "Inspection", "desc": "We inspect..." &#125; ]</p>
              <textarea rows={4} value={form.processStepsRaw} onChange={e => setForm(p => ({ ...p, processStepsRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>

            <div>
              <label className={lbl}>Safety Measures (JSON String Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ "Masks and gloves worn", "Sanitized equipment used" ]</p>
              <textarea rows={3} value={form.safetyMeasuresRaw} onChange={e => setForm(p => ({ ...p, safetyMeasuresRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>

            <div>
              <label className={lbl}>FAQs (JSON Object Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ &#123; "question": "...", "answer": "..." &#125; ]</p>
              <textarea rows={4} value={form.faqsRaw} onChange={e => setForm(p => ({ ...p, faqsRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>

            <div>
              <label className={lbl}>Related Services (JSON Mongo ID Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ "ObjectId1", "ObjectId2" ]</p>
              <textarea rows={2} value={form.relatedServicesRaw} onChange={e => setForm(p => ({ ...p, relatedServicesRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>

            <div>
              <label className={lbl}>Recommended Services (JSON Mongo ID Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ "ObjectId1", "ObjectId2" ]</p>
              <textarea rows={2} value={form.recommendedServicesRaw} onChange={e => setForm(p => ({ ...p, recommendedServicesRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>

            <div>
              <label className={lbl}>Add-On Services (JSON Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ &#123; "name": "Shoulder Massage", "description": "15 min massage", "price": 199 &#125; ]</p>
              <textarea rows={4} value={form.addonsRaw} onChange={e => setForm(p => ({ ...p, addonsRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-2xl">✓ {success}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-[#0F3D30] text-white rounded-full font-semibold text-sm hover:bg-[#0F3D30]/90 disabled:opacity-60 transition-colors shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.push('/admin/dashboard?tab=services')} className="px-8 py-3 border border-[#C3AB84]/40 text-foreground/70 rounded-full font-semibold text-sm hover:bg-[#F8F4EE] transition-colors">Cancel</button>
        </div>
      </form>
    </AdminPageLayout>
  );
}
