"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, Shield, Sparkles, CheckCircle2, TrendingUp, Users, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/admin/login', { email, password });
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('nexora_token', data.token); // Also store as global auth token
        router.push('/admin/dashboard');
      } else {
        setError('Login failed. No token received.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or connection issue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-screen bg-[#FAF6F0] overflow-hidden">
      
      {/* Left 50%: Banner Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F3D30] via-[#0b2b22] to-[#04100c] relative flex-col justify-between p-16 text-white overflow-hidden border-r border-[#C3AB84]/10">
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#C3AB84_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        {/* Top brand header */}
        <div className="z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C3AB84] to-[#FAF6F0]/20 flex items-center justify-center border border-[#C3AB84]/20 shadow-lg">
            <Shield className="w-5 h-5 text-[#0F3D30]" />
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-wider text-white">Nexora</span>
            <span className="block text-[9px] uppercase tracking-widest text-[#C3AB84] font-bold">Admin Operations</span>
          </div>
        </div>

        {/* Floating dashboard summary card (Glassmorphic) */}
        <div className="z-10 my-auto max-w-md space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C3AB84]/10 border border-[#C3AB84]/20 text-[#C3AB84] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Version 2.4.0 Operations Console</span>
            </div>
            <h1 className="font-serif text-4xl xl:text-5xl font-bold leading-tight text-[#FAF6F0]">
              Elevating Home Service Standards
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Log in to access booking analytics, review partner compliance, configure active deals, and supervise overall marketplace reliability.
            </p>
          </div>

          {/* Interactive features list */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-sm transition-transform duration-300 hover:translate-x-1">
              <div className="w-9 h-9 rounded-xl bg-[#C3AB84]/20 flex items-center justify-center text-[#C3AB84] shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C3AB84]">Partner Management</h4>
                <p className="text-white/60 text-xs mt-0.5">Verify certifications and manage active service providers.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-sm transition-transform duration-300 hover:translate-x-1">
              <div className="w-9 h-9 rounded-xl bg-[#C3AB84]/20 flex items-center justify-center text-[#C3AB84] shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C3AB84]">Operations & Growth</h4>
                <p className="text-white/60 text-xs mt-0.5">Track real-time bookings, cancellations, and promo utilization.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="z-10 text-[10px] text-white/40 flex justify-between items-center border-t border-white/10 pt-6">
          <span>&copy; {new Date().getFullYear()} Nexora Technologies Inc.</span>
          <Link href="/terms" className="hover:text-[#C3AB84] transition-colors">Security Policy</Link>
        </div>
      </div>

      {/* Right 50%: Admin Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-6 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-md space-y-10">
          
          <div className="space-y-3">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-[#0F3D30]" />
              <span className="font-serif text-xl font-bold tracking-wider text-[#0F3D30]">Nexora Admin</span>
            </div>
            <h2 className="text-3xl font-serif font-black tracking-tight text-[#0F3D30]">Welcome Back</h2>
            <p className="text-xs text-foreground/50 font-medium">Please enter operational credentials to access the console.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block w-full rounded-2xl border border-[#C3AB84]/30 bg-white py-3.5 pl-12 pr-4 text-[#0F3D30] shadow-sm text-sm focus:outline-none focus:border-[#0F3D30] focus:ring-1 focus:ring-[#0F3D30] transition-all placeholder-foreground/30 font-medium"
                    placeholder="admin@nexora.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="block w-full rounded-2xl border border-[#C3AB84]/30 bg-white py-3.5 pl-12 pr-12 text-[#0F3D30] shadow-sm text-sm focus:outline-none focus:border-[#0F3D30] focus:ring-1 focus:ring-[#0F3D30] transition-all placeholder-foreground/30 font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-[#0F3D30] transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-700 text-xs bg-red-50 rounded-xl p-3 border border-red-200/50 text-center font-bold">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center items-center gap-2 rounded-full bg-[#0F3D30] hover:bg-[#0b2b22] px-6 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:shadow-md disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#C3AB84]" /> : 'Authorize & Enter'}
            </button>
          </form>

          <div className="text-center pt-4">
            <Link href="/" className="text-xs font-bold text-[#C3AB84] hover:text-[#0F3D30] transition-colors uppercase tracking-wider">
              &larr; Back to Nexora homepage
            </Link>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
