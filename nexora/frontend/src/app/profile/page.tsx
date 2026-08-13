"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Phone, Loader2, Save, Edit, ShieldCheck, Clock, MapPin, LogOut, 
  CalendarDays, Key, LayoutDashboard, Settings, HelpCircle, Gift, Star, 
  Bell, Wallet, Percent, Tag, Heart, ListCollapse 
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import DashboardKPICard from '@/components/dashboard/DashboardKPICard';

type SidebarTab = 
  | 'dashboard' 
  | 'bookings' 
  | 'active_services' 
  | 'history' 
  | 'addresses' 
  | 'saved_services' 
  | 'coupons' 
  | 'wallet' 
  | 'notifications' 
  | 'reviews' 
  | 'refer' 
  | 'support' 
  | 'personal' 
  | 'security';

export default function ProfilePage() {
  const { user, login, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [isEditing, setIsEditing] = useState(false);

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Address list state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [label, setLabel] = useState('Home');

  // Bookings list state
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/profile');
      return;
    }
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      fetchAddresses();
      fetchBookings();
    }
  }, [authLoading, user]);

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/user/addresses');
      setAddresses(data.addresses || data || []);
    } catch (err) {
      console.error("Failed to load addresses:", err);
    }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const { data } = await api.get('/bookings');
      setBookings(data || []);
    } catch (err) {
      console.error("Failed to load bookings on profile panel:", err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const { data } = await api.put('/user/profile', {
        name,
        email,
        phone
      });
      if (data.success) {
        const storedToken = localStorage.getItem('nexora_token') || '';
        login(storedToken, {
          id: user!.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          profilePhoto: user?.profilePhoto
        });
        setSuccessMsg('Profile updated successfully.');
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!line1 || !city || !state || !pincode) {
      setError('Please fill in all address fields.');
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.post('/user/addresses', {
        label,
        line1,
        city,
        state,
        pincode
      });
      setAddresses(data.addresses || []);
      setLine1('');
      setCity('');
      setState('');
      setPincode('');
      setLabel('Home');
      setShowAddressForm(false);
      setSuccessMsg('Address added successfully.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setError('');
    try {
      const { data } = await api.delete(`/user/addresses/${addressId}`);
      setAddresses(data.addresses || []);
      setSuccessMsg('Address deleted successfully.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete address.');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700' },
    REQUESTED: { label: 'Finding Partner', color: 'bg-blue-100 text-blue-700' },
    ASSIGNED: { label: 'Partner Assigned', color: 'bg-indigo-100 text-indigo-700' },
    ARRIVED: { label: 'Partner Arrived', color: 'bg-purple-100 text-purple-700' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-orange-100 text-orange-700' },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  };

  const activeBookingsList = bookings.filter(b => ['REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS'].includes(b.status));
  const completedBookingsList = bookings.filter(b => b.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-cream py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-8 lg:px-12 max-w-8xl">

        {/* Header Summary Row */}
        <div className="bg-primary text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gold/15 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-1/2 right-10 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-full bg-cream border border-gold/40 flex items-center justify-center text-primary text-xl font-serif font-bold uppercase shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-white">{user?.name}</h1>
              <p className="text-white/70 text-xs mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Sidebar + Tab panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Responsive Sidebar Options */}
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 bg-white rounded-3xl p-3 border border-gold/20 shadow-sm scrollbar-none self-start lg:w-full">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'bookings', label: 'My Bookings', icon: CalendarDays },
              { id: 'active_services', label: 'Active Services', icon: Clock },
              { id: 'history', label: 'Booking History', icon: ListCollapse },
              { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
              { id: 'saved_services', label: 'Saved Services', icon: Heart },
              { id: 'coupons', label: 'Coupons', icon: Percent },
              { id: 'wallet', label: 'Wallet', icon: Wallet },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'reviews', label: 'Reviews', icon: Star },
              { id: 'refer', label: 'Refer & Earn', icon: Gift },
              { id: 'support', label: 'Help & Support', icon: HelpCircle },
              { id: 'personal', label: 'Profile Details', icon: User },
              { id: 'security', label: 'Settings & Security', icon: Settings },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as SidebarTab); setIsEditing(false); setError(''); setSuccessMsg(''); }}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap lg:w-full text-left ${isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-foreground/60 hover:bg-cream hover:text-primary'
                    }`}
                >
                  <IconComp className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Logout button */}
            <button onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all whitespace-nowrap lg:w-full text-left lg:mt-4 border-t border-gold/10 lg:pt-4">
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>

          {/* Active Tab Main Content Panel */}
          <div className="lg:col-span-3">

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Visual Preview Dashboard Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <DashboardKPICard label="Total Bookings" value={bookings.length} icon={CalendarDays} bg="bg-blue-100" text="text-blue-700" />
                  <DashboardKPICard label="Active Orders" value={activeBookingsList.length} icon={Clock} bg="bg-indigo-100" text="text-indigo-700" />
                  <DashboardKPICard label="Saved Addresses" value={addresses.length} icon={MapPin} bg="bg-green-100" text="text-green-700" />
                  <DashboardKPICard label="Wallet Balance" value="₹1,500" icon={Wallet} bg="bg-amber-100" text="text-amber-700" />
                </div>

                {/* Upcoming / Active Bookings */}
                <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm">
                  <h3 className="font-serif font-bold text-primary text-base mb-4">Upcoming Booking Orders</h3>
                  {activeBookingsList.length === 0 ? (
                    <p className="text-xs text-foreground/45 py-4">No upcoming bookings. Book your next home service today!</p>
                  ) : (
                    <div className="space-y-3">
                      {activeBookingsList.map(b => (
                        <div key={b._id} className="p-4 bg-cream rounded-2xl border border-gold/10 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-primary">{b.serviceId?.name}</p>
                            <p className="text-[10px] text-foreground/50 mt-0.5">Slot: {b.scheduledSlot} on {new Date(b.scheduledDate).toLocaleDateString('en-IN')}</p>
                          </div>
                          <span className="text-xs font-bold text-primary">₹{b.paymentDetails?.amount || b.serviceId?.basePrice}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Best Deals & Recommended Services preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm">
                    <h3 className="font-serif font-bold text-primary text-sm mb-3">Best Deals & Offers</h3>
                    <div className="p-4 bg-cream rounded-2xl border border-gold/10 flex gap-3 items-center">
                      <Tag className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-xs font-bold text-primary">Flat 15% OFF on Salon Classic</p>
                        <p className="text-[10px] text-foreground/50 mt-0.5">Use Code: NEXOSALON15</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm">
                    <h3 className="font-serif font-bold text-primary text-sm mb-3">Active Coupons</h3>
                    <div className="p-4 bg-cream rounded-2xl border border-gold/10 flex gap-3 items-center">
                      <Percent className="w-8 h-8 text-[#1D3B31]" />
                      <div>
                        <p className="text-xs font-bold text-primary">₹150 Cashback on First AC Service</p>
                        <p className="text-[10px] text-foreground/50 mt-0.5">Valid until end of month.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px]">
                <h2 className="font-serif text-xl font-bold text-primary mb-6">My Booking Orders</h2>
                {bookingsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarDays className="w-12 h-12 text-gold mx-auto mb-3" />
                    <p className="text-xs text-foreground/50">You have no booking records yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => {
                      const status = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700' };
                      return (
                        <div key={booking._id} className="p-4 rounded-2xl bg-cream border border-gold/10 flex justify-between items-start gap-3">
                          <div>
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color} mb-2`}>
                              {status.label}
                            </span>
                            <h3 className="font-serif text-sm font-bold text-primary">{booking.serviceId?.name || 'Service'}</h3>
                            <p className="text-[10px] text-foreground/50 mt-1">Scheduled: {new Date(booking.scheduledDate).toLocaleDateString('en-IN')} | Slot: {booking.scheduledSlot}</p>
                          </div>
                          <span className="font-bold text-primary text-sm whitespace-nowrap">₹{booking.paymentDetails?.amount || booking.serviceId?.basePrice}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'active_services' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px]">
                <h2 className="font-serif text-xl font-bold text-primary mb-6">Active Services</h2>
                {activeBookingsList.length === 0 ? (
                  <p className="text-xs text-foreground/45 text-center py-10 bg-cream rounded-2xl border border-gold/10">No active service tasks in progress currently.</p>
                ) : (
                  <div className="space-y-3">
                    {activeBookingsList.map(b => (
                      <div key={b._id} className="p-4 bg-cream rounded-2xl border border-gold/10 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-primary">{b.serviceId?.name}</p>
                          <p className="text-[10px] text-foreground/50 mt-0.5">Status: <span className="font-semibold text-primary">{b.status}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px]">
                <h2 className="font-serif text-xl font-bold text-primary mb-6">Booking History</h2>
                {completedBookingsList.length === 0 ? (
                  <p className="text-xs text-foreground/45 text-center py-10 bg-cream rounded-2xl border border-gold/10">No completed jobs found in your history.</p>
                ) : (
                  <div className="space-y-3">
                    {completedBookingsList.map(b => (
                      <div key={b._id} className="p-4 bg-cream rounded-2xl border border-gold/10 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-primary">{b.serviceId?.name}</p>
                          <p className="text-[10px] text-foreground/50 mt-0.5">Completed on {new Date(b.updatedAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span className="text-xs font-bold text-primary">₹{b.paymentDetails?.amount || b.serviceId?.basePrice}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-serif text-xl font-bold text-primary">Saved Addresses</h2>
                  <button onClick={() => setShowAddressForm(!showAddressForm)}
                    className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/95 transition-all shadow-sm">
                    {showAddressForm ? 'Cancel' : '+ Add Address'}
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="mb-6 p-5 bg-cream rounded-2xl border border-gold/15 space-y-4">
                    <h3 className="font-serif text-sm font-bold text-primary">New Delivery Location</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-foreground/75 mb-1 uppercase tracking-wider">Label</label>
                        <select value={label} onChange={e => setLabel(e.target.value)}
                          className="w-full px-3 py-2 border border-gold/30 bg-white rounded-xl text-xs focus:outline-none">
                          <option value="Home">Home</option>
                          <option value="Office">Office</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-foreground/75 mb-1 uppercase tracking-wider">Pincode (6-digit)</label>
                        <input type="text" maxLength={6} value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 border border-gold/30 bg-white rounded-xl text-xs font-mono focus:outline-none" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-foreground/75 mb-1 uppercase tracking-wider">Address Line 1</label>
                      <input type="text" value={line1} onChange={e => setLine1(e.target.value)}
                        placeholder="Flat, House no., Apartment, Street"
                        className="w-full px-3 py-2 border border-gold/30 bg-white rounded-xl text-xs focus:outline-none" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-foreground/75 mb-1 uppercase tracking-wider">City</label>
                        <input type="text" value={city} onChange={e => setCity(e.target.value)}
                          className="w-full px-3 py-2 border border-gold/30 bg-white rounded-xl text-xs focus:outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-foreground/75 mb-1 uppercase tracking-wider">State</label>
                        <input type="text" value={state} onChange={e => setState(e.target.value)}
                          className="w-full px-3 py-2 border border-gold/30 bg-white rounded-xl text-xs focus:outline-none" required />
                      </div>
                    </div>

                    {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

                    <button type="submit" disabled={isLoading}
                      className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all">
                      {isLoading ? 'Saving...' : 'Add Address'}
                    </button>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <p className="text-xs text-foreground/45 text-center py-10 bg-cream rounded-2xl border border-gold/10">No saved addresses found. Add a delivery location.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr._id} className="flex flex-col justify-between p-5 bg-cream rounded-2xl border border-gold/10 relative">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-gold/20 text-primary px-2 py-0.5 rounded">
                            {addr.label}
                          </span>
                          <p className="text-xs font-semibold text-primary mt-3 break-words leading-relaxed">{addr.line1}</p>
                          <p className="text-[10px] text-foreground/60 mt-1">{addr.city}, {addr.state} - <span className="font-mono">{addr.pincode}</span></p>
                        </div>
                        <button onClick={() => handleDeleteAddress(addr._id)}
                          className="text-xs text-red-500 hover:underline font-bold mt-4 self-end">
                          Remove Address
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved_services' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px]">
                <h2 className="font-serif text-xl font-bold text-primary mb-6">Saved Services</h2>
                <p className="text-xs text-foreground/45 text-center py-10 bg-cream rounded-2xl border border-gold/10">No saved services found. Bookmark services from the search listings to view them here.</p>
              </div>
            )}

            {activeTab === 'coupons' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px]">
                <h2 className="font-serif text-xl font-bold text-primary mb-6">Coupons & Promo Codes</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-cream rounded-2xl border border-gold/10 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-primary">NEXORA50</p>
                      <p className="text-[10px] text-foreground/50 mt-0.5">Get 50% discount up to ₹100 on first booking.</p>
                    </div>
                    <span className="text-xs font-bold text-[#1D3B31]">Active</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px]">
                <h2 className="font-serif text-xl font-bold text-primary mb-6">My Digital Wallet</h2>
                <div className="p-6 bg-cream rounded-2xl border border-gold/10 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                  <Wallet className="w-10 h-10 text-primary mb-2" />
                  <p className="text-xs text-foreground/60">Current Wallet Balance</p>
                  <p className="text-2xl font-serif font-bold text-primary mt-1">₹1,500</p>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px]">
                <h2 className="font-serif text-xl font-bold text-primary mb-6">Notifications</h2>
                <div className="space-y-3">
                  <div className="p-3 bg-cream rounded-xl border border-gold/10 flex gap-3">
                    <Bell className="w-4 h-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-primary">Booking Confirmed</p>
                      <p className="text-[10px] text-foreground/60 mt-0.5">Your AC installation has been booked for Friday at 10 AM.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px]">
                <h2 className="font-serif text-xl font-bold text-primary mb-6">My Service Reviews</h2>
                <p className="text-xs text-foreground/45 text-center py-10 bg-cream rounded-2xl border border-gold/10">No reviews submitted yet. Rate completed services from your booking history tab.</p>
              </div>
            )}

            {activeTab === 'refer' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px] text-center max-w-xl mx-auto flex flex-col justify-center">
                <Gift className="w-12 h-12 text-[#1D3B31] mx-auto mb-3" />
                <h2 className="font-serif text-xl font-bold text-primary mb-2">Refer & Earn Rewards</h2>
                <p className="text-xs text-foreground/60 leading-relaxed mb-4">Invite your friends to Nexora. They get ₹100 on signup, and you receive ₹150 once they complete their first home task booking order.</p>
                <div className="p-3 bg-cream rounded-2xl border border-gold/20 max-w-xs mx-auto font-mono text-xs font-bold text-primary">NEXORAREFER100</div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px]">
                <h2 className="font-serif text-xl font-bold text-primary mb-6">Help & Support</h2>
                <p className="text-xs text-foreground/60 mb-4">Have questions or issues with a service? Contact our 24/7 help desk.</p>
                <div className="space-y-3">
                  <div className="p-4 bg-cream rounded-2xl border border-gold/10">
                    <p className="text-xs font-bold text-primary">Support Helpline</p>
                    <p className="text-sm font-serif font-bold text-primary mt-1">+91 1800 200 4000</p>
                  </div>
                  <div className="p-4 bg-cream rounded-2xl border border-gold/10">
                    <p className="text-xs font-bold text-primary">Support Email</p>
                    <p className="text-sm font-serif font-bold text-primary mt-1">support@nexora.com</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'personal' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-serif text-xl font-bold text-primary">Personal Details</h2>
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-4 py-2 border border-gold text-primary rounded-full text-xs font-bold hover:bg-beige transition-all">
                      <Edit className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-1.5">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gold/30 bg-cream text-foreground text-sm focus:outline-none" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gold/30 bg-cream text-foreground text-sm focus:outline-none" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-1.5">Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                        <input type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gold/30 bg-cream text-foreground text-sm focus:outline-none font-mono" required />
                      </div>
                    </div>

                    {error && <p className="text-red-500 text-xs font-semibold bg-red-50 rounded-xl p-3 border border-red-100">{error}</p>}
                    {successMsg && <p className="text-green-700 text-xs font-semibold bg-green-50 rounded-xl p-3 border border-green-100">{successMsg}</p>}

                    <div className="flex gap-3 pt-2">
                      <button type="submit" disabled={isLoading}
                        className="flex items-center gap-1.5 px-6 py-3 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/95 transition-all shadow-sm">
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
                      </button>
                      <button type="button" onClick={() => { setIsEditing(false); setError(''); }}
                        className="px-6 py-3 border border-gold text-foreground/60 rounded-full text-xs font-bold hover:bg-beige transition-all">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-cream rounded-2xl border border-gold/10">
                      <Mail className="w-5 h-5 text-primary/60 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-foreground/45 uppercase tracking-wider font-semibold">Email Address</p>
                        <p className="text-sm font-semibold text-primary">{user?.email || 'Not configured'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-cream rounded-2xl border border-gold/10">
                      <Phone className="w-5 h-5 text-primary/60 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-foreground/45 uppercase tracking-wider font-semibold">Mobile Number</p>
                        <p className="text-sm font-semibold text-primary font-mono">{user?.phone || 'Not configured'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm min-h-[400px] flex flex-col justify-center text-center max-w-xl mx-auto">
                <ShieldCheck className="w-14 h-14 text-primary mx-auto mb-4" />
                <h2 className="font-serif text-xl font-bold text-primary mb-2">Safety & Verification Lock</h2>
                <p className="text-xs text-foreground/60 leading-relaxed mb-6">
                  Nexora maintains top security standards for on-demand home tasks. Every booking is secured via a dynamic start OTP code and enforces photo-lock validation checks before completion.
                </p>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="p-3 bg-cream rounded-2xl border border-gold/10">
                    <p className="font-bold text-xs text-primary">OTP Verification</p>
                    <p className="text-[10px] text-foreground/50 mt-1">Locks start times and verifies partner identity.</p>
                  </div>
                  <div className="p-3 bg-cream rounded-2xl border border-gold/10">
                    <p className="font-bold text-xs text-primary">Double Photo Lock</p>
                    <p className="text-[10px] text-foreground/50 mt-1">Before & After photo lock enforces proof of task quality.</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
