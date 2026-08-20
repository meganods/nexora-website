"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, CheckCircle, Clock, AlertTriangle, LogOut, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerStatusPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/partner/profile');
      if (data?.vendor) {
        setVendor(data.vendor);
        if (data.vendor.kycStatus === 'APPROVED') {
          router.replace('/partner/dashboard');
          return;
        }
      } else {
        router.replace('/partner/login');
      }
    } catch (err) {
      console.error(err);
      router.replace('/partner/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('partner_token');
    localStorage.removeItem('partner_role');
    router.replace('/partner/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const kycStatus = vendor?.kycStatus || 'KYC_NOT_STARTED';

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-gold/20 rounded-3xl shadow-xl p-8 text-center space-y-6">
        
        <div className="flex justify-center">
          {kycStatus === 'REJECTED' ? (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 animate-pulse">
              <Clock className="w-10 h-10" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-primary">
            {kycStatus === 'REJECTED' ? 'Application Rejected' : 'Application Pending Review'}
          </h1>
          <p className="text-xs text-foreground/50">
            {kycStatus === 'REJECTED' ? 'Please review rejection details below' : 'Our team is verifying your partner details'}
          </p>
        </div>

        {kycStatus === 'REJECTED' && (
          <div className="bg-red-50/50 border border-red-100/80 rounded-2xl p-4 text-left space-y-2">
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Rejection Feedback
            </span>
            <p className="text-xs text-red-800 font-semibold leading-relaxed">
              {vendor?.kycDetails?.reviewNote || vendor?.rejectionReason || 'Your application requires correction. Please review details.'}
            </p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {kycStatus === 'REJECTED' ? (
            <button 
              onClick={() => router.push('/partner/register')}
              className="w-full py-3 bg-[#1D3B31] text-white rounded-full font-bold hover:bg-[#1D3B31]/95 transition-all text-xs flex items-center justify-center gap-1.5"
            >
              Correct Info & Resubmit <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="bg-cream/40 rounded-2xl p-4 border border-gold/10 text-xs text-foreground/60 leading-relaxed text-left">
              <span className="font-bold text-primary block mb-1">Submitted Information:</span>
              <ul className="space-y-1 list-disc list-inside">
                <li>Business: {vendor?.kycDetails?.businessName}</li>
                <li>Email: {vendor?.email}</li>
                <li>Phone: {vendor?.phone}</li>
              </ul>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="w-full py-3 border border-red-200 text-red-700 hover:bg-red-50/30 rounded-full font-bold transition-all text-xs flex items-center justify-center gap-1.5"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}
