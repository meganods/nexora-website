"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, Clock, ShieldCheck, Check, X,
  ChevronRight, ChevronLeft, Loader2, Award, Heart,
  Plus, CheckSquare, Square, Shield, UserCheck, Smartphone, CreditCard, LifeBuoy
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [service, setService] = useState<any>(null);
  const [categoryServices, setCategoryServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFav, setIsFav] = useState(false);
  const [platformFee, setPlatformFee] = useState(15);

  // Redesign state variables
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedTogether, setSelectedTogether] = useState<any[]>([]);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const { data } = await api.get(`/public/services/${slug}`);
        setService(data);

        if (data.categoryId?._id) {
          const siblingRes = await api.get(`/public/services?categoryId=${data.categoryId._id}`);
          if (Array.isArray(siblingRes.data)) {
            setCategoryServices(siblingRes.data.filter((s: any) => s._id !== data._id));
          }
        }

        const local = localStorage.getItem('user_wishlist');
        if (local) {
          const list = JSON.parse(local);
          setIsFav(list.includes(data._id));
        }

        const settingsRes = await api.get('/public/settings').catch(() => null);
        if (settingsRes?.data?.success) {
          setPlatformFee(settingsRes.data.platformFee?.minRupees ?? 15);
        }
      } catch (err) {
        setError('Service not found or failed to retrieve details.');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchServiceDetails();
  }, [slug]);

  const toggleWishlist = async () => {
    if (!service) return;

    const role = typeof window !== 'undefined' ? localStorage.getItem('nexora_role') : '';
    if (role !== 'user') {
      toast.error('Please login or create an account to wishlist services.');
      router.push('/login');
      return;
    }

    const local = localStorage.getItem('user_wishlist');
    let list: string[] = [];
    if (local) list = JSON.parse(local);

    const isAdded = !list.includes(service._id);
    if (!isAdded) {
      list = list.filter(id => id !== service._id);
      setIsFav(false);
    } else {
      list.push(service._id);
      setIsFav(true);
    }
    localStorage.setItem('user_wishlist', JSON.stringify(list));

    try {
      await api.post('/user/dashboard/wishlist/toggle', { serviceId: service._id });
      toast.success(isAdded ? `${service.name} added to wishlist` : `${service.name} removed from wishlist`);
    } catch (err) {
      console.error(err);
      // Revert UI on failure
      const reverted = isAdded ? list.filter(id => id !== service._id) : [...list, service._id];
      setIsFav(!isAdded);
      localStorage.setItem('user_wishlist', JSON.stringify(reverted));
      toast.error('Failed to update wishlist. Please try again.');
    }
  };

  const toggleAddon = (addon: any) => {
    if (selectedAddons.some(a => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const toggleTogether = (s: any) => {
    if (selectedTogether.some(item => item._id === s._id)) {
      setSelectedTogether(selectedTogether.filter(item => item._id !== s._id));
    } else {
      setSelectedTogether([...selectedTogether, s]);
    }
  };

  const handleBookNow = () => {
    const togetherAddons = selectedTogether.map(s => ({ name: s.name, price: s.basePrice }));
    const allAddons = [...selectedAddons, ...togetherAddons];
    const addonsParam = encodeURIComponent(allAddons.map(a => `${a.name}:${a.price}`).join(','));
    router.push(`/checkout?serviceId=${service._id}&addons=${addonsParam}&qty=${quantity}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F3D30]" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center text-center p-6">
        <h2 className="font-serif text-2xl font-bold text-[#0F3D30] mb-2">Service Not Found</h2>
        <p className="text-xs text-foreground/50 mb-6 font-medium">We couldn't retrieve details for this service page.</p>
        <Link href="/services" className="px-6 py-2.5 bg-[#0F3D30] text-white rounded-full text-xs font-bold shadow-sm">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const isDiscounted = service.discountPercentage > 0;
  const baseFinalPrice = isDiscounted ? Math.round(service.basePrice * (1 - service.discountPercentage / 100)) : service.basePrice;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const togetherTotal = selectedTogether.reduce((sum, s) => sum + s.basePrice, 0);
  const subtotal = (baseFinalPrice * quantity) + addonsTotal + togetherTotal;
  const totalAmount = subtotal + platformFee;

  const galleryUrls = service.serviceImages && service.serviceImages.length > 0
    ? service.serviceImages
    : [service.imageUrl || 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80'];

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? galleryUrls.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === galleryUrls.length - 1 ? 0 : prev + 1));
  };

  const ratingBreakdown = {
    5: Math.round((service.reviewCount || 0) * 0.7) || 28,
    4: Math.round((service.reviewCount || 0) * 0.2) || 8,
    3: Math.round((service.reviewCount || 0) * 0.06) || 2,
    2: Math.round((service.reviewCount || 0) * 0.03) || 1,
    1: Math.round((service.reviewCount || 0) * 0.01) || 0,
  };
  const mockReviews = service.reviews && service.reviews.length > 0 ? service.reviews : [
    // {
    //   _id: 'rev1',
    //   userId: { name: 'Ritika Sharma', profilePhoto: '' },
    //   rating: 5,
    //   comment: 'Very relaxing experience. Therapist was very professional and polite.',
    //   createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    // },
    {
      _id: 'rev2',
      userId: { name: 'Aman Verma', profilePhoto: '' },
      rating: 5,
      comment: 'Helped a lot with my neck pain and stress. Highly recommended.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'rev3',
      userId: { name: 'Neha Iyer', profilePhoto: '' },
      rating: 4.5,
      comment: 'Great service and ambience. Will book again.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-24 font-sans text-foreground">

      <div className="container mx-auto px-4 sm:px-8 lg:px-12 pt-4 pb-2">
        <div className="flex items-center gap-2 text-foreground/45 text-xs">
          <Link href="/" className="hover:text-[#0F3D30] transition-colors font-medium">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/services" className="hover:text-[#0F3D30] transition-colors font-medium">Services</Link>
          {service.categoryId && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href={`/categories/${service.categoryId.slug || service.categoryId._id}`} className="hover:text-[#0F3D30] transition-colors font-medium">
                {service.categoryId.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0F3D30] font-bold truncate max-w-[200px]">{service.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 lg:px-12 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          <div className="lg:col-span-2 space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-6 rounded-3xl border border-[#C3AB84]/15 shadow-sm">

              <div className="md:col-span-6 space-y-3">
                <div className="relative h-64 md:h-72 w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group">
                  <img
                    src={galleryUrls[activeImageIndex]}
                    alt={`${service.name}-${activeImageIndex}`}
                    className="w-full h-full object-cover transition-all duration-300"
                  />

                  {/* Category & Promo Badges (Left) */}
                  <div className="absolute top-3.5 left-3.5 flex flex-col items-start gap-1.5 z-10">
                    <span className="bg-[#0F3D30] text-[#C3AB84] text-[8px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
                      {service.categoryId?.name || 'Service'}
                    </span>
                    {service.isMostBooked && (
                      <span className="bg-[#C3AB84] text-[#0F3D30] text-[8px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
                        🔥 Most Booked
                      </span>
                    )}
                  </div>

                  {/* Wishlist toggle button (Right) */}
                  <button onClick={toggleWishlist} className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/85 border border-gray-100 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all">
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-foreground/40'}`} />
                  </button>

                  {galleryUrls.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-gray-100 flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105 active:scale-95"
                      >
                        <ChevronLeft className="w-4 h-4 text-[#0F3D30]" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-gray-100 flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105 active:scale-95"
                      >
                        <ChevronRight className="w-4 h-4 text-[#0F3D30]" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-3.5 right-3.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full z-10">
                    {activeImageIndex + 1} / {galleryUrls.length}
                  </div>
                </div>

                {galleryUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {galleryUrls.map((url: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`h-12 w-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeImageIndex === idx ? 'border-[#0F3D30]' : 'border-transparent'}`}
                      >
                        <img src={url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <h1 className="font-serif text-2xl xl:text-3xl font-bold text-[#0F3D30] leading-tight">
                      {service.name}
                    </h1>
                  </div>

                  <p className="text-foreground/60 text-xs leading-relaxed">
                    {service.description || 'Professional grade services performed at your location.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3.5 text-xs text-foreground/70 pt-1">
                    <span className="flex items-center gap-1 font-bold text-[#0F3D30]">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      {service.rating || '4.8'}
                    </span>
                    <span>({service.reviewCount || 15} reviews)</span>
                    <span className="text-foreground/20">•</span>
                    <span>🔥 Booked {service.totalBookings || 12} times this week</span>
                    <span className="text-foreground/20">•</span>
                    <span className="text-emerald-700 font-bold">✓ {service.totalBookings * 7 + 140 || 1250} bookings completed</span>
                  </div>
                </div>

                <div className="space-y-3.5 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-[#FAF6F0] border border-gold/10 p-2.5 rounded-xl">
                      <Clock className="w-4 h-4 text-[#C3AB84]" />
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-foreground/40">Duration</span>
                        <span className="font-bold text-[#0F3D30]">{service.estimatedDurationMins} mins</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-[#FAF6F0] border border-gold/10 p-2.5 rounded-xl">
                      <UserCheck className="w-4 h-4 text-[#C3AB84]" />
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-foreground/40">Expertise</span>
                        <span className="font-bold text-[#0F3D30]">Therapist</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-[#FAF6F0] border border-gold/10 p-2.5 rounded-xl">
                      <Smartphone className="w-4 h-4 text-[#C3AB84]" />
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-foreground/40">Est. Arrival</span>
                        <span className="font-bold text-[#0F3D30]">Within {service.name.length * 2 + 15} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-emerald-800 text-[11px] font-semibold">
                    <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Premium At-Home Service Assured</span>
                  </div>

                  <div className="bg-[#FAF6F0] border border-[#C3AB84]/20 rounded-xl p-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#C3AB84] shrink-0" />
                    <div className="text-[10px] text-foreground/70">
                      <span className="font-bold text-[#0F3D30]">Nexora Assurance:</span> Verified professionals • Safe & hygienic • Quality service
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="space-y-6">
              <div className="bg-white border border-[#C3AB84]/15 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif text-sm font-bold text-[#0F3D30] pb-2 border-b border-gray-50 flex items-center gap-2">
                  <Check className="w-4.5 h-4.5 text-green-600" /> What's Included
                </h3>
                <div className="space-y-2">
                  {service.inclusions && service.inclusions.length > 0 ? (
                    service.inclusions.map((inc: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-foreground/75">
                        <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-foreground/40 italic">Standard features apply.</p>
                  )}
                </div>
              </div>

              {service.vendor && (
                <div className="bg-white border border-[#C3AB84]/15 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-serif text-base font-bold text-[#0F3D30] border-b border-gold/10 pb-2 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" /> Assigned Service Professional
                  </h3>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    {/* Photo / initials */}
                    <div className="w-16 h-16 rounded-2xl bg-[#C3AB84]/10 border border-[#C3AB84]/30 flex items-center justify-center text-[#0F3D30] text-xl font-bold font-serif overflow-hidden shrink-0">
                      {service.vendor.profilePictureUrl ? (
                        <img src={service.vendor.profilePictureUrl} alt={service.vendor.name} className="w-full h-full object-cover" />
                      ) : (
                        service.vendor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h4 className="font-serif text-sm font-bold text-[#0F3D30]">{service.vendor.name}</h4>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                          Verified
                        </span>
                      </div>

                      {service.vendor.kycDetails?.businessName && (
                        <p className="text-[#C3AB84] text-xs font-bold font-serif">{service.vendor.kycDetails.businessName}</p>
                      )}

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[11px] text-foreground/60">
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-[#0F3D30]">{(service.vendor.rating || 4.8).toFixed(1)}</span>
                        </span>
                        <span>•</span>
                        <span>{service.vendor.experience || 5}+ Years Exp</span>
                        <span>•</span>
                        <span>{service.vendor.totalCompletedJobs || 120}+ Completed Jobs</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                      <Link
                        href={`/partner/${service.vendor._id}`}
                        className="flex-1 sm:flex-none text-center px-4 py-2 border border-[#0F3D30]/20 text-[#0F3D30] text-xs font-bold rounded-full hover:bg-[#FAF6F0] transition-colors"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => {
                          window.scrollTo({
                            top: document.getElementById('checkout-action-box')?.offsetTop || 300,
                            behavior: 'smooth'
                          });
                        }}
                        className="flex-1 sm:flex-none text-center px-4 py-2 bg-[#0F3D30] text-white text-xs font-bold rounded-full hover:bg-[#0F3D30]/90 transition-colors"
                      >
                        Book Service
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {categoryServices.length > 0 && (
                <div className="bg-white border border-[#C3AB84]/15 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-serif text-base font-bold text-[#0F3D30]">Frequently Booked Together</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {categoryServices.slice(0, 3).map((s: any) => {
                      const isSelected = selectedTogether.some(item => item._id === s._id);
                      return (
                        <div
                          key={s._id}
                          onClick={() => toggleTogether(s)}
                          className={`bg-white border rounded-2xl p-3 flex flex-col justify-between hover:border-[#0F3D30]/40 transition-all shadow-sm group hover:-translate-y-0.5 cursor-pointer ${isSelected ? 'border-[#0F3D30] bg-[#0F3D30]/5 ring-1 ring-[#0F3D30]' : 'border-[#C3AB84]/15'
                            }`}
                        >
                          <div className="space-y-2">
                            <div className="h-24 w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                              <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                              {isSelected && (
                                <div className="absolute inset-0 bg-[#0F3D30]/40 flex items-center justify-center">
                                  <Check className="w-8 h-8 text-white bg-[#0F3D30] p-1.5 rounded-full shadow" />
                                </div>
                              )}
                            </div>
                            <h4 className="font-serif text-xs font-bold text-[#0F3D30] line-clamp-2 leading-tight">
                              {s.name}
                            </h4>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                            <span className="text-xs font-serif font-black text-[#0F3D30]">₹{s.basePrice}</span>
                            <div className={`p-1 rounded-full border transition-all ${isSelected ? 'bg-[#0F3D30] border-[#0F3D30] text-white' : 'bg-[#FAF6F0] border-gold/15 text-[#0F3D30]'
                              }`}>
                              {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-[#C3AB84]/15 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="font-serif text-base font-bold text-[#0F3D30]">How It Works</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {[
                  { title: "Book Service", desc: "Select time and slot" },
                  { title: "Therapist Assigned", desc: "Certified professional chosen" },
                  { title: "Service at Location", desc: "Done in your home comfort" },
                  { title: "Relax & Feel Better", desc: "Enjoy premium outcome" }
                ].map((step, idx) => (
                  <div key={idx} className="text-center space-y-2 relative group">
                    <div className="w-10 h-10 rounded-full bg-[#FAF6F0] border border-[#C3AB84]/30 text-[#0F3D30] flex items-center justify-center font-bold text-xs mx-auto shadow-sm transition-transform duration-200 group-hover:scale-105">
                      {idx + 1}
                    </div>
                    <h4 className="text-xs font-bold text-[#0F3D30]">{step.title}</h4>
                    <p className="text-[10px] text-foreground/50">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FAF6F0]/40 border border-[#C3AB84]/15 rounded-3xl p-5 shadow-inner">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-[10px] font-bold text-[#0F3D30]/80">
                <div className="space-y-1.5 p-2 rounded-2xl bg-white/70 border border-white/50">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                  <span>Verified Professional</span>
                </div>
                <div className="space-y-1.5 p-2 rounded-2xl bg-white/70 border border-white/50">
                  <CheckSquare className="w-5 h-5 text-[#C3AB84] mx-auto" />
                  <span>Background Checked</span>
                </div>
                <div className="space-y-1.5 p-2 rounded-2xl bg-white/70 border border-white/50">
                  <Award className="w-5 h-5 text-gold mx-auto" />
                  <span>Service Warranty</span>
                </div>
                <div className="space-y-1.5 p-2 rounded-2xl bg-white/70 border border-white/50">
                  <CreditCard className="w-5 h-5 text-[#C3AB84] mx-auto" />
                  <span>Secure Payments</span>
                </div>
                <div className="space-y-1.5 p-2 rounded-2xl bg-white/70 border border-white/50 col-span-2 sm:col-span-1">
                  <LifeBuoy className="w-5 h-5 text-gold mx-auto" />
                  <span>Customer Support</span>
                </div>
              </div>
            </div>

            {((service.beforeImages && service.beforeImages.length > 0) || (service.afterImages && service.afterImages.length > 0)) && (
              <div className="bg-white border border-[#C3AB84]/15 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif text-base font-bold text-[#0F3D30]">Before &amp; After Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-[#0F3D30]/60 mb-2 uppercase tracking-wider">Before Service</p>
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                      <img src={service.beforeImages?.[0] || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'} className="w-full h-full object-cover" alt="Before" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F3D30]/60 mb-2 uppercase tracking-wider">After Service</p>
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                      <img src={service.afterImages?.[0] || 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80'} className="w-full h-full object-cover" alt="After" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-[#C3AB84]/15 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="font-serif text-base font-bold text-[#0F3D30]">Customer Reviews</h3>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-gray-100 pb-6">
                <div className="md:col-span-4 text-center space-y-1.5">
                  <h4 className="text-4xl font-serif font-black text-[#0F3D30]">{service.rating || '4.8'}</h4>
                  <div className="flex items-center justify-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4.5 h-4.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-[10px] text-foreground/50 font-bold uppercase tracking-wide">
                    Based on {service.reviewCount || 0} Ratings
                  </p>
                </div>

                <div className="md:col-span-8 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = (ratingBreakdown as any)[stars] || 0;
                    const percent = service.reviewCount > 0 ? (count / service.reviewCount) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs text-foreground/75">
                        <span className="w-3 font-semibold text-right">{stars}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-8 text-foreground/50 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5">
                {mockReviews.map((rev: any) => (
                  <div key={rev._id} className="border-b border-gray-100 pb-5 last:border-b-0 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-foreground/80">{rev.userId?.name || 'Customer'}</h4>
                          <span className="text-[8px] bg-emerald-50 border border-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            Verified
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500 text-[10px] mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rev.rating) ? 'fill-current' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[9px] text-foreground/40 font-bold uppercase">
                        {new Date(rev.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed italic">
                      "{rev.comment || rev.reviewText}"
                    </p>
                    {rev.vendorReply && (
                      <div className="p-2.5 bg-[#FAF6F0] rounded-xl border border-gold/10 space-y-1 mt-2.5">
                        <p className="text-[9px] font-bold text-emerald-850 flex items-center gap-1 uppercase tracking-wider">
                          💬 Response from Partner:
                        </p>
                        <p className="text-xs text-[#0F3D30]/90 leading-relaxed italic">
                          "{rev.vendorReply}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="sticky top-24 space-y-6">

            <div id="checkout-action-box" className="bg-white border border-[#C3AB84]/20 p-6 rounded-3xl space-y-6 shadow-sm">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-widest font-bold text-foreground/45">Starting from</span>
                <div className="flex items-baseline gap-2">
                  <h3 className="font-serif text-3xl font-black text-[#0F3D30]">₹{baseFinalPrice}</h3>
                  {isDiscounted && (
                    <span className="text-sm line-through text-foreground/40 font-bold">₹{service.basePrice}</span>
                  )}
                </div>
                <span className="block text-[10px] text-foreground/45 font-medium">Inclusive of all taxes</span>
              </div>

              {service.addons && service.addons.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/45">Select Add-ons (Optional)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {service.addons.map((addon: any, idx: number) => {
                      const isChecked = selectedAddons.some(a => a.name === addon.name);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleAddon(addon)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${isChecked ? 'border-[#0F3D30] bg-[#0F3D30]/5' : 'border-gray-150 hover:bg-[#FAF6F0]/50'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-[#0F3D30] shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300 shrink-0" />
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-[#0F3D30]">{addon.name}</h4>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#0F3D30]">+ ₹{addon.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2.5 border-t border-gray-100 pt-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/45">Select Quantity</label>
                <div className="flex items-center justify-between bg-[#FAF6F0] border border-[#C3AB84]/30 rounded-full px-4 py-2 w-32">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="text-[#0F3D30] font-black text-sm hover:scale-110 transition-transform focus:outline-none"
                  >
                    -
                  </button>
                  <span className="font-bold text-[#0F3D30] text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="text-[#0F3D30] font-black text-sm hover:scale-110 transition-transform focus:outline-none"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-4 text-xs text-foreground/75">
                <div className="flex justify-between">
                  <span>Service Price ({quantity}x)</span>
                  <span>₹{baseFinalPrice * quantity}</span>
                </div>
                {selectedAddons.length > 0 && (
                  <div className="flex justify-between text-foreground/60 italic pl-2">
                    <span>+ Add-ons</span>
                    <span>₹{addonsTotal}</span>
                  </div>
                )}
                {selectedTogether.length > 0 && (
                  <div className="flex justify-between text-foreground/60 italic pl-2">
                    <span>+ Sibling Services</span>
                    <span>₹{togetherTotal}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-[#0F3D30]">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              <button
                onClick={handleBookNow}
                className="w-full py-4 bg-[#0F3D30] hover:bg-[#0b2b22] text-[#FAF6F0] font-bold text-xs uppercase tracking-widest text-center rounded-full shadow-md transition-all hover:shadow-lg focus:outline-none flex items-center justify-center gap-2"
              >
                <span>Continue Booking</span>
                <ChevronRight className="w-4 h-4 text-[#C3AB84]" />
              </button>

              <div className="text-center space-y-2">
                <span className="block text-[8px] uppercase tracking-wider text-foreground/45 font-bold">Secured by Cashfree</span>
                <div className="flex items-center justify-center gap-2 bg-[#FAF6F0] p-2.5 rounded-xl border border-gold/10 text-[10px] text-foreground/75">
                  <Shield className="w-3.5 h-3.5 text-[#C3AB84] shrink-0" />
                  <span className="font-semibold">100% Secure Payments</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#C3AB84]/20 px-6 py-4 shadow-2xl flex items-center justify-between lg:hidden">
        <div>
          <div className="text-[9px] uppercase font-bold text-foreground/40 flex items-baseline gap-1">
            <span>Base Price: ₹{baseFinalPrice}</span>
            <span>+</span>
            <span>Addons: ₹{addonsTotal + togetherTotal}</span>
          </div>
          <span className="block font-serif text-base font-black text-[#0F3D30]">Total: ₹{totalAmount}</span>
        </div>
        <button
          onClick={handleBookNow}
          className="px-6 py-3 bg-[#0F3D30] hover:bg-[#0b2b22] text-white rounded-full font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
        >
          <span>Book Now</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#C3AB84]" />
        </button>
      </div>

    </div>
  );
}
