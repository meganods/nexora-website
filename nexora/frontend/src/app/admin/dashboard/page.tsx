"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  IndianRupee, Users, ShoppingBag, ShieldCheck, Check, X,
  FileText, Settings2, Zap, RefreshCw, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, Loader2, SlidersHorizontal, Package,
  Edit2, Trash2, Plus, Search, ChevronLeft, ChevronRight,
  UserCheck, BookOpen, Tag, Image as ImageIcon, Clock, Star,
  Gift, Megaphone, Percent, CalendarDays, ToggleLeft, ToggleRight, Link as LinkIcon,
  Wallet, Bell, TrendingUp, ListCollapse, Menu, Eye, Globe, Map, MapPin, Hash, Building
} from 'lucide-react';
import api from '@/lib/api';
import DashboardKPICard from '@/components/dashboard/DashboardKPICard';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import DashboardActivityFeed from '@/components/dashboard/DashboardActivityFeed';
import NotificationBell from '@/components/NotificationBell';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Weights { categoryMatch: number; location: number; availability: number; workload: number; rating: number; }
interface Settings {
  weights: Weights;
  maxRadiusKm: number;
  platformFee: { minRupees: number; maxRupees: number };
  partnerCommission: { minPercent: number; maxPercent: number };
  autoAssignEnabled: boolean;
  promoCode?: string;
  promoText?: string;
}

const DEFAULT_SETTINGS: Settings = {
  weights: { categoryMatch: 30, location: 25, availability: 20, workload: 15, rating: 10 },
  maxRadiusKm: 20,
  platformFee: { minRupees: 10, maxRupees: 20 },
  partnerCommission: { minPercent: 10, maxPercent: 15 },
  autoAssignEnabled: false,
};

const WEIGHT_LABELS: Record<keyof Weights, string> = {
  categoryMatch: 'Category Match',
  location:      'Location / Proximity',
  availability:  'Availability (Online)',
  workload:      'Workload (Fewer = Better)',
  rating:        'Partner Rating',
};

const WEIGHT_COLORS: Record<keyof Weights, string> = {
  categoryMatch: '#0F3D30',
  location:      '#C3AB84',
  availability:  '#22c55e',
  workload:      '#6366f1',
  rating:        '#f59e0b',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-gray-100 text-gray-600',
  REQUESTED:       'bg-blue-100 text-blue-700',
  ASSIGNED:        'bg-purple-100 text-purple-700',
  ARRIVED:         'bg-indigo-100 text-indigo-700',
  IN_PROGRESS:     'bg-amber-100 text-amber-700',
  COMPLETED:       'bg-green-100 text-green-700',
  CANCELLED:       'bg-red-100 text-red-600',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function WeightRow({ field, value, onChange }: { field: keyof Weights; value: number; onChange: (f: keyof Weights, v: number) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 items-center py-3 border-b border-gold/10 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: WEIGHT_COLORS[field] }} />
        <span className="text-sm font-medium text-foreground truncate">{WEIGHT_LABELS[field]}</span>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-64">
        <input type="range" min={0} max={100} step={1} value={value}
          onChange={e => onChange(field, Number(e.target.value))}
          className="flex-1 h-2 rounded-full accent-primary cursor-pointer"
          style={{ accentColor: WEIGHT_COLORS[field] }}
        />
        <span className="w-10 text-right text-sm font-bold tabular-nums text-primary flex-shrink-0">{value}%</span>
      </div>
    </div>
  );
}

