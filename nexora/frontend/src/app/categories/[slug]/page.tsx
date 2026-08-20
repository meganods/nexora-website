"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, Clock, ShieldCheck, ArrowRight, Loader2,
  ChevronRight, ThumbsUp, HelpCircle, Image as ImageIcon,
  CheckCircle, Shield, Award, Calendar, Lock, Sparkles, Heart,
  ChevronDown, ChevronUp, MessageSquare, MapPin, Play, Plus, X
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Accordion active FAQ state
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // Modals state
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const local = localStorage.getItem('user_wishlist');
    if (local) {
      setWishlist(JSON.parse(local));
    }
  }, []);

  const toggleWishlist = (serviceId: string, serviceName: string) => {
    const local = localStorage.getItem('user_wishlist');
    let list: string[] = [];
    if (local) list = JSON.parse(local);

    if (list.includes(serviceId)) {
      list = list.filter(id => id !== serviceId);
      toast.success(`${serviceName} removed from wishlist`);
    } else {
      list.push(serviceId);
      toast.success(`${serviceName} added to wishlist`);
    }
    localStorage.setItem('user_wishlist', JSON.stringify(list));
    setWishlist(list);
  };

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      try {
        setLoading(true);
        const [catRes, catsRes] = await Promise.all([
          api.get(`/public/categories/${slug}`),
          api.get('/public/categories')
        ]);
        setCategory(catRes.data);
        setAllCategories(catsRes.data || []);
      } catch (err) {
        setError('Category not found or failed to load details.');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchCategoryDetails();
  }, [slug]);

  // Dynamic SEO implementation
  useEffect(() => {
    if (category) {
      document.title = category.seoTitle || `${category.name} - Nexora Services`;

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', category.seoDescription || category.description || 'Premium home services by Nexora');

      let metaKey = document.querySelector('meta[name="keywords"]');
      if (!metaKey) {
        metaKey = document.createElement('meta');
        metaKey.setAttribute('name', 'keywords');
        document.head.appendChild(metaKey);
      }
      metaKey.setAttribute('content', category.seoKeywords || 'home services, nexora, repair');
    }
  }, [category]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F3D30]" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center text-center p-6">
        <h2 className="font-serif text-2xl font-bold text-[#0F3D30] mb-2">Category Not Found</h2>
        <p className="text-xs text-foreground/50 mb-6">We couldn't retrieve the details for this category page.</p>
        <Link href="/services" className="px-6 py-2.5 bg-[#0F3D30] text-white rounded-full text-xs font-bold shadow-sm">
          Browse All Services
        </Link>
      </div>
    );
  }

  // Related categories filtering
  const relatedCategories = allCategories
    .filter(c => c._id !== category._id)
    .slice(0, 5);

  // Cheapest price calculations
  const servicesList = category.services || [];
  const cheapestPrice = servicesList.length > 0
    ? [...servicesList].sort((a, b) => a.basePrice - b.basePrice)[0]?.basePrice
    : 199;

  // Fallback approved reviews if MongoDB lists are empty
  const reviewsList = category.reviews && category.reviews.length > 0 ? category.reviews : [
    // {
    //   _id: 'r1',
    //   userId: { name: 'Ritika Sharma', profilePhoto: '' },
    //   rating: 5,
    //   reviewText: 'Very professional carpenter. Fixed my wardrobe perfectly.',
    //   images: [],
    //   createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    // },
    {
      _id: 'r2',
      userId: { name: 'Arun Verma', profilePhoto: '' },
      rating: 5,
      reviewText: 'On-time service and excellent work quality.',
      images: [],
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'r3',
      userId: { name: 'Neha Iyer', profilePhoto: '' },
      rating: 5,
      reviewText: 'Amazing work on my kitchen cabinets.',
      images: [],
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const handleScrollToServices = () => {
    const section = document.getElementById('services-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-28 md:pb-36 font-sans">

      {/* Category Hero Block */}
      <div className="relative w-full overflow-hidden bg-[#0F3D30] text-[#FAF6F0] py-12 md:py-16">
        {/* Dynamic Banner Image Background */}
        {(category.bannerImageUrl || category.imageUrl) ? (
          <div className="absolute inset-0">
            <img src={category.bannerImageUrl || category.imageUrl} alt={category.name} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F3D30]/95 via-[#0F3D30]/80 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F3D30] to-[#041d16] opacity-90" />
        )}

        <div className="container mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">

            {/* Left side info panel */}
            <div className="w-full lg:w-7/12 space-y-6">
              <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase font-bold tracking-wider">
                <Link href="/" className="hover:text-[#C3AB84] transition-colors">Home</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#C3AB84]">{category.name}</span>
              </div>

              <div className="space-y-3">
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#C3AB84] leading-tight">
                  {category.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#FAF6F0]/80 max-w-xl leading-relaxed">
                  {category.description || 'Verified, premium quality home installation, maintenance, and repair services.'}
                </p>
              </div>

              {/* Counters row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl pt-2">
                <div className="bg-[#FAF6F0]/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-[#C3AB84]">
                    <Star className="w-4 h-4 fill-current text-yellow-500" />
                    <span className="text-sm font-bold">{category.rating || '4.8'}</span>
                  </div>
                  <span className="text-[10px] text-white/50 mt-1 uppercase tracking-wider font-semibold">Rating</span>
                </div>

                <div className="bg-[#FAF6F0]/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-center">
                  <p className="text-sm font-black text-[#C3AB84]">500+</p>
                  <span className="text-[10px] text-white/50 mt-1 uppercase tracking-wider font-semibold">Pros Assigned</span>
                </div>

                <div className="bg-[#FAF6F0]/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-center">
                  <p className="text-sm font-black text-[#C3AB84]">{servicesList.length}+</p>
                  <span className="text-[10px] text-white/50 mt-1 uppercase tracking-wider font-semibold">Services</span>
                </div>

                <div className="bg-[#FAF6F0]/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-center">
                  <p className="text-sm font-black text-[#C3AB84]">{category.totalBookings || '12K+'}</p>
                  <span className="text-[10px] text-white/50 mt-1 uppercase tracking-wider font-semibold">Bookings</span>
                </div>
              </div>

              <button
                onClick={handleScrollToServices}
                className="inline-flex items-center gap-2 bg-[#C3AB84] hover:bg-[#b59b73] text-[#0F3D30] font-bold px-6 py-3 rounded-full text-xs shadow-md transition-all active:scale-95"
              >
                Explore Services <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right side trust box (Desktop Only) */}
            <div className="hidden lg:block lg:w-4/12 flex-shrink-0">
              <div className="bg-[#0F3D30] border border-[#C3AB84]/20 rounded-3xl p-6 space-y-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#C3AB84]/5 rounded-bl-full pointer-events-none" />
                <h3 className="font-serif text-base font-bold text-[#C3AB84] flex items-center gap-2 border-b border-[#C3AB84]/10 pb-3">
                  <ShieldCheck className="w-5 h-5" /> Nexora Trust
                </h3>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Shield className="w-4 h-4 text-[#C3AB84] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#FAF6F0]">Verified Specialists</h4>
                      <p className="text-[10px] text-[#FAF6F0]/60 mt-0.5 leading-normal">
                        Every technician undergoes a background check and certification check.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Award className="w-4 h-4 text-[#C3AB84] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#FAF6F0]">Satisfaction Promised</h4>
                      <p className="text-[10px] text-[#FAF6F0]/60 mt-0.5 leading-normal">
                        Not happy with output? We will fix it at no additional cost.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Clock className="w-4 h-4 text-[#C3AB84] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#FAF6F0]">On-time Service</h4>
                      <p className="text-[10px] text-[#FAF6F0]/60 mt-0.5 leading-normal">
                        We value your time. Certified professionals deliver as scheduled.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Guarantees row below hero */}
      <div className="container mx-auto px-4 sm:px-8 lg:px-12 mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Verified Professionals", desc: "Rigorous background checks" },
            { title: "Affordable Pricing", desc: "No hidden or unexpected costs" },
            { title: "Quality Guarantee", desc: "Service delivery warrantied" },
            { title: "Customer Support", desc: "Live chat assistance available" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-[#C3AB84]/15 rounded-2xl p-4 shadow-sm flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#0F3D30]">{item.title}</h4>
                <p className="text-[9px] text-foreground/50 mt-0.5 leading-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main split grid */}
      <div className="container mx-auto px-4 sm:px-8 lg:px-12 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column content */}
        <div className="lg:col-span-2 space-y-12" id="services-section">

          {/* Related categories list (Mobile/Tablet Only, Swapped to Top) */}
          {relatedCategories.length > 0 && (
            <div className="block lg:hidden bg-white border border-[#C3AB84]/15 p-5 rounded-3xl space-y-4 shadow-sm text-center">
              <h3 className="font-serif text-sm font-bold text-[#0F3D30]">Related Categories</h3>
              <p className="text-[10px] text-foreground/50">Explore other specialized home services near you</p>
              <button
                onClick={() => setShowCategoriesModal(true)}
                className="w-full py-2.5 bg-[#FAF6F0] hover:bg-[#0F3D30] hover:text-white border border-[#C3AB84]/20 text-[#0F3D30] text-xs font-bold rounded-xl transition-all"
              >
                View Related Categories &rarr;
              </button>
            </div>
          )}

          {/* Services mapping grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#C3AB84]/10 pb-4">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0F3D30]">
                Available Services in {category.name}
              </h2>
              {servicesList.length > 3 && (
                <button
                  onClick={() => setShowServicesModal(true)}
                  className="text-xs font-bold text-[#C3AB84] hover:text-[#0F3D30] flex items-center gap-1.5 transition-colors"
                >
                  View All ({servicesList.length}) &rarr;
                </button>
              )}
            </div>

            {servicesList.length === 0 ? (
              <p className="text-xs text-foreground/45 italic py-6">No services active in this category currently.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-6">
                {servicesList.map((svc: any) => {
                  const isDiscounted = svc.discountPercentage > 0;
                  const finalPrice = isDiscounted ? Math.round(svc.basePrice * (1 - svc.discountPercentage / 100)) : svc.basePrice;

                  return (
                    <div
                      key={svc._id}
                      className="bg-white border border-[#C3AB84]/15 rounded-3xl p-2.5 sm:p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {svc.popular && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#C3AB84] text-[#0F3D30] text-[6px] sm:text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow z-10 uppercase tracking-wider">
                          🔥 Popular
                        </div>
                      )}

                      <div className="space-y-2.5 sm:space-y-4">
                        {/* Service Thumbnail */}
                        <div className="h-24 sm:h-44 w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                          {svc.imageUrl ? (
                            <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-cream/20">
                              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gold/30" />
                            </div>
                          )}

                          {/* Wishlist toggle button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(svc._id, svc.name);
                            }}
                            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 border border-gray-100 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                          >
                            <Heart className={`w-3.5 h-3.5 ${wishlist.includes(svc._id) ? 'fill-red-500 text-red-500' : 'text-foreground/45'}`} />
                          </button>
                        </div>

                        <div className="space-y-1 sm:space-y-2">
                          <h3 className="font-serif text-[11px] sm:text-sm font-bold text-[#0F3D30] line-clamp-1 h-4 sm:h-5">{svc.name}</h3>

                          <div className="flex flex-wrap items-center gap-1 sm:gap-3 text-[8px] sm:text-[10px] text-foreground/50">
                            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                              <span className="text-[#0F3D30]">{svc.rating || '4.8'}</span>
                            </span>
                            <span className="hidden xs:inline">({svc.reviewCount || 0})</span>
                            <span className="hidden xs:inline">·</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> {svc.estimatedDurationMins}m
                            </span>
                          </div>

                          <p className="hidden sm:block text-[10px] text-foreground/60 leading-relaxed line-clamp-2">
                            {svc.description || 'Professional home service executed by background verified service experts.'}
                          </p>
                        </div>
                      </div>

                      {/* Pricing Footer */}
                      <div className="mt-2.5 pt-2 sm:mt-4 sm:pt-3 border-t border-gray-50 flex items-center justify-between gap-1.5">
                        <div className="shrink-0">
                          <span className="text-[7px] sm:text-[8px] uppercase tracking-wider font-semibold text-foreground/40 block">Price starts</span>
                          <div className="flex items-baseline gap-0.5 sm:gap-1">
                            <span className="font-serif text-xs sm:text-sm font-black text-[#0F3D30]">₹{finalPrice}</span>
                            {isDiscounted && (
                              <span className="text-[8px] sm:text-[9px] line-through text-foreground/45">₹{svc.basePrice}</span>
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/services/${svc.slug}`}
                          className="px-3 py-1.5 bg-[#0F3D30] hover:bg-[#0F3D30]/90 text-white font-bold rounded-full text-[9px] sm:text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {servicesList.length > 3 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowServicesModal(true)}
                  className="px-6 py-2.5 border border-[#C3AB84]/40 hover:bg-[#0F3D30] hover:text-white rounded-full text-xs font-bold text-[#0F3D30] transition-colors"
                >
                  View All Services ({servicesList.length}) &rarr;
                </button>
              </div>
            )}
          </div>

          {/* How it works steps dynamically */}
          {category.howItWorks && category.howItWorks.length > 0 && (
            <div className="bg-white border border-[#C3AB84]/15 rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="font-serif text-base font-bold text-[#0F3D30]">How It Works</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                {category.howItWorks.map((step: any, idx: number) => (
                  <div key={idx} className="space-y-2 relative group text-center sm:text-left">
                    <div className="flex items-center gap-3">
                      <span className="bg-[#FAF6F0] text-[#0F3D30] border border-gold/20 font-serif text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-[#0F3D30] uppercase tracking-wider">{step.title}</h4>
                    </div>
                    <p className="text-[10px] text-foreground/50 leading-relaxed pl-10">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Before & after comparative showcase */}
          {category.beforeAfterGallery && category.beforeAfterGallery.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#C3AB84]/10 pb-4">
                <h2 className="font-serif text-lg font-bold text-[#0F3D30]">Before &amp; After Comparison</h2>
                {category.beforeAfterGallery.length > 4 && (
                  <button
                    onClick={() => setShowGalleryModal(true)}
                    className="text-xs font-bold text-[#C3AB84] hover:text-[#0F3D30] transition-colors"
                  >
                    View More &rarr;
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.beforeAfterGallery.slice(0, 4).map((img: any, idx: number) => (
                  <div key={idx} className="bg-white border border-[#C3AB84]/15 rounded-3xl p-3 shadow-sm grid grid-cols-2 gap-2">
                    <div className="rounded-xl overflow-hidden h-28 relative">
                      <img src={img.beforeUrl} alt="Before" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 bg-[#0F3D30] text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">Before</span>
                    </div>
                    <div className="rounded-xl overflow-hidden h-28 relative">
                      <img src={img.afterUrl} alt="After" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 bg-green-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">After</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Accordion */}
          {category.faqs && category.faqs.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#0F3D30] border-b border-[#C3AB84]/10 pb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#C3AB84]" /> Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {category.faqs.map((faq: any, idx: number) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-white border border-[#C3AB84]/15 rounded-2xl shadow-sm transition-all"
                    >
                      <button
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 text-xs font-bold text-[#0F3D30]"
                      >
                        <span>{faq.question}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gold" /> : <ChevronDown className="w-4 h-4 text-gold" />}
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-[11px] text-foreground/60 leading-relaxed border-t border-gray-50">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right column: Reviews feed, categories list recommendations */}
        <div className="space-y-8">

          {/* Reviews Widget */}
          <div className="bg-white border border-[#C3AB84]/15 p-5 rounded-3xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <h3 className="font-serif text-sm font-bold text-[#0F3D30]">Customer Reviews</h3>
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{category.rating || '4.8'}</span>
              </div>
            </div>

            <div className="space-y-4">
              {reviewsList.slice(0, 3).map((rev: any) => (
                <div key={rev._id} className="pb-3 border-b border-gray-50 last:border-b-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-cream border border-gold/20 flex items-center justify-center font-bold text-[10px] text-primary uppercase overflow-hidden">
                        {rev.userId?.profilePhoto ? (
                          <img src={rev.userId.profilePhoto} alt={rev.userId.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{rev.userId?.name?.slice(0, 2) || 'CU'}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0F3D30]">{rev.userId?.name || 'Customer'}</h4>
                        <div className="flex items-center gap-0.5 text-[#C3AB84]">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-2.5 h-2.5 ${rev.rating > i ? 'fill-current' : 'opacity-20'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-foreground/45 font-medium text-emerald-600">Verified</span>
                  </div>

                  <p className="text-[10px] text-foreground/60 leading-relaxed italic">
                    "{rev.reviewText}"
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowReviewsModal(true)}
              className="w-full text-center text-xs font-bold text-[#C3AB84] hover:text-[#0F3D30] transition-colors pt-2 block"
            >
              View All Reviews &rarr;
            </button>
          </div>

          {/* Related categories list (Desktop Only) */}
          {relatedCategories.length > 0 && (
            <div className="hidden lg:block bg-white border border-[#C3AB84]/15 p-5 rounded-3xl space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <h3 className="font-serif text-sm font-bold text-[#0F3D30]">Related Categories</h3>
                <button
                  onClick={() => setShowCategoriesModal(true)}
                  className="text-[10px] font-bold text-[#C3AB84] hover:text-[#0F3D30] transition-colors"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {relatedCategories.map((cat: any) => (
                  <Link
                    key={cat._id}
                    href={`/categories/${cat.slug}`}
                    className="flex items-center justify-between p-3 border border-gold/10 hover:border-gold/30 rounded-2xl hover:bg-cream/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#FAF6F0] flex items-center justify-center text-[#0F3D30]">
                        <Sparkles className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-xs font-bold text-[#0F3D30] group-hover:text-gold transition-colors">{cat.name}</span>
                    </div>
                    <span className="text-[9px] text-[#C3AB84] font-semibold bg-[#C3AB84]/5 px-2 py-0.5 rounded">
                      {cat.services?.length || 0} Services
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Nexora Trust Box (Mobile/Tablet Only, Swapped to Bottom) */}
          <div className="block lg:hidden bg-[#0F3D30] text-white p-6 rounded-3xl space-y-5 shadow-md">
            <h3 className="font-serif text-base font-bold text-[#C3AB84] flex items-center gap-2 border-b border-[#C3AB84]/10 pb-3">
              <ShieldCheck className="w-5 h-5" /> Nexora Trust
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <Shield className="w-4 h-4 text-[#C3AB84] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#FAF6F0]">Verified Specialists</h4>
                  <p className="text-[10px] text-[#FAF6F0]/60 mt-0.5 leading-normal">
                    Every technician undergoes a background check and certification check.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Award className="w-4 h-4 text-[#C3AB84] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#FAF6F0]">Satisfaction Promised</h4>
                  <p className="text-[10px] text-[#FAF6F0]/60 mt-0.5 leading-normal">
                    Not happy with output? We will fix it at no additional cost.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock className="w-4 h-4 text-[#C3AB84] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#FAF6F0]">On-time Service</h4>
                  <p className="text-[10px] text-[#FAF6F0]/60 mt-0.5 leading-normal">
                    We value your time. Certified professionals deliver as scheduled.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Desktop Sticky Bottom CTA Bar */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-[#0F3D30] border-t border-[#C3AB84]/20 py-4 px-8 z-40 shadow-2xl">
        <div className="container mx-auto max-w-6xl flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/50 block">Pricing starting from</span>
              <p className="font-serif text-lg font-black text-[#C3AB84]">₹{cheapestPrice} <span className="text-xs font-sans font-normal text-white/60">onwards</span></p>
            </div>
            <div className="flex items-center gap-2 text-white/70 border-l border-white/10 pl-6 text-xs">
              <Lock className="w-4 h-4 text-[#C3AB84] shrink-0" />
              <span>Secure payments &amp; background verified partners only</span>
            </div>
          </div>

          <button
            onClick={handleScrollToServices}
            className="bg-[#C3AB84] hover:bg-[#b09772] text-[#0F3D30] text-xs font-bold px-8 py-3.5 rounded-full transition-all active:scale-95 shadow-md flex items-center gap-1.5"
          >
            Book {category.name} Service &rarr;
          </button>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F3D30] border-t border-[#C3AB84]/20 py-3.5 px-6 z-40 shadow-xl flex items-center justify-between gap-4">
        <div>
          <span className="text-[8px] uppercase font-bold text-white/50 block">Starting from</span>
          <p className="font-serif text-sm font-black text-[#C3AB84]">₹{cheapestPrice}</p>
        </div>
        <button
          onClick={handleScrollToServices}
          className="bg-[#C3AB84] hover:bg-[#b09772] text-[#0F3D30] text-xs font-bold px-6 py-2.5 rounded-full transition-all active:scale-95 shadow"
        >
          Book Now
        </button>
      </div>

      {/* View All Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gold/30 w-full max-w-2xl max-h-[85vh] flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 bg-[#FAF6F0]/20 flex justify-between items-center">
              <div>
                <h3 className="font-serif text-base font-bold text-[#0F3D30]">Customer Review Log</h3>
                <p className="text-[10px] text-foreground/45">Displaying approved reviews for {category.name}</p>
              </div>
              <button
                onClick={() => setShowReviewsModal(false)}
                className="p-1.5 hover:bg-cream rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 divide-y divide-gray-50 scrollbar-thin">
              {reviewsList.map((rev: any) => (
                <div key={rev._id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-cream border border-gold/20 flex items-center justify-center font-bold text-[10px] text-primary uppercase overflow-hidden">
                        {rev.userId?.profilePhoto ? (
                          <img src={rev.userId.profilePhoto} alt={rev.userId.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{rev.userId?.name?.slice(0, 2) || 'CU'}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0F3D30]">{rev.userId?.name || 'Customer'}</h4>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${rev.rating > i ? 'fill-current' : 'opacity-20'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-foreground/40 font-mono">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed italic">
                    "{rev.reviewText}"
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowReviewsModal(false)}
                className="px-6 py-2 bg-[#0F3D30] text-white text-xs font-bold rounded-full hover:bg-[#0F3D30]/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Before / After Full Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gold/30 w-full max-w-4xl max-h-[85vh] flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 bg-[#FAF6F0]/20 flex justify-between items-center">
              <div>
                <h3 className="font-serif text-base font-bold text-[#0F3D30]">Before &amp; After Showcase Gallery</h3>
                <p className="text-[10px] text-foreground/45">Complete visual log of completed {category.name} services</p>
              </div>
              <button
                onClick={() => setShowGalleryModal(false)}
                className="p-1.5 hover:bg-cream rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 scrollbar-thin">
              {category.beforeAfterGallery.map((img: any, idx: number) => (
                <div key={idx} className="bg-[#FAF6F0]/10 border border-[#C3AB84]/15 rounded-3xl p-3 shadow-sm grid grid-cols-2 gap-2">
                  <div className="rounded-xl overflow-hidden h-36 relative">
                    <img src={img.beforeUrl} alt="Before" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-[#0F3D30] text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">Before</span>
                  </div>
                  <div className="rounded-xl overflow-hidden h-36 relative">
                    <img src={img.afterUrl} alt="After" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-green-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">After</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowGalleryModal(false)}
                className="px-6 py-2 bg-[#0F3D30] text-white text-xs font-bold rounded-full hover:bg-[#0F3D30]/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View All Services Modal (Selector Popup) */}
      {showServicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gold/30 w-full max-w-lg max-h-[80vh] flex flex-col justify-between overflow-hidden shadow-2xl animate-scaleIn">

            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-[#FAF6F0]/20 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-serif text-base font-bold text-[#0F3D30]">All Services in {category.name}</h3>
                <p className="text-[10px] text-foreground/45">Select a service to view details and proceed with booking</p>
              </div>
              <button
                onClick={() => { setShowServicesModal(false); setServiceSearchQuery(''); }}
                className="p-1.5 hover:bg-cream rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-5 py-3 border-b border-gray-50 bg-[#FAF6F0]/10 flex-shrink-0">
              <input
                type="text"
                value={serviceSearchQuery}
                onChange={(e) => setServiceSearchQuery(e.target.value)}
                placeholder="Search services (e.g. AC repair, sofa clean)..."
                className="w-full border border-gold/20 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary bg-white"
              />
            </div>

            {/* List */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3 divide-y divide-gray-50 scrollbar-thin">
              {servicesList.filter((s: any) => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 ? (
                <p className="text-xs text-foreground/40 text-center py-8">No services match your search.</p>
              ) : (
                servicesList.filter((s: any) => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map((svc: any) => {
                  const isDiscounted = svc.discountPercentage > 0;
                  const finalPrice = isDiscounted ? Math.round(svc.basePrice * (1 - svc.discountPercentage / 100)) : svc.basePrice;
                  return (
                    <div
                      key={svc._id}
                      onClick={() => {
                        setShowServicesModal(false);
                        setServiceSearchQuery('');
                        router.push(`/services/${svc.slug}`);
                      }}
                      className="pt-3 first:pt-0 flex items-center justify-between gap-4 cursor-pointer group hover:bg-cream/20 p-2 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                          {svc.imageUrl ? (
                            <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-cream/20">
                              <ImageIcon className="w-5 h-5 text-gold/30" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#0F3D30] group-hover:text-gold transition-colors line-clamp-1 truncate">{svc.name}</h4>
                          <span className="text-[10px] text-foreground/45 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {svc.estimatedDurationMins} mins
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-serif font-black text-[#0F3D30]">₹{finalPrice}</span>
                        {isDiscounted && (
                          <span className="text-[9px] line-through text-foreground/45 block">₹{svc.basePrice}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => { setShowServicesModal(false); setServiceSearchQuery(''); }}
                className="px-6 py-2 bg-[#0F3D30] text-white text-xs font-bold rounded-full hover:bg-[#0F3D30]/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View All Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gold/30 w-full max-w-lg max-h-[80vh] flex flex-col justify-between overflow-hidden shadow-2xl animate-scaleIn">

            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-[#FAF6F0]/20 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-serif text-base font-bold text-[#0F3D30]">All Service Categories</h3>
                <p className="text-[10px] text-foreground/45">Select a category to explore specialized services</p>
              </div>
              <button
                onClick={() => { setShowCategoriesModal(false); setCategorySearchQuery(''); }}
                className="p-1.5 hover:bg-cream rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-5 py-3 border-b border-gray-50 bg-[#FAF6F0]/10 flex-shrink-0">
              <input
                type="text"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                placeholder="Search categories (e.g. Salon, AC, Painting)..."
                className="w-full border border-gold/20 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary bg-white"
              />
            </div>

            {/* List */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3 divide-y divide-gray-50 scrollbar-thin">
              {allCategories.filter((c: any) => c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())).length === 0 ? (
                <p className="text-xs text-foreground/40 text-center py-8">No categories match your search.</p>
              ) : (
                allCategories.filter((c: any) => c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())).map((cat: any) => (
                  <div
                    key={cat._id}
                    onClick={() => {
                      setShowCategoriesModal(false);
                      setCategorySearchQuery('');
                      router.push(`/categories/${cat.slug}`);
                    }}
                    className="pt-3 first:pt-0 flex items-center justify-between gap-4 cursor-pointer group hover:bg-cream/20 p-2 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] flex items-center justify-center text-[#0F3D30]">
                        <Sparkles className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-xs font-bold text-[#0F3D30] group-hover:text-gold transition-colors">{cat.name}</span>
                    </div>
                    <span className="text-[9px] text-[#C3AB84] font-semibold bg-[#C3AB84]/5 px-2 py-0.5 rounded shrink-0">
                      {cat.services?.length || 0} Services
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => { setShowCategoriesModal(false); setCategorySearchQuery(''); }}
                className="px-6 py-2 bg-[#0F3D30] text-white text-xs font-bold rounded-full hover:bg-[#0F3D30]/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
