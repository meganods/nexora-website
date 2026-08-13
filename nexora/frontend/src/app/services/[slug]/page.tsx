"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star, Clock, CheckCircle2, ChevronRight, IndianRupee,
  ArrowRight, ShieldCheck, MessageSquareQuote, Loader2,
  AlertCircle, MapPin, Zap, Package, HelpCircle, Wrench
} from 'lucide-react';
import api from '@/lib/api';

const FAQ_DEFAULT = [
  { q: "What does this service include?", a: "Our service includes all tasks listed in the inclusions section. Our professional will arrive with all necessary equipment." },
  { q: "How do I confirm my booking?", a: "After booking, you'll receive a booking confirmation. Our system will assign a verified professional and you'll be notified." },
  { q: "What is the OTP verification?", a: "When the professional arrives, you'll share a 4-digit OTP to start the service. This ensures security and proper tracking." },
  { q: "Can I reschedule my booking?", a: "Yes, you can reschedule via your bookings page before the professional is assigned." },
  { q: "What if I'm not satisfied?", a: "We have a 100% satisfaction guarantee. Contact our support team if you're not happy with the service." },
];

const CATEGORY_EMOJI: Record<string, string> = {
  'ac-appliance': '❄️',
  'ac-appliance-repair': '❄️',
  'cleaning-pest': '🧹',
  'electrician-plumbing': '⚡',
  'electrician-plumber': '⚡',
  'salon-women': '💅',
  'salon-men': '✂️',
  'womens-therapies': '🌸',
  'mens-therapies': '💆',
  'hair-skin-nails': '💇',
  'carpentry': '🔨',
  'home-painting': '🎨',
  'spa-therapies': '🧘',
  'packagers-movers': '📦',
  'water-purifier': '💧',
};

