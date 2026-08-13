"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import AdminPageLayout from '../../../_components/AdminPageLayout';
import ImageUpload from '../../../_components/ImageUpload';
import api from '@/lib/api';

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [previewFinal, setPreviewFinal] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    imagePublicId: '',
    dealType: 'SERVICE',
    serviceId: '',
    packageId: '',
    categoryId: '',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    startDate: '',
    endDate: '',
    displayOrder: '0',
    isFeatured: false,
    isActive: true,
    termsAndConditions: '',
  });

  useEffect(() => {
    const loadDependenciesAndDeal = async () => {
      try {
        const [catRes, svcRes, pkgRes, dealRes] = await Promise.all([
          api.get('/admin/categories'),
          api.get('/admin/services?limit=1000'),
          api.get('/admin/packages?limit=1000'),
          api.get(`/admin/deals/${id}`)
        ]);

        setCategories(catRes.data.categories || catRes.data || []);
        setServices(svcRes.data.services || svcRes.data || []);
        setPackages(pkgRes.data.packages || pkgRes.data || []);

        const d = dealRes.data.deal || dealRes.data;
        setForm({
          title: d.title || '',
          description: d.description || '',
          imageUrl: d.imageUrl || '',
          imagePublicId: d.imagePublicId || '',
          dealType: d.dealType || 'SERVICE',
          serviceId: d.serviceId?._id || d.serviceId || '',
          packageId: d.packageId?._id || d.packageId || '',
          categoryId: d.categoryId?._id || d.categoryId || '',
          discountType: d.discountType || 'PERCENTAGE',
          discountValue: String(d.discountValue ?? 10),
          startDate: d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '',
          endDate: d.endDate ? new Date(d.endDate).toISOString().split('T')[0] : '',
          displayOrder: String(d.displayOrder || 0),
          isFeatured: d.isFeatured === true,
          isActive: d.isActive !== false,
          termsAndConditions: d.termsAndConditions || '',
        });
        setSelectedPrice(d.originalPrice || null);
      } catch (err: any) {
        setError('Failed to load deal data.');
      } finally {
        setLoading(false);
      }
    };
    if (id) loadDependenciesAndDeal();
  }, [id]);

  // Compute final price preview
  useEffect(() => {
    if (selectedPrice !== null) {
      const disc = Number(form.discountValue) || 0;
      let final: number;
      if (form.discountType === 'PERCENTAGE') {
        final = Math.round(selectedPrice * (1 - Math.min(100, disc) / 100));
      } else {
        final = Math.max(0, selectedPrice - disc);
      }
      setPreviewFinal(Math.max(0, final));
    } else {
      setPreviewFinal(null);
    }
  }, [selectedPrice, form.discountType, form.discountValue]);

  const handleServiceChange = (id: string) => {
    const svc = services.find(s => s._id === id);
    setForm(p => ({ ...p, serviceId: id, packageId: '', categoryId: svc?.categoryId?._id || svc?.categoryId || p.categoryId }));
    setSelectedPrice(svc ? svc.basePrice : null);
  };

  const handlePackageChange = (id: string) => {
    const pkg = packages.find(p => p._id === id);
    setForm(p => ({ ...p, packageId: id, serviceId: '', categoryId: '' }));
    setSelectedPrice(pkg ? pkg.basePrice : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (form.dealType === 'SERVICE' && !form.serviceId) { setError('Please select a service.'); return; }
    if (form.dealType === 'PACKAGE' && !form.packageId) { setError('Please select a package.'); return; }
    if (form.discountValue === '') { setError('Discount value is required.'); return; }
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      setError('End date cannot be before start date.'); return;
    }
    setSaving(true); setError(''); setSuccess('');

    try {
      const payload = {
        ...form,
        originalPrice: selectedPrice || 0,
        discountValue: Number(form.discountValue),
        displayOrder: Number(form.displayOrder) || 0,
        startDate: form.startDate ? new Date(form.startDate) : new Date(),
        endDate: form.endDate ? new Date(form.endDate) : null,
      };

      await api.put(`/admin/deals/${id}`, payload);
      setSuccess('Deal updated successfully!');
      setTimeout(() => router.push('/admin/dashboard?tab=deals'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update deal.');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <AdminPageLayout title="Edit Deal" backHref="/admin/dashboard?tab=deals" backLabel="Back to Deals">
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#0F3D30]" /></div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title={`Edit Deal: ${form.title}`} subtitle="Modify deal details and pricing rules" backHref="/admin/dashboard?tab=deals" backLabel="Back to Deals">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-[#C3AB84]/20 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#0F3D30] border-b border-gold/10 pb-2">Deal Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Deal Title *</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inp} placeholder="Monsoon Special AC Service" />
            </div>
            <div>
              <label className={lbl}>Description</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inp} placeholder="Complete deep clean & gas charging" />
            </div>

            <div>
              <label className={lbl}>Deal Type *</label>
              <select value={form.dealType} onChange={e => setForm(p => ({ ...p, dealType: e.target.value, serviceId: '', packageId: '', categoryId: '' }))} className={inp}>
                <option value="SERVICE">Service</option>
                <option value="PACKAGE">Package</option>
              </select>
            </div>
            {form.dealType === 'SERVICE' ? (
              <div>
                <label className={lbl}>Select Service *</label>
                <select required value={form.serviceId} onChange={e => handleServiceChange(e.target.value)} className={inp}>
                  <option value="">-- Choose Service --</option>
                  {services.map(s => <option key={s._id} value={s._id}>{s.name} (₹{s.basePrice})</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className={lbl}>Select Package *</label>
                <select required value={form.packageId} onChange={e => handlePackageChange(e.target.value)} className={inp}>
                  <option value="">-- Choose Package --</option>
                  {packages.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.basePrice})</option>)}
                </select>
              </div>
            )}

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

            {selectedPrice !== null && (
              <div className="sm:col-span-2 p-4 bg-cream/40 rounded-2xl border border-gold/15 flex justify-around text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-foreground/45 block mb-1">Original Price</span>
                  <span className="font-serif font-bold text-base text-foreground/80 line-through">₹{selectedPrice}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-foreground/45 block mb-1">Calculated Final Price</span>
                  <span className="font-serif font-bold text-xl text-primary">₹{previewFinal}</span>
                </div>
              </div>
            )}

            <div>
              <label className={lbl}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inp} placeholder="No expiry if blank" />
            </div>

            <div>
              <label className={lbl}>Display Order</label>
              <input type="number" value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: e.target.value }))} className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>Terms &amp; Conditions</label>
            <textarea rows={3} value={form.termsAndConditions} onChange={e => setForm(p => ({ ...p, termsAndConditions: e.target.value }))} className={`${inp} resize-none`} placeholder="Deal specific terms..." />
          </div>

          <div className="pt-2">
            <ImageUpload
              imageUrl={form.imageUrl}
              imagePublicId={form.imagePublicId}
              onChange={(url, pid) => setForm(p => ({ ...p, imageUrl: url, imagePublicId: pid }))}
              label="Deal Image"
              folder="nexora/deals"
            />
          </div>

          <div className="flex gap-8 pt-2">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div className={`w-10 h-6 rounded-full transition-colors relative ${form.isFeatured ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFeatured ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-semibold text-foreground/70">Featured Deal</span>
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
          <button type="button" onClick={() => router.push('/admin/dashboard?tab=deals')} className="px-8 py-3 border border-[#C3AB84]/40 text-foreground/70 rounded-full font-semibold text-sm hover:bg-[#F8F4EE] transition-colors">Cancel</button>
        </div>
      </form>
    </AdminPageLayout>
  );
}
