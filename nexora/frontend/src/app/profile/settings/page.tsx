"use client";

import React, { useState, useEffect } from 'react';
import { Settings, User, Phone, Mail, Lock, Upload, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ProfileSettingsPage() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleReloadUser = async () => {
    const storedToken = localStorage.getItem('nexora_token');
    if (storedToken) {
      const { data } = await api.get('/partner/profile').catch(() => ({ data: {} }));
      if (data?.user) {
        login(storedToken, data.user);
      } else {
        const pRes = await api.get('/user/profile').catch(() => ({ data: {} }));
        if (pRes.data?.user) {
          login(storedToken, pRes.data.user);
        }
      }
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setProfilePhoto(user.profilePhoto || '');
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setErrorMsg('');
      
      const { data: signData } = await api.post('/upload/upload-signature');
      if (!signData.success) {
        setErrorMsg('Failed to fetch upload credentials.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', signData.upload_preset);
      formData.append('folder', signData.folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const result = await response.json();

      if (result.secure_url) {
        setProfilePhoto(result.secure_url);
        // Automatically save new profile image
        await api.put('/user/profile', { profilePhoto: result.secure_url });
        await handleReloadUser();
        setSuccessMsg('Profile picture updated successfully!');
      } else {
        setErrorMsg(result.error?.message || 'Image upload failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (password && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const payload: any = { name, email, phone };
      if (password) payload.password = password;

      const { data } = await api.put('/user/profile', payload);
      if (data?.success) {
        setSuccessMsg('Profile updated successfully!');
        setPassword('');
        setConfirmPassword('');
        await handleReloadUser();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gold/15 pb-4">
        <h1 className="font-serif text-2xl font-bold text-primary">Profile Settings</h1>
        <p className="text-xs text-foreground/50">Edit your personal contact info, change passwords, and update display avatar</p>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex gap-2 items-center">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-xs text-green-700 font-bold leading-normal">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Picture direct upload */}
        <div className="lg:col-span-1 bg-white border border-gold/15 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative w-28 h-28 rounded-full border-2 border-gold/20 overflow-hidden bg-cream flex items-center justify-center">
            {profilePhoto ? (
              <img src={profilePhoto} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-serif font-bold text-gold uppercase">{user?.name?.slice(0, 2)}</span>
            )}
            
            {uploadingImage && (
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-serif text-sm font-bold text-primary">{name}</h3>
            <p className="text-[10px] text-foreground/50 mt-0.5">{email}</p>
          </div>

          <label className="text-xs font-bold text-primary bg-gold/15 px-4 py-2 rounded-xl hover:bg-[#C3AB84] hover:text-primary transition-all cursor-pointer flex items-center gap-1.5">
            <Upload className="w-4 h-4" />
            Upload Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </label>
        </div>

        {/* Right Column: Profile updates form */}
        <div className="lg:col-span-2 bg-white border border-gold/15 rounded-3xl p-6 shadow-sm">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-foreground/60 uppercase mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gold" /> Full Name
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gold/20 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/60 uppercase mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gold" /> Email Address
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gold/20 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-foreground/60 uppercase mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gold" /> Phone Number
                </label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gold/20 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-gold/10 pt-6">
              <h3 className="font-serif text-sm font-bold text-primary mb-4 flex items-center gap-1">
                <Lock className="w-4 h-4 text-gold" /> Update Password
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">New Password (Optional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full border border-gold/20 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full border border-gold/20 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