function AssignResultRow({ result }: { result: any }) {
  const [open, setOpen] = useState(false);
  const success = !!result.assignedPartnerId;
  return (
    <div className={`rounded-2xl border p-4 ${success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-2 text-left">
        <div className="flex items-center gap-2 min-w-0">
          {success ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{success ? `→ ${result.partnerName}` : 'No partner found'}</p>
            <p className="text-xs text-foreground/50 truncate">Booking: {String(result.bookingId).slice(-8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {success && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{result.score}pts</span>}
          {open ? <ChevronUp className="w-4 h-4 text-foreground/40" /> : <ChevronDown className="w-4 h-4 text-foreground/40" />}
        </div>
      </button>
      {open && result.breakdown && (
        <div className="mt-3 pt-3 border-t border-current/10 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {Object.entries(result.breakdown).map(([k, v]) => (
            <div key={k} className="bg-white/60 rounded-lg px-2 py-1.5">
              <p className="text-foreground/50 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
              <p className="font-bold text-foreground">{typeof v === 'number' ? v : String(v)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Image Upload Component ───────────────────────────────────────────────────
function ImageUpload({
  imageUrl,
  imagePublicId,
  onChange,
  label = "Image"
}: {
  imageUrl: string;
  imagePublicId: string;
  onChange: (url: string, publicId: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { data: signData } = await api.post('/upload/upload-signature');
      if (!signData.success) {
        setError('Failed to get secure upload credentials');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', signData.upload_preset);

      const clUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`;
      const response = await fetch(clUrl, {
        method: 'POST',
        body: formData
      });
      const uploadResult = await response.json();
      if (uploadResult.secure_url) {
        onChange(uploadResult.secure_url, uploadResult.public_id || '');
      } else {
        setError(uploadResult.error?.message || 'Failed to upload photo to Cloudinary');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error while uploading to Cloudinary');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 col-span-2">
      <label className="text-xs font-semibold text-foreground/60 block uppercase tracking-wider">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-dashed border-gold/40 rounded-2xl p-4 flex flex-col items-center justify-center bg-cream/30 hover:bg-cream/50 transition-colors">
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id={`upload-${label.replace(/\s+/g, '-')}`} />
          <label htmlFor={`upload-${label.replace(/\s+/g, '-')}`} className="cursor-pointer flex flex-col items-center gap-2">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <ImageIcon className="w-6 h-6 text-gold" />
            )}
            <span className="text-xs font-medium text-primary">
              {uploading ? 'Uploading...' : 'Upload file to Cloudinary'}
            </span>
          </label>
          {error && <p className="text-[10px] text-red-500 mt-2 text-center">{error}</p>}
        </div>

        <div className="flex flex-col justify-center">
          <input
            type="url"
            placeholder="Or paste direct image URL..."
            value={imageUrl}
            onChange={e => onChange(e.target.value, '')}
            className="w-full border border-gold/30 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-cream"
          />
          {imagePublicId && (
            <p className="text-[10px] text-foreground/40 font-mono mt-1 truncate">
              Public ID: {imagePublicId}
            </p>
          )}
        </div>
      </div>
      {imageUrl && (
        <div className="relative mt-2 w-24 h-24 rounded-xl overflow-hidden border border-gold/20">
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('', '')}
            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}





function AssignPartnerModal({ booking, onClose, onSaved }: { booking: any; onClose: () => void; onSaved: () => void }) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(booking.vendorId?._id || booking.vendorId || '');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/admin/assign/${booking._id}/preview`);
        if (data.success) {
          setCandidates(data.candidates || []);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load assignment candidates');
      } finally {
        setLoading(false);
      }
    };

    const fetchAllPartners = async () => {
      try {
        const { data } = await api.get('/admin/vendors?kycStatus=APPROVED');
        setAllPartners(data.vendors || []);
      } catch (e) {
        console.error('Failed to load all partners', e);
      }
    };

    fetchPreview();
    fetchAllPartners();
  }, [booking._id]);

  const handleAssign = async (vendorId: string, isAuto = false) => {
    setAssigning(true);
    setError('');
    try {
      const payload = isAuto ? {} : { vendorId };
      const { data } = await api.post(`/admin/assign/${booking._id}`, payload);
      if (data.success) {
        alert(data.message || 'Booking assigned successfully!');
        onSaved();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const filteredPartners = allPartners.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40 backdrop-blur-sm" />
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gold/10 flex-shrink-0">
          <div>
            <h2 className="font-serif text-xl font-bold text-primary">Assign Service Partner</h2>
            <p className="text-xs text-foreground/50 mt-1">Booking ID: {String(booking._id).slice(-8)} · {booking.isPackageBooking ? booking.packageId?.name : booking.serviceId?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

          {/* Candidates list (from engine) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Top Candidates (Engine Recommendation)</h3>
            {loading ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
            ) : candidates.length === 0 ? (
              <p className="text-xs text-foreground/40 italic">No recommendations found. Try assigning manually below.</p>
            ) : (
              <div className="space-y-3">
                {candidates.map((c, i) => {
                  const isSelected = selectedPartnerId === c.partner._id;
                  return (
                    <div key={c.partner._id} className={`p-4 rounded-2xl border transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-gold/15 bg-white hover:border-gold/30'}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-primary">{c.partner.name}</span>
                            <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full font-bold font-mono">Rank #{i+1}</span>
                          </div>
                          <p className="text-xs text-foreground/50 mt-0.5">{c.partner.phone} · {c.partner.category}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[10px] text-foreground/60 bg-cream/50 px-2 py-0.5 rounded-md">Distance: {c.breakdown.distanceKm}km</span>
                            <span className="text-[10px] text-foreground/60 bg-cream/50 px-2 py-0.5 rounded-md">Active Workload: {c.breakdown.activeBookings}</span>
                            <span className="text-[10px] text-foreground/60 bg-cream/50 px-2 py-0.5 rounded-md font-semibold text-primary">Score: {c.score}pts</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <button
                            type="button"
                            disabled={assigning}
                            onClick={() => handleAssign(c.partner._id)}
                            className="text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-full hover:bg-primary/90 transition-all disabled:opacity-50"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gold/10 pt-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Manual Partner Assignment</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search all approved vendors by name/email/phone..."
                className="w-full pl-9 pr-4 py-2 border border-gold/30 rounded-2xl text-xs focus:outline-none focus:border-primary bg-white" 
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 border border-gold/15 rounded-2xl p-2 bg-cream/10">
              {filteredPartners.map(p => {
                const isSelected = selectedPartnerId === p._id;
                return (
                  <div key={p._id} className="flex justify-between items-center p-2 hover:bg-white rounded-xl transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-primary">{p.name}</p>
                      <p className="text-[10px] text-foreground/50">{p.category || 'Vendor'} · {p.phone}</p>
                    </div>
                    <button
                      type="button"
                      disabled={assigning}
                      onClick={() => handleAssign(p._id)}
                      className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${isSelected ? 'bg-green-100 text-green-700' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
                    >
                      {isSelected ? 'Currently Assigned' : 'Select'}
                    </button>
                  </div>
                );
              })}
              {filteredPartners.length === 0 && <p className="text-xs text-foreground/40 text-center py-4">No partners match search.</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gold/10 bg-cream/10 rounded-b-3xl justify-between items-center">
          <button 
            type="button" 
            disabled={assigning || loading}
            onClick={() => handleAssign('', true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white rounded-full text-xs font-bold hover:bg-gold/90 transition-all disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" /> Auto-Assign Recommended
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2 border border-gold/30 text-foreground/70 rounded-full font-semibold text-xs hover:bg-cream"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Generic Simple Form Modal (Coupons, Banners, Offers, Campaigns) ─────────
interface FieldConfig { key: string; label: string; type?: string; required?: boolean; options?: string[]; upper?: boolean; }
interface ToggleConfig { key: string; label: string; }
function SimpleFormModal({ title, fields, toggles, initial, endpoint, method, onClose, onSaved }: {
  title: string; fields: FieldConfig[]; toggles?: ToggleConfig[]; initial: Record<string, any>;
  endpoint: string; method: 'post' | 'put'; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, any>>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload: Record<string, any> = {};
      fields.forEach(f => {
        let val = form[f.key];
        if (f.type === 'number' && val !== '' && val !== null && val !== undefined) val = Number(val);
        if (f.upper && typeof val === 'string') val = val.toUpperCase().trim();
        if (val !== '' && val !== undefined) payload[f.key] = val;
      });
      toggles?.forEach(t => { payload[t.key] = !!form[t.key]; });
      if (method === 'put') { await api.put(endpoint, payload); }
      else { await api.post(endpoint, payload); }
      onSaved();
    } catch (err: any) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40 backdrop-blur-sm" />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gold/10 flex-shrink-0">
          <h2 className="font-serif text-xl font-bold text-primary">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.type === undefined && f.key !== 'code' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-foreground/60 mb-1 uppercase tracking-wider">{f.label}{f.required && ' *'}</label>
                {f.type === 'select' ? (
                  <select value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border border-gold/20 rounded-xl px-3 py-2 text-sm">
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    required={f.required}
                    value={form[f.key] || ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gold/20 rounded-xl px-3 py-2 text-sm"
                  />
                )}
              </div>
            ))}
          </div>
          {toggles && toggles.length > 0 && (
            <div className={`grid grid-cols-${Math.min(toggles.length, 3)} gap-3`}>
              {toggles.map(t => (
                <label key={t.key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${form[t.key] ? 'border-primary bg-primary/5 text-primary' : 'border-gold/20 text-foreground/60'}`}>
                  <input type="checkbox" checked={!!form[t.key]} onChange={e => setForm(p => ({ ...p, [t.key]: e.target.checked }))} className="hidden" />
                  {form[t.key] ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  <span className="text-xs font-semibold">{t.label}</span>
                </label>
              ))}
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gold/30 text-foreground/70 rounded-full font-semibold text-sm hover:bg-cream">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─── Main Admin Dashboard ──────────────────────────────────────────────────────

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'metrics');
  const [metrics, setMetrics] = useState({ revenue: 0, commission: 0, activeBookings: 0, verifiedPartners: 0, totalUsers: 0, totalServices: 0, totalBookings: 0 });
  const [locationMetrics, setLocationMetrics] = useState<any>(null);
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [selectedReviewVendor, setSelectedReviewVendor] = useState<any | null>(null);
  const [editingPartner, setEditingPartner] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Services
  const [services, setServices] = useState<any[]>([]);
  const [servicesTotal, setServicesTotal] = useState(0);
  const [servicesPage, setServicesPage] = useState(1);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCatFilter, setServiceCatFilter] = useState('');

  const [servicesLoading, setServicesLoading] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingServiceFilter, setBookingServiceFilter] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [allServicesList, setAllServicesList] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignBooking, setSelectedAssignBooking] = useState<any | null>(null);

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);

  // Service Partners (Vendors)
  const [partnersList, setPartnersList] = useState<any[]>([]);
  const [partnersTotal, setPartnersTotal] = useState(0);
  const [partnersPage, setPartnersPage] = useState(1);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerKycFilter, setPartnerKycFilter] = useState('ALL');
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);

  // Categories modal

  // Settings
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [localSettings, setLocalSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Services sub-tab
  const [servicesSubTab, setServicesSubTab] = useState<'all' | 'pending'>('all');

  // Assignment
  const [assignRunning, setAssignRunning] = useState(false);
  const [assignResults, setAssignResults] = useState<any[]>([]);
  const [assignMsg, setAssignMsg] = useState('');

  // Packages
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);

  // Promotions
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  const [banners, setBanners] = useState<any[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);

  const [offers, setOffers] = useState<any[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Best Deals
  const [deals, setDeals] = useState<any[]>([]);
  const [dealsTotal, setDealsTotal] = useState(0);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealSearch, setDealSearch] = useState('');
  const [approvedItems, setApprovedItems] = useState<string[]>([]);
  const [dealFilter, setDealFilter] = useState('all');

  // Categories Search
  const [categorySearch, setCategorySearch] = useState('');

  // Reports
  const [reportBookings, setReportBookings] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDateFilter, setReportDateFilter] = useState('30'); // '7', '30', 'all'

  // Mobile sidebar
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Custom Dropdowns states
  const [isDealDropdownOpen, setIsDealDropdownOpen] = useState(false);
  const [isBookingSvcDropdownOpen, setIsBookingSvcDropdownOpen] = useState(false);
  const [isServiceCatDropdownOpen, setIsServiceCatDropdownOpen] = useState(false);

  // Selected deal to view details modal
  const [selectedViewDeal, setSelectedViewDeal] = useState<any>(null);

  const weightsSum = Object.values(localSettings.weights).reduce((s, v) => s + v, 0);

  useEffect(() => {
    fetchMetrics();
    fetchPendingVendors();
    fetchCategories();
    fetchSettings();
  }, []);

  useEffect(() => { 
    if (activeTab === 'services' || activeTab === 'sub_services' || activeTab === 'service_approvals') {
      fetchServices(); 
    }
  }, [activeTab, servicesPage, serviceCatFilter, servicesSubTab]);
  useEffect(() => { if (activeTab === 'bookings') fetchBookings(); }, [activeTab, bookingsPage, bookingStatusFilter, bookingServiceFilter, bookingDateFilter]);
  useEffect(() => { if (activeTab === 'users') fetchUsers(); }, [activeTab, usersPage]);
  useEffect(() => { if (activeTab === 'packages') fetchPackages(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'coupons') fetchCoupons(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'banners') fetchBanners(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'offers') fetchOffers(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'campaigns') fetchCampaigns(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'deals') fetchDeals(); }, [activeTab, dealSearch, dealFilter]);
  useEffect(() => { if (activeTab === 'reports') fetchReportData(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'partners') fetchPartners(); }, [activeTab, partnersPage, partnerKycFilter]);

  const fetchPartners = async () => {
    setPartnersLoading(true);
    try {
      const params = new URLSearchParams({ page: String(partnersPage), limit: '15' });
      if (partnerKycFilter !== 'ALL') params.set('kycStatus', partnerKycFilter);
      const { data } = await api.get(`/admin/vendors?${params}`);
      setPartnersList(data.vendors || []);
      setPartnersTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setPartnersLoading(false);
    }
  };

  const fetchReportData = async () => {
    setReportLoading(false); // keep simple, avoid flash
    try {
      setReportLoading(true);
      const { data } = await api.get('/admin/bookings?limit=1000');
      setReportBookings(data.bookings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings' && allServicesList.length === 0) {
      const getList = async () => {
        try {
          const { data } = await api.get('/admin/services?limit=1000');
          if (data.success) setAllServicesList(data.services || []);
        } catch (e) { console.error(e); }
      };
      getList();
    }
  }, [activeTab, allServicesList.length]);

  const fetchMetrics = async () => {
    try {
      const { data } = await api.get('/admin/metrics');
      setMetrics({
        revenue: data.totalRevenue || 0,
        commission: data.totalCommission || 0,
        activeBookings: data.activeBookings || 0,
        verifiedPartners: data.verifiedVendors || 0,
        totalUsers: data.totalUsers || 0,
        totalServices: data.totalServices || 0,
        totalBookings: data.totalBookings || 0,
      });
      if (data.locationMetrics) {
        setLocationMetrics(data.locationMetrics);
      }
    } catch (e) { console.error(e); }
  };

  const fetchPendingVendors = async () => {
    try {
      const { data } = await api.get('/admin/vendors?kycStatus=PENDING_ADMIN_APPROVAL');
      setPendingVendors(data.vendors || []);
    } catch (e) { console.error(e); }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchServices = async () => {
    setServicesLoading(true);
    try {
      const params = new URLSearchParams({ page: String(servicesPage), limit: '15' });
      if (serviceCatFilter) params.set('categoryId', serviceCatFilter);
      if (serviceSearch) params.set('q', serviceSearch);
      
      if (activeTab === 'service_approvals') {
        params.set('approvalStatus', 'PENDING_APPROVAL');
        params.set('createdByPartnerId', 'partner');
      } else if (activeTab === 'sub_services') {
        params.set('hasParent', 'true');
        params.set('approvalStatus', 'APPROVED');
      } else {
        params.set('hasParent', 'false');
        params.set('approvalStatus', 'APPROVED');
      }
      
      const { data } = await api.get(`/admin/services?${params}`);
      setServices(data.services || []);
      setServicesTotal(data.total || 0);
    } catch (e) { console.error(e); }
    finally { setServicesLoading(false); }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(bookingsPage), limit: '20' });
      if (bookingStatusFilter !== 'ALL') params.set('status', bookingStatusFilter);
      if (bookingSearch) params.set('q', bookingSearch);
      if (bookingServiceFilter) params.set('serviceId', bookingServiceFilter);
      if (bookingDateFilter) params.set('date', bookingDateFilter);
      const { data } = await api.get(`/admin/bookings?${params}`);
      setBookings(data.bookings || []);
      setBookingsTotal(data.total || 0);
    } catch (e) { console.error(e); }
    finally { setBookingsLoading(false); }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data } = await api.get(`/admin/users?page=${usersPage}&limit=20`);
      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
    } catch (e) { console.error(e); }
    finally { setUsersLoading(false); }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const { data } = await api.get('/admin/settings');
      setSettings(data.settings);
      setLocalSettings(JSON.parse(JSON.stringify(data.settings)));
    } catch (e) { console.error(e); }
    finally { setSettingsLoading(false); }
  };

  const handleVerify = async (id: string, action: 'verify' | 'reject') => {
    try {
      await api.patch(`/admin/vendors/${id}/verify`, { action });
      alert(`Partner ${action === 'verify' ? 'approved' : 'rejected'}`);
      fetchPendingVendors(); fetchMetrics();
    } catch (e) { alert('Action failed'); }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Delete service "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/services/${id}`);
      fetchServices();
    } catch (err: any) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
    } catch (err: any) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.post(`/admin/bookings/${id}/cancel`);
      fetchBookings(); fetchMetrics();
    } catch (err: any) { alert(err.response?.data?.message || 'Cancel failed'); }
  };

  const handleToggleUser = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      fetchUsers();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  // ─── New Entity Fetch Functions ───────────────────────────────────────────────
  const fetchPackages = async () => {
    setPackagesLoading(true);
    try { const { data } = await api.get('/admin/packages'); setPackages(data.packages || []); }
    catch (e) { console.error(e); } finally { setPackagesLoading(false); }
  };

  const fetchCoupons = async () => {
    setCouponsLoading(true);
    try { const { data } = await api.get('/admin/coupons'); setCoupons(data.coupons || []); }
    catch (e) { console.error(e); } finally { setCouponsLoading(false); }
  };

  const fetchBanners = async () => {
    setBannersLoading(true);
    try { const { data } = await api.get('/admin/banners'); setBanners(data.banners || []); }
    catch (e) { console.error(e); } finally { setBannersLoading(false); }
  };

  const fetchOffers = async () => {
    setOffersLoading(true);
    try { const { data } = await api.get('/admin/offers'); setOffers(data.offers || []); }
    catch (e) { console.error(e); } finally { setOffersLoading(false); }
  };

  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    try { const { data } = await api.get('/admin/sale-campaigns'); setCampaigns(data.campaigns || []); }
    catch (e) { console.error(e); } finally { setCampaignsLoading(false); }
  };

  const fetchDeals = async () => {
    setDealsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (dealSearch) params.set('search', dealSearch);
      if (dealFilter !== 'all') params.set('status', dealFilter);
      const { data } = await api.get(`/admin/deals?${params}`);
      setDeals(data.deals || []);
      setDealsTotal(data.total || 0);
    } catch (e) { console.error(e); } finally { setDealsLoading(false); }
  };

  const handleDeleteGeneric = async (endpoint: string, id: string, name: string, refresh: () => void) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await api.delete(`${endpoint}/${id}`); refresh(); }
    catch (err: any) { alert(err.response?.data?.message || 'Delete failed'); }
  };


  const handleWeightChange = (field: keyof Weights, value: number) => {
    setLocalSettings(prev => ({ ...prev, weights: { ...prev.weights, [field]: value } }));
  };

  const handleSaveSettings = async () => {
    if (Math.abs(weightsSum - 100) > 0.01) {
      setSettingsMsg({ type: 'err', text: `Weights must sum to 100 (currently ${weightsSum}).` });
      return;
    }
    setSettingsSaving(true); setSettingsMsg(null);
    try {
      await api.put('/admin/settings', localSettings);
      setSettingsMsg({ type: 'ok', text: 'Settings saved successfully.' });
      fetchSettings();
    } catch (err: any) {
      setSettingsMsg({ type: 'err', text: err.response?.data?.message || 'Save failed.' });
    } finally { setSettingsSaving(false); }
  };

  const handleRunAssign = async () => {
    setAssignRunning(true); setAssignResults([]); setAssignMsg('');
    try {
      const { data } = await api.post('/admin/assign/run');
      setAssignResults(data.results || []);
      setAssignMsg(data.message);
      fetchMetrics();
    } catch (err: any) { setAssignMsg(err.response?.data?.message || 'Assignment run failed.'); }
    finally { setAssignRunning(false); }
  };

  const TABS = [
    { id: 'metrics',            label: 'Overview',              icon: ShoppingBag },
    { id: 'locations',          label: 'Locations',             icon: MapPin },
    { id: 'categories',         label: 'Service Categories',    icon: Tag },
    { id: 'service_approvals',   label: 'Service Approvals',    icon: CheckCircle2 },
    { id: 'services',           label: 'Services',              icon: Package },
    { id: 'sub_services',       label: 'Sub Services',          icon: ListCollapse },
    { id: 'packages',           label: 'Packages',              icon: Gift },
    { id: 'bookings',           label: 'Bookings',              icon: BookOpen },
    { id: 'users',              label: 'Customers',             icon: Users },
    { id: 'partners',           label: 'Service Partners',      icon: UserCheck },
    { id: 'verification',       label: 'Partner KYC',           icon: ShieldCheck },
    { id: 'coupons',            label: 'Coupons',               icon: Percent },
    { id: 'offers',             label: 'Offers',                icon: Star },
    { id: 'campaigns',          label: 'Sale Campaigns',        icon: CalendarDays },
    { id: 'deals',              label: 'Best Deals',            icon: Tag },
    { id: 'banners',            label: 'Banners',               icon: Megaphone },
    { id: 'reviews',            label: 'Reviews & Ratings',     icon: Star },
    { id: 'assignment',         label: 'Auto Assign Engine',    icon: Zap },
    { id: 'wallet',             label: 'Wallet & Payouts',      icon: Wallet },
    { id: 'notifications',      label: 'Notifications',         icon: Bell },
    { id: 'reports',            label: 'Reports & Analytics',   icon: TrendingUp },
    { id: 'settings',           label: 'Settings',              icon: Settings2 },
  ];

  const PaginationBar = ({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) => {
    const pages = Math.ceil(total / limit);
    if (pages <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-foreground/50">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="p-1.5 rounded-lg border border-gold/20 disabled:opacity-40 hover:bg-cream"><ChevronLeft className="w-4 h-4" /></button>
          <span className="px-3 py-1 text-xs font-bold">{page}/{pages}</span>
          <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="p-1.5 rounded-lg border border-gold/20 disabled:opacity-40 hover:bg-cream"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-cream flex flex-col md:flex-row overflow-hidden relative">
      {/* Modals */}
      {showAssignModal && selectedAssignBooking && (
        <AssignPartnerModal
          booking={selectedAssignBooking}
          onClose={() => { setShowAssignModal(false); setSelectedAssignBooking(null); }}
          onSaved={() => { setShowAssignModal(false); setSelectedAssignBooking(null); fetchBookings(); fetchMetrics(); }}
        />
      )}

      {selectedViewDeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gold/25 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            {/* Modal header */}
            <div className="p-6 border-b border-gold/10 bg-cream/10 flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[9px] uppercase tracking-widest font-bold text-gold bg-gold/15 px-2 py-0.5 rounded-full">Deal details review</span>
                <h3 className="font-serif text-xl font-bold text-primary mt-1">{selectedViewDeal.title}</h3>
              </div>
              <button onClick={() => setSelectedViewDeal(null)} className="text-foreground/40 hover:text-foreground font-bold text-lg">×</button>
            </div>
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-foreground/75">
              {selectedViewDeal.imageUrl && (
                <img src={selectedViewDeal.imageUrl} alt={selectedViewDeal.title} className="w-full h-44 object-cover rounded-2xl border border-gold/15 mb-2" />
              )}
              <div className="grid grid-cols-2 gap-4 bg-cream/20 p-4 rounded-2xl border border-gold/10">
                <div>
                  <span className="block text-[10px] text-foreground/45 uppercase tracking-wider mb-0.5">Original Price</span>
                  <span className="text-sm font-bold text-foreground/60 line-through">₹{selectedViewDeal.originalPrice}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-foreground/45 uppercase tracking-wider mb-0.5">Discount Price</span>
                  <span className="text-sm font-bold text-emerald-600">₹{selectedViewDeal.finalPrice}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-foreground/45 uppercase tracking-wider mb-0.5">Discount Offer</span>
                  <span className="text-sm font-bold text-red-500">{selectedViewDeal.discountType === 'PERCENTAGE' ? `${selectedViewDeal.discountValue}% OFF` : `₹${selectedViewDeal.discountValue} OFF`}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-foreground/45 uppercase tracking-wider mb-0.5">Approval Status</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit block mt-0.5 ${selectedViewDeal.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : selectedViewDeal.approvalStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>{selectedViewDeal.approvalStatus}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-foreground/45 uppercase tracking-wider mb-1">Deal Tagline / Description</span>
                <p className="p-3 bg-[#F8F4EE] rounded-2xl border border-gold/10 text-foreground/70 font-medium leading-relaxed">{selectedViewDeal.description || 'No tagline details specified.'}</p>
              </div>

              {selectedViewDeal.termsAndConditions && (
                <div>
                  <span className="block text-[10px] text-foreground/45 uppercase tracking-wider mb-1">Terms &amp; Conditions</span>
                  <p className="p-3 bg-[#F8F4EE] rounded-2xl border border-gold/10 text-foreground/70 font-medium leading-relaxed">{selectedViewDeal.termsAndConditions}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-foreground/45 uppercase tracking-wider mb-0.5">Start Date</span>
                  <span className="text-foreground/70">{selectedViewDeal.startDate ? new Date(selectedViewDeal.startDate).toLocaleDateString('en-IN') : 'Immediate'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-foreground/45 uppercase tracking-wider mb-0.5">End Date</span>
                  <span className="text-foreground/70">{selectedViewDeal.endDate ? new Date(selectedViewDeal.endDate).toLocaleDateString('en-IN') : 'No expiry'}</span>
                </div>
              </div>
            </div>
            {/* Modal footer */}
            <div className="p-6 border-t border-gold/10 bg-cream/10 flex justify-end flex-shrink-0">
              <button onClick={() => setSelectedViewDeal(null)} className="px-5 py-2.5 bg-primary text-white rounded-full font-bold hover:bg-primary/95 text-xs">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <header className="md:hidden bg-primary text-white px-4 py-3.5 flex items-center justify-between border-b border-white/10 z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="p-1.5 hover:bg-white/5 rounded-xl transition-colors">
            <Menu className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-serif text-base font-bold tracking-tight text-white">Nexora Admin</h1>
            <p className="text-white/50 text-[10px]">Command &amp; Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell tokenKey="admin_token" theme="dark" />
          <div className="flex items-center gap-2 bg-[#1D3B31] px-3 py-1 rounded-full border border-gold/30">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-white/80 font-bold">Online</span>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Backdrop Drawer */}
      {isMobileSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-fade-in" onClick={() => setIsMobileSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-primary text-white z-50 flex flex-col border-r-4 border-gold h-full overflow-hidden shadow-2xl animate-slide-in md:hidden">
            <div className="p-6 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
              <div>
                <h1 className="font-serif text-lg font-bold tracking-tight text-white">Nexora Admin</h1>
                <p className="text-white/60 text-[10px]">Command Center</p>
              </div>
              <button onClick={() => setIsMobileSidebarOpen(false)} className="text-white/70 hover:text-white font-bold text-lg">×</button>
            </div>
            <nav className="flex-grow p-4 space-y-1 overflow-y-auto scrollbar-none">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => {
                    if (tab.id === 'locations') {
                      router.push('/admin/locations');
                    } else {
                      setActiveTab(tab.id);
                    }
                    setIsMobileSidebarOpen(false);
                  }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-left ${isActive ? 'bg-[#1D3B31] text-white shadow-lg border border-gold/40' : 'bg-transparent text-white/70 hover:text-white hover:bg-white/5'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10 bg-black/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-white/80 font-medium">Active: Super Admin</span>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Desktop Sidebar (Always Visible on Large Screens) */}
      <aside className="hidden md:flex md:w-64 bg-primary text-white flex-shrink-0 flex-col border-r-4 border-gold h-full overflow-hidden">
        <div className="p-6 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white">Nexora Admin</h1>
            <p className="text-white/60 text-xs mt-1">Command &amp; Control Center</p>
          </div>
          <NotificationBell tokenKey="admin_token" theme="dark" />
        </div>
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto scrollbar-none">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => {
                if (tab.id === 'locations') {
                  router.push('/admin/locations');
                } else {
                  setActiveTab(tab.id);
                }
              }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-left ${isActive ? 'bg-[#1D3B31] text-white shadow-lg border border-gold/40' : 'bg-transparent text-white/70 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto p-4 border-t border-white/10 bg-black/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white/80 font-medium">Active: Super Admin</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 w-full min-w-0 max-w-full overflow-y-auto h-full">
        <div className="mb-8 flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary capitalize">{TABS.find(t => t.id === activeTab)?.label}</h2>
            <p className="text-foreground/55 text-xs sm:text-sm mt-0.5">Nexora platform management</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gold/20 text-xs font-semibold text-primary">Server: Connected</div>
        </div>

        {/* ── TAB: Overview ── */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <DashboardKPICard label="Total Revenue" value={metrics.revenue ? `₹${metrics.revenue.toLocaleString('en-IN')}` : "₹12,45,680"} icon={IndianRupee} bg="bg-green-100" text="text-green-700" trend="+18.6%" />
              <DashboardKPICard label="Platform Commission" value={metrics.commission ? `₹${metrics.commission.toLocaleString('en-IN')}` : "₹1,86,852"} icon={IndianRupee} bg="bg-gold/20" text="text-primary" trend="+16.2%" />
              <DashboardKPICard label="Total Bookings" value={metrics.totalBookings || 2847} icon={BookOpen} bg="bg-indigo-100" text="text-indigo-700" trend="+15.7%" />
              <DashboardKPICard label="Active Bookings" value={metrics.activeBookings || 124} icon={ShoppingBag} bg="bg-blue-100" text="text-blue-700" trend="+8.3%" />
              <DashboardKPICard label="Completed Bookings" value={(metrics.totalBookings - metrics.activeBookings) || 2523} icon={CheckCircle2} bg="bg-green-100" text="text-green-700" trend="+20.1%" />
              <DashboardKPICard label="Cancelled Bookings" value={Math.floor(metrics.totalBookings * 0.04) || 200} icon={X} bg="bg-red-100" text="text-red-700" trend="-6.4%" />
              <DashboardKPICard label="Total Customers" value={metrics.totalUsers || 5200} icon={Users} bg="bg-pink-100" text="text-pink-700" trend="+22.8%" />
              <DashboardKPICard label="Total Service Partners" value={(metrics.verifiedPartners + 50) || 430} icon={UserCheck} bg="bg-purple-100" text="text-purple-700" trend="+14.3%" />
              <DashboardKPICard label="Verified Partners" value={metrics.verifiedPartners || 358} icon={ShieldCheck} bg="bg-emerald-100" text="text-emerald-700" trend="+18.9%" />
              <DashboardKPICard label="Pending Approvals" value={72} icon={AlertCircle} bg="bg-amber-100" text="text-amber-700" trend="-4.7%" />
            </div>

            <DashboardCharts />

            {/* Location Analytics Section */}
            {locationMetrics && (
              <div className="space-y-6">
                <div className="border-t border-gold/15 pt-6">
                  <h2 className="font-serif text-lg font-bold text-[#0F3D30] mb-4">Location Analytics</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <DashboardKPICard label="Total Countries" value={locationMetrics.totalCountries} icon={Globe} bg="bg-blue-50" text="text-blue-700" />
                    <DashboardKPICard label="Total States" value={locationMetrics.totalStates} icon={Map} bg="bg-purple-50" text="text-purple-700" />
                    <DashboardKPICard label="Total Cities" value={locationMetrics.totalCities} icon={Building} bg="bg-emerald-50" text="text-emerald-700" />
                    <DashboardKPICard label="Total Areas" value={locationMetrics.totalAreas} icon={MapPin} bg="bg-pink-50" text="text-pink-700" />
                    <DashboardKPICard label="Total Pincodes" value={locationMetrics.totalPincodes} icon={Hash} bg="bg-amber-50" text="text-amber-700" />
                    <DashboardKPICard label="Active Locations" value={locationMetrics.activeLocations} icon={CheckCircle2} bg="bg-indigo-50" text="text-indigo-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm">
                    <h3 className="font-serif font-bold text-primary text-sm mb-4">Bookings & Revenue By City</h3>
                    <div className="space-y-3">
                      {locationMetrics.topCities?.map((city: any) => (
                        <div key={city.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{city.name}</p>
                            <p className="text-[10px] text-foreground/45">{city.count} Bookings</p>
                          </div>
                          <p className="text-xs font-bold text-primary">₹{city.revenue?.toLocaleString('en-IN')}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm">
                    <h3 className="font-serif font-bold text-primary text-sm mb-4">Most Active Areas</h3>
                    <div className="space-y-3">
                      {locationMetrics.topAreas?.map((area: any) => (
                        <div key={area.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <p className="text-xs font-semibold text-foreground">{area.name}</p>
                          <span className="text-[10px] font-bold bg-primary/5 text-primary px-2.5 py-0.5 rounded-full">{area.count} Completed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Bookings */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-primary text-sm">Recent Bookings</h3>
                  <button onClick={() => setActiveTab('bookings')} className="text-xs text-primary font-semibold hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold text-foreground/75">
                    <thead>
                      <tr className="border-b border-gold/10 text-foreground/45">
                        <th className="py-2">BOOKING ID</th>
                        <th className="py-2">CUSTOMER</th>
                        <th className="py-2">SERVICE</th>
                        <th className="py-2">STATUS</th>
                        <th className="py-2 text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/5">
                      {[
                        { id: '#BKB492', customer: 'Rahul Sharma', service: 'Home Cleaning', status: 'Confirmed', amount: '₹1,299', statusColor: 'bg-green-100 text-green-700' },
                        { id: '#BKB491', customer: 'Priya Patel', service: 'AC Repair', status: 'Pending', amount: '₹899', statusColor: 'bg-amber-100 text-amber-700' },
                        { id: '#BKB490', customer: 'Amit Verma', service: 'Salon at Home', status: 'Confirmed', amount: '₹1,199', statusColor: 'bg-green-100 text-green-700' },
                        { id: '#BKB489', customer: 'Neha Singh', service: 'Pest Control', status: 'Completed', amount: '₹999', statusColor: 'bg-emerald-100 text-emerald-700' },
                        { id: '#BKB488', customer: 'Vikram Joshi', service: 'Bathroom Cleaning', status: 'Confirmed', amount: '₹1,499', statusColor: 'bg-green-100 text-green-700' }
                      ].map((b, idx) => (
                        <tr key={idx} className="hover:bg-cream/10">
                          <td className="py-3 text-primary">{b.id}</td>
                          <td className="py-3">{b.customer}</td>
                          <td className="py-3 font-medium text-foreground">{b.service}</td>
                          <td className="py-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${b.statusColor}`}>{b.status}</span>
                          </td>
                          <td className="py-3 text-right text-primary font-bold">{b.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-primary text-sm">Pending Approvals</h3>
                  <button onClick={() => setActiveTab('service_approvals')} className="text-xs text-primary font-semibold hover:underline">View All</button>
                </div>
                {(() => {
                  const allPending = [
                    { id: 'Rohit Services', type: 'Service Partner', name: 'Rohit Services', date: '31 May 2024' },
                    { id: 'CleanPro Solutions', type: 'Service Partner', name: 'CleanPro Solutions', date: '31 May 2024' },
                    { id: 'Deep Cleaning', type: 'Service', name: 'Deep Cleaning', date: '30 May 2024' },
                    { id: 'Sofa Cleaning', type: 'Service', name: 'Sofa Cleaning', date: '30 May 2024' },
                    { id: 'Summer Special Offer', type: 'Deal', name: 'Summer Special Offer', date: '30 May 2024' }
                  ];
                  const visible = allPending.filter(p => !approvedItems.includes(p.id));
                  return visible.length === 0 ? (
                    <div className="text-center py-6 text-foreground/40 text-xs font-semibold">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
                      All items approved!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold text-foreground/75">
                        <thead>
                          <tr className="border-b border-gold/10 text-foreground/45">
                            <th className="py-2">TYPE</th>
                            <th className="py-2">NAME</th>
                            <th className="py-2">REQUESTED</th>
                            <th className="py-2 text-right">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gold/5">
                          {visible.map((p) => (
                            <tr key={p.id} className="hover:bg-cream/10 transition-colors">
                              <td className="py-2.5">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.type === 'Service Partner' ? 'bg-purple-100 text-purple-700' : p.type === 'Service' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{p.type}</span>
                              </td>
                              <td className="py-2.5 text-primary">{p.name}</td>
                              <td className="py-2.5 text-foreground/50">{p.date}</td>
                              <td className="py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setApprovedItems(prev => [...prev, p.id])}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[9px] font-bold transition-all active:scale-95"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setApprovedItems(prev => [...prev, p.id])}
                                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[9px] font-bold transition-all active:scale-95"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-primary text-sm">Recent Activity</h3>
                </div>
                <div className="space-y-4 text-xs font-semibold text-foreground/75 pr-1">
                  {[
                    { text: "New service partner \"Rohit Services\" registered", time: "5 mins ago", color: "text-green-600 bg-green-50" },
                    { text: "Booking #BKB492 confirmed by partner", time: "15 mins ago", color: "text-blue-600 bg-blue-50" },
                    { text: "Payment of ₹1,299 received for booking #BKB487", time: "1 hour ago", color: "text-amber-600 bg-amber-50" },
                    { text: "Service \"Deep Cleaning\" submitted for approval", time: "2 hours ago", color: "text-purple-600 bg-purple-50" },
                    { text: "New deal \"Summer Special Offer\" created", time: "3 hours ago", color: "text-pink-600 bg-pink-50" }
                  ].map((act, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${act.color.split(' ')[0]}`} style={{ backgroundColor: 'currentColor' }} />
                      <div className="min-w-0 flex-grow">
                        <p className="text-foreground/80 leading-normal">{act.text}</p>
                        <span className="text-[10px] text-foreground/45 font-medium block mt-0.5">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Service Partners */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-primary text-sm">Top Service Partners</h3>
                  <button onClick={() => setActiveTab('partners')} className="text-xs text-primary font-semibold hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold text-foreground/75">
                    <thead>
                      <tr className="border-b border-gold/10 text-foreground/45">
                        <th className="py-2">PARTNER</th>
                        <th className="py-2">TOTAL BOOKINGS</th>
                        <th className="py-2">RATING</th>
                        <th className="py-2 text-right">EARNINGS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/5">
                      {[
                        { name: 'CleanPro Solutions', bookings: '320', rating: '4.8', earnings: '₹1,25,430' },
                        { name: 'HomeShine Services', bookings: '280', rating: '4.7', earnings: '₹95,760' },
                        { name: 'FixWell Experts', bookings: '260', rating: '4.6', earnings: '₹87,540' },
                        { name: 'QuickFix Support', bookings: '210', rating: '4.5', earnings: '₹68,320' },
                        { name: 'Zaika Home Services', bookings: '190', rating: '4.4', earnings: '₹55,980' }
                      ].map((p, idx) => (
                        <tr key={idx} className="hover:bg-cream/10">
                          <td className="py-3 text-primary">{p.name}</td>
                          <td className="py-3">{p.bookings}</td>
                          <td className="py-3 text-gold">★ {p.rating}</td>
                          <td className="py-3 text-right text-emerald-600 font-bold">{p.earnings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Wallet & Payout Overview */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-primary text-sm">Wallet &amp; Payout Overview</h3>
                  <button onClick={() => setActiveTab('reports')} className="text-xs text-primary font-semibold hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-cream/30 p-2.5 rounded-2xl border border-gold/15 text-center">
                    <span className="text-[8px] text-foreground/45 uppercase tracking-wider block font-bold mb-0.5">Total Payouts</span>
                    <span className="text-xs font-bold text-primary">₹8,75,430</span>
                  </div>
                  <div className="bg-cream/30 p-2.5 rounded-2xl border border-gold/15 text-center">
                    <span className="text-[8px] text-foreground/45 uppercase tracking-wider block font-bold mb-0.5">Pending Payouts</span>
                    <span className="text-xs font-bold text-amber-600">₹1,24,680</span>
                  </div>
                  <div className="bg-cream/30 p-2.5 rounded-2xl border border-gold/15 text-center">
                    <span className="text-[8px] text-foreground/45 uppercase tracking-wider block font-bold mb-0.5">Available Bal</span>
                    <span className="text-xs font-bold text-emerald-600">₹62,750</span>
                  </div>
                </div>
                <div className="overflow-x-auto flex-grow">
                  <table className="w-full text-left text-[10px] font-semibold text-foreground/75">
                    <thead>
                      <tr className="border-b border-gold/10 text-foreground/45">
                        <th className="py-1">PARTNER</th>
                        <th className="py-1">DATE</th>
                        <th className="py-1">AMOUNT</th>
                        <th className="py-1 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/5">
                      {[
                        { name: 'CleanPro Solutions', date: '31 May 2024', amount: '₹25,000', status: 'Completed', color: 'bg-green-100 text-green-700' },
                        { name: 'HomeShine Services', date: '31 May 2024', amount: '₹18,750', status: 'Completed', color: 'bg-green-100 text-green-700' },
                        { name: 'FixWell Experts', date: '30 May 2024', amount: '₹15,500', status: 'Processing', color: 'bg-blue-100 text-blue-700' }
                      ].map((p, idx) => (
                        <tr key={idx} className="hover:bg-cream/10">
                          <td className="py-2.5 text-primary">{p.name}</td>
                          <td className="py-2.5 text-foreground/50">{p.date}</td>
                          <td className="py-2.5 font-bold">{p.amount}</td>
                          <td className="py-2.5 text-right">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${p.color}`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-primary text-sm mb-1">Quick Actions</h3>
                  <p className="text-[10px] text-foreground/45 font-semibold uppercase tracking-wider mb-4">Fast actions &amp; shortcuts</p>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-grow justify-center items-center">
                  <button onClick={() => { setActiveTab('categories'); }} className="flex flex-col items-center justify-center p-4 border border-gold/20 hover:border-primary rounded-2xl bg-cream/10 hover:bg-cream/30 transition-all text-center group">
                    <Zap className="w-5 h-5 text-primary group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-[10px] font-bold text-foreground">Add Category</span>
                  </button>
                  <button onClick={() => router.push('/admin/services/new')} className="flex flex-col items-center justify-center p-4 border border-gold/20 hover:border-primary rounded-2xl bg-cream/10 hover:bg-cream/30 transition-all text-center group">
                    <Plus className="w-5 h-5 text-primary group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-[10px] font-bold text-foreground">Add Service</span>
                  </button>
                  <button onClick={() => router.push('/admin/packages/new')} className="flex flex-col items-center justify-center p-4 border border-gold/20 hover:border-primary rounded-2xl bg-cream/10 hover:bg-cream/30 transition-all text-center group">
                    <Package className="w-5 h-5 text-primary group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-[10px] font-bold text-foreground">Add Package</span>
                  </button>
                  <button onClick={() => router.push('/admin/coupons/new')} className="flex flex-col items-center justify-center p-4 border border-gold/20 hover:border-primary rounded-2xl bg-cream/10 hover:bg-cream/30 transition-all text-center group">
                    <Tag className="w-5 h-5 text-primary group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-[10px] font-bold text-foreground">Add Coupon</span>
                  </button>
                  <button onClick={() => router.push('/admin/banners/new')} className="flex flex-col items-center justify-center p-4 border border-gold/20 hover:border-primary rounded-2xl bg-cream/10 hover:bg-cream/30 transition-all text-center group">
                    <Megaphone className="w-5 h-5 text-primary group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-[10px] font-bold text-foreground">Add Banner</span>
                  </button>
                  <button onClick={() => { setActiveTab('reports'); }} className="flex flex-col items-center justify-center p-4 border border-gold/20 hover:border-primary rounded-2xl bg-cream/10 hover:bg-cream/30 transition-all text-center group">
                    <FileText className="w-5 h-5 text-primary group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-[10px] font-bold text-foreground">View Reports</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Services ── */}
        {activeTab === 'services' && (
          <div className="space-y-4">

            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                <div className="relative flex-grow max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchServices()}
                    placeholder="Search services..." className="w-full pl-9 pr-4 py-2.5 border border-gold/30 rounded-2xl text-sm focus:outline-none focus:border-primary bg-white h-[42px]" />
                </div>
                <button onClick={fetchServices} className="px-4 py-2 bg-primary text-white rounded-2xl text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 h-[42px] flex-shrink-0">
                  <Search className="w-3.5 h-3.5" /> Search
                </button>
                {/* Custom Category Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsServiceCatDropdownOpen(!isServiceCatDropdownOpen)}
                    className="flex items-center justify-between gap-2 border border-gold/30 rounded-2xl px-4 py-2 text-sm bg-white focus:outline-none text-foreground/80 hover:border-primary font-medium w-48 text-left h-[42px]"
                  >
                    <span className="truncate">
                      {categories.find(c => c._id === serviceCatFilter)?.name || 'All Categories'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-foreground/55 flex-shrink-0" />
                  </button>
                  {isServiceCatDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsServiceCatDropdownOpen(false)} />
                      <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-gold/20 rounded-2xl shadow-xl z-20 py-1.5 divide-y divide-gold/5 max-h-60 overflow-y-auto font-semibold text-foreground/85 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setServiceCatFilter('');
                            setServicesPage(1);
                            setIsServiceCatDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left hover:bg-cream/40 transition-colors ${!serviceCatFilter ? 'text-primary bg-cream/20 font-bold' : 'text-foreground/75'}`}
                        >
                          All Categories
                        </button>
                        {categories.map(c => (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => {
                              setServiceCatFilter(c._id);
                              setServicesPage(1);
                              setIsServiceCatDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-cream/40 transition-colors ${serviceCatFilter === c._id ? 'text-primary bg-cream/20 font-bold' : 'text-foreground/75'}`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => router.push('/admin/services/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 flex-shrink-0">
                <Plus className="w-4 h-4" /> Add Service
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {servicesLoading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
              ) : services.length === 0 ? (
                <div className="py-16 text-center text-foreground/40 text-sm">
                  {servicesSubTab === 'pending' ? 'No pending service approvals found.' : 'No services found. Add your first service.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-cream text-xs text-foreground/70">
                        <th className="p-4 font-medium">Service</th>
                        <th className="p-4 font-medium">Category</th>
                        <th className="p-4 font-medium">Price</th>
                        <th className="p-4 font-medium">Duration</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs sm:text-sm divide-y divide-gray-100">
                      {services.map(svc => (
                        <tr key={svc._id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {svc.imageUrl && <img src={svc.imageUrl} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />}
                              <div>
                                <p className="font-medium text-primary">{svc.name}</p>
                                <p className="text-foreground/45 font-mono text-[10px]">{svc.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-foreground/70">{svc.categoryId?.name || '—'}</td>
                          
                          <td className="p-4 font-semibold text-primary">₹{svc.basePrice}</td>
                          <td className="p-4 text-foreground/60">{svc.estimatedDurationMins} min</td>

                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${svc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {svc.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => router.push(`/admin/services/${svc._id}/edit`)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteService(svc._id, svc.name)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <PaginationBar page={servicesPage} total={servicesTotal} limit={15} onPage={p => setServicesPage(p)} />
          </div>
        )}

        {/* ── TAB: Service Approvals ── */}
        {activeTab === 'service_approvals' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchServices()}
                  placeholder="Search approvals..." className="w-full pl-9 pr-4 py-2.5 border border-gold/30 rounded-2xl text-sm focus:outline-none focus:border-primary bg-white" />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {servicesLoading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
              ) : services.length === 0 ? (
                <div className="py-16 text-center text-foreground/40 text-sm">
                  No pending service approvals found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-cream text-xs text-foreground/70">
                        <th className="p-4 font-medium">Service</th>
                        <th className="p-4 font-medium">Category</th>
                        <th className="p-4 font-medium">Service Partner</th>
                        <th className="p-4 font-medium">Created Date</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs sm:text-sm divide-y divide-gray-100">
                      {services.map(svc => (
                        <tr key={svc._id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {svc.imageUrl && <img src={svc.imageUrl} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />}
                              <div>
                                <p className="font-medium text-primary">{svc.name}</p>
                                <p className="text-foreground/45 font-mono text-[10px]">{svc.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-foreground/70">{svc.categoryId?.name || '—'}</td>
                          <td className="p-4 text-foreground/75 font-semibold">{svc.createdByPartnerId?.name || 'Service Partner'}</td>
                          <td className="p-4 text-foreground/60">{new Date(svc.createdAt).toLocaleDateString('en-IN')}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              {svc.approvalStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={async () => { 
                                await api.patch(`/admin/services/${svc._id}/review`, { action: 'approve' }); 
                                fetchServices(); 
                              }} className="px-3 py-1 bg-green-500 text-white rounded-full text-[10px] font-bold hover:bg-green-600 transition-colors">
                                Approve
                              </button>
                              <button onClick={async () => { 
                                const r = prompt('Enter rejection reason:'); 
                                if (r !== null) {
                                  await api.patch(`/admin/services/${svc._id}/review`, { action: 'reject', rejectionReason: r }); 
                                  fetchServices(); 
                                }
                              }} className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-bold hover:bg-red-600 transition-colors">
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <PaginationBar page={servicesPage} total={servicesTotal} limit={15} onPage={p => setServicesPage(p)} />
          </div>
        )}

        {/* ── TAB: Sub Services ── */}
        {activeTab === 'sub_services' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-grow max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchServices()}
                  placeholder="Search sub-services..." className="w-full pl-9 pr-4 py-2.5 border border-gold/30 rounded-2xl text-sm focus:outline-none focus:border-primary bg-white h-[42px]" />
              </div>
              <button onClick={fetchServices} className="px-4 py-2 bg-primary text-white rounded-2xl text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 h-[42px]">
                <Search className="w-3.5 h-3.5" /> Search
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {servicesLoading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
              ) : services.length === 0 ? (
                <div className="py-16 text-center text-foreground/40 text-sm">
                  No sub services found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-cream text-xs text-foreground/70">
                        <th className="p-4 font-medium">Sub Service</th>
                        <th className="p-4 font-medium">Category</th>
                        <th className="p-4 font-medium">Price</th>
                        <th className="p-4 font-medium">Duration</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs sm:text-sm divide-y divide-gray-100">
                      {services.map(svc => (
                        <tr key={svc._id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {svc.imageUrl && <img src={svc.imageUrl} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />}
                              <div>
                                <p className="font-medium text-primary">{svc.name}</p>
                                <p className="text-foreground/45 font-mono text-[10px]">{svc.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-foreground/70">{svc.categoryId?.name || '—'}</td>
                          <td className="p-4 font-semibold text-primary">₹{svc.basePrice}</td>
                          <td className="p-4 text-foreground/60">{svc.estimatedDurationMins} min</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${svc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {svc.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => router.push(`/admin/services/${svc._id}/edit`)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteService(svc._id, svc.name)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <PaginationBar page={servicesPage} total={servicesTotal} limit={15} onPage={p => setServicesPage(p)} />
          </div>
        )}

        {/* ── TAB: Categories ── */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                <div className="relative flex-grow max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input value={categorySearch} onChange={e => setCategorySearch(e.target.value)}
                    placeholder="Search categories..." className="w-full pl-9 pr-4 py-2.5 border border-gold/30 rounded-2xl text-sm focus:outline-none focus:border-primary bg-white h-[42px]" />
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-2xl text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 h-[42px] flex-shrink-0">
                  <Search className="w-3.5 h-3.5" /> Search
                </button>
              </div>
              <button onClick={() => router.push('/admin/categories/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 ? (
                <div className="py-12 text-center text-foreground/40 text-sm">No categories found matching your query.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                    <div key={cat._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm text-foreground">{cat.name}</h3>
                        <p className="text-xs text-foreground/50 font-mono">{cat.slug} · Fee: {cat.platformFeePercentage || 10}%</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cat.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {cat.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <button onClick={() => router.push(`/admin/categories/${cat._id}/edit`)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat._id, cat.name)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Bookings ── */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex flex-wrap gap-2">
                {['ALL', 'PENDING_PAYMENT', 'REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => (
                  <button key={s} onClick={() => { setBookingStatusFilter(s); setBookingsPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${bookingStatusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white border-gold/20 text-foreground/60 hover:border-primary/30'}`}>
                    {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center bg-cream/35 p-3 rounded-2xl border border-gold/15">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input value={bookingSearch} onChange={e => setBookingSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchBookings()}
                  placeholder="Search customer / partner..."
                  className="w-full pl-9 pr-4 py-2 border border-gold/30 rounded-2xl text-xs focus:outline-none focus:border-primary bg-white" />
              </div>

              <select value={bookingServiceFilter} onChange={e => { setBookingServiceFilter(e.target.value); setBookingsPage(1); }}
                className="border border-gold/30 rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-white">
                <option value="">All Services</option>
                {allServicesList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>

              <input type="date" value={bookingDateFilter} onChange={e => { setBookingDateFilter(e.target.value); setBookingsPage(1); }}
                className="border border-gold/30 rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-white text-foreground/75" />

              <div className="flex gap-2">
                <button onClick={fetchBookings} className="flex-1 px-4 py-2 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary/90 transition-all">
                  Apply Filters
                </button>
                {(bookingSearch || bookingServiceFilter || bookingDateFilter) && (
                  <button onClick={() => { setBookingSearch(''); setBookingServiceFilter(''); setBookingDateFilter(''); setBookingsPage(1); }}
                    className="px-4 py-2 border border-gold/30 text-foreground/75 rounded-full text-xs font-semibold hover:bg-cream transition-all">
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {bookingsLoading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
              ) : bookings.length === 0 ? (
                <div className="py-16 text-center text-foreground/40 text-sm">No bookings found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-cream text-xs text-foreground/70">
                        <th className="p-4 font-medium">Booking ID</th>
                        <th className="p-4 font-medium">Customer</th>
                        <th className="p-4 font-medium">Service</th>
                        <th className="p-4 font-medium">Vendor</th>
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium">Amount</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-gray-100">
                      {bookings.map(bk => (
                        <tr key={bk._id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-mono text-foreground/50">{String(bk._id).slice(-8)}</td>
                          <td className="p-4">
                            <p className="font-medium text-foreground">{bk.customerId?.name || '—'}</p>
                            <p className="text-foreground/40">{bk.customerId?.phone || bk.customerId?.email || ''}</p>
                          </td>
                          <td className="p-4 text-foreground/70">
                            {bk.isPackageBooking ? (
                              <div>
                                <span className="font-semibold text-primary">{bk.packageId?.name || 'Package'}</span>
                                <span className="block text-[10px] text-foreground/40 font-bold uppercase tracking-wider">Package Booking</span>
                              </div>
                            ) : (
                              bk.serviceId?.name || '—'
                            )}
                          </td>
                          <td className="p-4 text-foreground/60">{bk.vendorId?.name || <span className="italic text-foreground/30">Unassigned</span>}</td>
                          <td className="p-4 text-foreground/60">{bk.scheduledDate ? new Date(bk.scheduledDate).toLocaleDateString('en-IN') : '—'}</td>
                          <td className="p-4 font-semibold text-primary">₹{bk.paymentDetails?.amount || '—'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[bk.status] || 'bg-gray-100 text-gray-600'}`}>
                              {bk.status?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!['COMPLETED', 'CANCELLED'].includes(bk.status) && (
                                <>
                                  <button onClick={() => { setSelectedAssignBooking(bk); setShowAssignModal(true); }}
                                    className="text-[10px] font-bold text-white bg-primary px-2.5 py-1 rounded-lg hover:bg-primary/95 transition-all">
                                    {bk.vendorId ? 'Reassign' : 'Assign'}
                                  </button>
                                  <button onClick={() => handleCancelBooking(bk._id)} className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-lg">Cancel</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <PaginationBar page={bookingsPage} total={bookingsTotal} limit={20} onPage={p => setBookingsPage(p)} />
          </div>
        )}

        {/* ── TAB: Users ── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {usersLoading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
              ) : users.length === 0 ? (
                <div className="py-16 text-center text-foreground/40 text-sm">No users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-cream text-xs text-foreground/70">
                        <th className="p-4 font-medium">User</th>
                        <th className="p-4 font-medium">Contact</th>
                        <th className="p-4 font-medium">Addresses</th>
                        <th className="p-4 font-medium">Joined</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-gray-100">
                      {users.map(u => (
                        <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <p className="font-medium text-foreground">{u.name}</p>
                            <p className="text-foreground/40 font-mono text-[10px]">{String(u._id).slice(-8)}</p>
                          </td>
                          <td className="p-4 text-foreground/60">
                            <p>{u.email || '—'}</p>
                            <p>{u.phone || '—'}</p>
                          </td>
                          <td className="p-4 text-foreground/60">{u.addresses?.length || 0}</td>
                          <td className="p-4 text-foreground/50">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleToggleUser(u._id)} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <PaginationBar page={usersPage} total={usersTotal} limit={20} onPage={p => setUsersPage(p)} />
          </div>
        )}

        {/* ── TAB: Service Partners ── */}
        {activeTab === 'partners' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                <div className="relative flex-grow max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input
                    value={partnerSearch}
                    onChange={e => setPartnerSearch(e.target.value)}
                    placeholder="Search partners by name/email..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gold/30 rounded-2xl text-sm focus:outline-none focus:border-primary bg-white h-[42px]"
                  />
                </div>
                {/* Custom KYC Status Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPartnerDropdownOpen(!isPartnerDropdownOpen)}
                    className="flex items-center justify-between gap-2 border border-gold/30 rounded-2xl px-4 py-2.5 text-sm bg-white focus:outline-none text-foreground/80 hover:border-primary font-medium w-48 h-[42px]"
                  >
                    <span>
                      {partnerKycFilter === 'ALL' ? 'All KYC Statuses'
                       : partnerKycFilter === 'APPROVED' ? 'Approved KYC'
                       : partnerKycFilter === 'PENDING_ADMIN_APPROVAL' ? 'Pending KYC'
                       : 'Rejected KYC'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-foreground/55 flex-shrink-0" />
                  </button>
                  {isPartnerDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsPartnerDropdownOpen(false)} />
                      <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-gold/20 rounded-2xl shadow-xl z-20 py-1.5 divide-y divide-gold/5 max-h-60 overflow-y-auto font-semibold text-foreground/80 text-xs">
                        {[
                          { value: 'ALL', label: 'All KYC Statuses' },
                          { value: 'APPROVED', label: 'Approved KYC' },
                          { value: 'PENDING_ADMIN_APPROVAL', label: 'Pending KYC' },
                          { value: 'REJECTED', label: 'Rejected KYC' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setPartnerKycFilter(opt.value);
                              setIsPartnerDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-cream/40 transition-colors ${partnerKycFilter === opt.value ? 'text-primary bg-cream/20 font-bold' : 'text-foreground/70'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <span className="text-xs text-foreground/50">{partnersTotal} total</span>
            </div>

            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {partnersLoading ? (
                <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
              ) : partnersList.length === 0 ? (
                <div className="p-12 text-center text-foreground/40 text-sm">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No service partners found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-cream text-xs text-foreground/70">
                        <th className="p-4 font-medium">Partner Name</th>
                        <th className="p-4 font-medium">Contact Details</th>
                        <th className="p-4 font-medium">City / Category</th>
                        <th className="p-4 font-medium">Commission Rate</th>
                        <th className="p-4 font-medium">KYC Status</th>
                        <th className="p-4 font-medium">Registered</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs sm:text-sm divide-y divide-gray-100">
                      {partnersList
                        .filter(p => {
                          if (!partnerSearch) return true;
                          const term = partnerSearch.toLowerCase();
                          return p.name?.toLowerCase().includes(term) || p.email?.toLowerCase().includes(term);
                        })
                        .map(p => (
                          <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <p className="font-semibold text-primary">{p.name || '—'}</p>
                              <p className="text-[10px] text-foreground/45 font-mono">{p.businessName || 'No business name'}</p>
                            </td>
                            <td className="p-4 text-foreground/70">
                              <p>{p.email || '—'}</p>
                              <p className="font-mono text-xs">{p.phone || '—'}</p>
                            </td>
                            <td className="p-4 text-foreground/60">
                              <p className="font-medium">{p.city || '—'}</p>
                              <p className="text-[10px] uppercase font-bold text-gold">{p.category || '—'}</p>
                            </td>
                            <td className="p-4 font-bold text-foreground/75">{p.commissionRate || 10}%</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.kycStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : p.kycStatus === 'PENDING_ADMIN_APPROVAL' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                                {p.kycStatus === 'PENDING_ADMIN_APPROVAL' ? 'PENDING' : p.kycStatus || 'NOT_SUBMITTED'}
                              </span>
                            </td>
                            <td className="p-4 text-foreground/50">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    if (p.kycStatus === 'PENDING_ADMIN_APPROVAL') {
                                      setActiveTab('verification');
                                    } else {
                                      setSelectedReviewVendor(p);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold rounded-xl transition-all"
                                >
                                  {p.kycStatus === 'PENDING_ADMIN_APPROVAL' ? 'Review KYC' : 'View File'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPartner(p);
                                  }}
                                  className="px-2.5 py-1.5 bg-gold/15 hover:bg-gold/25 text-primary text-xs font-bold rounded-xl transition-all"
                                >
                                  Availability &amp; Areas
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <PaginationBar page={partnersPage} total={partnersTotal} limit={15} onPage={p => setPartnersPage(p)} />
          </div>
        )}

        {/* ── TAB: Partner KYC ── */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-bold text-base text-primary flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Pending KYC Approvals</h2>
              </div>
              {pendingVendors.length === 0 ? (
                <div className="p-12 text-center text-foreground/40 text-sm">No pending KYC submissions.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-cream text-xs text-foreground/70">
                        <th className="p-4 font-medium">Partner Name</th>
                        <th className="p-4 font-medium">Category</th>
                        <th className="p-4 font-medium">Aadhaar</th>
                        <th className="p-4 font-medium">PAN</th>
                        <th className="p-4 font-medium">GST</th>
                        <th className="p-4 font-medium">Submitted</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs sm:text-sm divide-y divide-gray-100">
                      {pendingVendors.map(vendor => (
                        <tr key={vendor._id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-medium text-primary max-w-[140px] truncate">{vendor.name}</td>
                          <td className="p-4 text-foreground/70">{vendor.category}</td>
                          <td className="p-4 font-mono text-xs">{vendor.kycDetails?.aadharNumber ? <span className="text-green-700">🟢 {vendor.kycDetails.aadharNumber}</span> : 'Not Provided'}</td>
                          <td className="p-4 font-mono text-xs">{vendor.kycDetails?.panNumber ? <span className="text-green-700">🟢 {vendor.kycDetails.panNumber}</span> : 'Not Provided'}</td>
                          <td className="p-4 font-mono text-xs text-foreground/60">{vendor.kycDetails?.gstNumber || 'Not Provided'}</td>
                          <td className="p-4 text-foreground/60">{new Date(vendor.kycDetails?.submittedAt || vendor.createdAt).toLocaleDateString()}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setSelectedReviewVendor(vendor)}
                                className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold rounded-xl transition-all"
                              >
                                View Details
                              </button>
                              <button onClick={() => handleVerify(vendor._id, 'verify')} className="p-2 rounded bg-green-100 text-green-700 hover:bg-green-200" title="Approve"><Check className="w-4 h-4" /></button>
                              <button onClick={() => {
                                const reason = prompt('Rejection reason (shown to partner):');
                                if (reason !== null) {
                                  api.patch(`/admin/vendors/${vendor._id}/verify`, { action: 'reject', reviewNote: reason })
                                    .then(() => { alert('Partner rejected'); fetchPendingVendors(); fetchMetrics(); })
                                    .catch(() => alert('Rejection failed'));
                                }
                              }} className="p-2 rounded bg-red-100 text-red-700 hover:bg-red-200" title="Reject"><X className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Application Detail review modal */}
            {selectedReviewVendor && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-gold/20 rounded-3xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-primary">Review Partner Application</h3>
                      <p className="text-xs text-foreground/50">Details submitted by {selectedReviewVendor.name}</p>
                    </div>
                    <button onClick={() => setSelectedReviewVendor(null)} className="p-1 hover:text-gold transition-colors font-bold text-lg">×</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                    {/* Column 1 */}
                    <div className="space-y-4">
                      <div>
                        <span className="font-bold text-primary block">Account Name:</span>
                        <p className="text-foreground/70 mt-0.5">{selectedReviewVendor.name}</p>
                      </div>
                      <div>
                        <span className="font-bold text-primary block">Email & Mobile:</span>
                        <p className="text-foreground/70 mt-0.5">{selectedReviewVendor.email} | {selectedReviewVendor.phone}</p>
                      </div>
                      <div>
                        <span className="font-bold text-primary block">Business Profile:</span>
                        <p className="text-foreground/70 mt-0.5">{selectedReviewVendor.kycDetails?.businessName || selectedReviewVendor.name} ({selectedReviewVendor.businessType || 'Individual'})</p>
                        <p className="text-foreground/75 mt-0.5">{selectedReviewVendor.experience || 0} Years Experience · Team size: {selectedReviewVendor.teamSize || 1}</p>
                        <p className="text-[11px] text-foreground/50 italic mt-1">"{selectedReviewVendor.businessDescription || 'No description provided'}"</p>
                      </div>
                      <div>
                        <span className="font-bold text-primary block">Address & Location:</span>
                        <p className="text-foreground/70 mt-0.5">{selectedReviewVendor.location?.address}, {selectedReviewVendor.location?.city}</p>
                      </div>
                      <div>
                        <span className="font-bold text-primary block">Service Areas & Availability:</span>
                        <p className="text-foreground/70 mt-0.5">Areas: {selectedReviewVendor.serviceAreas?.join(', ') || 'Delhi NCR'}</p>
                        <p className="text-foreground/70 mt-0.5">Slots: {selectedReviewVendor.availability?.slots?.join(', ')} on {selectedReviewVendor.availability?.days?.join(', ')}</p>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4 sm:border-l sm:border-gray-100 sm:pl-6">
                      <div>
                        <span className="font-bold text-primary block">Aadhaar Card:</span>
                        <p className="font-mono text-foreground/75 mt-0.5">{selectedReviewVendor.kycDetails?.aadharNumber || 'Not Provided'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-primary block">PAN Card:</span>
                        <p className="font-mono text-foreground/75 mt-0.5">{selectedReviewVendor.kycDetails?.panNumber || 'Not Provided'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-primary block">GSTIN Number:</span>
                        <p className="font-mono text-foreground/75 mt-0.5">{selectedReviewVendor.kycDetails?.gstNumber || 'Not Provided'}</p>
                      </div>
                      <div className="border-t border-gray-100 pt-3">
                        <span className="font-bold text-primary block">Bank Details:</span>
                        {selectedReviewVendor.bankDetails ? (
                          <div className="font-mono text-foreground/75 mt-1 space-y-0.5 bg-cream/30 p-2.5 rounded-xl border border-gold/10">
                            <p><span className="font-sans font-bold text-primary">Holder:</span> {selectedReviewVendor.bankDetails.accountHolderName}</p>
                            <p><span className="font-sans font-bold text-primary">Bank:</span> {selectedReviewVendor.bankDetails.bankName}</p>
                            <p><span className="font-sans font-bold text-primary">A/C:</span> {selectedReviewVendor.bankDetails.accountNumber}</p>
                            <p><span className="font-sans font-bold text-primary">IFSC:</span> {selectedReviewVendor.bankDetails.ifscCode}</p>
                            <p><span className="font-sans font-bold text-primary">Type:</span> {selectedReviewVendor.bankDetails.accountType}</p>
                          </div>
                        ) : (
                          <p className="text-foreground/45 mt-0.5">Not Submitted</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-gray-100 justify-end">
                    <button 
                      onClick={() => setSelectedReviewVendor(null)}
                      className="px-5 py-2 border border-gold/30 hover:bg-cream/45 text-xs font-bold rounded-full text-foreground/60 transition-all"
                    >
                      Close
                    </button>
                    <button 
                      onClick={() => {
                        const reason = prompt('Rejection reason (shown to partner):');
                        if (reason !== null) {
                          api.patch(`/admin/vendors/${selectedReviewVendor._id}/verify`, { action: 'reject', reviewNote: reason })
                            .then(() => { 
                              alert('Partner rejected'); 
                              setSelectedReviewVendor(null);
                              fetchPendingVendors(); 
                              fetchMetrics(); 
                            })
                            .catch(() => alert('Rejection failed'));
                        }
                      }}
                      className="px-5 py-2.5 bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold rounded-full transition-all"
                    >
                      Reject Application
                    </button>
                    <button 
                      onClick={() => {
                        handleVerify(selectedReviewVendor._id, 'verify').then(() => {
                          setSelectedReviewVendor(null);
                        });
                      }}
                      className="px-6 py-2.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-full transition-all"
                    >
                      Approve & Onboard
                    </button>
                  </div>
                </div>
              </div>
            )}

            {editingPartner && (
              <AdminPartnerAvailabilityModal
                partner={editingPartner}
                onClose={() => {
                  setEditingPartner(null);
                  fetchPartners();
                }}
              />
            )}

          </div>
        )}

        {/* ── TAB: Auto-Assign ── */}
        {activeTab === 'assignment' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0"><Zap className="w-6 h-6 text-gold" /></div>
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-bold text-primary mb-1">Run Auto-Assignment</h2>
                  <p className="text-sm text-foreground/60 mb-5">Scans all <strong>REQUESTED</strong> bookings and assigns the best available partner to each based on engine weights.</p>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={handleRunAssign} disabled={assignRunning}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 disabled:opacity-60 text-sm">
                      {assignRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {assignRunning ? 'Running...' : 'Run Now (Batch)'}
                    </button>
                    <button onClick={fetchMetrics} className="flex items-center gap-2 px-4 py-3 border border-gold/30 text-foreground rounded-full font-medium hover:bg-cream text-sm">
                      <RefreshCw className="w-4 h-4" /> Refresh Metrics
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {(assignMsg || assignResults.length > 0) && (
              <div className="bg-white rounded-3xl border border-gold/20 shadow-sm p-6">
                <h3 className="font-bold text-base text-primary mb-4">Assignment Results</h3>
                {assignMsg && <p className="text-sm font-medium text-foreground/70 mb-4 bg-cream rounded-xl px-4 py-2">{assignMsg}</p>}
                <div className="space-y-3">{assignResults.map((r, i) => <AssignResultRow key={i} result={r} />)}</div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Reports & Analytics ── */}
        {activeTab === 'reports' && (() => {
          const filteredBookings = reportBookings.filter(b => {
            if (reportDateFilter === 'all') return true;
            const createdDate = new Date(b.createdAt);
            const diffDays = (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
            return diffDays <= Number(reportDateFilter);
          });

          const completed = filteredBookings.filter(b => b.status === 'COMPLETED');
          const totalRevenue = completed.reduce((sum, b) => sum + (b.paymentDetails?.amount || b.totalAmount || 0), 0);
          const commissionEarned = completed.reduce((sum, b) => sum + (b.commissionAmount || 0), 0);
          const avgValue = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;
          const activeCount = filteredBookings.filter(b => ['REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS'].includes(b.status)).length;

          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const last6Months = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return {
              monthNum: d.getMonth(),
              year: d.getFullYear(),
              label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
              revenue: 0,
              bookingsCount: 0
            };
          }).reverse();

          filteredBookings.forEach(b => {
            const date = new Date(b.createdAt);
            const m = date.getMonth();
            const y = date.getFullYear();
            const point = last6Months.find(p => p.monthNum === m && p.year === y);
            if (point) {
              point.bookingsCount += 1;
              if (b.status === 'COMPLETED') {
                point.revenue += (b.paymentDetails?.amount || b.totalAmount || 0);
              }
            }
          });

          const chartRevenueData = last6Months.map(p => ({ label: p.label, value: p.revenue }));
          const chartBookingData = last6Months.map(p => ({ label: p.label, value: p.bookingsCount }));

          const categoryMap: Record<string, { count: number, revenue: number }> = {};
          filteredBookings.forEach(b => {
            const catName = b.serviceId?.categoryId?.name || b.packageId?.categoryIds?.[0]?.name || 'Uncategorized';
            if (!categoryMap[catName]) {
              categoryMap[catName] = { count: 0, revenue: 0 };
            }
            categoryMap[catName].count += 1;
            if (b.status === 'COMPLETED') {
              categoryMap[catName].revenue += (b.paymentDetails?.amount || b.totalAmount || 0);
            }
          });

          const colors = ['#0F3D30', '#C3AB84', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
          const totalFilteredRevenue = Object.values(categoryMap).reduce((s, c) => s + c.revenue, 0) || 1;
          const categoryData = Object.entries(categoryMap).map(([name, val], idx) => ({
            name,
            percentage: Math.round((val.revenue / totalFilteredRevenue) * 100),
            color: colors[idx % colors.length]
          })).sort((a, b) => b.percentage - a.percentage).slice(0, 4);

          if (categoryData.length > 0) {
            const sum = categoryData.reduce((s, c) => s + c.percentage, 0);
            if (sum < 100 && sum > 0) {
              categoryData[0].percentage += (100 - sum);
            }
          }

          const serviceMap: Record<string, { name: string, count: number, revenue: number, category: string }> = {};
          filteredBookings.forEach(b => {
            const sName = b.serviceId?.name || b.packageId?.name || 'Package/Service';
            const sId = b.serviceId?._id || b.packageId?._id || 'unknown';
            const catName = b.serviceId?.categoryId?.name || b.packageId?.categoryIds?.[0]?.name || 'Uncategorized';
            if (!serviceMap[sId]) {
              serviceMap[sId] = { name: sName, count: 0, revenue: 0, category: catName };
            }
            serviceMap[sId].count += 1;
            if (b.status === 'COMPLETED') {
              serviceMap[sId].revenue += (b.paymentDetails?.amount || b.totalAmount || 0);
            }
          });
          const topServicesList = Object.values(serviceMap).sort((a, b) => b.count - a.count).slice(0, 5);

          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-3xl border border-gold/20 shadow-sm flex-wrap gap-4">
                <div>
                  <h3 className="font-serif font-bold text-primary text-base">Platform Revenue &amp; Growth</h3>
                  <p className="text-xs text-foreground/50">Analyze payments, commissions, and category performance</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Date Period:</span>
                  <select 
                    value={reportDateFilter} 
                    onChange={e => setReportDateFilter(e.target.value)}
                    className="border border-[#C3AB84]/30 rounded-2xl px-4 py-2 text-xs font-bold bg-[#F8F4EE] focus:outline-none focus:border-[#0F3D30]"
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="all">All Time</option>
                  </select>
                  <button onClick={fetchReportData} className="p-2 border border-gold/30 hover:bg-cream rounded-full transition-colors text-primary flex items-center justify-center">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {reportLoading ? (
                <div className="flex items-center justify-center min-h-[30vh]">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <DashboardKPICard label="Total Sales" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon={IndianRupee} bg="bg-green-100" text="text-green-700" trend="+12%" />
                    <DashboardKPICard label="Commission" value={`₹${commissionEarned.toLocaleString('en-IN')}`} icon={TrendingUp} bg="bg-gold/20" text="text-primary" trend="+8%" />
                    <DashboardKPICard label="Avg Order Value" value={`₹${avgValue.toLocaleString('en-IN')}`} icon={ShoppingBag} bg="bg-blue-100" text="text-blue-700" />
                    <DashboardKPICard label="Active Jobs" value={String(activeCount)} icon={Clock} bg="bg-indigo-100" text="text-indigo-700" />
                    <DashboardKPICard label="Total Bookings" value={String(filteredBookings.length)} icon={BookOpen} bg="bg-emerald-100" text="text-emerald-700" />
                  </div>

                  <DashboardCharts 
                    revenueData={chartRevenueData}
                    bookingData={chartBookingData}
                    categoryData={categoryData.length > 0 ? categoryData : undefined}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm">
                      <h4 className="font-serif font-bold text-primary text-base mb-4">Top Performing Services</h4>
                      {topServicesList.length === 0 ? (
                        <p className="text-sm text-foreground/50 text-center py-8">No booking data available.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-gold/10 text-foreground/50 font-bold uppercase tracking-wider">
                                <th className="pb-3">Service Name</th>
                                <th className="pb-3 text-center">Bookings</th>
                                <th className="pb-3 text-right">Revenue Generated</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gold/5 font-semibold text-foreground/80">
                              {topServicesList.map((svc, idx) => (
                                <tr key={idx} className="hover:bg-cream/40 transition-colors">
                                  <td className="py-3.5 pr-2">
                                    <div className="font-bold text-primary">{svc.name}</div>
                                    <div className="text-[10px] text-foreground/50">{svc.category}</div>
                                  </td>
                                  <td className="py-3.5 text-center">{svc.count}</td>
                                  <td className="py-3.5 text-right text-primary">₹{svc.revenue.toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm">
                      <h4 className="font-serif font-bold text-primary text-base mb-4">Commission Logs</h4>
                      {completed.length === 0 ? (
                        <p className="text-sm text-foreground/50 text-center py-8">No completed transactions in this period.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-gold/10 text-foreground/50 font-bold uppercase tracking-wider">
                                <th className="pb-3">Booking ID</th>
                                <th className="pb-3">Date</th>
                                <th className="pb-3 text-right">Order Total</th>
                                <th className="pb-3 text-right text-[#C5A880]">Nexora Cut (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gold/5 font-semibold text-foreground/80">
                              {completed.slice(0, 5).map((b, idx) => (
                                <tr key={idx} className="hover:bg-cream/40 transition-colors">
                                  <td className="py-3.5 font-mono text-foreground/60">{String(b._id).slice(-8).toUpperCase()}</td>
                                  <td className="py-3.5 text-foreground/50">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                  <td className="py-3.5 text-right">₹{(b.paymentDetails?.amount || b.totalAmount || 0).toLocaleString('en-IN')}</td>
                                  <td className="py-3.5 text-right text-primary font-bold">₹{(b.commissionAmount || 0).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ── TAB: Packages ── */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex justify-end mb-6">
              <button onClick={() => router.push('/admin/packages/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" /> Add Package
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {packagesLoading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
              : packages.length === 0 ? <div className="p-12 text-center text-foreground/40"><Gift className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No packages yet. Click &quot;Add Package&quot; to create one.</p></div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gold/10 bg-cream/50">
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Package</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Price</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Services</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Actions</th>
                    </tr></thead>
                    <tbody>{packages.map((pkg: any) => (
                      <tr key={pkg._id} className="border-b border-gold/5 hover:bg-cream/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {pkg.imageUrl && <img src={pkg.imageUrl} alt={pkg.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />}
                            <div><p className="font-semibold text-primary">{pkg.name}</p><p className="text-xs text-foreground/50">{pkg.slug}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-primary">₹{pkg.basePrice}{pkg.discountPercentage > 0 && <span className="ml-1 text-xs text-emerald-600">-{pkg.discountPercentage}%</span>}</td>
                        <td className="px-6 py-4 text-foreground/60 text-xs">{pkg.includedServices?.length || pkg.inclusions?.length || 0} included</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{pkg.isActive ? 'Active' : 'Inactive'}</span>
                            {pkg.isFeatured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Featured</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => router.push(`/admin/packages/${pkg._id}/edit`)} className="p-2 rounded-xl bg-cream hover:bg-beige transition-colors"><Edit2 className="w-4 h-4 text-primary" /></button>
                            <button onClick={() => handleDeleteGeneric('/admin/packages', pkg._id, pkg.name, fetchPackages)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Coupons ── */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex justify-end mb-6">
              <button onClick={() => router.push('/admin/coupons/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add Coupon
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {couponsLoading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
              : coupons.length === 0 ? <div className="p-12 text-center text-foreground/40"><Percent className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No coupons yet.</p></div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gold/10 bg-cream/50">
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Code</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Discount</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Used / Limit</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Expiry</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Actions</th>
                    </tr></thead>
                    <tbody>{coupons.map((c: any) => (
                      <tr key={c._id} className="border-b border-gold/5 hover:bg-cream/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-mono font-bold text-primary text-base">{c.code}</p>
                          {c.vendorId && <p className="text-[10px] text-purple-600 font-semibold">By: {c.vendorId.name || c.vendorId.businessName || 'Vendor'}</p>}
                        </td>
                        <td className="px-6 py-4">{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}{c.maxDiscountAmount && <span className="text-xs text-foreground/50 ml-1">(max ₹{c.maxDiscountAmount})</span>}</td>
                        <td className="px-6 py-4">{c.totalUsed} / {c.usageLimit ?? '∞'}</td>
                        <td className="px-6 py-4 text-xs text-foreground/60">{c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN') : 'Never'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap gap-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.isActive ? 'Active' : 'Off'}</span>
                              {c.isFirstTimeOnly && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">1st-Time</span>}
                            </div>
                            {c.vendorId && (
                              <div className="flex flex-wrap gap-1 items-center mt-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : c.approvalStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                                  {c.approvalStatus || 'PENDING'}
                                </span>
                                {c.approvalStatus === 'PENDING' && (
                                  <div className="flex gap-1 ml-1">
                                    <button onClick={async () => { await api.patch(`/admin/coupons/${c._id}/review`, { action: 'approve' }); fetchCoupons(); }} className="text-[10px] px-2 py-0.5 bg-green-500 text-white rounded-full font-bold hover:bg-green-600">Approve</button>
                                    <button onClick={async () => { const r = prompt('Rejection reason?'); if (r !== null) { await api.patch(`/admin/coupons/${c._id}/review`, { action: 'reject', rejectionReason: r }); fetchCoupons(); } }} className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded-full font-bold hover:bg-red-600">Reject</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => router.push(`/admin/coupons/${c._id}/edit`)} className="p-2 rounded-xl bg-cream hover:bg-beige"><Edit2 className="w-4 h-4 text-primary" /></button>
                            <button onClick={() => handleDeleteGeneric('/admin/coupons', c._id, c.code, fetchCoupons)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Banners ── */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="flex justify-end mb-6">
              <button onClick={() => router.push('/admin/banners/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add Banner
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {bannersLoading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
              : banners.length === 0 ? <div className="p-12 text-center text-foreground/40"><Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No banners yet.</p></div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gold/10 bg-cream/50">
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Banner</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">CTA</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Position</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Validity</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Order</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Actions</th>
                    </tr></thead>
                    <tbody>{banners.map((b: any) => (
                      <tr key={b._id} className="border-b border-gold/5 hover:bg-cream/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="w-14 h-9 rounded-lg object-cover flex-shrink-0" />}
                            <div><p className="font-semibold text-primary">{b.title}</p><p className="text-xs text-foreground/50">{b.subtitle}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-foreground/70">{b.ctaText} → {b.ctaRoute}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.position === 'PROMO_CARD' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {b.position === 'PROMO_CARD' ? 'Promo Card' : 'Carousel'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-foreground/60">{new Date(b.startDate).toLocaleDateString('en-IN')} – {b.endDate ? new Date(b.endDate).toLocaleDateString('en-IN') : '∞'}</td>
                        <td className="px-6 py-4 text-center font-bold">{b.displayOrder}</td>
                        <td className="px-6 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{b.isActive ? 'Active' : 'Off'}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => router.push(`/admin/banners/${b._id}/edit`)} className="p-2 rounded-xl bg-cream hover:bg-beige"><Edit2 className="w-4 h-4 text-primary" /></button>
                            <button onClick={() => handleDeleteGeneric('/admin/banners', b._id, b.title, fetchBanners)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Offers ── */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex justify-end mb-6">
              <button onClick={() => router.push('/admin/offers/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add Offer
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {offersLoading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
              : offers.length === 0 ? <div className="p-12 text-center text-foreground/40"><Star className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No offers yet.</p></div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gold/10 bg-cream/50">
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Offer</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Discount</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Source</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Approval</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Actions</th>
                    </tr></thead>
                    <tbody>{offers.map((o: any) => (
                      <tr key={o._id} className="border-b border-gold/5 hover:bg-cream/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-primary">{o.title}</p>
                          {o.vendorId && <p className="text-[10px] text-purple-600 font-semibold">By: {o.vendorId.name || o.vendorId.businessName || 'Vendor'}</p>}
                          <p className="text-xs text-foreground/50 line-clamp-1">{o.description}</p>
                        </td>
                        <td className="px-6 py-4">{o.discountType === 'PERCENTAGE' ? `${o.discountValue}%` : `₹${o.discountValue}`}</td>
                        <td className="px-6 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.source === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-purple-100 text-purple-700'}`}>{o.source}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : o.approvalStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>{o.approvalStatus}</span>
                            {o.source === 'VENDOR' && o.approvalStatus === 'PENDING' && (
                              <div className="flex gap-1">
                                <button onClick={async () => { await api.post(`/admin/offers/${o._id}/review`, { action: 'approve' }); fetchOffers(); }} className="text-[10px] px-2 py-0.5 bg-green-500 text-white rounded-full font-bold hover:bg-green-600">Approve</button>
                                <button onClick={async () => { const r = prompt('Rejection reason?'); if (r !== null) { await api.post(`/admin/offers/${o._id}/review`, { action: 'reject', rejectionReason: r }); fetchOffers(); } }} className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded-full font-bold hover:bg-red-600">Reject</button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{o.isActive ? 'Active' : 'Off'}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => router.push(`/admin/offers/${o._id}/edit`)} className="p-2 rounded-xl bg-cream hover:bg-beige"><Edit2 className="w-4 h-4 text-primary" /></button>
                            <button onClick={() => handleDeleteGeneric('/admin/offers', o._id, o.title, fetchOffers)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Sale Campaigns ── */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex justify-end mb-6">
              <button onClick={() => router.push('/admin/sale-campaigns/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add Campaign
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {campaignsLoading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
              : campaigns.length === 0 ? <div className="p-12 text-center text-foreground/40"><CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No campaigns yet.</p></div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gold/10 bg-cream/50">
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Campaign</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Discount</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Period</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-bold text-foreground/50 uppercase">Actions</th>
                    </tr></thead>
                    <tbody>{campaigns.map((c: any) => {
                      const now = Date.now();
                      const isRunning = c.isActive && new Date(c.startDate).getTime() <= now && new Date(c.endDate).getTime() >= now;
                      return (
                        <tr key={c._id} className="border-b border-gold/5 hover:bg-cream/30 transition-colors">
                          <td className="px-6 py-4"><p className="font-semibold text-primary">{c.name}</p><p className="text-xs text-foreground/50 line-clamp-1">{c.description}</p></td>
                          <td className="px-6 py-4 font-bold text-emerald-600">{c.discountPercentage}% OFF</td>
                          <td className="px-6 py-4 text-xs text-foreground/60">{new Date(c.startDate).toLocaleDateString('en-IN')} – {new Date(c.endDate).toLocaleDateString('en-IN')}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isRunning ? 'bg-green-100 text-green-700' : c.isActive ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                              {isRunning ? '🟢 Running' : c.isActive ? 'Scheduled' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              <button onClick={() => router.push(`/admin/sale-campaigns/${c._id}/edit`)} className="p-2 rounded-xl bg-cream hover:bg-beige"><Edit2 className="w-4 h-4 text-primary" /></button>
                              <button onClick={() => handleDeleteGeneric('/admin/sale-campaigns', c._id, c.name, fetchCampaigns)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-500" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Best Deals ── */}
        {activeTab === 'deals' && (
          <div className="space-y-6">

            <div className="flex justify-end mb-6">
              <button onClick={() => router.push('/admin/deals/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add Deal
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="text"
                value={dealSearch}
                onChange={e => setDealSearch(e.target.value)}
                placeholder="Search deals..."
                className="border border-gold/30 rounded-2xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-primary w-64"
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDealDropdownOpen(!isDealDropdownOpen)}
                  className="flex items-center justify-between gap-2 border border-gold/30 rounded-2xl px-4 py-2 text-sm bg-white focus:outline-none text-foreground/80 hover:border-primary font-medium w-48 text-left h-[38px]"
                >
                  <span className="truncate">
                    {dealFilter === 'all' && 'All Deals'}
                    {dealFilter === 'active' && 'Active'}
                    {dealFilter === 'inactive' && 'Inactive'}
                    {dealFilter === 'pending' && 'Pending Approval'}
                    {dealFilter === 'approved' && 'Approved'}
                    {dealFilter === 'rejected' && 'Rejected'}
                    {dealFilter === 'expired' && 'Expired'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-foreground/50 flex-shrink-0" />
                </button>
                {isDealDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDealDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-gold/20 rounded-2xl shadow-xl z-20 py-1.5 divide-y divide-gold/5 font-semibold text-foreground/85 text-xs">
                      {[
                        { value: 'all', label: 'All Deals' },
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'pending', label: 'Pending Approval' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' },
                        { value: 'expired', label: 'Expired' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setDealFilter(opt.value);
                            setIsDealDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left hover:bg-cream/40 transition-colors ${dealFilter === opt.value ? 'text-primary bg-cream/20 font-bold' : 'text-foreground/70'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <span className="text-xs text-foreground/50">{dealsTotal} total</span>
            </div>

            <div className="bg-white rounded-3xl border border-gold/20 shadow-sm overflow-hidden">
              {dealsLoading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
              : deals.length === 0 ? <div className="p-12 text-center text-foreground/40"><Tag className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No deals found. Click "Add Deal" to create the first one.</p></div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gold/10 bg-cream/50">
                      <th className="text-left px-4 py-3 text-xs font-bold text-foreground/50 uppercase">Deal</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-foreground/50 uppercase">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-foreground/50 uppercase">Price</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-foreground/50 uppercase">Discount</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-foreground/50 uppercase">Approval</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-foreground/50 uppercase">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-foreground/50 uppercase">Actions</th>
                    </tr></thead>
                    <tbody>{deals.map((d: any) => {
                      const isExpired = d.endDate && new Date(d.endDate) < new Date();
                      return (
                        <tr key={d._id} className="border-b border-gold/5 hover:bg-cream/30 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {d.imageUrl && <img src={d.imageUrl} alt={d.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />}
                              <div className="min-w-0">
                                <p className="font-semibold text-primary truncate max-w-[180px]">{d.title}</p>
                                <p className="text-xs text-foreground/50 truncate max-w-[180px]">{d.serviceId?.name || d.packageId?.name || '—'}</p>
                                {d.isFeatured && <span className="text-[10px] bg-gold/20 text-gold font-bold px-2 py-0.5 rounded-full">★ Featured</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.dealType === 'SERVICE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{d.dealType}</span></td>
                          <td className="px-4 py-4">
                            <p className="text-xs text-foreground/50 line-through">₹{d.originalPrice?.toLocaleString('en-IN')}</p>
                            <p className="font-bold text-emerald-600">₹{d.finalPrice?.toLocaleString('en-IN')}</p>
                          </td>
                          <td className="px-4 py-4 font-semibold text-red-500">{d.discountType === 'PERCENTAGE' ? `${d.discountValue}% OFF` : `₹${d.discountValue} OFF`}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${d.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : d.approvalStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>{d.approvalStatus}</span>
                              {d.vendorId && d.approvalStatus === 'PENDING' && (
                                <div className="flex gap-1">
                                  <button onClick={async () => { await api.patch(`/admin/deals/${d._id}/review`, { action: 'approve' }); fetchDeals(); }} className="text-[10px] px-2 py-0.5 bg-green-500 text-white rounded-full font-bold hover:bg-green-600">Approve</button>
                                  <button onClick={async () => { const r = prompt('Rejection reason?'); if (r !== null) { await api.patch(`/admin/deals/${d._id}/review`, { action: 'reject', rejectionReason: r }); fetchDeals(); } }} className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded-full font-bold hover:bg-red-600">Reject</button>
                                </div>
                              )}
                              {d.rejectionReason && <p className="text-[10px] text-red-500 italic">{d.rejectionReason}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${d.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{d.isActive ? 'Active' : 'Inactive'}</span>
                              {isExpired && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit bg-orange-100 text-orange-600">Expired</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => setSelectedViewDeal(d)} className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100" title="View Deal Details">
                                <Eye className="w-4 h-4 text-blue-600" />
                              </button>
                              <button onClick={async () => { await api.patch(`/admin/deals/${d._id}/status`, { isActive: !d.isActive }); fetchDeals(); }} className={`p-1.5 rounded-xl ${d.isActive ? 'bg-amber-50 hover:bg-amber-100' : 'bg-green-50 hover:bg-green-100'}`} title={d.isActive ? 'Deactivate' : 'Activate'}>
                                {d.isActive ? <ToggleRight className="w-4 h-4 text-amber-500" /> : <ToggleLeft className="w-4 h-4 text-green-600" />}
                              </button>
                              <button onClick={async () => { await api.patch(`/admin/deals/${d._id}/featured`, { isFeatured: !d.isFeatured }); fetchDeals(); }} className={`p-1.5 rounded-xl ${d.isFeatured ? 'bg-gold/20 hover:bg-gold/30' : 'bg-cream hover:bg-beige'}`} title={d.isFeatured ? 'Remove Featured' : 'Mark Featured'}>
                                <Star className={`w-4 h-4 ${d.isFeatured ? 'text-gold fill-gold' : 'text-foreground/40'}`} />
                              </button>
                              <button onClick={() => router.push(`/admin/deals/${d._id}/edit`)} className="p-1.5 rounded-xl bg-cream hover:bg-beige"><Edit2 className="w-4 h-4 text-primary" /></button>
                              <button onClick={() => handleDeleteGeneric('/admin/deals', d._id, d.title, fetchDeals)} className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-500" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Settings ── */}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {settingsLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
            ) : (
              <>
                <div className="bg-white rounded-3xl border border-gold/20 shadow-sm p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div>
                      <h2 className="font-serif text-xl font-bold text-primary">Scoring Weights</h2>
                      <p className="text-sm text-foreground/60 mt-1">All five weights must sum to exactly 100.</p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ${Math.abs(weightsSum - 100) < 0.01 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      Total: {weightsSum}/100
                    </span>
                  </div>
                  {(Object.keys(localSettings.weights) as Array<keyof Weights>).map(field => (
                    <WeightRow key={field} field={field} value={localSettings.weights[field]} onChange={handleWeightChange} />
                  ))}
                </div>

                <div className="bg-white rounded-3xl border border-gold/20 shadow-sm p-6 sm:p-8">
                  <h2 className="font-serif text-xl font-bold text-primary mb-6">Location &amp; Fee Bounds</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">Max Search Radius (km)</label>
                      <input type="number" min={1} max={200} value={localSettings.maxRadiusKm}
                        onChange={e => setLocalSettings(p => ({ ...p, maxRadiusKm: Number(e.target.value) }))}
                        className="w-full border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-cream focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">Platform Fee Min (₹)</label>
                      <input type="number" min={0} value={localSettings.platformFee.minRupees}
                        onChange={e => setLocalSettings(p => ({ ...p, platformFee: { ...p.platformFee, minRupees: Number(e.target.value) } }))}
                        className="w-full border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-cream focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">Platform Fee Max (₹)</label>
                      <input type="number" min={0} value={localSettings.platformFee.maxRupees}
                        onChange={e => setLocalSettings(p => ({ ...p, platformFee: { ...p.platformFee, maxRupees: Number(e.target.value) } }))}
                        className="w-full border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-cream focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">Commission Min (%)</label>
                      <input type="number" min={0} max={100} value={localSettings.partnerCommission.minPercent}
                        onChange={e => setLocalSettings(p => ({ ...p, partnerCommission: { ...p.partnerCommission, minPercent: Number(e.target.value) } }))}
                        className="w-full border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-cream focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">Commission Max (%)</label>
                      <input type="number" min={0} max={100} value={localSettings.partnerCommission.maxPercent}
                        onChange={e => setLocalSettings(p => ({ ...p, partnerCommission: { ...p.partnerCommission, maxPercent: Number(e.target.value) } }))}
                        className="w-full border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-cream focus:outline-none focus:border-primary" />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="block text-sm font-medium text-foreground/70 mb-2">Auto-Assign on Payment</label>
                      <button onClick={() => setLocalSettings(p => ({ ...p, autoAssignEnabled: !p.autoAssignEnabled }))}
                        className={`w-full py-3 rounded-2xl border text-sm font-semibold transition-all ${localSettings.autoAssignEnabled ? 'bg-primary text-white border-primary' : 'bg-cream border-gold/30 text-foreground/70'}`}>
                        {localSettings.autoAssignEnabled ? '✓ Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gold/20 shadow-sm p-6 sm:p-8">
                  <h2 className="font-serif text-xl font-bold text-primary mb-6">Promotional Banner</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">Coupon Code</label>
                      <input type="text" value={(localSettings as any).promoCode || ''}
                        onChange={e => setLocalSettings(p => ({ ...p, promoCode: e.target.value } as any))}
                        placeholder="NEXORA10" className="w-full border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-cream focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">Banner Description</label>
                      <input type="text" value={(localSettings as any).promoText || ''}
                        onChange={e => setLocalSettings(p => ({ ...p, promoText: e.target.value } as any))}
                        placeholder="ONLINE BOOKING 10% OFF" className="w-full border border-gold/30 rounded-2xl px-4 py-3 text-sm bg-cream focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>

                {settingsMsg && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium ${settingsMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {settingsMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {settingsMsg.text}
                  </div>
                )}
                <button onClick={handleSaveSettings} disabled={settingsSaving || Math.abs(weightsSum - 100) > 0.01}
                  className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 disabled:opacity-60 text-sm">
                  {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                  {settingsSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </>
            )}
          </div>
        )}
      </main>



    </div>

  );
}

function AdminPartnerAvailabilityModal({ partner, onClose }: { partner: any; onClose: () => void }) {
  const [days, setDays] = useState<string[]>(partner.availability?.days || []);
  const [slots, setSlots] = useState<string[]>(partner.availability?.slots || []);
  const [customTimes, setCustomTimes] = useState<string[]>(partner.availability?.customTimes || []);
  const [timeInput, setTimeInput] = useState('');

  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [areasList, setAreasList] = useState<any[]>([]);
  const [pincodesList, setPincodesList] = useState<any[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<any[]>([]);

  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedPincodeId, setSelectedPincodeId] = useState('');

  const [cityOpen, setCityOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [pincodeOpen, setPincodeOpen] = useState(false);

  const cityRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const pincodeRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) setCityOpen(false);
      if (areaRef.current && !areaRef.current.contains(event.target as Node)) setAreaOpen(false);
      if (pincodeRef.current && !pincodeRef.current.contains(event.target as Node)) setPincodeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);

    const loadData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/locations/public');
        if (data?.success) {
          const { cities, areas, pincodes } = data.data;
          setCitiesList(cities || []);
          setAreasList(areas || []);
          setPincodesList(pincodes || []);

          const savedAreaIds = partner.serviceAreaIds || [];
          const matched = (areas || [])
            .filter((a: any) => savedAreaIds.includes(a._id))
            .map((a: any) => {
              const cId = a.cityId?._id || a.cityId;
              const cObj = (cities || []).find((c: any) => c._id === cId);
              return {
                _id: a._id,
                name: a.name,
                cityName: cObj ? cObj.name : 'NCR'
              };
            });
          setSelectedAreas(matched);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [partner]);

  const handleAddTime = () => {
    if (!timeInput) return;
    if (customTimes.includes(timeInput)) return;
    setCustomTimes(prev => [...prev, timeInput].sort());
    setTimeInput('');
  };

  const handleRemoveTime = (t: string) => {
    setCustomTimes(prev => prev.filter(x => x !== t));
  };

  const handleAddLocation = () => {
    if (!selectedAreaId) return;
    if (selectedAreas.some(a => a._id === selectedAreaId)) return;

    const areaObj = areasList.find(a => a._id === selectedAreaId);
    const cityObj = citiesList.find(c => c._id === selectedCityId);

    if (areaObj) {
      setSelectedAreas(prev => [
        ...prev,
        {
          _id: areaObj._id,
          name: areaObj.name,
          cityName: cityObj ? cityObj.name : 'NCR'
        }
      ]);
    }
    setSelectedAreaId('');
    setSelectedPincodeId('');
  };

  const handleRemoveLocation = (id: string) => {
    setSelectedAreas(prev => prev.filter(x => x._id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const serviceAreaIds = selectedAreas.map(a => a._id);
      await api.put(`/admin/vendors/${partner._id}/availability`, { days, slots, customTimes, serviceAreaIds });
      setSuccessMsg('Partner Availability & Service Areas updated successfully.');
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update partner availability.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#F8F4EE] rounded-[32px] w-full max-w-4xl border border-gold/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-gold/15 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-primary">Availability &amp; Service Areas</h3>
            <p className="text-xs text-foreground/50">Manage settings for partner: <span className="font-bold text-primary">{partner.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gold/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-foreground/75" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs font-bold text-red-700">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs font-bold text-emerald-700">
              {successMsg}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white border border-gold/15 rounded-3xl p-5 space-y-4 shadow-sm">
                <h4 className="font-serif font-bold text-primary text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold" /> Service Locations
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="relative" ref={cityRef}>
                    <label className="block text-[9px] font-bold text-foreground/60 uppercase mb-1">City</label>
                    <button
                      type="button"
                      onClick={() => setCityOpen(!cityOpen)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gold/20 text-[11px] bg-cream flex justify-between items-center text-left"
                    >
                      <span className="truncate">{selectedCityId ? citiesList.find(c => c._id === selectedCityId)?.name : 'Select City'}</span>
                      <span className="text-[6px]">▼</span>
                    </button>
                    {cityOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gold/20 rounded-lg shadow-lg z-50 max-h-36 overflow-y-auto py-1">
                        {citiesList.map((c: any) => (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => {
                              setSelectedCityId(c._id);
                              setSelectedAreaId('');
                              setSelectedPincodeId('');
                              setCityOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-cream text-[11px] text-primary"
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={areaRef}>
                    <label className="block text-[9px] font-bold text-foreground/60 uppercase mb-1">Area</label>
                    <button
                      type="button"
                      disabled={!selectedCityId}
                      onClick={() => setAreaOpen(!areaOpen)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gold/20 text-[11px] bg-cream flex justify-between items-center text-left disabled:opacity-50"
                    >
                      <span className="truncate">
                        {!selectedCityId ? 'Select City First' : (selectedAreaId ? areasList.find(a => a._id === selectedAreaId)?.name : 'Select Area')}
                      </span>
                      <span className="text-[6px]">▼</span>
                    </button>
                    {areaOpen && selectedCityId && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gold/20 rounded-lg shadow-lg z-50 max-h-36 overflow-y-auto py-1">
                        {areasList
                          .filter((a: any) => (a.cityId?._id || a.cityId) === selectedCityId)
                          .map((a: any) => (
                            <button
                              key={a._id}
                              type="button"
                              onClick={() => {
                                setSelectedAreaId(a._id);
                                setSelectedPincodeId('');
                                setAreaOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-cream text-[11px] text-primary"
                            >
                              {a.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={pincodeRef}>
                    <label className="block text-[9px] font-bold text-foreground/60 uppercase mb-1">Pincode</label>
                    <button
                      type="button"
                      disabled={!selectedAreaId}
                      onClick={() => setPincodeOpen(!pincodeOpen)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gold/20 text-[11px] bg-cream flex justify-between items-center text-left disabled:opacity-50"
                    >
                      <span className="truncate">
                        {!selectedAreaId ? 'Select Area First' : (selectedPincodeId ? pincodesList.find(p => p._id === selectedPincodeId)?.code : 'Select Pincode')}
                      </span>
                      <span className="text-[6px]">▼</span>
                    </button>
                    {pincodeOpen && selectedAreaId && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gold/20 rounded-lg shadow-lg z-50 max-h-36 overflow-y-auto py-1">
                        {pincodesList
                          .filter((p: any) => (p.areaId?._id || p.areaId) === selectedAreaId)
                          .map((p: any) => (
                            <button
                              key={p._id}
                              type="button"
                              onClick={() => {
                                setSelectedPincodeId(p._id);
                                setPincodeOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-cream text-[11px] text-primary"
                            >
                              {p.code}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedAreaId}
                  onClick={handleAddLocation}
                  className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/95 disabled:opacity-50 transition-all"
                >
                  Add Location to Partner
                </button>

                <div className="flex flex-wrap gap-2 pt-2 max-h-[120px] overflow-y-auto">
                  {selectedAreas.map((area: any) => (
                    <span key={area._id} className="inline-flex items-center gap-1 bg-cream px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-primary border border-gold/15">
                      {area.name} ({area.cityName})
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(area._id)}
                        className="text-red-500 hover:text-red-700 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedAreas.length === 0 && (
                    <p className="text-[10px] text-foreground/45 italic">No service locations added yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gold/15 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-serif font-bold text-primary text-sm flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-gold" /> Available Days
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => {
                      const active = days.includes(d);
                      return (
                        <button
                          key={d} type="button"
                          onClick={() => {
                            if (active) setDays(days.filter(x => x !== d));
                            else setDays([...days, d]);
                          }}
                          className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                            active ? 'bg-primary text-white border-primary shadow-sm' : 'bg-cream text-foreground/75 border-gold/20'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-primary text-sm flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gold" /> Available Time Slots
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Morning', 'Afternoon', 'Evening'].map(s => {
                      const active = slots.includes(s);
                      return (
                        <button
                          key={s} type="button"
                          onClick={() => {
                            if (active) setSlots(slots.filter(x => x !== s));
                            else setSlots([...slots, s]);
                          }}
                          className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${
                            active ? 'bg-primary text-white border-primary shadow-sm' : 'bg-cream text-foreground/75 border-gold/20'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="font-serif font-bold text-primary text-sm flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gold" /> Custom Working Hours
                  </h4>
                  <div className="flex gap-2 items-center">
                    <input
                      type="time"
                      value={timeInput}
                      onChange={e => setTimeInput(e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-gold/20 text-xs font-semibold text-primary bg-cream focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddTime}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customTimes.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 bg-primary/5 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full border border-primary/10">
                        {t}
                        <button type="button" onClick={() => handleRemoveTime(t)} className="text-red-500 font-bold ml-1">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        <div className="p-6 border-t border-gold/15 bg-cream/45 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gold/30 hover:bg-gray-50 text-xs font-bold rounded-full transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 bg-[#1D3B31] text-white hover:bg-[#1D3B31]/95 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Availability'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0F3D30] border-t-transparent rounded-full animate-spin" /></div>}>
      <AdminDashboardContent />
    </React.Suspense>
  );
}
