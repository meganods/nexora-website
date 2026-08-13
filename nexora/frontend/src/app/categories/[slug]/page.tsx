"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, Clock, ShieldCheck, ArrowRight, Loader2,
  ChevronRight, BadgePercent, ThumbsUp, HelpCircle, Image as ImageIcon
} from 'lucide-react';
import api from '@/lib/api';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      try {
        const { data } = await api.get(`/public/categories/${slug}`);
        setCategory(data);
      } catch (err) {
        setError('Category not found or failed to load details.');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchCategoryDetails();
  }, [slug]);

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

  const cheapestService = category.services && category.services.length > 0
    ? [...category.services].sort((a, b) => a.basePrice - b.basePrice)[0]
    : null;

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-24">
      {/* Category Hero Banner */}
      <div className="relative w-full h-[320px] md:h-[420px] bg-[#0F3D30] overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-black/45 z-10" />
        {category.bannerImageUrl ? (
          <img src={category.bannerImageUrl} alt={category.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <img src={category.imageUrl || '/banner-fallback.jpg'} alt={category.name} className="absolute inset-0 w-full h-full object-cover filter blur-[2px]" />
        )}

        <div className="container mx-auto max-w-6xl px-6 relative z-20 text-[#FAF6F0] space-y-4">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/services" className="hover:text-white transition-colors">Categories</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{category.name}</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#C3AB84]">{category.name}</h1>
            {category.description && (
              <p className="max-w-2xl text-xs md:text-sm text-white/80 leading-relaxed">{category.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold text-white text-sm">{category.rating || '4.8'}</span>
            </div>
            {cheapestService && (
              <div className="border-l border-white/20 pl-6">
                <span className="text-white/60 block text-[9px] uppercase tracking-wider">Starting From</span>
                <span className="font-serif text-sm font-bold text-[#C3AB84]">₹{cheapestService.basePrice}</span>
              </div>
            )}
            <div className="border-l border-white/20 pl-6">
              <span className="text-white/60 block text-[9px] uppercase tracking-wider">Booked Recenty</span>
              <span className="font-serif text-sm font-bold text-[#C3AB84]">{category.totalBookings || '1.2k+'} times</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side Content - Services & Detail lists */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Services list */}
          <section className="space-y-5">
            <h2 className="font-serif text-xl font-bold text-[#0F3D30]">Available Services in {category.name}</h2>
            <div className="space-y-4">
              {category.services && category.services.map((svc: any) => {
                const isDiscounted = svc.discountPercentage > 0;
                const finalPrice = isDiscounted ? Math.round(svc.basePrice * (1 - svc.discountPercentage / 100)) : svc.basePrice;

                return (
                  <div key={svc._id} className="bg-white border border-[#C3AB84]/20 rounded-3xl p-5 flex flex-col md:flex-row gap-5 shadow-sm hover:shadow-md transition-shadow">
                    {svc.imageUrl && (
                      <div className="w-full md:w-44 h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                        <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif text-base font-bold text-[#0F3D30]">{svc.name}</h3>
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="w-3.5 h-3.5 fill-[#C3AB84] text-[#C3AB84]" />
                            <span className="font-bold text-[#0F3D30]">{svc.rating || '4.5'}</span>
                            <span className="text-foreground/40">({svc.reviewCount || 0})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-foreground/50 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{svc.estimatedDurationMins} minutes</span>
                        </div>
                        {svc.description && (
                          <p className="text-foreground/60 text-xs mt-2.5 leading-relaxed line-clamp-2">{svc.description}</p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-serif text-base font-black text-[#0F3D30]">₹{finalPrice}</span>
                          {isDiscounted && (
                            <span className="text-xs line-through text-foreground/40">₹{svc.basePrice}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/services/${svc.slug}`} className="px-4 py-1.5 border border-[#C3AB84]/40 text-[#0F3D30] rounded-full text-xs font-bold hover:bg-[#FAF6F0] transition-colors">
                            Details
                          </Link>
                          <Link href={`/checkout?serviceId=${svc._id}`} className="px-4 py-1.5 bg-[#0F3D30] text-white rounded-full text-xs font-bold hover:bg-[#0F3D30]/90 transition-colors shadow-sm">
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Why Choose Us */}
          {category.whyChoose && category.whyChoose.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-[#0F3D30]">Why Choose Nexora {category.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.whyChoose.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white border border-[#C3AB84]/15 rounded-3xl p-5 shadow-sm flex items-start gap-4">
                    <span className="bg-[#C3AB84]/20 text-[#0F3D30] font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#0F3D30]">{item.title}</h4>
                      <p className="text-foreground/50 text-xs mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* How it works */}
          {category.howItWorks && category.howItWorks.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-[#0F3D30]">How It Works</h2>
              <div className="space-y-3">
                {category.howItWorks.map((step: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 bg-white border border-[#C3AB84]/10 rounded-2xl p-4 shadow-sm">
                    <span className="bg-[#0F3D30] text-[#C3AB84] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F3D30] uppercase tracking-wider">{step.title}</h4>
                      <p className="text-xs text-foreground/50 mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Before & after gallery */}
          {category.beforeAfterGallery && category.beforeAfterGallery.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-[#0F3D30]">Before & After Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.beforeAfterGallery.map((img: any, idx: number) => (
                  <div key={idx} className="bg-white border border-[#C3AB84]/15 rounded-3xl p-3 shadow-sm grid grid-cols-2 gap-2">
                    <div className="rounded-xl overflow-hidden h-28 relative">
                      <img src={img.beforeUrl} alt="Before" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 bg-[#0F3D30] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Before</span>
                    </div>
                    <div className="rounded-xl overflow-hidden h-28 relative">
                      <img src={img.afterUrl} alt="After" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 bg-green-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">After</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQs */}
          {category.faqs && category.faqs.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-[#0F3D30] flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#C3AB84]" /> Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {category.faqs.map((faq: any, idx: number) => (
                  <div key={idx} className="bg-white border border-[#C3AB84]/15 rounded-3xl p-5 shadow-sm">
                    <h4 className="font-serif text-sm font-bold text-[#0F3D30]">{faq.question}</h4>
                    <p className="text-foreground/50 text-xs mt-2 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Right Side Column - Benefits & Reviews sidebar */}
        <div className="space-y-8">
          
          {/* Why choose Nexora benefits summary */}
          <div className="bg-[#0F3D30] text-white p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#C3AB84]">Nexora Trust Badges</h3>
            <div className="space-y-3.5 text-xs text-white/80">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#C3AB84] flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Verified Specialists</h4>
                  <p className="text-[10px] text-white/60 mt-0.5">Every technician is background checked.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ThumbsUp className="w-5 h-5 text-[#C3AB84] flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Satisfaction Promised</h4>
                  <p className="text-[10px] text-white/60 mt-0.5">Complimentary rework if not fully content.</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Reviews */}
          <div className="bg-white border border-[#C3AB84]/20 p-5 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-serif text-md font-bold text-[#0F3D30]">Customer Feedback</h3>
            {category.reviews && category.reviews.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {category.reviews.map((rev: any) => (
                  <div key={rev._id} className="border-b border-gray-100 pb-3 last:border-b-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground/80 truncate max-w-[120px]">{rev.userId?.name || 'Customer'}</h4>
                      <div className="flex items-center gap-0.5 text-amber-500 text-[10px]">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="font-bold">{rev.rating}</span>
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-[10px] text-foreground/60 leading-relaxed italic">"{rev.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-foreground/40 text-center py-6">No approved reviews yet.</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
