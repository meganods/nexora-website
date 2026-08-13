"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowRight, CheckCircle2, AlertTriangle, FileText, Landmark, FileCheck } from 'lucide-react';
import api from '@/lib/api';


export default function PartnerKycWizard() {
  const router = useRouter();

  const [partner, setPartner] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState('KYC_NOT_STARTED');
  const [loading, setLoading] = useState(true);

  // Verification Input States
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharOtp, setAadharOtp] = useState('');
  const [sentAadharOtp, setSentAadharOtp] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchPartnerProfile();
  }, []);

  const fetchPartnerProfile = async (retry = true) => {
    setLoading(true);
    try {
      const { data } = await api.get('/partner/profile');
      if (data?.vendor) {
        setPartner(data.vendor);
        setKycStatus(data.vendor.kycStatus || 'KYC_NOT_STARTED');
        setAadharNumber(data.vendor.kycDetails?.aadharNumber || '');
        setPanNumber(data.vendor.kycDetails?.panNumber || '');
        setGstNumber(data.vendor.kycDetails?.gstNumber || '');

        // KYC status redirect bypassed:
        // we comment this out so they can see/test the KYC page even if approved
        /*
        if (data.vendor.kycStatus === 'APPROVED') {
          router.push('/partner/dashboard');
        }
        */
      }
    } catch (e) {
      console.error("Failed to load partner details", e);

      router.push('/partner/login');
    } finally {
      setLoading(false);
    }
  };


  // Step 1: Submit Aadhaar & Send OTP
  const handleSendAadharOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!/^\d{12}$/.test(aadharNumber)) {
      setErrorMsg('Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setActionLoading(true);
    try {
      const { data } = await api.post('/partner/kyc/aadhar', { aadharNumber });
      if (data.success) {
        setSentAadharOtp(true);
        if (data.otp) setDevOtp(data.otp);
        setSuccessMsg('Verification code sent to Aadhaar-registered mobile.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Aadhaar submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Aadhaar OTP
  const handleVerifyAadharOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);
    try {
      const { data } = await api.post('/partner/kyc/aadhar/verify', { otp: aadharOtp });
      if (data.success) {
        setPartner(data.vendor);
        setSuccessMsg('Aadhaar successfully verified.');
        setSentAadharOtp(false);
        fetchPartnerProfile();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Submit PAN
  const handleValidatePan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      setErrorMsg('Please enter a valid PAN card number (e.g. ABCDE1234F).');
      return;
    }

    setActionLoading(true);
    try {
      const { data } = await api.post('/partner/kyc/pan', { panNumber });
      if (data.success) {
        setPartner(data.vendor);
        setSuccessMsg('PAN validated and saved.');
        fetchPartnerProfile();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'PAN validation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: Submit GST (Optional)
  const handleSaveGst = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    setActionLoading(true);
    try {
      const { data } = await api.post('/partner/kyc/gst', { gstNumber });
      if (data.success) {
        setPartner(data.vendor);
        setSuccessMsg('GST details updated successfully.');
        fetchPartnerProfile();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'GST update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Final step: Submit for Admin Review
  const handleSubmitFinalReview = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);
    try {
      const { data } = await api.post('/partner/kyc/submit');
      if (data.success) {
        setKycStatus('PENDING_ADMIN_APPROVAL');
        setSuccessMsg('KYC submitted for review.');
        fetchPartnerProfile();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'KYC final submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Determine current active step
  const aadharDone = partner?.kycDetails?.aadharVerified;
  const panDone = partner?.kycDetails?.panVerified;
  const gstDone = partner?.kycDetails?.gstVerified || gstNumber === ''; // Optional

  return (
    <div className="min-h-screen bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-gold/20 shadow-xl shadow-primary/5">
        
        {/* Onboarding Header */}
        <div className="text-center mb-8">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary">Onboarding & KYC</h1>
          <p className="text-xs sm:text-sm text-foreground/50 mt-1">Complete your verification to receive bookings</p>
        </div>

        {/* Global Warnings/Status logs */}
        {kycStatus === 'PENDING_ADMIN_APPROVAL' && (
          <div className="mb-8 p-5 bg-[#1D3B31]/10 border border-[#1D3B31]/20 rounded-2xl text-center">
            <CheckCircle2 className="w-8 h-8 text-[#1D3B31] mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[#1D3B31]">KYC Submitted</h3>
            <p className="text-xs text-[#1D3B31]/80 mt-1 leading-relaxed">
              Your profile is currently under review by Nexora Admins. You will be allowed access to the Service Partner Dashboard once approved.
            </p>
          </div>
        )}

        {kycStatus === 'REJECTED' && (
          <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-red-900">KYC Rejected</h3>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Rejection Reason: {partner?.kycDetails?.reviewNote || 'Incomplete verification parameters'}. Please correct details and resubmit.
            </p>
            <button onClick={() => setKycStatus('KYC_NOT_STARTED')}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all">
              Restart Resubmission
            </button>
          </div>
        )}

        {/* KYC Step Wizards */}
        {(kycStatus === 'KYC_NOT_STARTED' || kycStatus === 'KYC_IN_PROGRESS' || kycStatus === 'REJECTED') && (
          <div className="space-y-6">
            
            {/* Step 1: Aadhaar */}
            <div className={`p-5 rounded-2xl border transition-all ${aadharDone ? 'bg-green-50/50 border-green-200' : 'bg-cream/40 border-gold/20'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gold" /> Step 1: Aadhaar Verification
                </h3>
                {aadharDone && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Verified</span>}
              </div>

              {!aadharDone && (
                <form onSubmit={handleSendAadharOtp} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text" required value={aadharNumber.replace(/(\d{4})(?=\d)/g, '$1 ')} 
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setAadharNumber(raw);
                      }}
                      disabled={sentAadharOtp}
                      placeholder="XXXX XXXX XXXX"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gold/30 bg-white font-mono tracking-widest text-lg focus:outline-none"
                    />
                    <button type="submit" disabled={actionLoading || sentAadharOtp}
                      className="px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all">
                      Send OTP
                    </button>
                  </div>
                </form>
              )}

              {sentAadharOtp && (
                <form onSubmit={handleVerifyAadharOtp} className="mt-4 p-4 bg-white rounded-xl border border-gold/15 space-y-3">
                  <p className="text-xs text-foreground/50">Enter the verification OTP code. {devOtp && <span className="font-mono text-gold">(Mock OTP: {devOtp})</span>}</p>
                  <div className="flex gap-2">
                    <input
                      type="text" maxLength={4} value={aadharOtp} onChange={e => setAadharOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="4-digit OTP"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gold/30 bg-cream text-sm focus:outline-none"
                    />
                    <button type="submit" disabled={actionLoading}
                      className="px-4 bg-[#1D3B31] text-white text-xs font-bold rounded-xl hover:bg-[#1D3B31]/95 transition-all">
                      Verify OTP
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Step 2: PAN Details */}
            <div className={`p-5 rounded-2xl border transition-all ${!aadharDone ? 'opacity-50 pointer-events-none' : ''} ${panDone ? 'bg-green-50/50 border-green-200' : 'bg-cream/40 border-gold/20'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-gold" /> Step 2: PAN Details
                </h3>
                {panDone && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Validated</span>}
              </div>

              {!panDone && aadharDone && (
                <form onSubmit={handleValidatePan} className="flex gap-2">
                  <input
                    type="text" maxLength={10} required value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gold/30 bg-white font-mono tracking-widest text-lg uppercase focus:outline-none"
                  />
                  <button type="submit" disabled={actionLoading}
                    className="px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all">
                    Validate
                  </button>
                </form>
              )}
            </div>

            {/* Step 3: GST Details (Optional) */}
            <div className={`p-5 rounded-2xl border transition-all ${!panDone ? 'opacity-50 pointer-events-none' : ''} bg-cream/40 border-gold/20`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-gold" /> Step 3: GST Details (Optional)
                </h3>
              </div>

              {panDone && (
                <form onSubmit={handleSaveGst} className="flex gap-2">
                  <input
                    type="text" maxLength={15} value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="15-digit GSTIN (Optional)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gold/30 bg-white text-sm focus:outline-none uppercase font-mono"
                  />
                  <button type="submit" disabled={actionLoading}
                    className="px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all">
                    Save GST
                  </button>
                </form>
              )}
            </div>

            {errorMsg && <p className="text-red-500 text-xs font-semibold bg-red-50 rounded-xl p-3 border border-red-100">{errorMsg}</p>}
            {successMsg && <p className="text-green-700 text-xs font-semibold bg-green-50 rounded-xl p-3 border border-green-100">{successMsg}</p>}

            {/* Step 4: Final Submission */}
            <button
              onClick={handleSubmitFinalReview}
              disabled={actionLoading || !aadharDone || !panDone}
              className="w-full mt-6 py-3.5 bg-primary text-white rounded-full font-bold hover:bg-primary/95 transition-all text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit KYC for Admin Approval'}
            </button>

          </div>
        )}
      </div>
    </div>
  );
}
