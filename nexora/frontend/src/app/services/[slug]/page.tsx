"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, Clock, ShieldCheck, Check, X, AlertCircle,
  ChevronRight, Loader2, Award, Heart, HelpCircle,
  Plus, CheckSquare, Square
} from 'lucide-react';
import api from '@/lib/api';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [service, setService] = useState<any>(null);
  const [categoryServices, setCategoryServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFav, setIsFav] = useState(false);

  // Add-ons State
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const { data } = await api.get(`/public/services/${slug}`);
        setService(data);

        // Fetch sibling services in the same category for "Related Services"
        if (data.categoryId?._id) {
          const siblingRes = await api.get(`/public/services?categoryId=${data.categoryId._id}`);
          if (Array.isArray(siblingRes.data)) {
            setCategoryServices(siblingRes.data.filter((s: any) => s._id !== data._id));
          }
        }

        // Check if is in wishlist
        const local = localStorage.getItem('user_wishlist');
        if (local) {
          const list = JSON.parse(local);
          setIsFav(list.includes(data._id));
        }
      } catch (err) {
        setError('Service not found or failed to retrieve details.');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchServiceDetails();
  }, [slug]);

  const toggleWishlist = () => {
    if (!service) return;
    const local = localStorage.getItem('user_wishlist');
    let list: string[] = [];
    if (local) list = JSON.parse(local);

    if (list.includes(service._id)) {
      list = list.filter(id => id !== service._id);
      setIsFav(false);
    } else {
      list.push(service._id);
      setIsFav(true);
    }
    localStorage.setItem('user_wishlist', JSON.stringify(list));
  };

  const toggleAddon = (addon: any) => {
    if (selectedAddons.some(a => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
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
        <p className="text-xs text-foreground/50 mb-6">We couldn't retrieve details for this service page.</p>
        <Link href="/services" className="px-6 py-2.5 bg-[#0F3D30] text-white rounded-full text-xs font-bold shadow-sm">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const isDiscounted = service.discountPercentage > 0;
  const baseFinalPrice = isDiscounted ? Math.round(service.basePrice * (1 - service.discountPercentage / 100)) : service.basePrice;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalAmount = baseFinalPrice + addonsTotal;

  // Build Book Now URL passing ID, selected add-ons names, and total amount
  const handleBookNow = () => {
    const addonsParam = encodeURIComponent(selectedAddons.map(a => `${a.name}:${a.price}`).join(','));
    router.push(`/checkout?serviceId=${service._id}&addons=${addonsParam}&total=${totalAmount}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-32">
      
      {/* Search Header Banner */}
      <div className="bg-[#0F3D30] text-white pt-6 pb-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/services" className="hover:text-white transition-colors">Services</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{service.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] bg-[#C3AB84]/20 border border-[#C3AB84]/30 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {service.categoryId?.name || 'Home Services'}
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#C3AB84] mt-2">{service.name}</h1>
              
              <div className="flex items-center gap-4 text-xs mt-2 text-[#FAF6F0]/80">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-current" /> {service.rating || '4.5'}
                </span>
                <span>({service.reviewCount || 0} customer reviews)</span>
                <span className="text-white/20">•</span>
                <span>{service.totalBookings || '420+'} booked recently</span>
              </div>
            </div>

            <button onClick={toggleWishlist} className="flex items-center gap-2 px-4 py-2 border border-[#C3AB84]/30 rounded-full text-xs font-bold hover:bg-white/5 transition-all text-white w-fit">
              <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              {isFav ? 'Added to Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side Content - Inclusions, exclusions, safety, steps */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Image Banner */}
          {service.imageUrl && (
            <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden shadow-sm border border-[#C3AB84]/15 bg-white p-2">
              <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover rounded-2xl" />
            </div>
          )}

          {/* Service Description */}
          {service.description && (
            <section className="bg-white border border-[#C3AB84]/20 rounded-3xl p-6 shadow-sm space-y-3">
              <h2 className="font-serif text-lg font-bold text-[#0F3D30]">Service Overview</h2>
              <p className="text-foreground/60 text-xs leading-relaxed">{service.description}</p>
            </section>
          )}

          {/* Add-on Services System Section */}
          {service.addons && service.addons.length > 0 && (
            <section className="bg-white border border-[#C3AB84]/20 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#0F3D30]">Available Add-ons</h2>
              <p className="text-foreground/50 text-[10px] -mt-2">Enhance your booking experience with premium options:</p>
              <div className="space-y-3">
                {service.addons.map((addon: any, idx: number) => {
                  const isChecked = selectedAddons.some(a => a.name === addon.name);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                        isChecked ? 'border-[#0F3D30] bg-[#0F3D30]/5' : 'border-gray-200 hover:border-[#0F3D30]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-[#0F3D30]" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300" />
                        )}
                        <div>
                          <h4 className="font-serif text-xs font-bold text-[#0F3D30]">{addon.name}</h4>
                          {addon.description && (
                            <p className="text-[10px] text-foreground/50 mt-0.5">{addon.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-serif text-xs font-black text-[#0F3D30]">+ ₹{addon.price}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section className="bg-white border border-[#C3AB84]/20 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-serif text-sm font-bold text-[#0F3D30] border-b border-gray-100 pb-2">What's Included</h3>
              <div className="space-y-2">
                {service.inclusions && service.inclusions.length > 0 ? (
                  service.inclusions.map((inc: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground/70">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-foreground/40">Standard service features apply.</p>
                )}
              </div>
            </section>

            <section className="bg-white border border-[#C3AB84]/20 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-serif text-sm font-bold text-[#0F3D30] border-b border-gray-100 pb-2">What's NOT Included</h3>
              <div className="space-y-2">
                {service.whatsNotIncluded && service.whatsNotIncluded.length > 0 ? (
                  service.whatsNotIncluded.map((exc: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground/70">
                      <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{exc}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-foreground/40">Cost of replacement spare parts not included.</p>
                )}
              </div>
            </section>
          </div>

          {/* Process steps */}
          {service.processSteps && service.processSteps.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#0F3D30]">Service Process Steps</h2>
              <div className="relative border-l border-gold/30 ml-4 pl-6 space-y-6">
                {service.processSteps.map((step: any, idx: number) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-10 top-0.5 bg-[#0F3D30] text-[#C3AB84] text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-[#0F3D30] text-xs uppercase tracking-wider">{step.title}</h4>
                    <p className="text-xs text-foreground/50 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Safety measures */}
          {service.safetyMeasures && service.safetyMeasures.length > 0 && (
            <section className="bg-white border border-[#C3AB84]/20 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-sm font-bold text-[#0F3D30]">Nexora Safety Guidelines</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {service.safetyMeasures.map((safe: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-foreground/70">
                    <ShieldCheck className="w-4 h-4 text-[#C3AB84]" />
                    <span>{safe}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Services */}
          {categoryServices.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#0F3D30]">Related Services</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoryServices.slice(0, 4).map((s: any) => (
                  <Link key={s._id} href={`/services/${s.slug}`} className="bg-white border border-[#C3AB84]/15 p-4 rounded-2xl flex items-center justify-between hover:border-[#0F3D30]/40 transition-colors shadow-sm">
                    <div>
                      <h4 className="font-serif text-xs font-bold text-[#0F3D30]">{s.name}</h4>
                      <span className="block text-[10px] text-foreground/50 mt-1">Starting at ₹{s.basePrice}</span>
                    </div>
                    <Plus className="w-4 h-4 text-[#0F3D30]/60" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQs */}
          {service.faqs && service.faqs.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#0F3D30] flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#C3AB84]" /> Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {service.faqs.map((faq: any, idx: number) => (
                  <div key={idx} className="bg-white border border-[#C3AB84]/15 rounded-3xl p-5 shadow-sm">
                    <h4 className="font-serif text-sm font-bold text-[#0F3D30]">{faq.question}</h4>
                    <p className="text-foreground/50 text-xs mt-2 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Right Side Column - Price Summary & Reviews summary */}
        <div className="space-y-8">
          
          {/* Price checkout box */}
          <div className="bg-white border border-[#C3AB84]/20 p-6 rounded-3xl space-y-6 shadow-sm sticky top-24">
            <div>
              <span className="block text-[10px] uppercase font-bold text-foreground/40 tracking-wider font-serif">Order Summary</span>
              
              <div className="mt-4 space-y-2 border-b border-gray-100 pb-3">
                <div className="flex justify-between text-xs text-foreground/70">
                  <span>Base Service ({service.name})</span>
                  <span>₹{baseFinalPrice}</span>
                </div>
                {selectedAddons.map((addon, i) => (
                  <div key={i} className="flex justify-between text-xs text-foreground/60 italic pl-2">
                    <span>+ {addon.name}</span>
                    <span>₹{addon.price}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-baseline justify-between mt-4">
                <span className="text-xs font-bold text-[#0F3D30]">Total Amount:</span>
                <h3 className="font-serif text-xl font-black text-[#0F3D30]">₹{totalAmount}</h3>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5 text-xs text-foreground/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C3AB84]" />
                <span>Job Duration: {service.estimatedDurationMins} minutes</span>
              </div>
              {service.warrantyInfo && (
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#C3AB84]" />
                  <span className="font-bold text-[#0F3D30]">{service.warrantyInfo}</span>
                </div>
              )}
            </div>

            <button onClick={handleBookNow} className="block w-full py-3 bg-[#0F3D30] hover:bg-[#0F3D30]/90 text-[#FAF6F0] font-serif font-bold text-center rounded-full text-sm shadow-sm transition-colors">
              Book Now
            </button>
          </div>

          {/* Service Reviews summary */}
          <div className="bg-white border border-[#C3AB84]/20 p-5 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-serif text-sm font-bold text-[#0F3D30]">Customer Feedback</h3>
            {service.reviews && service.reviews.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {service.reviews.map((rev: any) => (
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

      {/* Sticky Book Now Bottom Bar (for responsive viewport/mobile scrolling convenience) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#C3AB84]/20 px-6 py-4 shadow-2xl flex items-center justify-between md:hidden">
        <div>
          <span className="text-[9px] uppercase font-bold text-foreground/40">Total Amount</span>
          <span className="block font-serif text-base font-black text-[#0F3D30]">₹{totalAmount}</span>
        </div>
        <button onClick={handleBookNow} className="px-6 py-2.5 bg-[#0F3D30] text-white rounded-full font-serif font-bold text-xs shadow-sm">
          Book Now
        </button>
      </div>

    </div>
  );
}
