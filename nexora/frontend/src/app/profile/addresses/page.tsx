"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, ChevronLeft, Loader2, ShieldAlert, Plus, Trash2, Navigation } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function MyAddressesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form toggling
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Address Form Fields
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [stateStr, setStateStr] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Fetch location state
  const [fetchingGps, setFetchingGps] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/profile/addresses');
      return;
    }
    if (user) {
      fetchAddresses();
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [authLoading, user]);

  const fetchAddresses = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/user/addresses');
      setAddresses(data.addresses || data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  };

  const handleGpsFetch = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding matching India address bounds using OpenStreetMap Nominatim with English locale forced
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
          const geoData = await response.json();
          if (geoData && geoData.address) {
            const addr = geoData.address;
            setStreet(addr.suburb || addr.neighbourhood || addr.road || '');
            setCity(addr.city || addr.town || addr.state_district || '');
            setStateStr(addr.state || '');
            setPincode(addr.postcode || '');
          }
        } catch (err) {
          console.error('Error in reverse geocoding:', err);
          alert('Failed to retrieve address from GPS coordinates. Please type manually.');
        } finally {
          setFetchingGps(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Permission denied or location lookup failed.');
        setFetchingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !line1 || !street || !city || !stateStr || !pincode) {
      alert('Please fill all required address details.');
      return;
    }

    setLoading(true);
    try {
      const addressString = `${line1}, ${street}${landmark ? ', ' + landmark : ''}`;
      const payload = {
        label,
        name,
        phone,
        line1: addressString,
        city,
        state: stateStr,
        pincode,
        isDefault
      };

      const { data } = await api.post('/user/addresses', payload);
      setSuccess('Address added successfully.');
      setShowAddForm(false);
      
      // Clear form
      setLine1('');
      setStreet('');
      setLandmark('');
      setCity('');
      setStateStr('');
      setPincode('');
      
      fetchAddresses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setLoading(true);
    try {
      await api.delete(`/user/addresses/${addressId}`);
      setSuccess('Address deleted successfully.');
      fetchAddresses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete address.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gold/20 shadow-lg max-w-sm w-full text-center">
          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-primary mb-2">Login Required</h2>
          <p className="text-foreground/60 mb-6 text-sm">
            You need to be logged in to manage addresses.
          </p>
          <Link href={`/login?redirect=/profile/addresses`}
            className="block w-full py-3.5 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors text-sm">
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gold/20 py-5 px-4">
        <div className="container mx-auto max-w-4xl flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-cream rounded-full transition-colors flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-primary truncate flex-1">My Addresses</h1>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Address
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        
        {/* Add Address Form overlay or banner */}
        {showAddForm && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/30 shadow-lg mb-8 max-w-2xl mx-auto space-y-5">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-primary mb-4">Add New Address</h2>
            
            {/* GPS lookup */}
            <button 
              type="button" 
              onClick={handleGpsFetch}
              disabled={fetchingGps}
              className="w-full py-3 bg-cream border border-gold/50 text-primary rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-beige transition-all disabled:opacity-60"
            >
              {fetchingGps ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              Fetch Current Location using GPS
            </button>

            <form onSubmit={saveAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 mb-1.5">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-cream border border-gold/30 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 mb-1.5">Mobile Number *</label>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-cream border border-gold/30 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 mb-1.5">House / Flat / Building *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 123, ABC Colony"
                  value={line1}
                  onChange={e => setLine1(e.target.value)}
                  className="w-full bg-cream border border-gold/30 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 mb-1.5">Street / Area *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Sector 62"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    className="w-full bg-cream border border-gold/30 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 mb-1.5">Landmark (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Near Market"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    className="w-full bg-cream border border-gold/30 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 mb-1.5">City *</label>
                  <input 
                    type="text" 
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-cream border border-gold/30 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 mb-1.5">State *</label>
                  <input 
                    type="text" 
                    required
                    value={stateStr}
                    onChange={e => setStateStr(e.target.value)}
                    className="w-full bg-cream border border-gold/30 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 mb-1.5">PIN Code *</label>
                  <input 
                    type="text" 
                    required
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    className="w-full bg-cream border border-gold/30 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">Address Type</label>
                <div className="flex gap-2.5">
                  {(['Home', 'Work', 'Other'] as const).map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => setLabel(t)}
                      className={`flex-1 py-2.5 border text-xs sm:text-sm font-semibold rounded-xl transition-all ${label === t ? 'bg-primary text-white border-primary' : 'bg-cream text-foreground/70 border-gold/25 hover:border-primary/50'}`}
                    >
                      {t === 'Home' ? '🏠 Home' : t === 'Work' ? '🏢 Work' : '📍 Other'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="defaultCheck"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="accent-primary w-4 h-4 cursor-pointer"
                />
                <label htmlFor="defaultCheck" className="text-xs font-medium text-foreground/75 cursor-pointer">Set as Default Address</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 border border-gold/35 text-foreground/70 rounded-full font-bold text-xs hover:bg-cream transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-full font-bold text-xs hover:bg-primary/95 transition-all shadow"
                >
                  Save Address
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Saved Addresses list */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-gold/15 shadow-sm text-center">
            <MapPin className="w-10 h-10 mx-auto text-gold/45 mb-3" />
            <h3 className="font-serif text-lg font-bold text-primary mb-1">No Saved Addresses</h3>
            <p className="text-xs text-foreground/50 max-w-xs mx-auto mb-5">You haven't saved any addresses yet. Click "+ Add New Address" above to start.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {addresses.map((addr: any) => (
              <div 
                key={addr._id}
                className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider bg-cream border border-gold/25 px-2.5 py-0.5 rounded-full">
                      {addr.label === 'Work' ? '🏢 Work' : addr.label === 'Home' ? '🏠 Home' : '📍 Other'}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Default</span>
                    )}
                  </div>

                  <p className="font-bold text-primary text-sm">{addr.name || user.name}</p>
                  <p className="text-xs text-foreground/75 mt-1.5 leading-relaxed">{addr.line1}</p>
                  <p className="text-xs text-foreground/50 mt-0.5">{addr.city}, {addr.state} — {addr.pincode}</p>
                  {addr.phone && <p className="text-xs text-foreground/50 mt-1">Ph: {addr.phone}</p>}
                </div>

                <div className="flex justify-end gap-3 mt-5 pt-3 border-t border-gold/10">
                  <button 
                    onClick={() => deleteAddress(addr._id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
