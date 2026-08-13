"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, KeyRound, User as UserIcon, Loader2, ShieldCheck, Mail, Lock, Eye, EyeOff, Star } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();

  const [activeMode, setActiveMode] = useState<'otp' | 'password'>('password');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Password fields
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');

  const redirectTo = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user) router.replace(redirectTo);
  }, [user, router, redirectTo]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Please fill in both email/phone and password fields.');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.post('/user/login-password', {
        identifier: identifier.trim(),
        password
      });
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
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.post('/user/login', { phone });
      if (data.otp) setDevOtp(data.otp);
      setOtpStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    if (isNewUser && !name.trim()) { setError('Please enter your name to create an account.'); return; }
    setIsLoading(true);
    try {
      const payload: any = { phone, otp };
      if (isNewUser && name.trim()) payload.name = name.trim();
      const { data } = await api.post('/user/login', payload);
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
      const msg = err.response?.data?.message || 'Invalid OTP.';
      if (msg.includes('Name is required')) {
        setIsNewUser(true);
        setError("You're new! Please also enter your name below.");
      } else {
        setError(msg);
      }
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
      console.error(err);
      setError(err.response?.data?.message || 'Google authentication failed.');
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
              Premium services, <br />
              delivered directly to your home.
            </h2>
            <p className="text-white/70 text-base leading-relaxed">
              Join millions of families who trust Nexora verified technicians and beauty professionals for premium home sessions.
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
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary">Login to Nexora</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-foreground/50">Grow your experience with expert services</p>
          </div>

          {searchParams.get('signup_success') === 'true' && (
            <div className="mb-5 bg-[#1D3B31]/10 border border-[#1D3B31]/30 rounded-2xl p-4 text-center">
              <p className="text-xs text-[#1D3B31] font-bold">🎉 Account created successfully! Please enter your email and password to log in and access the website.</p>
            </div>
          )}

          {/* Password login form */}
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Enter your email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                <input
                  type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder="Enter your email"
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
                  type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In'}
            </button>
          </form>

          {/* Social login separator */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gold/15"></div>
            <span className="flex-shrink mx-3.5 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-gold/15"></div>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google auth initiation failed')}
              shape="pill"
              width="100%"
            />
          </div>

          <div className="mt-8 text-center text-xs text-foreground/60">
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-primary hover:underline">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
