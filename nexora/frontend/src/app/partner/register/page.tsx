"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, User, Mail, Lock, Phone, Wrench, Eye, EyeOff, Loader2, Star, 
  FileText, Briefcase, Users, MapPin, Calendar, Clock, CreditCard, Landmark, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft 
} from 'lucide-react';
import api from '@/lib/api';

export default function PartnerRegisterWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Individual');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Business Info
  const [experience, setExperience] = useState<number>(0);
  const [teamSize, setTeamSize] = useState<number>(1);
  const [primaryContact, setPrimaryContact] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Delhi');
  const [state, setState] = useState('Delhi');
  const [pincode, setPincode] = useState('');

  // Step 3: Services
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<any[]>([]); // array of service objects
  const [pricingOverrides, setPricingOverrides] = useState<Record<string, number>>({});

  // Step 4: Areas & Availability
  const [days, setDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  const [slots, setSlots] = useState<string[]>(['Morning', 'Afternoon', 'Evening']);
  const [serviceAreas, setServiceAreas] = useState<string[]>(['Delhi NCR']);
  const [newAreaInput, setNewAreaInput] = useState('');

  // Step 5: KYC details
  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [isGstRegistered, setIsGstRegistered] = useState(false);

  // Step 6: Bank details
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState('Savings');

  useEffect(() => {
    fetchPublicCategories();
    // If token already exists, check if onboarding is in progress
    checkExistingDraft();
  }, []);

  const fetchPublicCategories = async () => {
    try {
      const { data } = await api.get('/public/categories');
      setAllCategories(data || []);
    } catch (e) {
      console.error("Failed to fetch platform categories", e);
    }
  };

  const checkExistingDraft = async () => {
    const token = localStorage.getItem('nexora_token');
    const role = localStorage.getItem('nexora_role');
    if (token && role === 'vendor') {
      try {
        setLoading(true);
        const { data } = await api.get('/partner/profile');
        if (data?.vendor) {
          const v = data.vendor;
          setName(v.name || '');
          setEmail(v.email || '');
          setPhone(v.phone || '');
          setBusinessName(v.kycDetails?.businessName || '');
          setBusinessType(v.businessType || 'Individual');
          setExperience(v.experience || 0);
          setTeamSize(v.teamSize || 1);
          setPrimaryContact(v.primaryContact || '');
          setBusinessDescription(v.businessDescription || '');
          setAddress(v.location?.address || '');
          setCity(v.location?.city || 'Delhi');
          
          setDays(v.availability?.days || []);
          setSlots(v.availability?.slots || []);
          setServiceAreas(v.serviceAreas || []);
          setAadharNumber(v.kycDetails?.aadharNumber || '');
          setPanNumber(v.kycDetails?.panNumber || '');
          setGstNumber(v.kycDetails?.gstNumber || '');
          setIsGstRegistered(!!v.kycDetails?.gstNumber);

          setAccountHolderName(v.bankDetails?.accountHolderName || '');
          setBankName(v.bankDetails?.bankName || '');
          setAccountNumber(v.bankDetails?.accountNumber || '');
          setIfscCode(v.bankDetails?.ifscCode || '');
          setAccountType(v.bankDetails?.accountType || 'Savings');

          setSelectedServices(v.customServices?.map((cs: any) => cs.serviceId) || []);
          const overrides: Record<string, number> = {};
          v.customServices?.forEach((cs: any) => {
            if (cs.customPrice) {
              overrides[cs.serviceId?._id || cs.serviceId] = cs.customPrice;
            }
          });
          setPricingOverrides(overrides);

          // Resume step
          setCurrentStep(v.onboardingStep || 1);
        }
      } catch (err) {
        console.log("Draft load skipped or unauthorized", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const saveProgress = async (step: number) => {
    setErrorMsg('');
    setApiLoading(true);
    try {
      // Build custom services payload for Step 3
      const customServicesPayload = selectedServices.map(svc => ({
        serviceId: svc._id || svc,
        customPrice: pricingOverrides[svc._id || svc] || null,
        isActive: true
      }));

      const payload: any = {
        onboardingStep: step,
        businessType,
        experience,
        teamSize,
        businessDescription,
        primaryContact,
        location: {
          address,
          city,
          coordinates: [77.209, 28.613] // Default Delhi center
        },
        bankDetails: {
          accountHolderName,
          bankName,
          accountNumber,
          ifscCode,
          accountType
        },
        kycDetails: {
          aadharNumber,
          panNumber,
          gstNumber: isGstRegistered ? gstNumber : "",
          businessName
        },
        availability: { days, slots },
        serviceAreas,
        // Step 3: included in every save so it's always persisted correctly
        customServices: customServicesPayload
      };

      await api.put('/partner/onboarding', payload);
      setCurrentStep(step);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save progress.');
    } finally {
      setApiLoading(false);
    }
  };


  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('Please accept Terms & Privacy Policy.');
      return;
    }

    setApiLoading(true);
    try {
      // First account registration
      const { data } = await api.post('/partner/signup', {
        name,
        email,
        phone,
        category: 'Home Painting', // Default initial category placeholder
        password
      });

      if (data.success && data.token) {
        localStorage.setItem('nexora_token', data.token);
        localStorage.setItem('nexora_role', 'vendor');
        await saveProgress(2);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Registration step 1 failed.');
    } finally {
      setApiLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setApiLoading(true);
    try {
      await saveProgress(7);
      const { data } = await api.post('/partner/kyc/submit');
      if (data.success) {
        setSuccessMsg("Onboarding submitted successfully! Redirecting to your application status...");
        setTimeout(() => {
          router.push('/partner/status');
        }, 2500);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Final submission failed.');
    } finally {
      setApiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1D3B31] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
        <p className="text-white/75 font-medium text-sm">Loading your application...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-cream">

      {/* ─── LEFT BRANDING PANEL (40%) — Desktop only ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-[38%] bg-[#1D3B31] text-white flex-col justify-between fixed top-0 left-0 h-screen overflow-y-auto">
        {/* Top Brand */}
        <div className="px-10 pt-12">
          <div className="font-serif text-3xl font-bold tracking-tight text-white mb-2">Nexora</div>
          <div className="text-[10px] uppercase font-extrabold tracking-widest text-gold/80">Service Partner Portal</div>
        </div>

        {/* Hero Content */}
        <div className="px-10 py-8 space-y-8">
          <div className="space-y-4">
            <div className="inline-block bg-gold/15 border border-gold/25 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-gold">
              Join 500+ Service Partners
            </div>
            <h1 className="font-serif text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              Become a Nexora<br />
              <span className="text-gold">Service Partner</span>
            </h1>
            <p className="text-white/65 text-sm leading-relaxed max-w-sm">
              Grow your service business with Nexora and reach premium customers across Delhi NCR. Secure payments, real bookings, zero hassle.
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-3.5">
            {[
              { icon: '📍', title: 'Reach More Customers', desc: 'Get matched with customers in your service areas automatically' },
              { icon: '📅', title: 'Manage Bookings Easily', desc: 'Accept, track and complete bookings from your dashboard' },
              { icon: '💰', title: 'Secure & Fast Payments', desc: 'Cashfree-powered payouts directly to your registered bank account' },
              { icon: '📈', title: 'Grow Your Business', desc: 'Analytics, ratings, and promotions to build customer trust' },
              { icon: '🔒', title: 'Verified Professional Network', desc: 'KYC-verified partners earn premium customer confidence' },
              { icon: '⭐', title: 'Build Customer Trust', desc: 'Ratings and reviews help you stand out from the competition' },
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors">
                <span className="text-xl flex-shrink-0 mt-0.5">{b.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{b.title}</p>
                  <p className="text-xs text-white/50 leading-relaxed mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="px-10 pb-10">
          <div className="border-t border-white/10 pt-6 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <p className="text-xs text-white/40">100% KYC-Verified • Secure Platform • Real Bookings</p>
          </div>
        </div>
      </div>

      {/* ─── MOBILE TOP BANNER ────────────────────────────────────────────────── */}
      <div className="lg:hidden bg-[#1D3B31] text-white px-6 py-8">
        <div className="font-serif text-2xl font-bold text-white mb-1">Nexora</div>
        <h2 className="font-serif text-xl font-bold leading-tight mb-2">
          Become a <span className="text-gold">Service Partner</span>
        </h2>
        <p className="text-white/60 text-xs leading-relaxed">
          Grow your business. Reach customers across Delhi NCR. Secure payments.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {['Verified Bookings', 'Fast Payouts', 'Easy Dashboard', 'Build Reviews'].map(tag => (
            <span key={tag} className="text-[10px] font-bold bg-gold/15 border border-gold/25 text-gold px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL (60%) ───────────────────────────────────────────── */}
      <div className="w-full lg:ml-[40%] xl:ml-[38%] lg:w-3/5 xl:w-[62%] min-h-screen flex flex-col">
        <div className="flex-1 py-8 px-4 sm:px-8 lg:px-10 xl:px-12">
          <div className="max-w-2xl mx-auto">

            {/* Form Card */}
            <div className="bg-white border border-gold/20 rounded-3xl shadow-xl overflow-hidden">

              {/* Mobile/Tablet inner header — Desktop sees left panel instead */}
              <div className="lg:hidden bg-cream/50 border-b border-gold/10 px-6 py-4">
                <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider">Registration Wizard</p>
              </div>

              {/* Desktop form header */}
              <div className="hidden lg:block bg-[#1D3B31]/5 border-b border-gold/10 px-8 py-5">
                <h2 className="font-serif text-xl font-bold text-primary">Service Partner Registration</h2>
                <p className="text-xs text-foreground/50 mt-0.5">Complete all 7 steps to submit your application for review</p>
              </div>

              {/* Steps Progress Header */}
              <div className="bg-cream/40 border-b border-gold/10 px-6 py-4 overflow-x-auto">
                <div className="flex justify-between gap-2 min-w-max">
                  {[
                    { num: 1, label: 'Account' },
                    { num: 2, label: 'Business' },
                    { num: 3, label: 'Services' },
                    { num: 4, label: 'Areas' },
                    { num: 5, label: 'KYC' },
                    { num: 6, label: 'Bank' },
                    { num: 7, label: 'Review' }
                  ].map(s => (
                    <div key={s.num} className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        currentStep === s.num ? 'bg-[#1D3B31] text-white' : 
                        currentStep > s.num ? 'bg-gold/25 text-primary' : 'bg-gold/10 text-foreground/45'
                      }`}>
                        {currentStep > s.num ? '✓' : s.num}
                      </span>
                      <span className={`text-xs font-semibold hidden sm:block ${
                        currentStep === s.num ? 'text-primary' : 'text-foreground/50'
                      }`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

        <div className="p-6 sm:p-10">
          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-2 items-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-700 font-bold leading-normal">{successMsg}</p>
            </div>
          )}

          {/* STEP 1: Account Info */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <input 
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Enter full name" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Mobile *</label>
                  <input 
                    type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="10-digit mobile" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Email Address *</label>
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@business.com" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider font-sans">Password *</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••" className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider font-sans">Confirm Password *</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••" className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Business Name *</label>
                  <input 
                    type="text" required value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Dynamic Painting Solutions" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Business Type *</label>
                  <select 
                    value={businessType} onChange={e => setBusinessType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gold/30 bg-white focus:outline-none"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Company">Company</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2">
                <input 
                  id="terms" type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-gold/30 text-primary accent-primary mt-0.5"
                />
                <label htmlFor="terms" className="text-xs text-foreground/60 leading-normal">
                  I accept the partner Terms & Conditions and Privacy Policies.
                </label>
              </div>

              <button 
                type="submit" disabled={apiLoading}
                className="w-full py-3.5 bg-primary text-white rounded-full font-bold hover:bg-primary/95 transition-all text-sm flex items-center justify-center gap-2"
              >
                {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register & Continue'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Business Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Experience (Years) *</label>
                  <input 
                    type="number" value={experience} onChange={e => setExperience(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Team Size *</label>
                  <input 
                    type="number" value={teamSize} onChange={e => setTeamSize(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Primary Contact Person Name *</label>
                <input 
                  type="text" value={primaryContact} onChange={e => setPrimaryContact(e.target.value)}
                  placeholder="Manager / Owner Name" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Business Description *</label>
                <textarea 
                  value={businessDescription} onChange={e => setBusinessDescription(e.target.value)}
                  placeholder="Describe your services, specializations, etc." rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Business Address *</label>
                <input 
                  type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Office or home office address" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">City *</label>
                  <input 
                    type="text" value={city} onChange={e => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">State *</label>
                  <input 
                    type="text" value={state} onChange={e => setState(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Pincode *</label>
                  <input 
                    type="text" value={pincode} onChange={e => setPincode(e.target.value)}
                    placeholder="110001" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setCurrentStep(1)} 
                  className="w-1/3 py-3 border border-primary/30 text-primary rounded-full font-bold hover:bg-cream/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={() => saveProgress(3)} disabled={apiLoading}
                  className="w-2/3 py-3 bg-[#1D3B31] text-white rounded-full font-bold hover:bg-[#1D3B31]/95 transition-all flex items-center justify-center gap-2"
                >
                  {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Continue'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Services Select */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <p className="text-xs text-foreground/60 leading-normal mb-4">
                Choose the services you provide. You may optionally override the base price with your customized vendor quote if needed.
              </p>

              {allCategories.map(cat => (
                <div key={cat._id} className="border border-gold/15 rounded-2xl p-4 bg-cream/10">
                  <h3 className="font-serif font-bold text-primary text-base mb-3 border-b border-gold/10 pb-1.5">{cat.name}</h3>
                  <div className="space-y-4">
                    {cat.services?.map((svc: any) => {
                      const isSelected = selectedServices.some(s => (s._id || s) === svc._id);
                      return (
                        <div key={svc._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2.5">
                          <div className="flex items-start gap-2.5">
                            <input 
                              type="checkbox" checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedServices(selectedServices.filter(s => (s._id || s) !== svc._id));
                                } else {
                                  setSelectedServices([...selectedServices, svc]);
                                }
                              }}
                              className="h-4.5 w-4.5 rounded border-gold/30 text-primary accent-primary mt-1"
                            />
                            <div>
                              <h4 className="font-bold text-sm text-primary">{svc.name}</h4>
                              <p className="text-xs text-foreground/50">{svc.description || 'Premium service option'}</p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-2 pl-7 sm:pl-0">
                              <span className="text-xs text-foreground/60">Standard: ₹{svc.basePrice}</span>
                              <input 
                                type="number" placeholder="Override (₹)"
                                value={pricingOverrides[svc._id] || ''}
                                onChange={e => {
                                  setPricingOverrides({
                                    ...pricingOverrides,
                                    [svc._id]: parseInt(e.target.value) || 0
                                  });
                                }}
                                className="w-28 px-2 py-1 text-xs rounded border border-gold/30 focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setCurrentStep(2)} 
                  className="w-1/3 py-3 border border-primary/30 text-primary rounded-full font-bold hover:bg-cream/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={() => saveProgress(4)} disabled={apiLoading}
                  className="w-2/3 py-3 bg-[#1D3B31] text-white rounded-full font-bold hover:bg-[#1D3B31]/95 transition-all flex items-center justify-center gap-2"
                >
                  {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Continue'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Areas & Availability */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-primary mb-2 uppercase tracking-wider">Service Areas (Delhi NCR) *</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" value={newAreaInput} onChange={e => setNewAreaInput(e.target.value)}
                    placeholder="Enter city or locality (e.g. Noida Sector 62)"
                    className="flex-1 px-4 py-2 rounded-xl border border-gold/30 focus:outline-none text-sm"
                  />
                  <button 
                    onClick={() => {
                      if (newAreaInput.trim() && !serviceAreas.includes(newAreaInput.trim())) {
                        setServiceAreas([...serviceAreas, newAreaInput.trim()]);
                        setNewAreaInput('');
                      }
                    }}
                    className="px-4 bg-[#1D3B31] text-white font-bold rounded-xl text-xs hover:bg-[#1D3B31]/95"
                  >
                    Add Area
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {serviceAreas.map(a => (
                    <span key={a} className="inline-flex items-center gap-1.5 bg-cream px-3 py-1 rounded-full text-xs font-semibold text-primary border border-gold/15">
                      {a}
                      <button onClick={() => setServiceAreas(serviceAreas.filter(x => x !== a))} className="text-red-500 hover:text-red-700 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-2 uppercase tracking-wider">Available Days *</label>
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
                        className={`py-2 rounded-xl text-xs font-bold border ${active ? 'bg-primary text-white border-primary' : 'bg-cream text-foreground/75 border-gold/20'}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-2 uppercase tracking-wider">Available Time Slots *</label>
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
                        className={`py-3 rounded-xl text-xs font-bold border ${active ? 'bg-primary text-white border-primary' : 'bg-cream text-foreground/75 border-gold/20'}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setCurrentStep(3)} 
                  className="w-1/3 py-3 border border-primary/30 text-primary rounded-full font-bold hover:bg-cream/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={() => saveProgress(5)} disabled={apiLoading}
                  className="w-2/3 py-3 bg-[#1D3B31] text-white rounded-full font-bold hover:bg-[#1D3B31]/95 transition-all flex items-center justify-center gap-2"
                >
                  {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Continue'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: KYC Verification */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-cream rounded-2xl border border-gold/15 mb-4">
                <span className="text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> KYC Verification
                </span>
                <p className="text-xs text-foreground/60 leading-relaxed mt-1">
                  Your verification information is securely handled and is only visible to authorized Nexora administrators.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Aadhaar Card Number *</label>
                <input 
                  type="text" required 
                  value={aadharNumber.replace(/(\d{4})(?=\d)/g, '$1 ')} 
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setAadharNumber(raw);
                  }}
                  placeholder="XXXX XXXX XXXX" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none font-mono text-lg tracking-widest bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">PAN Card Number *</label>
                <input 
                  type="text" maxLength={10} required 
                  value={panNumber} 
                  onChange={e => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none font-mono text-lg tracking-widest bg-white uppercase"
                />
              </div>

              <div className="flex items-center gap-2.5 py-2">
                <input 
                  id="gstToggle" type="checkbox" checked={isGstRegistered} onChange={e => setIsGstRegistered(e.target.checked)}
                  className="h-4.5 w-4.5 text-primary accent-primary"
                />
                <label htmlFor="gstToggle" className="text-xs font-bold text-foreground/75">I have a GSTIN for my business</label>
              </div>

              {isGstRegistered && (
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">GSTIN Number *</label>
                  <input 
                    type="text" maxLength={15} value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none font-mono text-lg tracking-widest bg-white uppercase"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setCurrentStep(4)} 
                  className="w-1/3 py-3 border border-primary/30 text-primary rounded-full font-bold hover:bg-cream/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={() => saveProgress(6)} disabled={apiLoading}
                  className="w-2/3 py-3 bg-[#1D3B31] text-white rounded-full font-bold hover:bg-[#1D3B31]/95 transition-all flex items-center justify-center gap-2"
                >
                  {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Continue'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Bank Details */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="p-4 bg-cream rounded-2xl border border-gold/15 mb-4">
                <span className="text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-4 h-4" /> Financial Setup
                </span>
                <p className="text-xs text-foreground/60 leading-relaxed mt-1">
                  Enter your business bank account details to receive payouts. This information is encrypted and securely stored.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Account Holder Name *</label>
                <input 
                  type="text" required value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)}
                  placeholder="As in bank records" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Bank Name *</label>
                  <input 
                    type="text" required value={bankName} onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Account Type *</label>
                  <select 
                    value={accountType} onChange={e => setAccountType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gold/30 bg-white focus:outline-none"
                  >
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Account Number *</label>
                  <input 
                    type="text" required value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter account number" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 bg-white focus:outline-none font-mono tracking-widest text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">IFSC Code *</label>
                  <input 
                    type="text" maxLength={11} required value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="SBIN0000123" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 bg-white focus:outline-none font-mono uppercase tracking-widest text-lg"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setCurrentStep(5)} 
                  className="w-1/3 py-3 border border-primary/30 text-primary rounded-full font-bold hover:bg-cream/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={() => saveProgress(7)} disabled={apiLoading}
                  className="w-2/3 py-3 bg-[#1D3B31] text-white rounded-full font-bold hover:bg-[#1D3B31]/95 transition-all flex items-center justify-center gap-2"
                >
                  {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Continue'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: Final Review */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="p-4 bg-cream rounded-2xl border border-gold/15 mb-4">
                <p className="text-xs text-foreground/60 leading-relaxed">
                  Please review your information carefully before final submission. Approved vendors can get immediate service match listings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3.5">
                  <div>
                    <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-1">Account & Profile</h4>
                    <p className="text-primary font-serif font-bold text-base">{name}</p>
                    <p className="text-foreground/70">{email} | {phone}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-1">Business Specs</h4>
                    <p className="text-primary font-bold">{businessName} ({businessType})</p>
                    <p className="text-foreground/70">{experience} Years Experience | Team of {teamSize}</p>
                    <p className="text-foreground/60 text-xs italic mt-1">"{businessDescription}"</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-1">Office Location</h4>
                    <p className="text-foreground/75">{address}, {city}, {state}</p>
                  </div>
                </div>

                <div className="space-y-3.5 border-t md:border-t-0 md:border-l border-gold/10 pt-4 md:pt-0 md:pl-6">
                  <div>
                    <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-1">Services Provided</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedServices.map(s => (
                        <span key={s._id} className="bg-cream px-2 py-0.5 rounded text-xs border border-gold/15 font-semibold text-primary">
                          {s.name} {pricingOverrides[s._id] ? `(₹${pricingOverrides[s._id]})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-1">Areas & Availability</h4>
                    <p className="text-foreground/75"><span className="font-bold">Areas:</span> {serviceAreas.join(', ')}</p>
                    <p className="text-foreground/75"><span className="font-bold">Slots:</span> {slots.join(', ')} on {days.join(', ')}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-1">Verified KYC Details</h4>
                    <p className="text-foreground/75 font-mono">Aadhaar: *******{aadharNumber.slice(-4)}</p>
                    <p className="text-foreground/75 font-mono">PAN: *****{panNumber.slice(-4)}</p>
                    {isGstRegistered && <p className="text-foreground/75 font-mono">GSTIN: {gstNumber}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gold/10">
                <button 
                  onClick={() => setCurrentStep(6)} 
                  className="w-1/3 py-3 border border-primary/30 text-primary rounded-full font-bold hover:bg-cream/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={handleFinalSubmit} disabled={apiLoading}
                  className="w-2/3 py-3.5 bg-emerald-700 text-white rounded-full font-bold hover:bg-emerald-800 transition-all flex items-center justify-center gap-2"
                >
                  {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Verification'} <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-foreground/50 border-t border-gold/10 pt-6">
            Already have an account?{' '}
            <Link href="/partner/login" className="font-bold text-primary hover:underline">Log In</Link>
          </div>
        </div>
      </div>{/* end form card */}

          </div>{/* end max-w-2xl */}
        </div>{/* end py-8 px-4 */}
      </div>{/* end right panel */}

    </div>
  );
}

