"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, CheckCircle2, AlertTriangle, Loader2, Plus, Edit2, Trash2, PlusCircle, Check } from 'lucide-react';
import api from '@/lib/api';
import ImageUpload from '@/app/admin/_components/ImageUpload';
import { useAuth } from '@/lib/auth';

export default function PartnerServicesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [vendor, setVendor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [platformServices, setPlatformServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformSaving, setPlatformSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // CRUD Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [estimatedDurationMins, setEstimatedDurationMins] = useState(60);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [parentId, setParentId] = useState('');
  const [inclusionInput, setInclusionInput] = useState('');
  const [inclusions, setInclusions] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const [catRes, svcRes, platRes, profRes] = await Promise.all([
        api.get('/public/categories'),
        api.get('/partner/created-services'),
        api.get('/partner/services'),
        api.get('/partner/profile').catch(() => ({ data: {} }))
      ]);

      setCategories(catRes.data || []);
      setServices((svcRes.data.services || []).filter((s: any) => !s.parentId));
      setPlatformServices(platRes.data.services || []);
      if (profRes.data?.vendor) {
        setVendor(profRes.data.vendor);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load services data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    const hasPhoto = vendor?.profilePictureUrl || vendor?.profilePhoto || user?.profilePictureUrl || user?.profilePhoto;
    if (!hasPhoto) {
      alert('Please upload your profile photo in the Profile section before adding services.');
      router.push('/partner/profile');
      return;
    }
    router.push('/partner/services/new');
  };

  const handleOpenEdit = (svc: any) => {
    router.push(`/partner/services/${svc._id}/edit`);
  };

  const handleDelete = async (id: string, svcName: string) => {
    if (!confirm(`Are you sure you want to delete "${svcName}"?`)) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const { data } = await api.delete(`/partner/created-services/${id}`);
      if (data.success) {
        setSuccessMsg(`"${svcName}" deleted successfully.`);
        fetchData();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete service.');
    }
  };

  const handleTogglePlatformService = (id: string) => {
    setPlatformServices(prev => prev.map(s => {
      if (s._id === id) {
        return { ...s, isSelected: !s.isSelected };
      }
      return s;
    }));
  };

  const handlePlatformOverrideChange = (id: string, price: number) => {
    setPlatformServices(prev => prev.map(s => {
      if (s._id === id) {
        return { ...s, customPrice: price || null };
      }
      return s;
    }));
  };

  const handleSavePlatformServices = async () => {
    const hasPhoto = vendor?.profilePictureUrl || vendor?.profilePhoto || user?.profilePictureUrl || user?.profilePhoto;
    if (!hasPhoto) {
      alert('Please upload your profile photo in the Profile section before adding services.');
      router.push('/partner/profile');
      return;
    }
    try {
      setPlatformSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const customServicesPayload = platformServices
        .filter(s => s.isSelected)
        .map(s => ({
          serviceId: s._id,
          customPrice: s.customPrice,
          isActive: s.customActive !== false
        }));

      const { data } = await api.put('/partner/services', {
        customServices: customServicesPayload
      });

      if (data.success) {
        setSuccessMsg('Service offerings updated successfully!');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save service offerings.');
    } finally {
      setPlatformSaving(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gold/15 pb-4 gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Manage My Services</h1>
          <p className="text-xs text-foreground/50 font-medium">Select platform standard services or create custom ones</p>
        </div>
        {activeTab === 'custom' && (
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1D3B31] text-white hover:bg-[#1D3B31]/95 text-xs font-bold rounded-full transition-all self-start sm:self-center"
          >
            <Plus className="w-4 h-4" /> Add New Custom Service
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-gold/10 pb-px">
        <button
          onClick={() => { setActiveTab('standard'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'standard' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-foreground/50 hover:text-primary'
          }`}
        >
          Standard Services
        </button>
        <button
          onClick={() => { setActiveTab('custom'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'custom' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-foreground/50 hover:text-primary'
          }`}
        >
          Custom Partner Services
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-2 items-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs text-emerald-700 font-bold leading-normal">{successMsg}</p>
        </div>
      )}

      {/* STANDARD SERVICES TAB */}
      {activeTab === 'standard' && (
        <div className="space-y-6">
          <div className="p-4 bg-cream/30 border border-gold/15 rounded-2xl">
            <p className="text-xs text-foreground/60 leading-relaxed">
              Select which platform-standard services you provide. You can check the services you offer and optional customize your pricing override. Click <strong>Save Service Offerings</strong> to update.
            </p>
          </div>

          {platformServices.length === 0 ? (
            <div className="py-16 text-center text-foreground/40 text-sm bg-white rounded-3xl border border-gold/20">
              No standard services found matching your registered category.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platformServices.map((svc) => (
                  <div 
                    key={svc._id} 
                    className={`flex flex-col justify-between gap-3 p-5 rounded-2xl border transition-all ${
                      svc.isSelected 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-gold/15 bg-white hover:border-gold/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        checked={!!svc.isSelected}
                        id={`plat-${svc._id}`}
                        onChange={() => handleTogglePlatformService(svc._id)}
                        className="h-5 w-5 rounded border-gold/30 text-primary accent-primary mt-0.5 cursor-pointer flex-shrink-0"
                      />
                      <label htmlFor={`plat-${svc._id}`} className="cursor-pointer select-none flex-1">
                        <h4 className="font-bold text-sm text-primary">{svc.name}</h4>
                        <p className="text-xs text-foreground/50 mt-1">{svc.description || 'Platform standard service option'}</p>
                        <p className="text-[10px] text-foreground/40 font-mono mt-1 uppercase tracking-wider">{svc.categoryId?.name}</p>
                      </label>
                    </div>

                    <div className="flex flex-col gap-2 pt-3 border-t border-gold/10 mt-1">
                      <div className="flex justify-between items-center text-xs text-foreground/60">
                        <span>Standard Base Price:</span>
                        <span className="font-semibold text-primary">₹{svc.basePrice}</span>
                      </div>

                      {svc.isSelected && (
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gold uppercase tracking-wider">Override Price (₹):</span>
                          <input 
                            type="number" 
                            placeholder="Override Price"
                            value={svc.customPrice || ''}
                            onChange={e => handlePlatformOverrideChange(svc._id, parseInt(e.target.value) || 0)}
                            className="w-32 px-3 py-1.5 text-xs rounded-xl border border-gold/30 focus:outline-none bg-white font-semibold"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSavePlatformServices}
                  disabled={platformSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-[#1D3B31] text-white hover:bg-[#1D3B31]/95 text-xs font-bold rounded-full transition-all shadow-md disabled:opacity-50"
                >
                  {platformSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Service Offerings
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* CUSTOM SERVICES TAB */}
      {activeTab === 'custom' && (
        <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
          {services.length === 0 ? (
            <div className="py-16 text-center text-foreground/40 text-sm">No custom services configured. Create your first custom service.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-cream text-xs text-foreground/70">
                    <th className="p-4 font-medium">Service</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Category</th>
                    <th className="p-4 font-medium">Base Price</th>
                    <th className="p-4 font-medium">Duration</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm divide-y divide-gray-100">
                  {services.map(svc => (
                    <tr key={svc._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {svc.imageUrl && <img src={svc.imageUrl} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />}
                          <div>
                            <p className="font-semibold text-primary">{svc.name}</p>
                            <p className="text-foreground/45 font-mono text-[10px]">{svc.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-foreground/60">
                        {svc.parentId ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Sub-Service</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Parent Service</span>
                        )}
                      </td>
                      <td className="p-4 text-foreground/70">{svc.categoryId?.name || '—'}</td>
                      <td className="p-4 font-bold text-[#1D3B31]">₹{svc.basePrice}</td>
                      <td className="p-4 text-foreground/60">{svc.estimatedDurationMins} mins</td>
                      <td className="p-4">
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            svc.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            svc.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {svc.approvalStatus === 'APPROVED' ? 'Approved' :
                             svc.approvalStatus === 'REJECTED' ? 'Rejected' : 'Pending Approval'}
                          </span>
                          {svc.approvalStatus === 'REJECTED' && svc.rejectionReason && (
                            <p className="text-[10px] text-red-600 mt-1 font-medium bg-red-50 p-1.5 rounded-lg">Reason: {svc.rejectionReason}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEdit(svc)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(svc._id, svc.name)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
