"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Trash2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import AdminPageLayout from '../_components/AdminPageLayout';
import api from '@/lib/api';

const autoSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const inpClass = 'w-full border border-gold/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-white transition-colors';
const lblClass = 'block text-[10px] font-bold text-foreground/60 mb-1 uppercase tracking-wider';

export default function AdminLocationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Database lists
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [areasList, setAreasList] = useState<any[]>([]);
  const [pincodesList, setPincodesList] = useState<any[]>([]);

  // Input states
  const [cityInput, setCityInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState('');

  // Active locations table list
  const [activeLocations, setActiveLocations] = useState<any[]>([]);

  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setAlertMsg(null);
    try {
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
    if (!cityInput || !areaInput || !pincodeInput) {
      setAlertMsg({ text: 'Please enter City, Area, and Pincode.', type: 'err' });
      return;
    }
    setSaving(true);
    try {
      // 1. Find or Create City
      let city = citiesList.find(c => c.name.toLowerCase() === cityInput.trim().toLowerCase());
      if (!city) {
        const cityRes = await api.post('/locations/admin/cities', {
          name: cityInput.trim(),
          slug: autoSlug(cityInput.trim()),
          isActive: true
        });
        city = cityRes.data?.data;
      }

      // 2. Find or Create Area
      let area = areasList.find(a => 
        a.name.toLowerCase() === areaInput.trim().toLowerCase() && 
        (a.cityId === city._id || a.cityId?._id === city._id)
      );
      if (!area) {
        const areaRes = await api.post('/locations/admin/areas', {
          cityId: city._id,
          name: areaInput.trim(),
          slug: autoSlug(areaInput.trim()),
          isActive: true
        });
        area = areaRes.data?.data;
      }

      // 3. Find or Create Pincode
      let pincode = pincodesList.find(p => 
        p.code.toLowerCase() === pincodeInput.trim().toLowerCase() && 
        (p.areaId === area._id || p.areaId?._id === area._id)
      );
      if (!pincode) {
        const pinRes = await api.post('/locations/admin/pincodes', {
          cityId: city._id,
          areaId: area._id,
          code: pincodeInput.trim(),
          isActive: true
        });
        pincode = pinRes.data?.data;
      } else {
        // If it exists, we just activate it
        await api.put(`/locations/admin/pincodes/${pincode._id}`, { isActive: true });
      }

      setAlertMsg({ text: 'Service location added and activated successfully.', type: 'ok' });
      setCityInput('');
      setAreaInput('');
      setPincodeInput('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setAlertMsg({ text: err.response?.data?.message || 'Failed to add location.', type: 'err' });
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

  return (
    <AdminPageLayout title="📍 Locations" subtitle="Manage City, Area, and Pincode Service Availability" backHref="/admin/dashboard">
      
      {alertMsg && (
        <div className={`p-4 rounded-2xl border mb-6 text-xs font-bold flex items-center gap-2 ${alertMsg.type === 'ok' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          {alertMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {alertMsg.text}
        </div>
      )}

      <div className="space-y-6">
        
        {/* Main Selection Card */}
        <div className="bg-white border border-gold/15 rounded-3xl p-6 space-y-5 shadow-sm max-w-4xl">
          <div className="flex items-center justify-between border-b border-gold/10 pb-3">
            <h3 className="font-serif font-bold text-primary text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold" /> Add Service Location
            </h3>
            <p className="text-[10px] text-foreground/45 italic">Auto-creates if not exists</p>
          </div>
          
          <p className="text-xs text-foreground/50">Enter City, Area, and Pincode to add serving locations.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* City Input */}
            <div>
              <label className={lblClass}>City Name</label>
              <input
                type="text"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                placeholder="e.g. Noida"
                className={inpClass}
              />
            </div>

            {/* Area Input */}
            <div>
              <label className={lblClass}>Area Name</label>
              <input
                type="text"
                value={areaInput}
                onChange={e => setAreaInput(e.target.value)}
                placeholder="e.g. Sector 62"
                className={inpClass}
              />
            </div>

            {/* Pincode Input */}
            <div>
              <label className={lblClass}>Pincode</label>
              <input
                type="text"
                value={pincodeInput}
                onChange={e => setPincodeInput(e.target.value)}
                placeholder="e.g. 201301"
                className={inpClass}
              />
            </div>

          </div>

          <button
            type="button"
            disabled={!cityInput || !areaInput || !pincodeInput || saving}
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

    </AdminPageLayout>
  );
}
