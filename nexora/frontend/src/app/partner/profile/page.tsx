"use client";

import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Mail, Phone, Landmark, Briefcase, CheckCircle2, AlertTriangle, Loader2, FileText, CreditCard, Camera } from 'lucide-react';
import api from '@/lib/api';
import ImageUpload from '@/app/admin/_components/ImageUpload';

export default function PartnerProfilePage() {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [experience, setExperience] = useState<number>(0);
  const [teamSize, setTeamSize] = useState<number>(1);
  const [businessDescription, setBusinessDescription] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  
  // New profile fields
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [skills, setSkills] = useState('');
  const [certifications, setCertifications] = useState('');
  const [languages, setLanguages] = useState('');
  const [workingHours, setWorkingHours] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/partner/profile');
      if (data?.vendor) {
        const v = data.vendor;
        setVendor(v);
        setName(v.name || '');
        setPhone(v.phone || '');
        setBusinessName(v.kycDetails?.businessName || '');
        setExperience(v.experience || 0);
        setTeamSize(v.teamSize || 1);
        setBusinessDescription(v.businessDescription || '');
        setPrimaryContact(v.primaryContact || '');
        setAddress(v.location?.address || '');
        setCity(v.location?.city || '');
        
        // Populate new fields
        setProfilePictureUrl(v.profilePictureUrl || '');
        setAboutMe(v.aboutMe || '');
        setSkills(Array.isArray(v.skills) ? v.skills.join(', ') : '');
        setCertifications(Array.isArray(v.certifications) ? v.certifications.join(', ') : '');
        setLanguages(Array.isArray(v.languages) ? v.languages.join(', ') : 'English, Hindi');
        setWorkingHours(v.workingHours || 'Monday - Sunday: 9:00 AM - 8:00 PM');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!profilePictureUrl) {
      setErrorMsg('Mandatory Profile Photo upload is required before publishing profile.');
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const payload = {
        name,
        phone,
        businessType: vendor?.businessType,
        experience,
        teamSize,
        businessDescription,
        primaryContact,
        location: {
          address,
          city,
          coordinates: vendor?.location?.coordinates || [77.209, 28.613]
        },
        profilePictureUrl,
        aboutMe,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        certifications: certifications.split(',').map(s => s.trim()).filter(Boolean),
        languages: languages.split(',').map(s => s.trim()).filter(Boolean),
        workingHours
      };

      const { data } = await api.put('/partner/onboarding', payload);
      if (data.success) {
        setSuccessMsg('Profile details updated successfully.');
        fetchProfile();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-gold/15 pb-4">
        <h1 className="font-serif text-2xl font-bold text-primary">Partner Profile</h1>
        <p className="text-xs text-foreground/50">Manage your business profile details</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Masked Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm text-center space-y-4">
            {profilePictureUrl ? (
              <img 
                src={profilePictureUrl} 
                alt="profile" 
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-gold"
              />
            ) : (
              <div className="w-20 h-20 bg-gold/15 border border-gold/30 text-gold rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                {name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-serif font-bold text-primary text-lg">{businessName || name}</h3>
              <p className="text-xs text-foreground/45">Category: {vendor?.category || 'Premium Home Service'}</p>
            </div>
            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              Status: {vendor?.kycStatus}
            </span>
          </div>

          <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5" /> Masked KYC Documents
            </h4>
            <div className="text-xs text-foreground/70 space-y-4 font-mono">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-cream/30 flex items-center justify-center text-primary">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gold uppercase tracking-wider mb-1">Aadhaar / Identity</p>
                  <p className="mt-0.5">XXXX XXXX {vendor?.kycDetails?.aadharNumber?.slice(-4) || 'XXXX'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-cream/30 flex items-center justify-center text-primary">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gold uppercase tracking-wider mb-1">PAN Card</p>
                  <p className="mt-0.5">XXXXX{vendor?.kycDetails?.panNumber?.slice(-5) || 'XXXXX'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleUpdate} className="lg:col-span-2 bg-white border border-gold/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="font-serif font-bold text-primary text-base border-b border-gold/10 pb-2.5">Edit Profile Info</h3>
          
          {/* PROFILE PHOTO UPLOADER (MANDATORY) */}
          <div className="border border-dashed border-gold/30 rounded-2xl p-4 bg-[#FAF6F0]/20">
            <ImageUpload 
              imageUrl={profilePictureUrl}
              imagePublicId=""
              onChange={(url) => setProfilePictureUrl(url)}
              label="Profile Photo (Mandatory) *"
              folder="nexora/partners"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Contact Name *</label>
              <input 
                type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Contact Phone *</label>
              <input 
                type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Business Name *</label>
              <input 
                type="text" required value={businessName} onChange={e => setBusinessName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Primary Contact Person *</label>
              <input 
                type="text" required value={primaryContact} onChange={e => setPrimaryContact(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Experience (Years) *</label>
              <input 
                type="number" required value={experience} onChange={e => setExperience(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Team Size *</label>
              <input 
                type="number" required value={teamSize} onChange={e => setTeamSize(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Working Hours *</label>
              <input 
                type="text" required value={workingHours} onChange={e => setWorkingHours(e.target.value)}
                placeholder="e.g. Mon - Sun: 9:00 AM - 8:00 PM"
                className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Languages Known (comma-separated)</label>
              <input 
                type="text" value={languages} onChange={e => setLanguages(e.target.value)}
                placeholder="English, Hindi, Punjabi"
                className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Skills / Expertise (comma-separated)</label>
            <input 
              type="text" value={skills} onChange={e => setSkills(e.target.value)}
              placeholder="AC Installation, Leak Repair, Compressor Service"
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Certifications (comma-separated)</label>
            <input 
              type="text" value={certifications} onChange={e => setCertifications(e.target.value)}
              placeholder="ISO Certified, Govt Electrical License"
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">About Me / Business Description *</label>
            <textarea 
              required value={aboutMe} onChange={e => setAboutMe(e.target.value)}
              placeholder="Provide a detailed business summary..."
              rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Short Summary for Cards *</label>
            <textarea 
              required value={businessDescription} onChange={e => setBusinessDescription(e.target.value)}
              rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Address *</label>
              <input 
                type="text" required value={address} onChange={e => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">City *</label>
              <input 
                type="text" required value={city} onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none text-xs bg-cream/20"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button 
              type="submit" disabled={saving}
              className="px-6 py-2.5 bg-[#1D3B31] text-white hover:bg-[#1D3B31]/95 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Profile'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