// Component to dynamically query and list verified partners offering matching category services
function ServicePartnersList({ categoryName }: { categoryName: string }) {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryName) fetchPartners();
  }, [categoryName]);

  const fetchPartners = async () => {
    try {
      const { data } = await api.get('/public/partners?limit=10');
      if (data.success) {
        // Filter partners matching this specific category name
        const matches = data.partners.filter((p: any) =>
          p.category?.toLowerCase().includes(categoryName.toLowerCase()) ||
          categoryName.toLowerCase().includes(p.category?.toLowerCase())
        );
        setPartners(matches);
      }
    } catch (err) {
      console.error('Failed to fetch service partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const avatarColors = ["bg-primary", "bg-secondary", "bg-[#C3AB84]", "bg-emerald-600", "bg-violet-600"];

  if (loading) {
    return <div className="py-6 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (partners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {partners.map((p, i) => {
        const initials = p.name ? p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'SP';
        return (
          <div key={p._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-cream rounded-2xl border border-gold/15 gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                {initials}
              </div>
              <div className="min-w-0">
                <h4 className="font-serif font-bold text-primary text-sm truncate">{p.name}</h4>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-foreground/60">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                    <span className="font-bold text-primary">{(p.rating || 4.8).toFixed(1)}</span>
                  </div>
                  <span>•</span>
                  <span>{p.totalCompletedJobs || 0} completed jobs</span>
                  {p.location?.city && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-gold" /> {p.location.city}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Link
              href={`/partner/${p._id}`}
              className="px-5 py-2 border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold rounded-full text-center sm:self-center"
            >
              View Profile
            </Link>
          </div>
        );
      })}
    </div>
  );
}


export default function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [relatedServices, setRelatedServices] = useState<any[]>([]);

  useEffect(() => {
    fetchService();
  }, [unwrappedParams.slug]);

  const fetchService = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/public/services/${unwrappedParams.slug}`);
      setService(data);
      // Fetch related services in same category
      if (data.categoryId?._id) {
        try {
          const allRes = await api.get('/public/services');
          const related = allRes.data
            .filter((s: any) => s.categoryId?._id === data.categoryId._id && s._id !== data._id)
            .slice(0, 4);
          setRelatedServices(related);
        } catch { /* silent */ }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Service not found.');
    } finally {
      setLoading(false);
    }
  };

  const categorySlug = service?.categoryId?.slug || '';
  const emoji = CATEGORY_EMOJI[categorySlug] || '🔧';

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="w-14 h-14 text-secondary mb-4" />
        <h2 className="font-serif text-2xl font-bold text-primary mb-2">Service Not Found</h2>
        <p className="text-foreground/60 mb-6">{error || 'This service could not be found.'}</p>
        <Link href="/services" className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all text-sm">
          Browse All Services
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">

      {/* Header band */}
      <div className="bg-primary text-white pt-10 pb-20 px-4 sm:px-8">
        <div className="container mx-auto max-w-9xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/60 text-xs mb-6 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/services" className="hover:text-white transition-colors">Services</Link>
            {service.categoryId?.name && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/services?category=${encodeURIComponent(service.categoryId.name)}`} className="hover:text-white transition-colors">
                  {service.categoryId.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/90 font-medium truncate max-w-[180px]">{service.name}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-3xl flex-shrink-0">
              {emoji}
            </div>
            <div>
              {service.categoryId?.name && (
                <span className="text-xs font-bold text-gold uppercase tracking-wider">{service.categoryId.name}</span>
              )}
              <h1 className="font-serif text-3xl sm:text-4xl font-bold mt-1 mb-2">{service.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <span className="font-bold text-white">{(service.rating || 4.5).toFixed(1)}</span>
                  <span>({service.reviewCount || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-white/60" />
                  <span>{service.estimatedDurationMins} mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-white/60" />
                  <span>Verified Professional</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-9xl px-4 sm:px-8 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Main content ───────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Service visual */}
            <div className="bg-white rounded-3xl overflow-hidden border border-gold/20 shadow-sm">
              <div className="w-full h-64 sm:h-80 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                <img
                  src={
                    service.categoryId?.slug === 'ac-appliance' || service.categoryId?.slug === 'ac-appliance-repair'
                      ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80' // AC / appliance
                      : service.categoryId?.slug === 'cleaning-pest'
                        ? 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' // Cleaning
                        : service.categoryId?.slug === 'electrician-plumbing' || service.categoryId?.slug === 'electrician-plumber'
                          ? 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80' // Electrician
                          : service.categoryId?.slug === 'salon-women' || service.categoryId?.slug === 'hair-skin-nails'
                            ? 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' // Women Salon
                            : service.categoryId?.slug === 'salon-men'
                              ? 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80' // Men salon
                              : service.categoryId?.slug === 'spa-therapies' || service.categoryId?.slug === 'womens-therapies' || service.categoryId?.slug === 'mens-therapies'
                                ? 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80' // Massage Spa
                                : service.categoryId?.slug === 'home-painting'
                                  ? 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80' // Painting
                                  : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' // General
                  }
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
              </div>

              {/* Description */}
              <div className="p-6 sm:p-8">
                <h2 className="font-serif text-xl font-bold text-primary mb-3">About this service</h2>
                <p className="text-foreground/75 leading-relaxed">
                  {service.description || 'Professional, verified on-demand home service delivered at your doorstep by KYC-verified professionals.'}
                </p>
              </div>
            </div>

            {/* What's included */}
            {service.inclusions && service.inclusions.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm">
                <h2 className="font-serif text-xl font-bold text-primary mb-5 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gold" /> What's Included
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.inclusions.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Guarantee Strip */}
            <div className="bg-[#0F3D30]/8 border border-[#0F3D30]/15 rounded-3xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: ShieldCheck, title: "KYC-Verified Pro", desc: "All professionals are verified" },
                { icon: Zap, title: "OTP Safety Lock", desc: "Service starts only with your OTP" },
                { icon: MapPin, title: "At Your Doorstep", desc: "Service delivered to your home" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{item.title}</p>
                    <p className="text-xs text-foreground/60 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Service Partners list in place of FAQs */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-primary mb-5 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-gold" /> Top Professionals for this Service
              </h2>

              <ServicePartnersList categoryName={service.categoryId?.name} />
              
              <div className="mt-6 pt-5 border-t border-gold/10 flex justify-center">
                <Link 
                  href={`/partners?category=${encodeURIComponent(service.categoryId?.name || '')}`}
                  className="px-6 py-2.5 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold rounded-full transition-all border border-primary/20"
                >
                  View Professional Profiles
                </Link>
              </div>
            </div>

            {/* Related services */}
            {relatedServices.length > 0 && (
              <div>
                <h2 className="font-serif text-xl font-bold text-primary mb-4">Similar Services</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedServices.map((rel: any) => (
                    <Link
                      key={rel._id}
                      href={`/services/${rel.slug || rel._id}`}
                      className="bg-white rounded-2xl p-5 border border-gold/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center text-2xl flex-shrink-0">
                        {CATEGORY_EMOJI[rel.categoryId?.slug] || '🔧'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-primary text-sm truncate group-hover:text-primary/80 transition-colors">{rel.name}</h4>
                        <p className="text-xs text-foreground/50 mt-0.5 flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" /> {rel.basePrice} onwards
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gold flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Booking card ──────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Main booking card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/30 shadow-xl shadow-gold/5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs text-foreground/50 mb-1 uppercase tracking-wider font-semibold">Starting From</p>
                    <div className="font-serif text-4xl font-bold text-primary flex items-start gap-1">
                      <IndianRupee className="w-5 h-5 mt-2" />{service.basePrice}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gold">
                      <Star className="w-4 h-4 fill-gold" />
                      <span className="font-bold text-primary text-sm">{(service.rating || 4.5).toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-foreground/40">{service.reviewCount || 0} reviews</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6 text-sm text-foreground/70">
                  <div className="flex items-center justify-between">
                    <span>Service Duration</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gold" /> {service.estimatedDurationMins} mins
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Platform Fee</span>
                    <span className="font-semibold text-foreground">Calculated at checkout</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Service Type</span>
                    <span className="font-semibold text-foreground">At Home</span>
                  </div>
                </div>

                <hr className="border-gold/15 mb-6" />

                <Link
                  href={`/checkout?serviceId=${service._id}&name=${encodeURIComponent(service.name)}&price=${service.basePrice}`}
                  className="block w-full py-4 bg-primary text-white text-center rounded-full font-bold hover:bg-primary/90 transition-all shadow-md text-sm"
                >
                  Book Now
                </Link>
                <p className="text-center text-xs text-foreground/40 mt-3">You won't be charged until you complete checkout</p>

                {/* Trust signals */}
                <div className="mt-5 pt-5 border-t border-gold/10 space-y-2">
                  {[
                    { icon: ShieldCheck, text: "KYC-Verified Professional" },
                    { icon: Zap, text: "OTP-Protected Service Start" },
                    { icon: MessageSquareQuote, text: "Post-Service Rating Available" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-foreground/55">
                      <t.icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer reviews section */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-gold" /> Customer Reviews
          </h2>
          <div className="space-y-6">
            {[
              { name: 'Karan Malhotra', rating: 5, date: '3 days ago', text: 'Amazing service! Professional arrived on time, was extremely polite, and completed the work cleanly. Highly recommended!' },
              { name: 'Sneha Patel', rating: 5, date: '1 week ago', text: 'Super convenient and completely hassle-free booking. The OTP verification feature made me feel secure.' },
              { name: 'Aditya Sen', rating: 4, date: '2 weeks ago', text: 'Professional work quality. Price matches what was shown on-screen. Will book again.' }
            ].map((rev, i) => (
              <div key={i} className="pb-6 border-b border-gold/10 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-primary text-sm">{rev.name}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(rev.rating)].map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-gold text-gold" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-foreground/40">{rev.date}</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">"{rev.text}"</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
