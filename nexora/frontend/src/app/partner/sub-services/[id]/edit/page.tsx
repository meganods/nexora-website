"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import api from '@/lib/api';
import ImageUpload from '@/app/admin/_components/ImageUpload';

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

export default function PartnerEditSubServicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [parentServices, setParentServices] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [estimatedDurationMins, setEstimatedDurationMins] = useState(60);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [inclusionInput, setInclusionInput] = useState('');
  const [inclusions, setInclusions] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchSubServiceAndParents = async () => {
      try {
        const [parentRes, svcRes] = await Promise.all([
          api.get('/partner/created-services'),
          api.get(`/partner/created-services`)
        ]);
        const list = parentRes.data.services || [];
        setParentServices(list.filter((s: any) => !s.parentId));

        const subSvc = list.find((s: any) => s._id === id);
        if (subSvc) {
          setName(subSvc.name || '');
          setParentId(subSvc.parentId || '');
          setDescription(subSvc.description || '');
          setBasePrice(subSvc.basePrice || 0);
          setEstimatedDurationMins(subSvc.estimatedDurationMins || 60);
          setImageUrl(subSvc.imageUrl || '');
          setImagePublicId(subSvc.imagePublicId || '');
          setInclusions(subSvc.inclusions || []);
        } else {
          setErrorMsg('Sub-service not found.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load sub-service details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSubServiceAndParents();
  }, [id]);

  const addInclusion = () => {
    if (inclusionInput.trim()) {
      setInclusions([...inclusions, inclusionInput.trim()]);
      setInclusionInput('');
    }
  };

  const removeInclusion = (index: number) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentId) {
      setErrorMsg('Please select a parent service.');
      return;
    }
    setSaving(true);
    setErrorMsg('');

    try {
      const parentSvc = parentServices.find(s => s._id === parentId);
      const catId = parentSvc?.categoryId?._id || parentSvc?.categoryId;
      if (!catId) {
        setErrorMsg('Parent service category is missing.');
        setSaving(false);
        return;
      }

      const payload = {
        name,
        categoryId: catId,
        description,
        basePrice,
        estimatedDurationMins,
        inclusions,
        imageUrl,
        imagePublicId,
        parentId
      };

      const { data } = await api.put(`/partner/created-services/${id}`, payload);
      if (data.success) {
        router.push('/partner/sub-services');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update sub-service.');
    } finally {
      setSaving(false);
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
      <div className="flex items-center gap-3 border-b border-gold/15 pb-4">
        <button onClick={() => router.push('/partner/sub-services')} className="p-1.5 hover:bg-cream rounded-full transition-colors text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Edit Sub-Service: {name}</h1>
          <p className="text-xs text-foreground/50">Edit sub-service details and resubmit for approval</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-xs text-red-700 font-bold">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-[#C3AB84]/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={lbl}>Sub-Service Name *</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)}
              className={inp} />
          </div>

          <div>
            <label className={lbl}>Parent Service *</label>
            <select required value={parentId} onChange={e => setParentId(e.target.value)}
              className={inp}>
              <option value="">Select Parent Service</option>
              {parentServices.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Base Price (₹) *</label>
            <input required type="number" min={0} value={basePrice} onChange={e => setBasePrice(Number(e.target.value))}
              className={inp} />
          </div>

          <div>
            <label className={lbl}>Duration (minutes) *</label>
            <input required type="number" min={1} value={estimatedDurationMins} onChange={e => setEstimatedDurationMins(Number(e.target.value))}
              className={inp} />
          </div>
        </div>

        <div>
          <label className={lbl}>Description</label>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
            className={inp} />
        </div>

        <div>
          <label className={lbl}>Service Image</label>
          <div className="bg-[#F8F4EE] border border-[#C3AB84]/30 rounded-2xl p-4">
            <ImageUpload label="Sub-Service Image" imageUrl={imageUrl} imagePublicId={imagePublicId} onChange={(url, pubId) => {
              setImageUrl(url);
              setImagePublicId(pubId);
            }} />
          </div>
        </div>

        <div>
          <label className={lbl}>Inclusions</label>
          <div className="flex gap-3 mb-3">
            <input type="text" value={inclusionInput} onChange={e => setInclusionInput(e.target.value)}
              className={inp} placeholder="e.g. Chemical coil spray" />
            <button type="button" onClick={addInclusion} className="px-6 bg-cream text-primary rounded-2xl text-xs font-bold border border-gold/15 hover:bg-beige transition-colors flex-shrink-0">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {inclusions.map((inc, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream border border-gold/10 text-primary text-xs font-semibold rounded-full">
                {inc}
                <button type="button" onClick={() => removeInclusion(idx)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button type="button" onClick={() => router.push('/partner/sub-services')} className="px-8 py-3 border border-[#C3AB84]/40 text-foreground/70 rounded-full font-semibold text-sm hover:bg-[#F8F4EE] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-[#0F3D30] text-white rounded-full font-semibold text-sm hover:bg-[#0F3D30]/90 disabled:opacity-60 transition-colors shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
