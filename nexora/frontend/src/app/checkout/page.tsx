"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { MapPin, Calendar, CreditCard, ChevronLeft, Loader2, ShieldAlert, Plus, Edit2, Tag } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const serviceId = searchParams.get('serviceId') || '';
  const packageId = searchParams.get('packageId') || '';
  const qtyParam = searchParams.get('qty') || searchParams.get('quantity') || '1';
  const qty = Math.max(1, parseInt(qtyParam) || 1);



  const [service, setService] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  
  // Custom address input fields matching the profile address inputs
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [stateStr, setStateStr] = useState('');
  const [pincode, setPincode] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('Morning');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [customTimeVal, setCustomTimeVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [fetchingGps, setFetchingGps] = useState(false);

  const handleGpsFetch = () => {
    setFetchingGps(true);

    const performReverseLookup = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`);
        const geo = await res.json();
        if (geo && geo.address) {
          const addr = geo.address;
          const streetVal = addr.suburb || addr.neighbourhood || addr.road || '';
          const districtVal = addr.city || addr.town || addr.state_district || '';
          setStreet(streetVal);
          setCity(districtVal);
          setStateStr(addr.state || '');
          setPincode(addr.postcode || '');
        }
      } catch (err) {
        console.error('OSM Nominatim lookup failed:', err);
        // Fallback to IP lookup if reverse lookup fails
        await fetchIpLocation();
      }
    };

    const fetchIpLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.city) {
          setCity(data.city);
          setStateStr(data.region || '');
          setPincode(data.postal || '');
          setStreet(data.org || '');
        }
      } catch (err) {
        console.error('IP Geolocation failed:', err);
        alert('Could not fetch location automatically. Please enter your address details manually.');
      }
    };

    if (!navigator.geolocation) {
      fetchIpLocation().finally(() => setFetchingGps(false));
      return;
    }

    // Try low accuracy directly (faster, doesn't crash on Wi-Fi triangulation devices like MacBooks)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        performReverseLookup(position.coords.latitude, position.coords.longitude)
          .finally(() => setFetchingGps(false));
      },
      (err) => {
        console.warn('Browser GPS lookup failed, falling back to IP lookup. Error:', err);
        fetchIpLocation()
          .finally(() => setFetchingGps(false));
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
    );
  };

  // Fee and settings states
  const [platformFee, setPlatformFee] = useState(15);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [discountMsg, setDiscountMsg] = useState('');

  const loginUrl = `/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/checkout')}`;

  useEffect(() => {
    // Allow package bookings (no serviceId required if packageId is present)
    const hasTarget = serviceId || packageId;
    if (!authLoading && !hasTarget) {
      router.replace('/');
      return;
    }
    
    if (user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexora_role', 'user');
      }
      if (hasTarget) {
        loadCheckoutDetails();
      }
    }
  }, [authLoading, serviceId, packageId, user]);

  const loadCheckoutDetails = async () => {
    setLoadingDetails(true);
    try {
      if (packageId) {
        let loaded = false;
        try {
          // Dynamic Package fetch by slug
          const pkgRes = await api.get(`/public/packages/${packageId}`);
          if (pkgRes.data?.success && pkgRes.data.package) {
            const pkg = pkgRes.data.package;
            setService({
              _id: pkg._id || pkg.slug,
              name: pkg.name,
              basePrice: pkg.basePrice,
              discountPercentage: pkg.discountPercentage || 0,
              description: pkg.description || `Package includes: ${(pkg.includedServices || []).map((s: any) => s.name).join(', ')}`,
              isPackage: true,
              includedServices: pkg.includedServices || [],
            });
            loaded = true;
          }
        } catch (apiErr) {
          console.warn("Package not found in MongoDB. Falling back to local static registry.");
        }

        if (!loaded) {
          const LOCAL_PACKAGES = {
            'basic-home-care': { name: 'Basic Home Care', price: 699, desc: 'Essential maintenance package for your home covering cleaning, electrical and plumbing needs.' },
            'deep-home-care': { name: 'Deep Home Care', price: 1299, desc: 'Comprehensive deep cleaning package for bathroom, kitchen and sofa — leaving your home spotless and hygienically clean.' },
            'move-in-care': { name: 'Move-In Care', price: 1999, desc: 'Get your new home fresh and pest-free before moving in with a full home clean and herbal pest treatment.' },
            'annual-home-care': { name: 'Annual Home Care', price: 2999, desc: 'Year-round home maintenance with quarterly AC, RO, electrical and plumbing service visits.' }
          };
          const localPkg = LOCAL_PACKAGES[packageId as keyof typeof LOCAL_PACKAGES];
          if (localPkg) {
            setService({
              _id: packageId,
              name: localPkg.name,
              basePrice: localPkg.price,
              discountPercentage: 0,
              description: localPkg.desc,
              isPackage: true,
              includedServices: [],
            });
          }
        }
      } else if (serviceId) {
        // Single service booking: fetch from public API
        const serviceRes = await api.get(`/public/services`);
        const matched = serviceRes.data?.find((s: any) => s._id === serviceId || s.slug === serviceId);
        if (matched) setService(matched);
      }

      // Platform settings
      const settingsRes = await api.get('/public/settings');
      if (settingsRes.data?.success) {
        setPlatformFee(settingsRes.data.platformFee?.minRupees ?? 15);
      }

      // User saved addresses
      const addrRes = await api.get('/user/addresses');
      const addrs = addrRes.data?.addresses || addrRes.data || [];
      setSavedAddresses(addrs);

      if (user) {
        setName(user.name || '');
        setPhone(user.phone || '');
      }

      if (addrs.length > 0) {
        setSelectedAddressId(addrs[0]._id || '');
      } else {
        setUseCustom(true);
      }
    } catch (err) {
      console.error('Failed to load checkout details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const applyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setDiscountMsg('');
    try {
      const payload: any = {
        code: promoCodeInput,
        orderAmount: basePrice,
      };
      if (service?.isPackage) {
        payload.packageId = service._id;
      } else {
        payload.serviceId = serviceId;
      }
      const { data } = await api.post('/promotions/validate-coupon', payload);
      if (data.success) {
        setAppliedDiscount(data.discountAmount);
        setDiscountMsg(data.message || 'Coupon applied successfully!');
      }
    } catch (err: any) {
      setAppliedDiscount(0);
      setDiscountMsg(err.response?.data?.message || 'Invalid or expired coupon.');
    }
  };

  const getActiveAddress = () => {
    if (useCustom) {
      if (!name || !phone || !line1 || !street || !city || !stateStr || !pincode) return null;
      const combinedLine1 = `${line1}, ${street}${landmark ? ', ' + landmark : ''}`;
      return { 
        name,
        phone,
        label,
        line1: combinedLine1, 
        city, 
        state: stateStr, 
        pincode 
      };
    }
    const matched = savedAddresses.find(a => a._id === selectedAddressId);
    if (!matched) return null;
    return {
      name: matched.name,
      phone: matched.phone,
      label: matched.label,
      line1: matched.line1,
      city: matched.city,
      state: matched.state,
      pincode: matched.pincode
    };
  };

  const formatTime12h = (time24: string) => {
    if (!time24) return '';
    try {
      const [hoursStr, minutesStr] = time24.split(':');
      let hours = parseInt(hoursStr, 10);
      const minutes = minutesStr;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; 
      return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    } catch {
      return time24;
    }
  };

  const createOrder = async () => {
    const activeAddr = getActiveAddress();
    const finalSlotString = selectedTimeSlot === 'Custom Time' 
      ? `${slot} (Custom: ${formatTime12h(customTimeVal)})` 
      : `${slot} (${selectedTimeSlot})`;

    const payload: any = {
      address: activeAddr,
      scheduledDate: date,
      scheduledSlot: finalSlotString,
      addons: parsedAddons,
      quantity: qty,
    };

    if (service?.isPackage) {
      payload.packageId = service._id;
    } else {
      payload.serviceId = serviceId;
    }

    if (appliedDiscount > 0 && promoCodeInput.trim()) {
      payload.couponCode = promoCodeInput.trim().toUpperCase();
    }

    return await api.post('/bookings/create-order', payload);
  };

  const handlePayment = async () => {
    const activeAddr = getActiveAddress();
    if (!activeAddr) { alert('Please select or fill a complete service address.'); return; }
    if (!date) { alert('Please select a service date.'); return; }
    if (!selectedTimeSlot) { alert('Please select an available hourly time slot.'); return; }
    if (selectedTimeSlot === 'Custom Time' && !customTimeVal.trim()) {
      alert('Please fill in your custom time.');
      return;
    }

    setIsProcessing(true);
    try {
      const { data } = await createOrder();
      const cashfree = await (window as any).Cashfree({ mode: 'production' });
      cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: '_modal' }).then((result: any) => {
        if (result.paymentDetails) router.push(`/bookings/${data.bookingId}`);
        else if (result.error) alert('Payment failed or cancelled');
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Payment initiation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatePayment = async () => {
    const activeAddr = getActiveAddress();
    if (!activeAddr) { alert('Please select or fill a complete service address.'); return; }
    if (!date) { alert('Please select a service date.'); return; }
    if (!selectedTimeSlot) { alert('Please select an available hourly time slot.'); return; }
    if (selectedTimeSlot === 'Custom Time' && !customTimeVal.trim()) {
      alert('Please fill in your custom time.');
      return;
    }

    setIsProcessing(true);
    try {
      const { data } = await createOrder();
      await api.post('/bookings/verify-payment', { orderId: data.orderId, mockSuccess: true });
      router.push(`/bookings/${data.bookingId}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Mock payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || loadingDetails) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] pb-24 font-sans pt-12 animate-pulse">
        <div className="container mx-auto px-4 lg:px-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-3xl w-full border border-gray-100"></div>
              <div className="h-48 bg-gray-200 rounded-3xl w-full border border-gray-100"></div>
            </div>
            <div className="lg:col-span-1">
              <div className="h-96 bg-gray-200 rounded-3xl w-full border border-gray-100"></div>
            </div>
          </div>
        </div>
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
            You need to be logged in to book a service.
          </p>
          <Link href={loginUrl}
            className="block w-full py-3.5 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors text-sm">
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  const role = typeof window !== 'undefined' ? localStorage.getItem('nexora_role') : null;
  if (!user && role && role !== 'user') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gold/20 shadow-lg max-w-sm w-full text-center">
          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-primary mb-2">Customer Account Required</h2>
          <p className="text-foreground/60 mb-6 text-sm">
            Checkout is only available for Customer accounts. Please sign in with a Customer account.
          </p>
          <button 
            onClick={() => {
              localStorage.removeItem('nexora_token');
              localStorage.removeItem('nexora_role');
              localStorage.removeItem('nexora_user');
              window.location.href = '/login?redirect=/checkout';
            }}
            className="block w-full py-3.5 bg-[#0F3D30] text-white rounded-full font-semibold hover:bg-[#0F3D30]/90 transition-colors text-sm"
          >
            Sign in as Customer
          </button>
        </div>
      </div>
    );
  }

  const addonsParam = searchParams.get('addons') || '';
  const parsedAddons = addonsParam ? addonsParam.split(',').map(item => {
    const parts = item.split(':');
    return { name: decodeURIComponent(parts[0]), price: Number(parts[1] || 0) };
  }) : [];
  const addonsPriceTotal = parsedAddons.reduce((sum, a) => sum + a.price, 0);

  let basePrice = service?.basePrice || 0;
  if (service?.discountPercentage > 0) {
    basePrice = Math.round(basePrice * (1 - service.discountPercentage / 100));
  }
  const multipliedBasePrice = basePrice * qty;
  const subtotal = multipliedBasePrice + addonsPriceTotal;
  const total = Math.max(0, subtotal + platformFee - appliedDiscount);

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden">
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" />

      {/* Header */}
      <header className="bg-white border-b border-gold/20 py-5 px-4">
        <div className="container mx-auto max-w-7xl flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-cream rounded-full transition-colors flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-primary truncate flex-1">Checkout</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-8 sm:py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">

          {/* Left: Input Fields */}
          <div className="lg:col-span-2 space-y-6">

            {/* Address Selection */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-primary">Service Address</h2>
                </div>
                <Link 
                  href="/profile/addresses"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Manage Saved Addresses
                </Link>
              </div>

              {!useCustom && savedAddresses.length > 0 ? (
                <div className="space-y-3">
                  {savedAddresses.map((addr: any) => (
                    <label 
                      key={addr._id}
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${selectedAddressId === addr._id ? 'border-primary bg-primary/5' : 'border-gold/15 hover:bg-cream'}`}
                    >
                      <input 
                        type="radio" 
                        name="savedAddress"
                        value={addr._id}
                        checked={selectedAddressId === addr._id}
                        onChange={() => setSelectedAddressId(addr._id)}
                        className="mt-1 accent-primary"
                      />
                      <div className="text-sm">
                        <span className="font-bold text-primary text-xs uppercase tracking-wider">{addr.label || 'Address'}</span>
                        <p className="text-foreground/75 mt-0.5">{addr.line1}</p>
                        <p className="text-foreground/50 text-xs mt-0.5">{addr.city}, {addr.state} — {addr.pincode}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <button 
                    type="button" 
                    onClick={handleGpsFetch}
                    disabled={fetchingGps}
                    className="w-full py-2.5 bg-cream border border-gold/40 text-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-beige transition-all disabled:opacity-60"
                  >
                    {fetchingGps ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : '📍 Fetch Current Location using GPS'}
                  </button>

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
                </div>
              )}
            </section>

            {/* Date & Slot */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                <h2 className="font-serif text-lg sm:text-xl font-bold text-primary">Date & Time</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Select Date *</label>
                  <input type="date"
                    className="w-full bg-cream border border-gold/30 rounded-2xl p-3.5 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={date} onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Select Slot *</label>
                  <div className="flex gap-2 flex-wrap">
                    {['Morning', 'Afternoon', 'Evening'].map(s => (
                      <button key={s} type="button" onClick={() => { setSlot(s); setSelectedTimeSlot(''); }}
                        className={`flex-1 min-w-[80px] py-3 px-2 rounded-xl border text-xs sm:text-sm font-medium transition-all text-center ${slot === s ? 'bg-primary text-white border-primary' : 'bg-cream text-foreground/70 border-gold/30 hover:border-primary/50'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time selection sub-list */}
              <div className="mt-5 pt-5 border-t border-gold/10">
                <label className="block text-sm font-medium text-foreground/70 mb-3">Available Time Slots</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(slot === 'Morning' 
                    ? ['08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM'] 
                    : slot === 'Afternoon' 
                    ? ['12:00 PM - 01:00 PM', '01:00 PM - 02:00 PM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM']
                    : ['05:00 PM - 06:00 PM', '06:00 PM - 07:00 PM', '07:00 PM - 08:00 PM', '08:00 PM - 09:00 PM']
                  ).concat(['Custom Time']).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSelectedTimeSlot(t);
                        if (t !== 'Custom Time') setCustomTimeVal('');
                      }}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-semibold text-center transition-all ${selectedTimeSlot === t ? 'bg-primary text-white border-primary' : 'bg-cream text-foreground/70 border-gold/25 hover:border-primary/45'}`}
                    >
                      {t === 'Custom Time' ? '✏️ Custom Time' : t.split(' - ')[0]}
                    </button>
                  ))}
                </div>

                {selectedTimeSlot === 'Custom Time' && (
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">Select Custom Time</label>
                    <input 
                      type="time"
                      value={customTimeVal}
                      onChange={e => setCustomTimeVal(e.target.value)}
                      className="w-full bg-cream border border-gold/30 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/30 shadow-lg shadow-gold/5 lg:sticky lg:top-8 space-y-6">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-primary">Order Summary</h2>

              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-primary text-sm truncate">{service?.name || 'Selected Service'}</h3>
                    {service?.isPackage && (
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full flex-shrink-0">📦 Package</span>
                    )}
                  </div>
                  {service?.isPackage && service?.includedServices && service.includedServices.length > 0 ? (
                    <ul className="text-[10px] text-foreground/55 mt-1 space-y-0.5">
                      {service.includedServices.map((item: any) => (
                        <li key={item._id || item.name}>✓ {item.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-foreground/60 mt-1">1 session</p>
                  )}
                  {parsedAddons.length > 0 && (
                    <div className="mt-2 pl-2 border-l border-gold/30 space-y-1">
                      <span className="block text-[9px] uppercase font-bold text-foreground/45">Add-ons:</span>
                      {parsedAddons.map((addon, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] text-foreground/65">
                          <span>+ {addon.name}</span>
                          <span>₹{addon.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-serif font-bold text-primary text-sm">₹{basePrice}</span>
              </div>

              {/* Coupon entry */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-2">Apply Promo Code</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Try NEXORA50"
                    value={promoCodeInput}
                    onChange={e => setPromoCodeInput(e.target.value)}
                    className="flex-1 bg-cream border border-gold/20 rounded-xl px-3 py-2 text-xs focus:outline-none uppercase"
                  />
                  <button 
                    onClick={applyPromo}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all"
                  >
                    Apply
                  </button>
                </div>
                {discountMsg && (
                  <p className={`text-[10px] mt-1.5 font-medium ${appliedDiscount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{discountMsg}</p>
                )}
              </div>

              <hr className="border-gold/15" />
              
              <div className="space-y-2.5 text-xs text-foreground/75">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{appliedDiscount}</span>
                  </div>
                )}
              </div>
              
              <hr className="border-gold/15" />

              <div className="flex justify-between items-center">
                <span className="font-bold text-primary text-sm">Total</span>
                <span className="font-serif text-2xl font-bold text-primary">₹{total}</span>
              </div>

              <button onClick={handlePayment} disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-70 text-xs sm:text-sm">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Pay & Book</>}
              </button>
              <p className="text-center text-xs text-foreground/40 mt-3">Secured by Cashfree</p>

              {process.env.NODE_ENV === 'development' && (
                <div className="mt-5 pt-5 border-t border-gold/20">
                  <button onClick={handleSimulatePayment} disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-cream border border-gold/50 text-primary rounded-xl font-medium hover:bg-beige transition-colors text-xs disabled:opacity-70">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : '🧪 Simulate Successful Payment'}
                  </button>
                  <p className="text-center text-[10px] text-foreground/40 mt-2">Development mode only</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>}>
      <CheckoutForm />
    </Suspense>
  );
}
