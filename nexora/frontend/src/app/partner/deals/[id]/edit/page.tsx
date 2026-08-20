"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import api from '@/lib/api';

const inp = 'w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors';
const lbl = 'block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider';

export default function PartnerEditDealPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [city, setCity] = useState('');
  const [liveCities, setLiveCities] = useState<any[]>([]);
  const [tagline, setTagline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown states
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchServicesAndLocations();
  }, [id]);

  const fetchServicesAndLocations = async () => {
    try {
      setLoading(true);
      const catRes = await api.get('/public/categories');
      setCategories(catRes.data || []);

      const servicesRes = await api.get('/partner/created-services');
      const approvedList = (servicesRes.data.services || []).filter((s: any) => s.approvalStatus === 'APPROVED');
      setMyServices(approvedList);

      const locationsRes = await api.get('/locations/public/cities?limit=100');
      let loadedCities: any[] = [];
      if (locationsRes.data?.success && Array.isArray(locationsRes.data.data)) {
        setLiveCities(locationsRes.data.data);
        loadedCities = locationsRes.data.data;
      }

      const dealsRes = await api.get('/partner/deals');
      const list = dealsRes.data?.deals || dealsRes.data || [];
      const deal = list.find((d: any) => d._id === id);
      if (deal) {
        setDiscountPercent(deal.discountValue || 0);
        setCity(deal.city || (loadedCities.length > 0 ? loadedCities[0].name : ''));
        setTagline(deal.title || '');
        if (deal.startDate) setStartDate(new Date(deal.startDate).toISOString().split('T')[0]);
        if (deal.endDate) setEndDate(new Date(deal.endDate).toISOString().split('T')[0]);
        
        // Handle serviceId and serviceIds
        if (deal.serviceIds && deal.serviceIds.length > 0) {
          setSelectedServiceIds(deal.serviceIds.map((s: any) => s._id || s));
        } else if (deal.serviceId) {
          setSelectedServiceIds([deal.serviceId._id || deal.serviceId]);
        }
      } else {
        setErrorMsg('Deal not found or access denied.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load deal details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    if (!tagline.trim()) {
      setErrorMsg('Title is required.');
      setSaving(false);
      return;
    }

    if (selectedServiceIds.length === 0) {
      setErrorMsg('Please select at least one service.');
      setSaving(false);
      return;
    }

    try {
      await api.put(`/partner/deals/${id}`, {
        title: tagline,
        serviceIds: selectedServiceIds,
        discountValue: Number(discountPercent),
        city,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null
      });
      router.push('/partner/deals');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update deal.');
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
        <button onClick={() => router.push('/partner/deals')} className="p-1.5 hover:bg-cream rounded-full transition-colors text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Edit Deal</h1>
          <p className="text-xs text-foreground/50">Modify details of your home page promotional deal</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gold/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <label className={lbl}>Deal Title *</label>
          <input 
            type="text" required value={tagline} onChange={e => setTagline(e.target.value)}
            className={inp}
          />
        </div>

        <div>
          <label className={lbl}>Select Services *</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsServiceDropdownOpen(!isServiceDropdownOpen);
                setServiceSearchQuery('');
              }}
              className="flex items-center justify-between gap-2 border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-[#F8F4EE] focus:outline-none text-foreground/80 hover:border-primary font-medium w-full text-left min-h-[46px]"
            >
              <span className="truncate">
                {selectedServiceIds.length === 0 
                  ? 'Select approved services...' 
                  : `${selectedServiceIds.length} service(s) selected: ${
                      myServices.filter(s => selectedServiceIds.includes(s._id)).map(s => s.name).join(', ')
                    }`
                }
              </span>
              <ChevronDown className="w-4 h-4 text-foreground/55 flex-shrink-0" />
            </button>
            {isServiceDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsServiceDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-gold/20 rounded-2xl shadow-xl z-20 overflow-hidden font-semibold text-foreground/80 text-xs flex flex-col max-h-72">
                  <div className="p-2 border-b border-gold/10 bg-cream/10 flex-shrink-0 flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={serviceSearchQuery}
                      onChange={e => setServiceSearchQuery(e.target.value)}
                      placeholder="Type to search service..."
                      className="w-full px-3 py-2 border border-gold/20 rounded-xl text-xs focus:outline-none focus:border-primary bg-white font-medium"
                    />
                    <button type="button" onClick={() => setIsServiceDropdownOpen(false)} className="px-3 py-2 bg-primary text-white rounded-xl text-[10px] hover:bg-primary/95 transition-all">Done</button>
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
                            {catSvcs.map(svc => {
                              const isChecked = selectedServiceIds.includes(svc._id);
                              return (
                                <button
                                  key={svc._id}
                                  type="button"
                                  onClick={() => {
                                    const next = isChecked
                                      ? selectedServiceIds.filter(id => id !== svc._id)
                                      : [...selectedServiceIds, svc._id];
                                    setSelectedServiceIds(next);
                                  }}
                                  className={`w-full px-6 py-2.5 text-left hover:bg-cream/40 transition-colors flex items-center justify-between ${isChecked ? 'text-primary bg-cream/20 font-bold' : 'text-foreground/75'}`}
                                >
                                  <span>{svc.name} <span className="text-[10px] text-foreground/40 font-normal">(Base: ₹{svc.basePrice})</span></span>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-[#0F3D30] border-[#0F3D30] text-white' : 'border-gold/30 bg-white'}`}>
                                    {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </button>
                              );
                            })}
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
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Target City *</label>
            <select 
              required 
              value={city} 
              onChange={e => setCity(e.target.value)} 
              className={inp}
            >
              {liveCities.length === 0 ? (
                <option value="">No operating cities found</option>
              ) : (
                liveCities.map((c: any) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))
              )}
            </select>
          </div>
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
          type="submit" disabled={saving}
          className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition-all text-sm flex items-center justify-center gap-1.5 mt-4"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
