"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Star, MapPin, ShieldCheck, Wrench, Award,
  ChevronLeft, Loader2, AlertCircle, CalendarDays, CheckCircle2
} from 'lucide-react';
import api from '@/lib/api';

export default function PartnerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const router = useRouter();

  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      } else {
        setError('Failed to load profile details.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Service Partner profile not found.');
    } finally {
      setLoading(false);
    }
  };

  const avatarColors = ["bg-primary", "bg-secondary", "bg-[#C3AB84]", "bg-emerald-600", "bg-violet-600"];
  const avatarInitials = partner?.name ? partner.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'SP';

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="w-14 h-14 text-secondary mb-4" />
        <h2 className="font-serif text-2xl font-bold text-primary mb-2">Profile Not Found</h2>
        <p className="text-foreground/60 mb-6">{error || 'This service partner details could not be loaded.'}</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all text-sm">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      
      {/* Header band */}
      <div className="bg-primary text-white pt-10 pb-20 px-4 sm:px-8">
        <div className="container mx-auto max-w-4xl">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-white/70 hover:text-white mb-5 transition-colors text-sm w-fit">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-secondary flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {avatarInitials}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                <h1 className="font-serif text-3xl font-bold">{partner.name}</h1>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Partner
                </span>
              </div>
              <p className="text-white/80 text-sm font-medium">{partner.category}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-white/60 mt-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <span className="font-bold text-white">{(partner.rating || 4.8).toFixed(1)}</span> Rating
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-bold text-white">{partner.totalCompletedJobs || 0}</span> Completed Jobs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 sm:px-8 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left panel */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-primary mb-4">About Professional</h2>
              <p className="text-foreground/75 leading-relaxed text-sm">
                {partner.aboutText || `Hi, I am ${partner.name}, a verified home services professional with Nexora. I specialise in ${partner.category} and strive to deliver the highest standard of service quality, punctuality, and client satisfaction.`}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-primary mb-5">Completed Services Record</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-cream rounded-2xl border border-gold/15">
                  <div>
                    <p className="text-xs font-bold text-primary">Job Completion Rate</p>
                    <p className="text-xs text-foreground/50 mt-0.5">Assigned vs completed jobs ratio</p>
                  </div>
                  <span className="font-serif text-xl font-bold text-primary">98%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-cream rounded-2xl border border-gold/15">
                  <div>
                    <p className="text-xs font-bold text-primary">Customer Satisfaction</p>
                    <p className="text-xs text-foreground/50 mt-0.5">Percentage of 5-star ratings</p>
                  </div>
                  <span className="font-serif text-xl font-bold text-primary">96%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/30 shadow-lg shadow-gold/5 space-y-6 sticky top-8">
              <h3 className="font-serif text-lg font-bold text-primary mb-2">Partner Details</h3>
              
              <div className="space-y-4 text-xs text-foreground/70">
                <div className="flex items-start gap-2.5">
                  <Wrench className="w-4 h-4 text-gold flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Specialisation</p>
                    <p className="mt-0.5">{partner.category}</p>
                  </div>
                </div>
                
                {partner.experienceYears && (
                  <div className="flex items-start gap-2.5">
                    <Award className="w-4 h-4 text-gold flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Experience</p>
                      <p className="mt-0.5">{partner.experienceYears} Years</p>
                    </div>
                  </div>
                )}

                {partner.location?.city && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Service Location</p>
                      <p className="mt-0.5">{partner.location.city}</p>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-gold/15" />
              
              <Link href="/services" className="block w-full py-3 bg-primary text-white text-center rounded-full font-bold hover:bg-primary/90 transition-all text-xs">
                Book a Service
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
