"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Trash2, CheckCircle2, AlertTriangle, Loader2, X, Building, Map, Hash, Check } from 'lucide-react';
import AdminPageLayout from '../_components/AdminPageLayout';
import api from '@/lib/api';

const autoSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const inpClass = 'w-full border border-gold/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-white transition-colors';
const lblClass = 'block text-[10px] font-bold text-foreground/60 mb-1 uppercase tracking-wider';

type NodeType = 'city' | 'area' | 'pincode';

export default function AdminLocationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Database lists
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [areasList, setAreasList] = useState<any[]>([]);
  const [pincodesList, setPincodesList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Selection states
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedPincodeId, setSelectedPincodeId] = useState('');

  // Dropdown open states
  const [cityOpen, setCityOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [pincodeOpen, setPincodeOpen] = useState(false);

  const cityRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const pincodeRef = useRef<HTMLDivElement>(null);

  // Active locations table list
  const [activeLocations, setActiveLocations] = useState<any[]>([]);

  // Inline forms control
  const [showAddForm, setShowAddForm] = useState<NodeType | null>(null);
  const [formInput, setFormInput] = useState<any>({});

  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  useEffect(() => {
    fetchData();

    // Click outside handler to close custom selectors
    const handleClickOutside = (event: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) setCityOpen(false);
      if (areaRef.current && !areaRef.current.contains(event.target as Node)) setAreaOpen(false);
      if (pincodeRef.current && !pincodeRef.current.contains(event.target as Node)) setPincodeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setAlertMsg(null);
    try {
      // Fetch categories
      const catRes = await api.get('/public/categories');
      setCategories(catRes.data || []);

      // Fetch public locations hierarchy lists
      const res = await api.get('/locations/public');
      if (res.data?.success && res.data.data) {
        const { cities, areas, pincodes } = res.data.data;
        setCitiesList(cities || []);
        setAreasList(areas || []);
        setPincodesList(pincodes || []);

        // The active list is the set of all pincodes in the database
        const activeList: any[] = [];
        (pincodes || []).forEach((p: any) => {
          const areaObj = (areas || []).find((a: any) => a._id === (p.areaId?._id || p.areaId));
          const cityObj = (cities || []).find((c: any) => c._id === (p.cityId?._id || p.cityId));
          if (cityObj && areaObj) {
            activeList.push({
              _id: p._id,
              city: cityObj,
              area: areaObj,
              pincode: p
            });
          }
        });
        setActiveLocations(activeList);
      }
    } catch (err) {
      console.error(err);
      setAlertMsg({ text: 'Failed to fetch location records.', type: 'err' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!selectedPincodeId) {
      setAlertMsg({ text: 'Please select a city, area, and pincode to activate.', type: 'err' });
      return;
    }
    setSaving(true);
    try {
      // Toggle the pincode status to active in database
      await api.put(`/locations/admin/pincodes/${selectedPincodeId}`, { isActive: true });
      setAlertMsg({ text: 'Service location activated successfully.', type: 'ok' });
      setSelectedCityId('');
      setSelectedAreaId('');
      setSelectedPincodeId('');
      fetchData();
    } catch (err) {
      console.error(err);
      setAlertMsg({ text: 'Failed to activate location.', type: 'err' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateLocation = async (pincodeId: string) => {
    if (!confirm('Are you sure you want to deactivate this service location?')) return;
    try {
      await api.put(`/locations/admin/pincodes/${pincodeId}`, { isActive: false });
      setAlertMsg({ text: 'Service location deactivated.', type: 'ok' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLocationItem = async (type: 'city' | 'area' | 'pincode', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}? This will delete all child references!`)) return;
    try {
      const subtab = type === 'city' ? 'cities' : type === 'area' ? 'areas' : 'pincodes';
      await api.delete(`/locations/admin/${subtab}/${id}`);
      setAlertMsg({ text: `${type} deleted.`, type: 'ok' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Master Record Creation submissions
  const handleCreateMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (showAddForm === 'city') {
        const cityPayload = {
          name: formInput.name,
          slug: formInput.slug || autoSlug(formInput.name),
          popular: !!formInput.popular,
          displayOrder: Number(formInput.displayOrder || 0),
          latitude: Number(formInput.latitude || 0),
          longitude: Number(formInput.longitude || 0),
          supportedServices: formInput.supportedServices || [],
          isActive: true
        };
        const cityRes = await api.post('/locations/admin/cities', cityPayload);
        const cityId = cityRes.data?.data?._id;

        let areaId = '';
        if (cityId && formInput.areaName) {
          const areaPayload = {
            cityId,
            name: formInput.areaName,
            slug: autoSlug(formInput.areaName),
            latitude: Number(formInput.latitude || 0),
            longitude: Number(formInput.longitude || 0),
            isActive: true
          };
          const areaRes = await api.post('/locations/admin/areas', areaPayload);
          areaId = areaRes.data?.data?._id;
        }

        let pincodeId = '';
        if (cityId && areaId && formInput.pincodeCode) {
          const pincodePayload = {
            cityId,
            areaId,
            code: formInput.pincodeCode,
            latitude: Number(formInput.latitude || 0),
            longitude: Number(formInput.longitude || 0),
            isActive: true
          };
          const pinRes = await api.post('/locations/admin/pincodes', pincodePayload);
          pincodeId = pinRes.data?.data?._id;
        }

        if (cityId) setSelectedCityId(cityId);
        if (areaId) setSelectedAreaId(areaId);
        if (pincodeId) setSelectedPincodeId(pincodeId);
      } else if (showAddForm === 'area') {
        const payload = {
          cityId: selectedCityId,
          name: formInput.name,
          slug: formInput.slug || autoSlug(formInput.name),
          displayOrder: Number(formInput.displayOrder || 0),
          latitude: Number(formInput.latitude || 0),
          longitude: Number(formInput.longitude || 0),
          isActive: true
        };
        await api.post('/locations/admin/areas', payload);
      } else if (showAddForm === 'pincode') {
        const payload = {
          cityId: selectedCityId,
          areaId: selectedAreaId,
          code: formInput.code,
          latitude: Number(formInput.latitude || 0),
          longitude: Number(formInput.longitude || 0),
          isActive: true
        };
        await api.post('/locations/admin/pincodes', payload);
      }
      setShowAddForm(null);
      setFormInput({});
      setAlertMsg({ text: `New ${showAddForm} created successfully.`, type: 'ok' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create record.');
    } finally {
      setSaving(false);
    }
  };

  // Reusable Creator Panel Content
  const renderCreatorContent = () => {
    if (!showAddForm) {
      return (
        <div className="py-24 text-center text-foreground/45 italic text-xs">
          Select City, Area, or Pincode and click "+ New" link above the dropdowns to create master records.
        </div>
      );
    }
    return (
      <form onSubmit={handleCreateMaster} className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold bg-primary/5 text-primary px-3 py-1 rounded-full border border-primary/10 uppercase tracking-wider">
            New {showAddForm}
          </span>
          <button type="button" onClick={() => setShowAddForm(null)} className="text-foreground/40 hover:text-foreground text-xs font-bold">
            ✕ Cancel
          </button>
        </div>

        {showAddForm === 'city' && (
          <>
            <div>
              <label className={lblClass}>City Name</label>
              <input
                type="text" required
                value={formInput.name || ''}
                onChange={e => setFormInput({ ...formInput, name: e.target.value })}
                placeholder="e.g. Noida"
                className={inpClass}
              />
            </div>
            <div>
              <label className={lblClass}>SEO Slug (Optional)</label>
              <input
                type="text"
                value={formInput.slug || ''}
                onChange={e => setFormInput({ ...formInput, slug: e.target.value })}
                placeholder="e.g. noida"
                className={inpClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lblClass}>Latitude</label>
                <input
                  type="number" step="any"
                  value={formInput.latitude || ''}
                  onChange={e => setFormInput({ ...formInput, latitude: e.target.value })}
                  placeholder="e.g. 28.57"
                  className={inpClass}
                />
              </div>
              <div>
                <label className={lblClass}>Longitude</label>
                <input
                  type="number" step="any"
                  value={formInput.longitude || ''}
                  onChange={e => setFormInput({ ...formInput, longitude: e.target.value })}
                  placeholder="e.g. 77.32"
                  className={inpClass}
                />
              </div>
            </div>
            <div>
              <label className={lblClass}>Area Name (Initial)</label>
              <input
                type="text" required
                value={formInput.areaName || ''}
                onChange={e => setFormInput({ ...formInput, areaName: e.target.value })}
                placeholder="e.g. Sector 62"
                className={inpClass}
              />
            </div>
            <div>
              <label className={lblClass}>Pincode Code (Initial)</label>
              <input
                type="text" required
                value={formInput.pincodeCode || ''}
                onChange={e => setFormInput({ ...formInput, pincodeCode: e.target.value })}
                placeholder="e.g. 201301"
                className={inpClass}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="pop-cb"
                checked={!!formInput.popular}
                onChange={e => setFormInput({ ...formInput, popular: e.target.checked })}
                className="rounded border-gold/30 text-primary w-4 h-4 cursor-pointer"
              />
              <label htmlFor="pop-cb" className="text-xs font-bold text-foreground/75 cursor-pointer">Popular City</label>
            </div>
          </>
        )}

        {showAddForm === 'area' && (
          <>
            <div>
              <label className={lblClass}>Selected City</label>
              <input
                type="text" disabled
                value={citiesList.find(c => c._id === selectedCityId)?.name || 'None selected'}
                className="w-full border border-gold/30 rounded-xl px-3 py-2 text-xs bg-cream text-foreground/50"
              />
            </div>
            <div>
              <label className={lblClass}>Area Name</label>
              <input
                type="text" required
                value={formInput.name || ''}
                onChange={e => setFormInput({ ...formInput, name: e.target.value })}
                placeholder="e.g. Sector 62"
                className={inpClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lblClass}>Latitude</label>
                <input
                  type="number" step="any"
                  value={formInput.latitude || ''}
                  onChange={e => setFormInput({ ...formInput, latitude: e.target.value })}
                  className={inpClass}
                />
              </div>
              <div>
                <label className={lblClass}>Longitude</label>
                <input
                  type="number" step="any"
                  value={formInput.longitude || ''}
                  onChange={e => setFormInput({ ...formInput, longitude: e.target.value })}
                  className={inpClass}
                />
              </div>
            </div>
          </>
        )}

        {showAddForm === 'pincode' && (
          <>
            <div>
              <label className={lblClass}>Selected Area</label>
              <input
                type="text" disabled
                value={areasList.find(a => a._id === selectedAreaId)?.name || 'None selected'}
                className="w-full border border-gold/30 rounded-xl px-3 py-2 text-xs bg-cream text-foreground/50"
              />
            </div>
            <div>
              <label className={lblClass}>Pincode Code</label>
              <input
                type="text" required
                value={formInput.code || ''}
                onChange={e => setFormInput({ ...formInput, code: e.target.value })}
                placeholder="e.g. 201301"
                className={inpClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lblClass}>Latitude</label>
                <input
                  type="number" step="any"
                  value={formInput.latitude || ''}
                  onChange={e => setFormInput({ ...formInput, latitude: e.target.value })}
                  className={inpClass}
                />
              </div>
              <div>
                <label className={lblClass}>Longitude</label>
                <input
                  type="number" step="any"
                  value={formInput.longitude || ''}
                  onChange={e => setFormInput({ ...formInput, longitude: e.target.value })}
                  className={inpClass}
                />
              </div>
            </div>
          </>
        )}

        <button
          type="submit" disabled={saving}
          className="w-full py-2.5 bg-primary text-white hover:bg-primary/95 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          {saving && <Loader2 className="w-3.5 animate-spin" />}
          Create Master Record
        </button>
      </form>
    );
  };

  return (
    <AdminPageLayout title="📍 Locations" subtitle="Manage City, Area, and Pincode Service Availability" backHref="/admin/dashboard">
      
      {alertMsg && (
        <div className={`p-4 rounded-2xl border mb-6 text-xs font-bold flex items-center gap-2 ${alertMsg.type === 'ok' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          {alertMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {alertMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Columns: Main Selection Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gold/15 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gold/10 pb-3">
              <h3 className="font-serif font-bold text-primary text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gold" /> Service Locations
              </h3>
              <p className="text-[10px] text-foreground/45 italic">Admin Panel Editor</p>
            </div>
            
            <p className="text-xs text-foreground/50">Select City, Area, and Pincode to add serving locations.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* City Dropdown */}
              <div className="relative" ref={cityRef}>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-foreground/60 uppercase">City</label>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm('city'); setFormInput({}); }}
                    className="text-[9px] text-gold hover:text-gold/80 font-bold"
                  >
                    + New City
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCityOpen(!cityOpen)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream flex justify-between items-center text-left"
                >
                  <span className="truncate">{selectedCityId ? citiesList.find(c => c._id === selectedCityId)?.name : 'Select City'}</span>
                  <span className="text-foreground/45 text-[8px]">▼</span>
                </button>
                {cityOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gold/20 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto py-1">
                    {citiesList.map((c: any) => (
                      <div key={c._id} className="flex justify-between items-center px-3 py-1.5 hover:bg-cream transition-colors">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCityId(c._id);
                            setSelectedAreaId('');
                            setSelectedPincodeId('');
                            setCityOpen(false);
                          }}
                          className="text-left flex-1 text-xs text-primary font-medium"
                        >
                          {c.name}
                        </button>
                        <button type="button" onClick={() => handleDeleteLocationItem('city', c._id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {citiesList.length === 0 && <p className="text-[10px] text-center text-foreground/40 py-2">No cities. Create one!</p>}
                  </div>
                )}
              </div>

              {/* Area Dropdown */}
              <div className="relative" ref={areaRef}>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-foreground/60 uppercase">Area</label>
                  {selectedCityId && (
                    <button
                      type="button"
                      onClick={() => { setShowAddForm('area'); setFormInput({}); }}
                      className="text-[9px] text-gold hover:text-gold/80 font-bold"
                    >
                      + New Area
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!selectedCityId}
                  onClick={() => setAreaOpen(!areaOpen)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream flex justify-between items-center text-left disabled:opacity-50"
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
                        <div key={a._id} className="flex justify-between items-center px-3 py-1.5 hover:bg-cream transition-colors">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAreaId(a._id);
                              setSelectedPincodeId('');
                              setAreaOpen(false);
                            }}
                            className="text-left flex-1 text-xs text-primary font-medium"
                          >
                            {a.name}
                          </button>
                          <button type="button" onClick={() => handleDeleteLocationItem('area', a._id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    {areasList.filter((a: any) => (a.cityId?._id || a.cityId) === selectedCityId).length === 0 && (
                      <p className="text-[10px] text-center text-foreground/40 py-2">No areas. Create one!</p>
                    )}
                  </div>
                )}
              </div>

              {/* Pincode Dropdown */}
              <div className="relative" ref={pincodeRef}>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-foreground/60 uppercase">Pincode</label>
                  {selectedAreaId && (
                    <button
                      type="button"
                      onClick={() => { setShowAddForm('pincode'); setFormInput({}); }}
                      className="text-[9px] text-gold hover:text-gold/80 font-bold"
                    >
                      + New Pincode
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!selectedAreaId}
                  onClick={() => setPincodeOpen(!pincodeOpen)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream flex justify-between items-center text-left disabled:opacity-50"
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
                        <div key={p._id} className="flex justify-between items-center px-3 py-1.5 hover:bg-cream transition-colors">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPincodeId(p._id);
                              setPincodeOpen(false);
                            }}
                            className="text-left flex-1 text-xs text-primary font-medium"
                          >
                            {p.code}
                          </button>
                          <button type="button" onClick={() => handleDeleteLocationItem('pincode', p._id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    {pincodesList.filter((p: any) => (p.areaId?._id || p.areaId) === selectedAreaId).length === 0 && (
                      <p className="text-[10px] text-center text-foreground/40 py-2">No pincodes. Create one!</p>
                    )}
                  </div>
                )}
              </div>

            </div>

            <button
              type="button"
              disabled={!selectedPincodeId || saving}
              onClick={handleAddLocation}
              className="w-full py-3.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Service Location
            </button>

          </div>

          {/* Active Locations List Table */}
          <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm">
            <h3 className="font-serif font-bold text-primary text-base border-b border-gold/10 pb-3 mb-4">
              Active Serving Areas
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gold/10 text-foreground/45 uppercase tracking-wider font-bold">
                    <th className="pb-3">City</th>
                    <th className="pb-3">Area</th>
                    <th className="pb-3">Pincode</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/5">
                  {activeLocations.filter(loc => loc.pincode.isActive).map(loc => (
                    <tr key={loc._id} className="hover:bg-cream/20 transition-colors">
                      <td className="py-3 font-semibold text-primary">{loc.city.name}</td>
                      <td className="py-3 text-foreground/75">{loc.area.name}</td>
                      <td className="py-3 text-foreground/75 font-mono">{loc.pincode.code}</td>
                      <td className="py-3">
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold text-[10px] border border-green-100">
                          Active
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeactivateLocation(loc.pincode._id)}
                          className="text-red-500 hover:text-red-700 font-bold"
                          title="Deactivate Location"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeLocations.filter(loc => loc.pincode.isActive).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-foreground/45 italic">
                        No active service locations configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Inline Creator Panel (Desktop view only) */}
        <div className="hidden lg:block bg-white border border-gold/15 rounded-3xl p-6 shadow-sm">
          <h3 className="font-serif font-bold text-primary text-base border-b border-gold/10 pb-3 mb-4">
            Master Records Creator
          </h3>
          {renderCreatorContent()}
        </div>

      </div>

      {/* Mobile/Tablet Popup Modal for Creator */}
      {showAddForm && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F8F4EE] rounded-[32px] w-full max-w-md border border-gold/30 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setShowAddForm(null)}
              className="absolute top-4 right-4 text-foreground/45 hover:text-foreground font-bold text-base"
            >
              ✕
            </button>
            <h3 className="font-serif font-bold text-primary text-base border-b border-gold/10 pb-3 mb-4 mt-2">
              Master Records Creator
            </h3>
            {renderCreatorContent()}
          </div>
        </div>
      )}

    </AdminPageLayout>
  );
}
