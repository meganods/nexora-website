"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, Sparkles, Scissors, Wrench, ShieldAlert, Brush, Eye, HelpCircle, Heart, HardHat, Car } from 'lucide-react';
import api from '@/lib/api';

const getCategoryIcon = (slug: string) => {
  const s = slug.toLowerCase();
  if (s.includes('salon') || s.includes('women') || s.includes('men') || s.includes('beauty')) return Scissors;
  if (s.includes('ac') || s.includes('appliance') || s.includes('repair') || s.includes('electric')) return Wrench;
  if (s.includes('cleaning') || s.includes('pest')) return Brush;
  if (s.includes('painting')) return Sparkles;
  if (s.includes('massage') || s.includes('spa') || s.includes('therap')) return Heart;
  if (s.includes('plumb')) return HardHat;
  if (s.includes('car') || s.includes('auto')) return Car;
  return Sparkles;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/public/categories');
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-24 font-sans text-foreground">
      {/* Header Banner */}
      <div className="bg-[#0F3D30] text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center space-y-4">
          <span className="text-xs font-bold text-[#C3AB84] uppercase tracking-widest bg-[#C3AB84]/15 px-4 py-1.5 rounded-full border border-[#C3AB84]/20">
            Professional Home Services
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#C3AB84]">Browse All Categories</h1>
          <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed">
            Select a category to explore premium, verified, bookable services tailored for your home.
          </p>
        </div>
      </div>

      {/* Grid Container */}
      <div className="container mx-auto max-w-6xl px-4 mt-12">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center max-w-md mx-auto">
            <ShieldAlert className="w-12 h-12 text-gold/30 mx-auto mb-4" />
            <h3 className="font-serif text-base font-bold text-primary mb-1">No Categories Found</h3>
            <p className="text-xs text-foreground/50 leading-relaxed mb-6">
              Our service category catalog is undergoing updates. Please try again later.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-all shadow-sm">
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const IconComponent = getCategoryIcon(cat.slug || cat.name);
              return (
                <div key={cat._id} className="bg-white rounded-3xl p-6 border border-gold/20 hover:border-gold/45 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group h-full">
                  <div className="space-y-4">
                    {/* Icon Box */}
                    <div className="w-12 h-12 rounded-2xl bg-[#0F3D30]/5 text-[#0F3D30] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="space-y-2">
                      <Link href={`/categories/${cat.slug || cat._id}`}>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-primary group-hover:text-[#C3AB84] transition-colors">
                          {cat.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-foreground/55 leading-relaxed line-clamp-3">
                        {cat.description || `Professional ${cat.name.toLowerCase()} services. Certified experts, standardized rates, and complete customer satisfaction.`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gold/10 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground/45">
                      Verified Professionals
                    </span>
                    <Link
                      href={`/categories/${cat.slug || cat._id}`}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-[#C3AB84] transition-colors"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
