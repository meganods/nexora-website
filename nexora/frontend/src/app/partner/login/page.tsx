"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, Star, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';



function PartnerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const signupSuccess = searchParams.get('signup_success') === 'true';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please fill in both email/phone and password fields.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/partner/login', {
        identifier: identifier.trim(),
        password
      });

      if (data.success && data.token) {
        localStorage.setItem('nexora_token', data.token);
        localStorage.setItem('nexora_role', 'vendor');
        router.push('/partner/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full bg-cream">
      {/* Left Column Visual Banner */}
      <div className="relative hidden lg:block overflow-hidden bg-[#1D3B31]">
        <div className="absolute inset-0 bg-[#1D3B31]/85 z-10" />
        <div className="absolute inset-0">
          <img 
            src="/images/hero-interior.png" 
            alt="Premium Home Services Partner Banner" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-20 h-full flex flex-col justify-between p-16 text-white max-w-xl">
          <div className="font-serif text-3xl font-bold tracking-tight">Nexora</div>
          
          <div className="space-y-6">
            <h2 className="font-serif text-4xl sm:text-5xl font-extrabold leading-tight">
              Grow Your Business with Nexora
            </h2>
            <p className="text-white/70 text-base leading-relaxed">
              Join Nexora and connect with customers looking for trusted professionals. Manage leads, track bookings, and increase earnings.
            </p>
          </div>

          <div className="flex gap-6 items-center text-xs font-semibold text-gold/90">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> 100% Verified Jobs</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold/50" />
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-current" /> Premium Partner Network</span>
          </div>
        </div>
      </div>

      {/* Right Column Service Partner Login Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-10 border border-gold/20 shadow-xl shadow-primary/5">
          <div className="text-center mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary">Service Partner Login</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-foreground/50">Access your professional service partner portal</p>
          </div>

          {signupSuccess && (
            <div className="mb-6 bg-[#1D3B31]/10 border border-[#1D3B31]/30 rounded-2xl p-4 flex gap-2 items-center">
              <CheckCircle2 className="w-5 h-5 text-[#1D3B31] flex-shrink-0" />
              <p className="text-xs text-[#1D3B31] font-bold leading-normal">
                KYC Application submitted successfully! Your account will be accessible once reviewed and approved by Admins.
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Email or Phone Number</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Enter email or 10-digit mobile"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gold/30 bg-cream text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-foreground/75 uppercase tracking-wider">Password</label>
                <Link href="/contact" className="text-xs font-semibold text-primary hover:underline">Forgot Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-2xl border border-gold/30 bg-cream text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-primary transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-semibold bg-red-50 rounded-xl p-3 border border-red-100">{error}</p>}

            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-primary text-white rounded-full font-bold hover:bg-primary/95 transition-all text-sm shadow-sm flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
            </button>


          </form>

          <div className="mt-8 text-center text-xs text-foreground/60">
            Interested in joining?{' '}
            <Link href="/partner/register" className="font-bold text-primary hover:underline">Register as Service Partner</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnerLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>}>
      <PartnerLoginForm />
    </Suspense>
  );
}
