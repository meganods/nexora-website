"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Star, MapPin, ShieldCheck, Wrench, Award,
  ChevronLeft, Loader2, AlertCircle, CalendarDays, CheckCircle2,
  Clock, Image as ImageIcon, Briefcase, ThumbsUp, MessageSquare, Phone, Mail
} from 'lucide-react';
import api from '@/lib/api';

export default function PartnerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const router = useRouter();

  const [partner, setPartner] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [gallery, setGallery] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  useEffect(() => {
    fetchPartnerProfile();
  }, [unwrappedParams.id]);

  const fetchPartnerProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/public/partners/${unwrappedParams.id}`);
      if (data.success) {
        setPartner(data.partner);
        setServices(data.services || []);
        setReviews(data.reviews || []);
        setStats(data.stats || {});
        setGallery(data.gallery || []);
      } else {
        setError('Failed to load profile details.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Service Partner profile not found.');
    } finally {
      setLoading(false);
    }
  };

  const avatarInitials = partner?.name 
    ? partner.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() 
    : 'SP';

  const defaultCity = partner?.addresses?.[0]?.city || partner?.addresses?.[0]?.cityId?.name || "Delhi NCR";
  const defaultState = partner?.addresses?.[0]?.state || partner?.addresses?.[0]?.stateId?.name || "Delhi";

  if (loading) {
    return (
      <div className="min-h-screen bg-cream/35 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-xs font-bold text-primary font-mono uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-cream/35 flex flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="w-14 h-14 text-red-500 mb-4" />
        <h2 className="font-serif text-2xl font-bold text-primary mb-2">Profile Not Found</h2>
        <p className="text-foreground/60 mb-6">{error || 'This service partner details could not be loaded.'}</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/95 transition-all text-sm shadow-md">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]/40 pb-24 font-sans text-foreground">
      
      {/* ── PROFILE HEADER SECTION ── */}
      <div className="bg-primary text-white pt-10 pb-24 px-4 sm:px-8 border-b border-[#C3AB84]/15 relative">
        <div className="container mx-auto max-w-5xl">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[#C3AB84] hover:text-white mb-6 transition-colors text-xs font-bold uppercase tracking-wider w-fit">
            <ChevronLeft className="w-4 h-4" /> Back to Partners
          </button>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
            {/* Vendor Profile Image / Initial bubble */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#C3AB84]/20 border-2 border-[#C3AB84]/40 flex items-center justify-center text-white text-4xl font-serif font-black shadow-xl shrink-0 overflow-hidden">
              {partner.profilePictureUrl ? (
                <img src={partner.profilePictureUrl} alt={partner.name} className="w-full h-full object-cover" />
              ) : avatarInitials}
            </div>
            
            <div className="flex-grow space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="font-serif text-2xl sm:text-3.5xl font-black tracking-tight">{partner.name}</h1>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/65 border border-emerald-800/60 px-3 py-1 rounded-full uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Partner
                </span>
              </div>

              {partner.kycDetails?.businessName && (
                <p className="text-[#C3AB84] font-serif text-base sm:text-lg font-semibold">{partner.kycDetails.businessName}</p>
              )}

              <p className="text-white/80 text-xs sm:text-sm font-bold tracking-wider uppercase">{partner.category} Specialist</p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <strong className="text-white">{(stats.averageRating || 4.8).toFixed(1)}</strong> ({stats.reviewCount || 0} Reviews)
                </span>
                <span className="hidden xs:inline">•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#C3AB84]" />
                  <strong className="text-white">{stats.completedJobs || 0}</strong> Bookings Completed
                </span>
                <span className="hidden xs:inline">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[#C3AB84]" />
                  {defaultCity}, {defaultState}
                </span>
              </div>

              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4 text-[10px] text-white/50 font-mono">
                <span>Member Since: {new Date(partner.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</span>
                {partner.experience > 0 && <span>• {partner.experience} Years Experience</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFILE CONTENT AREA ── */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: About, Services, Reviews */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About Vendor Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/25 shadow-sm space-y-4">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-primary border-b border-gold/10 pb-2.5">About Professional</h2>
              <p className="text-foreground/75 leading-relaxed text-xs sm:text-sm">
                {partner.aboutMe || partner.businessDescription || `Hello, I'm ${partner.name}. As a verified premium home services expert on Nexora, I specialize in ${partner.category} jobs. I work strictly with quality standard supplies, focus on service safety, and strive to provide a top-class customer experience.`}
              </p>
              
              {/* Skills & Certifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#FAF6F0]/40 p-4 rounded-2xl border border-gold/15">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-gold" /> Key Skills &amp; Expertise
                  </h4>
                  <p className="text-[11px] text-foreground/70 leading-relaxed">
                    {partner.skills && partner.skills.length > 0 ? partner.skills.join(', ') : `Premium standard execution, background-verified workforce, dynamic pricing alignment, and custom ${partner.category} solutions.`}
                  </p>
                </div>
                <div className="bg-[#FAF6F0]/40 p-4 rounded-2xl border border-gold/15">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-gold" /> Certifications &amp; Accreditations
                  </h4>
                  <p className="text-[11px] text-foreground/70 leading-relaxed">
                    {partner.certifications && partner.certifications.length > 0 ? partner.certifications.join(', ') : 'Nexora Gold Standard Partner verification check successfully passed. Verified KYC records.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Services Offered Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/25 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gold/10 pb-3">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-primary">Services Offered</h2>
                <span className="bg-[#0F3D30]/5 text-primary text-xs font-bold px-3 py-1 rounded-full">{services.length} Active</span>
              </div>

              {services.length === 0 ? (
                <div className="text-center py-8 text-foreground/45 text-xs italic">
                  No active services found matching this partner's category.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((svc) => {
                    const isDiscounted = svc.discountPercentage > 0;
                    const finalPrice = isDiscounted ? Math.round(svc.basePrice * (1 - svc.discountPercentage / 100)) : svc.basePrice;

                    return (
                      <div key={svc._id} className="bg-white border border-[#C3AB84]/15 rounded-3xl p-3 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                        <div>
                          <div className="h-32 w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative mb-3">
                            <img 
                              src={svc.imageUrl || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80"} 
                              alt={svc.name} 
                              className="w-full h-full object-cover" 
                            />
                            {isDiscounted && (
                              <span className="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded shadow">
                                {svc.discountPercentage}% OFF
                              </span>
                            )}
                          </div>

                          <h3 className="font-serif text-xs font-bold text-[#0F3D30] line-clamp-1">{svc.name}</h3>
                          
                          <div className="flex items-center gap-2 text-[9px] text-foreground/50 mt-1">
                            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{(svc.rating || 4.7).toFixed(1)}</span>
                            </span>
                            <span>•</span>
                            <span>{svc.estimatedDurationMins} mins</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[7px] uppercase tracking-wider text-foreground/45 block">Starts At</span>
                            <span className="font-serif text-xs sm:text-sm font-black text-[#0F3D30]">₹{finalPrice}</span>
                          </div>
                          <Link href={`/services/${svc.slug}`} className="px-3.5 py-1.5 bg-[#0F3D30] text-white text-[10px] font-bold rounded-full hover:bg-[#0F3D30]/90 transition-colors shadow-sm">
                            Book Now
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Customer Reviews Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/25 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gold/10 pb-3">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-primary">Customer Reviews</h2>
                {reviews.length > 3 && (
                  <button 
                    onClick={() => setShowReviewsModal(true)} 
                    className="text-xs font-bold text-[#C3AB84] hover:text-[#0F3D30] transition-colors"
                  >
                    View All ({reviews.length}) &rarr;
                  </button>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-8 text-foreground/45 text-xs italic">
                  No verified customer reviews available for this partner yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((rev) => (
                    <div key={rev._id} className="p-4 bg-[#FAF6F0]/30 rounded-2xl border border-gold/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-primary">{rev.userId?.name || 'Verified Customer'}</p>
                          <p className="text-[9px] text-foreground/45 font-mono">{new Date(rev.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                        </div>
                        <div className="flex text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-foreground/20'}`} />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-foreground/75 leading-relaxed italic">
                        "{rev.reviewText}"
                      </p>

                      {rev.serviceId?.name && (
                        <p className="text-[9px] font-bold text-[#C3AB84] uppercase tracking-wider">Service Booked: {rev.serviceId.name}</p>
                      )}

                      {rev.vendorReply && (
                        <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100/50 space-y-1">
                          <p className="text-[9px] font-bold text-emerald-800 flex items-center gap-1 uppercase tracking-wider">
                            💬 Response from Partner:
                          </p>
                          <p className="text-xs text-[#0F3D30]/90 leading-relaxed italic">
                            "{rev.vendorReply}"
                          </p>
                        </div>
                      )}

                      {/* Review Images */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pt-1">
                          {rev.images.map((img: string, idx: number) => (
                            <div key={idx} className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-gray-100 flex-shrink-0">
                              <img src={img} alt="review-proof" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gallery Section */}
            {gallery.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/25 shadow-sm space-y-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-primary border-b border-gold/10 pb-2.5">Recent Work Gallery</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {gallery.map((imgUrl, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gold/10 shadow-sm relative group">
                      <img src={imgUrl} alt="work-gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Statistics, Business/Contact Info */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Vendor Statistics Panel */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/25 shadow-sm space-y-6">
              <h3 className="font-serif text-base sm:text-lg font-bold text-primary border-b border-gold/10 pb-2.5">Performance Metrics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#FAF6F0]/50 rounded-2xl border border-gold/10 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground/45 block">Bookings Completed</span>
                  <span className="font-serif text-lg font-bold text-primary">{stats.completedJobs || 0}</span>
                </div>
                <div className="p-3 bg-[#FAF6F0]/50 rounded-2xl border border-gold/10 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground/45 block">Active Services</span>
                  <span className="font-serif text-lg font-bold text-primary">{stats.activeServicesCount || 0}</span>
                </div>
                <div className="p-3 bg-[#FAF6F0]/50 rounded-2xl border border-gold/10 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground/45 block">Completion Rate</span>
                  <span className="font-serif text-lg font-bold text-primary">{stats.completionRate || "100%"}</span>
                </div>
                <div className="p-3 bg-[#FAF6F0]/50 rounded-2xl border border-gold/10 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground/45 block">On-Time Arrival</span>
                  <span className="font-serif text-lg font-bold text-primary">{stats.onTimeArrivalRate || "98%"}</span>
                </div>
                <div className="p-3 bg-[#FAF6F0]/50 rounded-2xl border border-gold/10 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground/45 block">Satisfaction Rate</span>
                  <span className="font-serif text-lg font-bold text-primary">{stats.satisfactionRate || "96%"}</span>
                </div>
                <div className="p-3 bg-[#FAF6F0]/50 rounded-2xl border border-gold/10 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground/45 block">Repeat Customers</span>
                  <span className="font-serif text-lg font-bold text-primary">{stats.repeatCustomers || "15%"}</span>
                </div>
              </div>
            </div>

            {/* Contact & Service Info */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-lg shadow-gold/5 space-y-6">
              <h3 className="font-serif text-base sm:text-lg font-bold text-primary border-b border-gold/10 pb-2.5">Business Information</h3>
              
              <div className="space-y-4 text-xs text-foreground/70">
                <div className="flex items-start gap-2.5">
                  <Briefcase className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Registered Business</p>
                    <p className="mt-0.5">{partner.kycDetails?.businessName || partner.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Service Locations</p>
                    <p className="mt-0.5">{partner.serviceAreas?.join(', ') || 'Delhi NCR'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Working Hours</p>
                    <p className="mt-0.5">{partner.workingHours || "Monday – Sunday: 9:00 AM – 8:00 PM"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Languages Spoken</p>
                    <p className="mt-0.5">{partner.languages?.join(', ') || 'English, Hindi'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Phone Helpline</p>
                    <p className="mt-0.5 font-mono">{partner.phone || '—'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Email Support</p>
                    <p className="mt-0.5 font-mono">{partner.email || '—'}</p>
                  </div>
                </div>
              </div>

              <hr className="border-gold/15" />
              
              <Link href="/services" className="block w-full py-3 bg-primary text-white text-center rounded-full font-bold hover:bg-primary/95 transition-all text-xs shadow-md">
                Browse Services Catalog
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ── REVIEWS DETAIL MODAL ── */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gold/25 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gold/15 bg-cream/40 flex justify-between items-center">
              <h4 className="font-serif text-sm font-bold text-primary">All Customer Reviews ({reviews.length})</h4>
              <button onClick={() => setShowReviewsModal(false)} className="text-primary/70 hover:text-primary font-bold text-lg">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {reviews.map((rev) => (
                <div key={rev._id} className="p-4 bg-[#FAF6F0]/30 rounded-2xl border border-gold/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-primary">{rev.userId?.name || 'Verified Customer'}</p>
                      <p className="text-[9px] text-foreground/45 font-mono">{new Date(rev.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                    </div>
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-foreground/20'}`} />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-foreground/75 leading-relaxed italic">
                    "{rev.reviewText}"
                  </p>

                  {rev.serviceId?.name && (
                    <p className="text-[9px] font-bold text-[#C3AB84] uppercase tracking-wider">Service Booked: {rev.serviceId.name}</p>
                  )}

                  {rev.vendorReply && (
                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100/50 space-y-1">
                      <p className="text-[9px] font-bold text-emerald-800 flex items-center gap-1 uppercase tracking-wider">
                        💬 Response from Partner:
                      </p>
                      <p className="text-xs text-[#0F3D30]/90 leading-relaxed italic">
                        "{rev.vendorReply}"
                      </p>
                    </div>
                  )}

                  {rev.images && rev.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pt-1">
                      {rev.images.map((img: string, idx: number) => (
                        <div key={idx} className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-gray-100 flex-shrink-0">
                          <img src={img} alt="review-proof" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
