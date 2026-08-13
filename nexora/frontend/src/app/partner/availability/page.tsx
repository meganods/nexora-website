"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Clock, CheckCircle2, AlertTriangle, Loader2, Plus, X } from 'lucide-react';
import api from '@/lib/api';

// Converts "14:30" → "2:30 PM"
function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function PartnerAvailabilityPage() {
  const [days, setDays] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [customTimes, setCustomTimes] = useState<string[]>([]);
  const [timeInput, setTimeInput] = useState('');

  // Location Selector states
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [areasList, setAreasList] = useState<any[]>([]);
  const [pincodesList, setPincodesList] = useState<any[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<any[]>([]);

  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedPincodeId, setSelectedPincodeId] = useState('');

  // Custom Dropdown Open States
  const [cityOpen, setCityOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [pincodeOpen, setPincodeOpen] = useState(false);

  const cityRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const pincodeRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchAvailability();

    // Close custom dropdowns on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) setCityOpen(false);
      if (areaRef.current && !areaRef.current.contains(event.target as Node)) setAreaOpen(false);
      if (pincodeRef.current && !pincodeRef.current.contains(event.target as Node)) setPincodeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/partner/profile');
      if (data?.vendor) {
        const v = data.vendor;
        setDays(v.availability?.days || []);
        setSlots(v.availability?.slots || []);
        setCustomTimes(v.availability?.customTimes || []);

        const locRes = await api.get('/locations/public');
        if (locRes.data?.success) {
          const { cities, areas, pincodes } = locRes.data.data;
          setCitiesList(cities || []);
          setAreasList(areas || []);
          setPincodesList(pincodes || []);

          const savedAreaIds = v.serviceAreaIds || [];
          const matched = (areas || [])
            .filter((a: any) => savedAreaIds.includes(a._id))
            .map((a: any) => {
              const cityIdStr = a.cityId?._id || a.cityId;
              const cityObj = (cities || []).find((c: any) => c._id === cityIdStr);
              return {
                _id: a._id,
                name: a.name,
                cityName: cityObj ? cityObj.name : 'NCR'
              };
            });
          setSelectedAreas(matched);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load availability configurations.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTime = () => {
    if (!timeInput) return;
    if (customTimes.includes(timeInput)) return;
    setCustomTimes(prev => [...prev, timeInput].sort());
    setTimeInput('');
  };

  const handleRemoveTime = (t: string) => {
    setCustomTimes(prev => prev.filter(x => x !== t));
  };

  const handleAddLocation = () => {
    if (!selectedAreaId) return;
    if (selectedAreas.some(a => a._id === selectedAreaId)) return;

    const areaObj = areasList.find(a => a._id === selectedAreaId);
    const cityObj = citiesList.find(c => c._id === selectedCityId);

    if (areaObj) {
      setSelectedAreas(prev => [
        ...prev,
        {
          _id: areaObj._id,
          name: areaObj.name,
          cityName: cityObj ? cityObj.name : 'NCR'
        }
      ]);
    }
    // Reset selectors
    setSelectedAreaId('');
    setSelectedPincodeId('');
  };

  const handleRemoveLocation = (id: string) => {
    setSelectedAreas(prev => prev.filter(x => x._id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const serviceAreaIds = selectedAreas.map(a => a._id);
      await api.put('/partner/availability', { days, slots, customTimes, serviceAreaIds });
      setSuccessMsg('Service areas and availability updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save configuration.');
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
      <div className="flex items-center justify-between border-b border-gold/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Availability &amp; Service Areas</h1>
          <p className="text-xs text-foreground/50 font-medium">Configure where and when you accept customer assignments</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Areas Card */}
        <div className="bg-white border border-gold/15 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-primary text-base flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gold" /> Service Locations
          </h3>
          <p className="text-xs text-foreground/50">Select City, Area, and Pincode to add serving locations.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* City Dropdown */}
            <div className="relative" ref={cityRef}>
              <label className="block text-[10px] font-bold text-foreground/60 uppercase mb-1">City</label>
              <button
                type="button"
                onClick={() => setCityOpen(!cityOpen)}
                className="w-full px-3 py-2 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream flex justify-between items-center text-left"
              >
                <span className="truncate">{selectedCityId ? citiesList.find(c => c._id === selectedCityId)?.name : 'Select City'}</span>
                <span className="text-foreground/45 text-[8px]">▼</span>
              </button>
              {cityOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gold/20 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto py-1">
                  {citiesList.map((c: any) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => {
                        setSelectedCityId(c._id);
                        setSelectedAreaId('');
                        setSelectedPincodeId('');
                        setCityOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-cream text-xs text-primary font-medium transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Area Dropdown */}
            <div className="relative" ref={areaRef}>
              <label className="block text-[10px] font-bold text-foreground/60 uppercase mb-1">Area</label>
              <button
                type="button"
                disabled={!selectedCityId}
                onClick={() => setAreaOpen(!areaOpen)}
                className="w-full px-3 py-2 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream flex justify-between items-center text-left disabled:opacity-50"
              >
                <span className="truncate">
                  {!selectedCityId ? 'Select City First' : (selectedAreaId ? areasList.find(a => a._id === selectedAreaId)?.name : 'Select Area')}
                </span>
                <span className="text-foreground/45 text-[8px]">▼</span>
              </button>
              {areaOpen && selectedCityId && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gold/20 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto py-1">
                  {areasList
                    .filter((a: any) => (a.cityId?._id || a.cityId) === selectedCityId)
                    .map((a: any) => (
                      <button
                        key={a._id}
                        type="button"
                        onClick={() => {
                          setSelectedAreaId(a._id);
                          setSelectedPincodeId('');
                          setAreaOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-cream text-xs text-primary font-medium transition-colors"
                      >
                        {a.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Pincode Dropdown */}
            <div className="relative" ref={pincodeRef}>
              <label className="block text-[10px] font-bold text-foreground/60 uppercase mb-1">Pincode</label>
              <button
                type="button"
                disabled={!selectedAreaId}
                onClick={() => setPincodeOpen(!pincodeOpen)}
                className="w-full px-3 py-2 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream flex justify-between items-center text-left disabled:opacity-50"
              >
                <span className="truncate">
                  {!selectedAreaId ? 'Select Area First' : (selectedPincodeId ? pincodesList.find(p => p._id === selectedPincodeId)?.code : 'Select Pincode')}
                </span>
                <span className="text-foreground/45 text-[8px]">▼</span>
              </button>
              {pincodeOpen && selectedAreaId && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gold/20 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto py-1">
                  {pincodesList
                    .filter((p: any) => (p.areaId?._id || p.areaId) === selectedAreaId)
                    .map((p: any) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          setSelectedPincodeId(p._id);
                          setPincodeOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-cream text-xs text-primary font-medium transition-colors"
                      >
                        {p.code}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={!selectedAreaId}
            onClick={handleAddLocation}
            className="w-full py-2 bg-[#1D3B31] text-white text-xs font-bold rounded-xl hover:bg-[#1D3B31]/95 disabled:opacity-50 transition-all"
          >
            Add Service Location
          </button>

          <div className="flex flex-wrap gap-2 pt-2 max-h-[150px] overflow-y-auto">
            {selectedAreas.map((area: any) => (
              <span key={area._id} className="inline-flex items-center gap-1.5 bg-cream px-3 py-1 rounded-full text-xs font-semibold text-primary border border-gold/15">
                {area.name} ({area.cityName})
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(area._id)}
                  className="text-red-500 hover:text-red-700 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedAreas.length === 0 && (
              <p className="text-xs text-foreground/45 italic">No service locations added yet.</p>
            )}
          </div>
        </div>

        {/* Days & Slots Card */}
        <div className="bg-white border border-gold/15 rounded-3xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="font-serif font-bold text-primary text-base flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-gold" /> Available Days
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => {
                const active = days.includes(d);
                return (
                  <button
                    key={d} type="button"
                    onClick={() => {
                      if (active) setDays(days.filter(x => x !== d));
                      else setDays([...days, d]);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      active ? 'bg-primary text-white border-primary shadow-sm' : 'bg-cream text-foreground/75 border-gold/20'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-serif font-bold text-primary text-base flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-gold" /> Available Time Slots
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {['Morning', 'Afternoon', 'Evening'].map(s => {
                const active = slots.includes(s);
                return (
                  <button
                    key={s} type="button"
                    onClick={() => {
                      if (active) setSlots(slots.filter(x => x !== s));
                      else setSlots([...slots, s]);
                    }}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                      active ? 'bg-primary text-white border-primary shadow-sm' : 'bg-cream text-foreground/75 border-gold/20'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Time Picker Card — full width */}
      <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-5">
        <h3 className="font-serif font-bold text-primary text-base flex items-center gap-2">
          <Clock className="w-5 h-5 text-gold" /> Custom Working Hours
          <span className="text-[10px] font-semibold text-foreground/40 bg-cream px-2 py-0.5 rounded-full ml-1">Optional</span>
        </h3>
        <p className="text-xs text-foreground/50 font-medium -mt-2">Add specific start/end times your team is available during the day</p>

        {/* Time input row */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">Select Time</label>
            <div className="relative flex items-center">
              <Clock className="absolute left-3 w-4 h-4 text-gold pointer-events-none" />
              <input
                type="time"
                value={timeInput}
                onChange={e => setTimeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddTime(); }}
                className="pl-9 pr-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none focus:border-primary text-sm font-semibold text-primary bg-white appearance-none cursor-pointer min-w-[160px]"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddTime}
            disabled={!timeInput}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" /> Add Time
          </button>
        </div>

        {/* Added time chips */}
        {customTimes.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {customTimes.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-2 bg-primary/5 border border-primary/15 text-primary px-3.5 py-1.5 rounded-full text-xs font-bold"
              >
                <Clock className="w-3 h-3 text-gold" />
                {formatTime12h(t)}
                <button
                  type="button"
                  onClick={() => handleRemoveTime(t)}
                  className="w-4 h-4 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition-colors ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-foreground/35 font-medium italic">No custom times added yet — add specific hours above</p>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={handleSave} disabled={saving}
          className="px-8 py-3 bg-[#1D3B31] text-white hover:bg-[#1D3B31]/95 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Availability'}
        </button>
      </div>

    </div>
  );
}
