"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, User, Mail, Lock, Phone, Wrench, Eye, EyeOff, Loader2, Star, 
  FileText, Briefcase, Users, MapPin, Calendar, Clock, CreditCard, Landmark, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Search 
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Step 4: Areas & Availability
  const [days, setDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  const [slots, setSlots] = useState<string[]>(['Morning', 'Afternoon', 'Evening']);
  const [serviceAreas, setServiceAreas] = useState<string[]>(['Delhi NCR']);
  const [newAreaInput, setNewAreaInput] = useState('');
  const [availableAreas, setAvailableAreas] = useState<any[]>([]);

  // Step 5: KYC details
  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [isGstRegistered, setIsGstRegistered] = useState(false);
  const [aadharVerified, setAadharVerified] = useState(false);
  const [aadharName, setAadharName] = useState('');
  const [aadharDob, setAadharDob] = useState('');
  const [panVerified, setPanVerified] = useState(false);
  const [panName, setPanName] = useState('');
  const [gstVerified, setGstVerified] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [aadharError, setAadharError] = useState('');
  const [panError, setPanError] = useState('');
  const [gstError, setGstError] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);

  // Step 6: Bank details
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState('Savings');

  useEffect(() => {
    fetchPublicCategories();
    fetchAvailableAreas();
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

  const fetchAvailableAreas = async () => {
    try {
      const { data } = await api.get('/locations/public/areas?limit=1000&isActive=true');
      setAvailableAreas(data?.data || []);
    } catch (e) {
      console.error("Failed to fetch platform areas", e);
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
          setAadharVerified(!!v.kycDetails?.aadharVerified);
          setAadharName(v.kycDetails?.aadharName || '');
          setAadharDob(v.kycDetails?.aadharDob || '');
          setPanNumber(v.kycDetails?.panNumber || '');
          setPanVerified(!!v.kycDetails?.panVerified);
          setPanName(v.kycDetails?.panName || '');
          setGstNumber(v.kycDetails?.gstNumber || '');
          setGstVerified(!!v.kycDetails?.gstVerified);
          setIsGstRegistered(!!v.kycDetails?.gstNumber);

          setAccountHolderName(v.bankDetails?.accountHolderName || '');
          setBankName(v.bankDetails?.bankName || '');
          setAccountNumber(v.bankDetails?.accountNumber || '');
          setIfscCode(v.bankDetails?.ifscCode || '');
          setAccountType(v.bankDetails?.accountType || 'Savings');

          setSelectedCategories(v.category ? v.category.split(', ') : []);
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
        category: selectedCategories.join(', '),
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
          businessName,
          aadharVerified,
          aadharName,
          aadharDob,
          panVerified,
          panName,
          gstVerified
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


  const handleVerifyAadhar = async () => {
    if (!/^\d{12}$/.test(aadharNumber)) {
      setAadharError("Aadhaar must be a 12-digit number.");
      return;
    }
    setAadharError('');
    setApiLoading(true);
    try {
      const { data } = await api.post('/partner/kyc/aadhar', { aadharNumber });
      if (data.success) {
        setShowOtpField(true);
        setSuccessMsg("Mock verification OTP '1234' sent to registered mobile number!");
      }
    } catch (err: any) {
      setAadharError(err.response?.data?.message || "Failed to start Aadhaar verification.");
    } finally {
      setApiLoading(false);
    }
  };

  const handleVerifyAadharOtp = async () => {
    if (otpInput !== "1234") {
      setAadharError("Invalid Mock OTP. Use '1234'.");
      return;
    }
    setAadharError('');
    setApiLoading(true);
    try {
      const { data } = await api.post('/partner/kyc/aadhar/verify', { otp: otpInput });
      if (data.success) {
        setAadharVerified(true);
        setAadharName(data.vendor?.kycDetails?.aadharName || name);
        setAadharDob(data.vendor?.kycDetails?.aadharDob || "15-08-1990");
        setShowOtpField(false);
        setSuccessMsg("Aadhaar verified successfully!");
      }
    } catch (err: any) {
      setAadharError(err.response?.data?.message || "Aadhaar verification failed.");
    } finally {
      setApiLoading(false);
    }
  };

  const handleVerifyPan = async () => {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      setPanError("Please enter a valid 10-character PAN number (e.g. ABCDE1234F).");
      return;
    }
    setPanError('');
    setApiLoading(true);
    try {
      const { data } = await api.post('/partner/kyc/pan', { panNumber });
      if (data.success) {
        setPanVerified(true);
        setPanName(data.vendor?.kycDetails?.panName || name.toUpperCase());
        setSuccessMsg("PAN Card verified successfully!");
      }
    } catch (err: any) {
      setPanError(err.response?.data?.message || "PAN verification failed.");
    } finally {
      setApiLoading(false);
    }
  };

  const handleVerifyGst = async () => {
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
      setGstError("Please enter a valid 15-character GSTIN format.");
      return;
    }
    setGstError('');
    setApiLoading(true);
    try {
      const { data } = await api.post('/partner/kyc/gst', { gstNumber });
      if (data.success) {
        setGstVerified(true);
        setSuccessMsg("GST details verified successfully!");
      }
    } catch (err: any) {
      setGstError(err.response?.data?.message || "GST verification failed.");
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
          <div className="w-full max-w-4xl mx-auto">

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
                Choose the categories of services you provide. Multiple selections are allowed. You will be able to customize your service list after admin approval.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allCategories.map(cat => {
                  const isSelected = selectedCategories.includes(cat.name);
                  return (
                    <div 
                      key={cat._id} 
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCategories(selectedCategories.filter(c => c !== cat.name));
                        } else {
                          setSelectedCategories([...selectedCategories, cat.name]);
                        }
                      }}
                      className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-32 ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-gold/20 bg-white hover:border-gold/45 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-serif font-bold text-primary text-base">{cat.name}</div>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          readOnly
                          className="h-5 w-5 rounded border-gold/30 text-primary accent-primary cursor-pointer mt-0.5"
                        />
                      </div>
                      <p className="text-xs text-foreground/50 line-clamp-2 mt-2">{cat.description || 'Professional home service category'}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setCurrentStep(2)} 
                  className="w-1/3 py-3 border border-primary/30 text-primary rounded-full font-bold hover:bg-cream/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={() => {
                    if (selectedCategories.length === 0) {
                      setErrorMsg("Please select at least one service category.");
                      return;
                    }
                    saveProgress(4);
                  }} 
                  disabled={apiLoading}
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
                <div className="flex flex-wrap gap-2.5">
                  {availableAreas.length === 0 ? (
                    <p className="text-xs text-foreground/40 italic">No areas available. Please contact admin.</p>
                  ) : (
                    availableAreas.map(area => {
                      const active = serviceAreas.includes(area.name);
                      return (
                        <button 
                          key={area._id} 
                          type="button"
                          onClick={() => {
                            if (active) {
                              setServiceAreas(serviceAreas.filter(x => x !== area.name));
                            } else {
                              setServiceAreas([...serviceAreas, area.name]);
                            }
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            active 
                              ? 'bg-primary text-white border-primary shadow-sm' 
                              : 'bg-cream text-foreground/75 border-gold/20 hover:border-gold/35'
                          }`}
                        >
                          {area.name}
                        </button>
                      );
                    })
                  )}
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
            <div className="space-y-8">
              <div className="p-4 bg-cream/40 rounded-2xl border border-gold/15">
                <span className="text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Secure Verification System
                </span>
                <p className="text-xs text-foreground/50 leading-relaxed mt-1">
                  Please verify your credentials. Once verified, the details from government databases will be displayed and saved.
                </p>
              </div>

              {/* Part 1: Aadhaar Card */}
              <div className="border border-gold/15 p-6 rounded-3xl bg-cream/10 space-y-4">
                <div className="flex justify-between items-center border-b border-gold/10 pb-3">
                  <h3 className="font-serif font-bold text-primary text-base">Part 1: Aadhaar Card Verification</h3>
                  {aadharVerified && <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">Verified ✓</span>}
                </div>

                {aadharError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 items-center">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-xs text-red-700 font-bold leading-normal">{aadharError}</p>
                  </div>
                )}

                {/* Aadhaar Card Template Preview */}
                <div className="w-full max-w-sm mx-auto bg-gradient-to-br from-orange-50/30 via-white to-sky-50 border border-blue-200 rounded-2xl p-4 pt-6 pb-6 shadow-sm relative overflow-hidden font-sans text-blue-900">
                  {/* Authentic Top Saffron Band */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500"></div>
                  
                  {/* Authentic Bottom Green Band */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600"></div>

                  <div className="flex justify-between items-start border-b border-orange-200/50 pb-2 mb-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase text-orange-700">Government of India</p>
                      <p className="text-[7px] text-blue-800/70 font-semibold">Unique Identification Authority of India</p>
                    </div>
                    <span className="text-[10px] font-extrabold text-orange-600 tracking-wider">Aadhaar</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-14 h-16 bg-blue-50 border border-blue-200/80 rounded-lg flex items-center justify-center text-blue-900/30 text-[10px] font-bold">Photo</div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[11px] font-bold text-blue-900">Name: {aadharVerified ? aadharName : 'Your Full Name'}</p>
                      <p className="text-[9px] text-blue-900/75">DOB: {aadharVerified ? aadharDob : 'DD/MM/YYYY'}</p>
                      <p className="text-[9px] text-blue-900/75">Gender: Male / Female</p>
                    </div>
                  </div>
                  <div className="text-center font-mono font-bold text-sm tracking-widest text-blue-900/90 mt-4 border-t border-blue-100 pt-2">
                    {aadharNumber ? aadharNumber.replace(/(\d{4})/g, '$1 ').trim() : 'XXXX XXXX XXXX'}
                  </div>
                </div>

                {!aadharVerified ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Aadhaar Card Number *</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={aadharNumber.replace(/(\d{4})(?=\d)/g, '$1 ')} 
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                            setAadharNumber(raw);
                          }}
                          placeholder="XXXX XXXX XXXX" 
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none font-mono text-base tracking-widest bg-white"
                        />
                        {!showOtpField && (
                          <button 
                            type="button"
                            onClick={handleVerifyAadhar}
                            className="px-5 bg-[#1D3B31] text-white text-xs font-bold rounded-xl hover:bg-[#1D3B31]/95 transition-all"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>

                    {showOtpField && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3">
                        <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">Enter OTP sent to Aadhaar Mobile *</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            maxLength={4}
                            value={otpInput}
                            onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 1234" 
                            className="flex-1 px-4 py-2 rounded-xl border border-blue-200 focus:outline-none font-mono text-center text-lg tracking-widest bg-white"
                          />
                          <button 
                            type="button"
                            onClick={handleVerifyAadharOtp}
                            className="px-5 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition-all"
                          >
                            Submit OTP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-xs text-emerald-800 font-medium">
                    Verified from Aadhaar database. Name: <strong>{aadharName}</strong> | DOB: <strong>{aadharDob}</strong>
                  </div>
                )}
              </div>

              {/* Part 2: PAN Card */}
              <div className="border border-gold/15 p-6 rounded-3xl bg-cream/10 space-y-4">
                <div className="flex justify-between items-center border-b border-gold/10 pb-3">
                  <h3 className="font-serif font-bold text-primary text-base">Part 2: PAN Card Verification</h3>
                  {panVerified && <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">Verified ✓</span>}
                </div>

                {panError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 items-center">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-xs text-red-700 font-bold leading-normal">{panError}</p>
                  </div>
                )}

                {/* PAN Card Template Preview */}
                <div className="w-full max-w-sm mx-auto bg-gradient-to-r from-teal-800 to-[#1D3B31] border border-teal-700 rounded-2xl p-4 shadow-md relative overflow-hidden font-sans text-white">
                  <div className="flex justify-between items-start border-b border-teal-700/50 pb-2 mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-teal-100 uppercase font-serif">Income Tax Department</p>
                      <p className="text-[8px] text-white/60">Government of India</p>
                    </div>
                    <span className="text-[9px] font-bold text-teal-300 bg-teal-950/40 border border-teal-700 px-1.5 py-0.5 rounded">Permanent Account Number</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-white/80">Name: <span className="font-bold text-white">{panVerified ? panName : 'YOUR FULL NAME'}</span></p>
                    <p className="text-[10px] text-white/80">Father's Name: <span className="font-bold text-white">{panVerified ? 'MOCK FATHER NAME' : 'FATHER\'S NAME'}</span></p>
                  </div>
                  <div className="text-center font-mono font-bold text-base tracking-widest text-white mt-4 border-t border-teal-700/50 pt-2 bg-teal-950/40 py-1 rounded border border-teal-700/30">
                    {panNumber ? panNumber : 'ABCDE1234F'}
                  </div>
                </div>

                {!panVerified ? (
                  <div>
                    <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">PAN Card Number *</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" maxLength={10} 
                        value={panNumber} 
                        onChange={e => {
                          const raw = e.target.value.replace(/[^A-Z0-9]/ig, '').toUpperCase().slice(0, 10);
                          setPanNumber(raw);
                        }}
                        placeholder="ABCDE1234F" 
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none font-mono text-base tracking-widest bg-white uppercase"
                      />
                      <button 
                        type="button"
                        onClick={handleVerifyPan}
                        className="px-5 bg-[#1D3B31] text-white text-xs font-bold rounded-xl hover:bg-[#1D3B31]/95 transition-all"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-xs text-emerald-800 font-medium">
                    Verified from Income Tax database. Name: <strong>{panName}</strong>
                  </div>
                )}
              </div>

              {/* Part 3: GSTIN (Optional) */}
              <div className="border border-gold/15 p-6 rounded-3xl bg-cream/10 space-y-4">
                <div className="flex justify-between items-center border-b border-gold/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <input 
                      id="gstToggle" type="checkbox" checked={isGstRegistered} onChange={e => setIsGstRegistered(e.target.checked)}
                      className="h-5 w-5 text-[#1D3B31] accent-[#1D3B31] cursor-pointer"
                    />
                    <label htmlFor="gstToggle" className="text-sm font-bold text-primary cursor-pointer select-none">Part 3: I have a GSTIN for my business (Optional)</label>
                  </div>
                  {isGstRegistered && gstVerified && <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">Verified ✓</span>}
                </div>

                {gstError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 items-center">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-xs text-red-700 font-bold leading-normal">{gstError}</p>
                  </div>
                )}

                {isGstRegistered && (
                  <div className="space-y-4">
                    {!gstVerified ? (
                      <div>
                        <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">GSTIN Number *</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" maxLength={15} 
                            value={gstNumber} 
                            onChange={e => {
                              const raw = e.target.value.replace(/[^A-Z0-9]/ig, '').toUpperCase().slice(0, 15);
                              setGstNumber(raw);
                            }}
                            placeholder="22AAAAA0000A1Z5" 
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none font-mono text-base tracking-widest bg-white uppercase"
                          />
                          <button 
                            type="button"
                            onClick={handleVerifyGst}
                            className="px-5 bg-[#1D3B31] text-white text-xs font-bold rounded-xl hover:bg-[#1D3B31]/95 transition-all"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-xs text-emerald-800 font-medium">
                        GSTIN verified successfully.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-4 pt-4 border-t border-gold/10">
                <button 
                  onClick={() => setCurrentStep(4)} 
                  className="w-1/3 py-3 border border-primary/30 text-primary rounded-full font-bold hover:bg-cream/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={() => {
                    if (!aadharVerified) {
                      setErrorMsg("Please verify your Aadhaar Card to proceed.");
                      return;
                    }
                    if (!panVerified) {
                      setErrorMsg("Please verify your PAN Card to proceed.");
                      return;
                    }
                    if (isGstRegistered && !gstVerified) {
                      setErrorMsg("Please verify your GSTIN or uncheck the GSTIN option to proceed.");
                      return;
                    }
                    saveProgress(6);
                  }} 
                  disabled={apiLoading}
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
                <div className="relative">
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Bank Name *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      value={bankName} 
                      onFocus={() => setShowBankDropdown(true)}
                      onBlur={() => {
                        // Delay closing slightly so onMouseDown can trigger first
                        setTimeout(() => setShowBankDropdown(false), 200);
                      }}
                      onChange={e => {
                        setBankName(e.target.value);
                        setShowBankDropdown(true);
                      }}
                      placeholder="Type to Search & Select Bank" 
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gold/30 bg-white focus:outline-none text-sm font-semibold"
                    />
                    <Search className="w-4 h-4 text-foreground/40 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>

                  {showBankDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gold/20 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto mt-1 divide-y divide-gold/5">
                      {[
                        { name: 'State Bank of India', code: 'SBIN0' },
                        { name: 'HDFC Bank', code: 'HDFC0' },
                        { name: 'ICICI Bank', code: 'ICIC0' },
                        { name: 'Axis Bank', code: 'UTIB0' },
                        { name: 'Punjab National Bank', code: 'PUNB0' },
                        { name: 'Bank of Baroda', code: 'BARB0' },
                        { name: 'Canara Bank', code: 'CNRB0' },
                        { name: 'Union Bank of India', code: 'UBIN0' },
                        { name: 'Bank of India', code: 'BKID0' },
                        { name: 'Indian Bank', code: 'IDIB0' },
                        { name: 'Central Bank of India', code: 'CBIN0' },
                        { name: 'Indian Overseas Bank', code: 'IOBA0' },
                        { name: 'UCO Bank', code: 'UCBA0' },
                        { name: 'Bank of Maharashtra', code: 'MAHB0' },
                        { name: 'Yes Bank', code: 'YESB0' },
                        { name: 'Kotak Mahindra Bank', code: 'KKBK0' },
                        { name: 'Federal Bank', code: 'FDRL0' },
                        { name: 'IDFC First Bank', code: 'IDFB0' },
                        { name: 'IndusInd Bank', code: 'INDB0' },
                        { name: 'Bandhan Bank', code: 'BDBL0' }
                      ]
                        .filter(b => b.name.toLowerCase().includes(bankName.toLowerCase()))
                        .map(b => (
                          <button
                            key={b.name}
                            type="button"
                            onMouseDown={() => {
                              setBankName(b.name);
                              setIfscCode(b.code);
                              setShowBankDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-cream/40 text-xs font-semibold text-foreground transition-all"
                          >
                            {b.name}
                          </button>
                        ))}
                    </div>
                  )}
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
                    type="text" maxLength={18} required value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
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
                    <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-1">Categories Selected</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedCategories.map(cat => (
                        <span key={cat} className="bg-cream px-2 py-0.5 rounded text-xs border border-gold/15 font-semibold text-primary">
                          {cat}
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

