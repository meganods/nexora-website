"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import AdminPageLayout from '../../_components/AdminPageLayout';
import ImageUpload from '../../_components/ImageUpload';
import api from '@/lib/api';

const autoSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

export default function NewCategoryPage() {
  const router = useRouter();
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
  });

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
      };
      await api.post('/admin/categories', payload);
      setSuccess('Category created successfully!');
      setTimeout(() => router.push('/admin/dashboard?tab=categories'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageLayout
      title="Add New Category"
      subtitle="Create a new service category on the Nexora platform"
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
                placeholder="e.g. Home Cleaning"
              />
            </div>
            <div>
              <label className={lbl}>Slug (auto-generated)</label>
              <input
                value={form.slug}
                onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                className={`${inp} font-mono`}
                placeholder="home-cleaning"
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
              placeholder="Brief category description..."
            />
          </div>

          <ImageUpload
            imageUrl={form.imageUrl}
            imagePublicId={form.imagePublicId}
            onChange={(url, publicId) => setForm(p => ({ ...p, imageUrl: url, imagePublicId: publicId }))}
            label="Category Image"
            folder="nexora/categories"
          />

          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${form.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
          >
            {form.isActive ? '✓ Active' : '✗ Inactive'}
          </button>
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
            {saving ? 'Creating...' : 'Create Category'}
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
