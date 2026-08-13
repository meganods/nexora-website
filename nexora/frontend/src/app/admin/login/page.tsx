"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock } from 'lucide-react';
import api from '@/lib/api';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="flex-1 flex items-center justify-center bg-[#0d1527] py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="w-full max-w-md space-y-8 bg-slate-900 p-8 rounded-3xl shadow-2xl ring-1 ring-white/10">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white font-serif">Admin Portal</h2>
          <p className="mt-2 text-sm text-slate-400">Secure access to Nexora operations</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-300">
                Email Address
              </label>
              <div className="mt-2 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border-0 bg-white/5 py-3 pl-11 pr-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 focus:outline-none"
                  placeholder="admin@nexora.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-300">
                Password
              </label>
              <div className="mt-2 relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border-0 bg-white/5 py-3 pl-11 pr-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-950/50 rounded-xl p-3 border border-red-900/30 text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center items-center gap-2 rounded-full bg-blue-600 px-4 py-3.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in to Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
