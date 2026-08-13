"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, MapPin, Wrench, Award, ChevronLeft, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

function PartnersList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';

  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/public/partners?limit=30');
      if (data.success) {
        let list = data.partners;
        if (categoryFilter) {
          list = list.filter((p: any) => 
            p.category?.toLowerCase().includes(categoryFilter.toLowerCase()) ||
            categoryFilter.toLowerCase().includes(p.category?.toLowerCase())
          );
        }
        setPartners(list);
      }
    } catch (err) {
      console.error('Failed to load partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const avatarColors = ["bg-primary", "bg-secondary", "bg-[#C3AB84]", "bg-emerald-600", "bg-violet-600"];

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="bg-primary text-white pt-10 pb-20 px-4 sm:px-8">
        <div className="container mx-auto max-w-6xl">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-white/70 hover:text-white mb-5 transition-colors text-sm w-fit">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">
            {categoryFilter ? `${categoryFilter} Professionals` : 'Service Partners'}
          </h1>
          <p className="text-white/70 text-sm">
            Top-rated verified professionals ready to serve at your doorstep.
          </p>
        </div>
      </div>

      {/* Main List */}
      <main className="container mx-auto max-w-6xl px-4 sm:px-8 -mt-10">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
        ) : partners.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gold/20 shadow-sm">
            <p className="text-sm font-semibold text-primary">No professionals found</p>
            <p className="text-xs text-foreground/50 mt-1">Try browsing other categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partners.map((p, i) => {
              const initials = p.name ? p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'SP';
              return (
                <div key={p._id} className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-5 justify-between">
                  <div className="flex gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif font-bold text-primary text-base truncate">{p.name}</h3>
                      <p className="text-xs text-foreground/75 font-medium mt-0.5">{p.category}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/50 mt-3">
                        <div className="flex items-center gap-0.5 text-primary font-bold">
                          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                          <span>{(p.rating || 4.8).toFixed(1)}</span>
                        </div>
                        <span>•</span>
                        <span>{p.totalCompletedJobs || 0} jobs completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-end items-end gap-3 flex-shrink-0">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full w-fit">
                      <ShieldCheck className="w-3 h-3" /> Verified Partner
                    </span>
                    
                    <Link
                      href={`/partner/${p._id}`}
                      className="px-5 py-2 border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold rounded-full w-full sm:w-auto text-center"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function PartnersPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <PartnersList />
    </Suspense>
  );
}
