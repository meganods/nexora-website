"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle, ChevronDown, Search } from 'lucide-react';
import api from '@/lib/api';

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

export default function PartnerNewDealPage() {
  const router = useRouter();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [city, setCity] = useState('Delhi');
  const [tagline, setTagline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Missing fields for backend Deal Schema validation
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // Dropdown states
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const catRes = await api.get('/public/categories');
      setCategories(catRes.data || []);

      const { data } = await api.get('/partner/created-services');
      const approvedList = (data.services || []).filter((s: any) => s.approvalStatus === 'APPROVED');
      setMyServices(approvedList);
      if (approvedList.length > 0) {
        setSelectedServiceId(approvedList[0]._id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Title is required.');
      setSubmitting(false);
      return;
    }

    if (!selectedServiceId) {
      setErrorMsg('Please select a service.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        title,
        description,
        termsAndConditions,
        serviceId: selectedServiceId,
        discountType: 'PERCENTAGE',
        discountValue: Number(discountPercent),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null
      };

      const { data } = await api.post('/partner/deals', payload);
      if (data.success) {
        router.push('/partner/deals');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit deal.');
    } finally {
      setSubmitting(false);
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
        <button onClick={() => router.push('/partner/deals')} className="p-1.5 hover:bg-cream rounded-full transition-colors text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Create New Deal</h1>
          <p className="text-xs text-foreground/50">Propose a premium homepage deal for approval</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {myServices.length === 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-bold leading-normal">
            You do not have any APPROVED services yet. Please submit services for approval first, or wait for the Admin to approve them.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-[#C3AB84]/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <label className={lbl}>Deal Title *</label>
          <input 
            type="text" required value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Special Independence Day Painting Deal" className={inp}
          />
        </div>

        <div>
          <label className={lbl}>Select Service *</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsServiceDropdownOpen(!isServiceDropdownOpen);
                setServiceSearchQuery('');
              }}
              className="flex items-center justify-between gap-2 border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-[#F8F4EE] focus:outline-none text-foreground/80 hover:border-primary font-medium w-full text-left h-[46px]"
            >
              <span className="truncate">
                {myServices.find(s => s._id === selectedServiceId)?.name || 'Select an approved service...'}
              </span>
              <ChevronDown className="w-4 h-4 text-foreground/55 flex-shrink-0" />
            </button>
            {isServiceDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsServiceDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-gold/20 rounded-2xl shadow-xl z-20 overflow-hidden font-semibold text-foreground/80 text-xs flex flex-col max-h-72">
                  <div className="p-2 border-b border-gold/10 bg-cream/10 flex-shrink-0">
                    <input
                      type="text"
                      value={serviceSearchQuery}
                      onChange={e => setServiceSearchQuery(e.target.value)}
                      placeholder="Type to search service..."
                      className="w-full px-3 py-2 border border-gold/20 rounded-xl text-xs focus:outline-none focus:border-primary bg-white font-medium"
                    />
                  </div>
                  <div className="overflow-y-auto divide-y divide-gold/5 flex-grow">
                    {categories.map(cat => {
                      const catSvcs = myServices.filter(s => {
                        const catId = s.categoryId?._id || s.categoryId;
                        return catId === cat._id && s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase());
                      });
                      if (catSvcs.length === 0) return null;
                      return (
                        <div key={cat._id} className="bg-cream/5">
                          <div className="px-4 py-1.5 bg-cream/20 text-[10px] font-bold text-primary tracking-wider uppercase">{cat.name}</div>
                          <div className="divide-y divide-gold/5">
                            {catSvcs.map(svc => (
                              <button
                                key={svc._id}
                                type="button"
                                onClick={() => {
                                  setSelectedServiceId(svc._id);
                                  setIsServiceDropdownOpen(false);
                                }}
                                className={`w-full px-6 py-2.5 text-left hover:bg-cream/40 transition-colors ${selectedServiceId === svc._id ? 'text-primary bg-cream/20 font-bold' : 'text-foreground/75'}`}
                              >
                                {svc.name} <span className="text-[10px] text-foreground/40 font-normal">(Base: ₹{svc.basePrice})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {myServices.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 && (
                      <div className="p-4 text-center text-foreground/40 text-[10px]">No approved services match</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={lbl}>Discount Percent (%) *</label>
            <input 
              type="number" required value={discountPercent} onChange={e => setDiscountPercent(parseInt(e.target.value) || 0)}
              placeholder="e.g. 15" className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Target City *</label>
            <input 
              type="text" required value={city} onChange={e => setCity(e.target.value)}
              placeholder="e.g. Delhi" className={inp}
            />
          </div>
        </div>

        <div>
          <label className={lbl}>Description / Tagline</label>
          <textarea 
            rows={3} value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe the details of this deal promotion..." className={`${inp} resize-none`}
          />
        </div>

        <div>
          <label className={lbl}>Terms &amp; Conditions (Optional)</label>
          <textarea 
            rows={3} value={termsAndConditions} onChange={e => setTermsAndConditions(e.target.value)}
            placeholder="e.g. Valid only for residential bookings. Cannot be combined with other offers." className={`${inp} resize-none`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={lbl}>Start Date</label>
            <input 
              type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>End Date</label>
            <input 
              type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className={inp}
            />
          </div>
        </div>

        <button 
          type="submit" disabled={submitting}
          className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition-all text-sm flex items-center justify-center gap-1.5 mt-4"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
