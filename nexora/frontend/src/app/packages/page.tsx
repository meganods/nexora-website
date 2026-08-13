"use client";

import React from 'react';
import Link from 'next/link';
import { Clock, IndianRupee, ArrowRight, Star, Sparkles, Package } from 'lucide-react';

const PACKAGES_DATA = [
  {
    slug: 'basic-home-care',
    name: 'Basic Home Care',
    tagline: 'Your everyday home maintenance essentials.',
    includedServices: ['Cleaning', 'Electrician', 'Plumbing'],
    price: 699,
    originalPrice: 849,
    savings: '₹150 saved',
    badge: 'Popular',
    badgeColor: 'bg-primary text-white',
    duration: '3-4 hrs',
    rating: 4.8,
    reviewCount: 2140,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=80',
  },
  {
    slug: 'deep-home-care',
    name: 'Deep Home Care',
    tagline: 'Deep-clean your entire home in one booking.',
    includedServices: ['Bathroom Cleaning', 'Kitchen Cleaning', 'Sofa Cleaning'],
    price: 1299,
    originalPrice: 1549,
    savings: '₹250 saved',
    badge: 'Best Value',
    badgeColor: 'bg-amber-500 text-white',
    duration: '5-6 hrs',
    rating: 4.9,
    reviewCount: 3612,
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=80',
  },
  {
    slug: 'move-in-care',
    name: 'Move-In Care',
    tagline: 'Move into a clean, sanitized, pest-free home.',
    includedServices: ['Full Home Cleaning', 'Pest Control'],
    price: 1999,
    originalPrice: 2399,
    savings: '₹400 saved',
    badge: 'New Home',
    badgeColor: 'bg-emerald-600 text-white',
    duration: '6-8 hrs',
    rating: 4.9,
    reviewCount: 1892,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80',
  },
  {
    slug: 'annual-home-care',
    name: 'Annual Home Care',
    tagline: 'Complete annual care for a worry-free home.',
    includedServices: ['AC Service', 'RO Service', 'Electrical Service', 'Plumbing Service'],
    price: 2999,
    originalPrice: 3799,
    savings: '₹800 saved',
    badge: 'All Inclusive',
    badgeColor: 'bg-amber-600 text-white',
    duration: 'Quarterly visits',
    rating: 4.9,
    reviewCount: 4230,
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=80',
  },
];

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-beige">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice">
            <circle cx="500" cy="-50" r="200" fill="white" />
            <circle cx="50" cy="350" r="150" fill="white" />
          </svg>
        </div>
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest">
            <Package className="w-3.5 h-3.5" />
            Home Care Packages
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 drop-shadow">
            Complete Home Care
          </h1>
          <p className="text-white/75 text-base sm:text-lg max-w-xl mx-auto">
            Convenient, curated service packages for complete home maintenance. Save more when you bundle.
          </p>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="w-5 h-5 text-gold" />
          <span className="font-bold text-primary text-lg">{PACKAGES_DATA.length} Packages Available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {PACKAGES_DATA.map((pkg) => (
            <div
              key={pkg.slug}
              className="bg-white rounded-3xl overflow-hidden border border-gold/20 shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-gold/40 transition-all duration-300 group"
            >
              {/* Image */}
              <Link href={`/packages/${pkg.slug}`} className="relative block h-52 bg-slate-100 overflow-hidden flex-shrink-0">
                <img
                  src={pkg.imageUrl}
                  alt={pkg.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${pkg.badgeColor} shadow`}>
                  {pkg.badge}
                </span>
                <span className="absolute top-3 right-3 text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full shadow">
                  {pkg.savings}
                </span>
              </Link>

              {/* Body */}
              <div className="p-5 flex flex-col flex-1">
                <Link href={`/packages/${pkg.slug}`}>
                  <h2 className="font-serif text-base font-bold text-primary mb-1 hover:text-primary/80 transition-colors line-clamp-1">
                    {pkg.name}
                  </h2>
                </Link>
                <p className="text-xs text-foreground/55 line-clamp-2 mb-3">{pkg.tagline}</p>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-3 text-xs">
                  <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                  <span className="font-bold text-foreground/80">{pkg.rating}</span>
                  <span className="text-foreground/40">({pkg.reviewCount.toLocaleString()})</span>
                </div>

                {/* Service pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {pkg.includedServices.map((s, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-beige border border-gold/20 text-primary/80 px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1.5 mb-4 text-xs text-foreground/50">
                  <Clock className="w-3 h-3" />
                  <span>{pkg.duration}</span>
                </div>

                {/* Price & CTA */}
                <div className="pt-3 border-t border-gold/10 flex items-center justify-between gap-2 mt-auto">
                  <div>
                    <p className="text-[10px] text-foreground/40 uppercase tracking-wider font-semibold">Starting At</p>
                    <div className="flex items-end gap-1.5">
                      <span className="font-serif font-bold text-primary text-lg flex items-center gap-0.5">
                        <IndianRupee className="w-3.5 h-3.5" />{pkg.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-foreground/30 line-through mb-0.5">₹{pkg.originalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <Link
                    href={`/packages/${pkg.slug}`}
                    className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/95 active:scale-95 transition-all shadow-sm flex-shrink-0 flex items-center gap-1.5"
                  >
                    View
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-white rounded-3xl p-8 border border-gold/15 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-primary mb-2">Need Something Custom?</h2>
          <p className="text-sm text-foreground/55 mb-5 max-w-md mx-auto">
            Browse individual services and create your own combination tailored to your home's needs.
          </p>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-3.5 rounded-full hover:bg-primary/90 transition-colors shadow-md text-sm"
          >
            Browse All Services
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
