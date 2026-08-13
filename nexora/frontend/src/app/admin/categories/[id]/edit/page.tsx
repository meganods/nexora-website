"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import AdminPageLayout from '../../../_components/AdminPageLayout';
import ImageUpload from '../../../_components/ImageUpload';
import api from '@/lib/api';

const autoSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    imageUrl: '',
    imagePublicId: '',
    displayOrder: 0,
    platformFeePercentage: 10,
    isActive: true,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    popular: false,
    featured: false,
    bannerImageUrl: '',
    totalBookings: 0,
    whyChooseRaw: '[]',
    benefitsRaw: '[]',
    howItWorksRaw: '[]',
    beforeAfterGalleryRaw: '[]',
    faqsRaw: '[]',
  });

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const { data } = await api.get(`/admin/categories/${id}`);
        const cat = data.category || data;
        setForm({
          name: cat.name || '',
          slug: cat.slug || '',
          description: cat.description || '',
          icon: cat.icon || '',
          imageUrl: cat.imageUrl || '',
          imagePublicId: cat.imagePublicId || '',
          displayOrder: cat.displayOrder || 0,
          platformFeePercentage: cat.platformFeePercentage ?? 10,
          isActive: cat.isActive !== false,
          seoTitle: cat.seoTitle || '',
          seoDescription: cat.seoDescription || '',
          seoKeywords: cat.seoKeywords || '',
          popular: !!cat.popular,
          featured: !!cat.featured,
          bannerImageUrl: cat.bannerImageUrl || '',
          totalBookings: cat.totalBookings || 0,
          whyChooseRaw: JSON.stringify(cat.whyChoose || [], null, 2),
          benefitsRaw: JSON.stringify(cat.benefits || [], null, 2),
          howItWorksRaw: JSON.stringify(cat.howItWorks || [], null, 2),
          beforeAfterGalleryRaw: JSON.stringify(cat.beforeAfterGallery || [], null, 2),
          faqsRaw: JSON.stringify(cat.faqs || [], null, 2),
        });
      } catch (err) {
        setError('Failed to load category. It may not exist.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCategory();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Category name is required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        ...form,
        slug: form.slug || autoSlug(form.name),
        platformFeePercentage: Number(form.platformFeePercentage),
        displayOrder: Number(form.displayOrder),
        totalBookings: Number(form.totalBookings),
        whyChoose: JSON.parse(form.whyChooseRaw || '[]'),
        benefits: JSON.parse(form.benefitsRaw || '[]'),
        howItWorks: JSON.parse(form.howItWorksRaw || '[]'),
        beforeAfterGallery: JSON.parse(form.beforeAfterGalleryRaw || '[]'),
        faqs: JSON.parse(form.faqsRaw || '[]'),
      };
      await api.put(`/admin/categories/${id}`, payload);
      setSuccess('Category updated successfully!');
      setTimeout(() => router.push('/admin/dashboard?tab=categories'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update category.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPageLayout title="Edit Category" backHref="/admin/dashboard?tab=categories" backLabel="Back to Categories">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F3D30]" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={`Edit Category: ${form.name}`}
      subtitle="Update category details, image, and settings"
      backHref="/admin/dashboard?tab=categories"
      backLabel="Back to Categories"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-[#C3AB84]/20 shadow-sm p-6 space-y-5">
          <h2 className="font-serif text-lg font-bold text-[#0F3D30]">Category Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Category Name *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: autoSlug(e.target.value) }))}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Slug</label>
              <input
                value={form.slug}
                onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                className={`${inp} font-mono`}
              />
            </div>
            <div>
              <label className={lbl}>Platform Fee %</label>
              <input
                type="number" min={0} max={100}
                value={form.platformFeePercentage}
                onChange={e => setForm(p => ({ ...p, platformFeePercentage: Number(e.target.value) }))}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Icon Name (Lucide)</label>
              <input
                value={form.icon}
                onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                className={inp}
                placeholder="Brush, Wrench, Wind..."
              />
            </div>
            <div>
              <label className={lbl}>Display Order</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={e => setForm(p => ({ ...p, displayOrder: Number(e.target.value) }))}
                className={inp}
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className={`${inp} resize-none`}
            />
          </div>

          <ImageUpload
            imageUrl={form.imageUrl}
            imagePublicId={form.imagePublicId}
            onChange={(url, publicId) => setForm(p => ({ ...p, imageUrl: url, imagePublicId: publicId }))}
            label="Category Image"
            folder="nexora/categories"
          />

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
              <input value={form.seoTitle} onChange={e => setForm(p => ({ ...p, seoTitle: e.target.value }))} className={inp} placeholder="Meta Title" />
            </div>
            <div>
              <label className={lbl}>SEO Keywords</label>
              <input value={form.seoKeywords} onChange={e => setForm(p => ({ ...p, seoKeywords: e.target.value }))} className={inp} placeholder="home cleaning, sofa clean, best service" />
            </div>
          </div>

          <div>
            <label className={lbl}>SEO Description</label>
            <textarea rows={2} value={form.seoDescription} onChange={e => setForm(p => ({ ...p, seoDescription: e.target.value }))} className={`${inp} resize-none`} placeholder="Meta Description text" />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, popular: !p.popular }))}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${form.popular ? 'bg-gold/20 text-[#0F3D30] border-gold/40' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
            >
              {form.popular ? '✓ Popular Category' : '✗ Standard Category'}
            </button>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, featured: !p.featured }))}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${form.featured ? 'bg-gold/20 text-[#0F3D30] border-gold/40' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
            >
              {form.featured ? '✓ Featured Category' : '✗ Standard Category'}
            </button>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${form.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
            >
              {form.isActive ? '✓ Active' : '✗ Inactive'}
            </button>
          </div>

          <div className="pt-6 border-t border-[#C3AB84]/20 space-y-4">
            <h3 className="font-serif text-md font-bold text-[#0F3D30]">Category Content Sections (JSON Lists)</h3>
            
            <div>
              <label className={lbl}>Why Choose Us (JSON Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ &#123; "title": "...", "desc": "..." &#125; ]</p>
              <textarea rows={4} value={form.whyChooseRaw} onChange={e => setForm(p => ({ ...p, whyChooseRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>

            <div>
              <label className={lbl}>Benefits (JSON Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ &#123; "title": "...", "desc": "..." &#125; ]</p>
              <textarea rows={4} value={form.benefitsRaw} onChange={e => setForm(p => ({ ...p, benefitsRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>

            <div>
              <label className={lbl}>How It Works Steps (JSON Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ &#123; "title": "...", "desc": "..." &#125; ]</p>
              <textarea rows={4} value={form.howItWorksRaw} onChange={e => setForm(p => ({ ...p, howItWorksRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>

            <div>
              <label className={lbl}>Before / After Gallery (JSON Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ &#123; "beforeUrl": "...", "afterUrl": "..." &#125; ]</p>
              <textarea rows={4} value={form.beforeAfterGalleryRaw} onChange={e => setForm(p => ({ ...p, beforeAfterGalleryRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>

            <div>
              <label className={lbl}>FAQs (JSON Array)</label>
              <p className="text-[10px] text-foreground/45 mb-1">Format: [ &#123; "question": "...", "answer": "..." &#125; ]</p>
              <textarea rows={4} value={form.faqsRaw} onChange={e => setForm(p => ({ ...p, faqsRaw: e.target.value }))} className="w-full font-mono text-xs border border-[#C3AB84]/30 rounded-2xl px-4 py-3 bg-[#F8F4EE] focus:outline-none" />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-2xl">✓ {success}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-[#0F3D30] text-white rounded-full font-semibold text-sm hover:bg-[#0F3D30]/90 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard?tab=categories')}
            className="px-8 py-3 border border-[#C3AB84]/40 text-foreground/70 rounded-full font-semibold text-sm hover:bg-[#F8F4EE] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminPageLayout>
  );
}
