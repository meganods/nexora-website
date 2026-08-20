"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, CheckCircle2, AlertTriangle, Loader2, Plus, Edit2, Trash2, PlusCircle, Check } from 'lucide-react';
import api from '@/lib/api';
import ImageUpload from '@/app/admin/_components/ImageUpload';

export default function PartnerSubServicesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]); // To resolve parent names in list and populate parent dropdown
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      const [catRes, svcRes] = await Promise.all([
        api.get('/public/categories'),
        api.get('/partner/created-services')
      ]);

      setCategories(catRes.data || []);
      const allSvcs = svcRes.data.services || [];
      setAllServices(allSvcs);
      // Filter for sub-services (those that have parentId)
      setServices(allSvcs.filter((s: any) => s.parentId));
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load sub-services data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    router.push('/partner/sub-services/new');
  };

  const handleOpenEdit = (svc: any) => {
    router.push(`/partner/sub-services/${svc._id}/edit`);
  };

  const handleDelete = async (id: string, svcName: string) => {
    if (!confirm(`Are you sure you want to delete sub-service "${svcName}"?`)) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const { data } = await api.delete(`/partner/created-services/${id}`);
      if (data.success) {
        setSuccessMsg(`Sub-service "${svcName}" deleted successfully.`);
        fetchData();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete sub-service.');
    }
  };

  const addInclusion = () => {
    if (inclusionInput.trim()) {
      setInclusions([...inclusions, inclusionInput.trim()]);
      setInclusionInput('');
    }
  };

  const removeInclusion = (index: number) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentId) {
      setErrorMsg('Please select a parent service.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        name,
        categoryId,
        description,
        basePrice,
        estimatedDurationMins,
        inclusions,
        imageUrl,
        imagePublicId,
        parentId
      };

      if (editingId) {
        const { data } = await api.put(`/partner/created-services/${editingId}`, payload);
        if (data.success) {
          setSuccessMsg('Sub-service updated and submitted for approval.');
          setShowModal(false);
          fetchData();
        }
      } else {
        const { data } = await api.post('/partner/created-services', payload);
        if (data.success) {
          setSuccessMsg('Sub-service created and submitted for approval.');
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save sub-service.');
    } finally {
      setSaving(false);
    }
  };

  // Filter potential parent services (only parent services created by this partner, having parentId = null)
  const potentialParents = allServices.filter(s => !s.parentId);

  // Auto-set Category based on selected Parent Service
  const handleParentSelect = (pId: string) => {
    setParentId(pId);
    const parentSvc = allServices.find(s => s._id === pId);
    if (parentSvc) {
      setCategoryId(parentSvc.categoryId?._id || parentSvc.categoryId || '');
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
      <div className="flex items-center justify-between border-b border-gold/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Manage My Sub Services</h1>
          <p className="text-xs text-foreground/50 font-medium">Create sub services nested under your parent offerings</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1D3B31] text-white hover:bg-[#1D3B31]/95 text-xs font-bold rounded-full transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Sub Service
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

      <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
        {services.length === 0 ? (
          <div className="py-16 text-center text-foreground/40 text-sm">No sub-services configured. Add your first sub-service.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-cream text-xs text-foreground/70">
                  <th className="p-4 font-medium">Sub-Service</th>
                  <th className="p-4 font-medium">Parent Service</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Base Price</th>
                  <th className="p-4 font-medium">Duration</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm divide-y divide-gray-100">
                {services.map(svc => {
                  const parentName = allServices.find(s => s._id === svc.parentId)?.name || 'Parent Service';
                  return (
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
                      <td className="p-4 text-xs font-bold text-[#1D3B31]">{parentName}</td>
                      <td className="p-4 text-foreground/70">{svc.categoryId?.name || '—'}</td>
                      <td className="p-4 font-bold text-[#1D3B31]">₹{svc.basePrice}</td>
                      <td className="p-4 text-foreground/60">{svc.estimatedDurationMins} mins</td>
                      <td className="p-4">
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            svc.approvalStatus === 'APPROVED' 
                              ? (svc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')
                              : (svc.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')
                          }`}>
                            {svc.approvalStatus === 'APPROVED' 
                              ? (svc.isActive ? 'Active' : 'Inactive')
                              : (svc.approvalStatus === 'REJECTED' ? 'Rejected' : 'Pending Approval')}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
