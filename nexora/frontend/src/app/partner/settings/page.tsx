"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      setSaving(false);
      return;
    }

    try {
      // In the real backend, there should be a change password endpoint.
      // If we use standard PUT to update, let's call the update onboarding endpoint or password endpoint.
      const { data } = await api.put('/partner/onboarding', { password: newPassword });
      if (data.success) {
        setSuccessMsg('Your security password was changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gold/15 pb-4">
        <h1 className="font-serif text-2xl font-bold text-primary">Settings</h1>
        <p className="text-xs text-foreground/50">Manage security preferences and passwords</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-2 items-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs text-emerald-700 font-bold leading-normal">{successMsg}</p>
        </div>
      )}

      <form onSubmit={handlePasswordChange} className="bg-white border border-gold/15 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <h3 className="font-serif font-bold text-primary text-base border-b border-gold/10 pb-2.5">Update Password</h3>
        
        <div>
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Current Password *</label>
          <div className="relative">
            <input 
              type={showCurrent ? 'text' : 'password'} required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/45">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">New Password *</label>
          <div className="relative">
            <input 
              type={showNew ? 'text' : 'password'} required value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/45">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Confirm New Password *</label>
          <div className="relative">
            <input 
              type={showConfirm ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/45">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button 
            type="submit" disabled={saving}
            className="w-full py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition-all text-xs flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save New Password'}
          </button>
        </div>
      </form>

    </div>
  );
}
