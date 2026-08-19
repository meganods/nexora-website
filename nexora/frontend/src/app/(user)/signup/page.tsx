"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, User as UserIcon, Loader2, Mail, Lock, Eye, EyeOff, Phone, Star } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Suspense } from 'react';

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectTo = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user) router.replace(redirectTo);
  }, [user, router, redirectTo]);

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms & Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        email: email.toLowerCase(),
        phone: phone.trim(),
        password
      };

      const { data } = await api.post('/user/request-signup-otp', payload);
      if (data.success) {
        if (data.devOtp) setDevOtp(data.devOtp);
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!otp.trim() || otp.length < 4) {
      setError('Please enter a valid OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/user/verify-signup-otp', {
        email: email.toLowerCase(),
        otp: otp.trim()
      });
      if (data.success) {
        router.push(`/login?signup_success=true&redirect=${encodeURIComponent(redirectTo)}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setIsLoading(true);
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      const payload = {
        googleId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        profilePhoto: decoded.picture
      };

      const { data } = await api.post('/user/login-google', payload);
      if (data.success && data.token) {
        login(data.token, {
          id: data.user._id,
          name: data.user.name,
          phone: data.user.phone,
          email: data.user.email,
          profilePhoto: data.user.profilePhoto
        });
        router.replace(redirectTo);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full bg-cream">
      {/* Left Column Banner */}
      <div className="relative hidden lg:block overflow-hidden bg-[#1D3B31]">
        <div className="absolute inset-0 bg-[#1D3B31]/85 z-10" />
        <div className="absolute inset-0">
          <img src="/images/hero-interior.png" alt="Nexora Banner" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-20 h-full flex flex-col justify-between p-16 text-white max-w-xl">
          <div className="font-serif text-3xl font-bold tracking-tight">Nexora</div>
          <div className="space-y-6">
            <h2 className="font-serif text-4xl sm:text-5xl font-extrabold leading-tight">
              Sign up today, <br />
              book instant appointments.
            </h2>
            <p className="text-white/70 text-base leading-relaxed">
              Create an account with Nexora to gain full access to verified local home professionals and automated real-time assignment tracking.
            </p>
          </div>
          <div className="flex gap-6 items-center text-xs font-semibold text-gold/90">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> 100% Verified Pros</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold/50" />
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-current" /> 4.9 Rated Quality</span>
          </div>
        </div>
      </div>

      {/* Right Column Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-10 border border-gold/20 shadow-xl shadow-primary/5">
          <div className="text-center mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary">Create Nexora Account</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-foreground/50">Start booking premium home services today</p>
          </div>

          {step === 'form' ? (
            <>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gold/30 bg-cream text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gold/30 bg-cream text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                    <input
                      type="tel" maxLength={10} value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter your mobile number"
                      className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gold/30 bg-cream text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider font-sans">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                      <input
                        type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-gold/30 bg-cream text-foreground text-sm focus:outline-none focus:border-primary font-mono"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-primary">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider font-sans">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-gold/30 bg-cream text-foreground text-sm focus:outline-none focus:border-primary font-mono"
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-primary">
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1.5">
                  <input
                    id="terms" type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-gold/30 text-primary focus:ring-primary/20 accent-primary mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-foreground/60 leading-normal cursor-pointer select-none">
                    I accept and agree to Nexora's{' '}
                    <Link href="/terms" className="underline font-semibold hover:text-primary">Terms &amp; Conditions</Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="underline font-semibold hover:text-primary">Privacy Policy</Link>.
                  </label>
                </div>

                {error && <p className="text-red-500 text-xs font-semibold bg-red-50 rounded-xl p-3 border border-red-100">{error}</p>}

                <button type="submit" disabled={isLoading}
                  className="w-full py-3.5 bg-primary text-white rounded-full font-bold hover:bg-primary/95 transition-all text-sm shadow-sm flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                </button>
              </form>

              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gold/15"></div>
                <span className="flex-shrink mx-3.5 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-gold/15"></div>
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google signup failed')}
                  shape="pill"
                  width="100%"
                />
              </div>
            </>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-foreground/70 text-center mb-6">
                We've sent a 6-digit code to <strong>{email}</strong>. Please enter it below to verify your account.
              </p>
              <div>
                <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Verification Code *</label>
                <div className="relative">
                  <input
                    type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full text-center tracking-[0.2em] sm:tracking-[0.5em] placeholder:tracking-normal font-bold text-xl py-3 rounded-2xl border border-gold/30 bg-cream text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    required
                  />
                </div>
              </div>


              {error && <p className="text-red-500 text-xs font-semibold bg-red-50 rounded-xl p-3 border border-red-100">{error}</p>}

              <button type="submit" disabled={isLoading || otp.length < 4}
                className="w-full py-3.5 bg-primary text-white rounded-full font-bold hover:bg-primary/95 transition-all text-sm shadow-sm flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Continue'}
              </button>
              
              <div className="text-center mt-4">
                <button type="button" onClick={() => setStep('form')} className="text-xs text-foreground/60 hover:text-primary underline">
                  Back to Registration
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center text-xs text-foreground/60">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>}>
      <SignupPageContent />
    </Suspense>
  );
}
