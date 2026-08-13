"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Check, AlertTriangle, Loader2, X } from 'lucide-react';
import api from '@/lib/api';

export default function SavedAddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form fields
  const [label, setLabel] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedPincodeId, setSelectedPincodeId] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [profileRes, locRes] = await Promise.all([
        api.get('/user/profile'),
        api.get('/locations/public')
      ]);

      if (profileRes.data?.user) {
        setAddresses(profileRes.data.user.addresses || []);
      }

      if (locRes.data?.success) {
        const { cities: c, areas: a, pincodes: p } = locRes.data.data;
        setCities(c || []);
        setAreas(a || []);
        setPincodes(p || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load address lists.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingAddressId(null);
    setLabel('Home');
    setFullName('');
    setPhone('');
    setHouseNo('');
    setStreet('');
    setLandmark('');
    setSelectedCityId('');
    setSelectedAreaId('');
    setSelectedPincodeId('');
    setIsDefault(false);
    setShowFormModal(true);
  };

  const handleOpenEdit = (addr: any) => {
    setEditingAddressId(addr._id);
    setLabel(addr.label || 'Home');
    setFullName(addr.fullName || '');
    setPhone(addr.phone || '');
    setHouseNo(addr.houseNo || '');
    setStreet(addr.street || '');
    setLandmark(addr.landmark || '');
    setSelectedCityId(addr.cityId || '');
    setSelectedAreaId(addr.areaId || '');
    setSelectedPincodeId(addr.pincodeId || '');
    setIsDefault(addr.isDefault || false);
    setShowFormModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    // Map names from selected IDs
    const cityObj = cities.find(c => c._id === selectedCityId);
    const areaObj = areas.find(a => a._id === selectedAreaId);
    const pinObj = pincodes.find(p => p._id === selectedPincodeId);

    const payload = {
      label,
      fullName,
      phone,
      houseNo,
      street,
      landmark,
      cityId: selectedCityId || undefined,
      areaId: selectedAreaId || undefined,
      pincodeId: selectedPincodeId || undefined,
      city: cityObj ? cityObj.name : '',
      state: cityObj?.stateId?.name || 'NCR',
      pincode: pinObj ? pinObj.code : '',
      isDefault
    };

    try {
      setLoading(true);
      setErrorMsg('');
      let res;
      if (editingAddressId) {
        res = await api.put(`/user/dashboard/addresses/${editingAddressId}`, payload);
      } else {
        res = await api.post('/user/dashboard/addresses', payload);
      }

      if (res.data?.success) {
        setAddresses(res.data.data || []);
        setShowFormModal(false);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.delete(`/user/dashboard/addresses/${addressId}`);
      if (data?.success) {
        setAddresses(data.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete address.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addr: any) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.put(`/user/dashboard/addresses/${addr._id}`, { ...addr, isDefault: true });
      if (data?.success) {
        setAddresses(data.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update default address.');
    } finally {
      setLoading(false);
    }
  };

  // Filter areas based on selected city
  const filteredAreas = areas.filter(a => !selectedCityId || (a.cityId?._id || a.cityId) === selectedCityId);

  return (
    <div className="space-y-6">
      <div className="border-b border-gold/15 pb-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Saved Addresses</h1>
          <p className="text-xs text-foreground/50">Manage your locations for prompt home services deliveries</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="text-xs font-bold text-white bg-primary px-4 py-2.5 rounded-full hover:bg-primary/95 transition-all flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      )}

      {!loading && addresses.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center">
          <MapPin className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">No saved addresses</h3>
          <p className="text-xs text-foreground/50 leading-relaxed max-w-sm mx-auto">
            Add your address to configure service routes and auto-complete scheduling locations instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4 transition-all relative ${
                addr.isDefault ? 'border-primary shadow-md' : 'border-gold/15 hover:border-gold/30'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs font-bold text-primary bg-gold/10 px-2.5 py-0.5 rounded-md uppercase font-mono tracking-wide">
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">
                      DEFAULT
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-primary">{addr.fullName}</p>
                <p className="text-xs text-foreground/60 leading-relaxed">
                  {addr.houseNo}, {addr.street}, {addr.landmark ? `${addr.landmark}, ` : ''}{addr.city}, {addr.state} - {addr.pincode}
                </p>
                <p className="text-xs text-foreground/50 font-medium">Phone: {addr.phone}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gold/10 justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="text-xs font-bold text-primary hover:text-[#C3AB84]"
                  >
                    Edit
                  </button>
                  <span className="text-gold/20">|</span>
                  <button
                    onClick={() => handleDeleteAddress(addr._id)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
                
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr)}
                    className="text-[10px] font-bold text-[#C3AB84] hover:text-primary flex items-center gap-1"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl border border-gold/30 w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowFormModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-cream rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h3 className="font-serif text-lg font-bold text-primary mb-4">
              {editingAddressId ? 'Edit Saved Address' : 'Add New Address'}
            </h3>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">Label</label>
                  <select
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full border border-gold/20 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">Full Name</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Recipient name"
                    className="w-full border border-gold/20 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">Phone Number</label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full border border-gold/20 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">House / Flat No.</label>
                  <input
                    required
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="House number"
                    className="w-full border border-gold/20 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">Street / Block</label>
                <input
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street name, colony, sector"
                  className="w-full border border-gold/20 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">Landmark (Optional)</label>
                <input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near famous school, shop, hospital"
                  className="w-full border border-gold/20 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Cities */}
                <div>
                  <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">City</label>
                  <select
                    required
                    value={selectedCityId}
                    onChange={(e) => { setSelectedCityId(e.target.value); setSelectedAreaId(''); }}
                    className="w-full border border-gold/20 rounded-xl px-3 py-2 text-xs focus:outline-none bg-white"
                  >
                    <option value="">Select City</option>
                    {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Areas */}
                <div>
                  <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">Area</label>
                  <select
                    required
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    className="w-full border border-gold/20 rounded-xl px-3 py-2 text-xs focus:outline-none bg-white"
                  >
                    <option value="">Select Area</option>
                    {filteredAreas.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                  </select>
                </div>

                {/* Pincodes */}
                <div>
                  <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">Pincode</label>
                  <select
                    required
                    value={selectedPincodeId}
                    onChange={(e) => setSelectedPincodeId(e.target.value)}
                    className="w-full border border-gold/20 rounded-xl px-3 py-2 text-xs focus:outline-none bg-white"
                  >
                    <option value="">Select Code</option>
                    {pincodes.map(p => <option key={p._id} value={p._id}>{p.code}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gold/20 text-primary focus:ring-primary w-4 h-4"
                />
                <label htmlFor="defaultCheck" className="text-xs font-semibold text-primary select-none cursor-pointer">
                  Set as default address
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-colors mt-2"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
