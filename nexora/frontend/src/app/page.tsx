"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star, ShieldCheck, Clock, Shield, IndianRupee, Tag,
  Sparkles as SparkleIcon, ArrowRight, CheckCircle2,
  Brush, Sparkles, Flower2, Scissors, User, Wind, Broom, Wrench,
  Zap, MapPin, ThumbsUp, BadgeCheck, ChevronLeft, ChevronRight,
  Smartphone, Wallet, Users, MessageSquareQuote, Award,
  CalendarCheck, UserCheck, Heart
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { useLocation } from '@/lib/location';

// ─── Category data (static for icons) ────────────────────────────────────────
const CATEGORIES = [
  { name: "Salon for Women", icon: Brush, slug: "salon-women" },
  { name: "Salon for Men", icon: Scissors, slug: "salon-men" },
  { name: "AC & Appliance Repair", icon: Wind, slug: "ac-appliance" },
  { name: "Cleaning & Pest Control", icon: Broom, slug: "cleaning-pest" },
  { name: "Electrician & Plumbing", icon: Wrench, slug: "electrician-plumbing" },
  { name: "Carpentry", icon: Wrench, slug: "carpentry" },
  { name: "Home Painting", icon: Brush, slug: "home-painting" },
  { name: "Spa & Therapies", icon: Flower2, slug: "spa-therapies" },
  { name: "Packers & Movers", icon: Sparkles, slug: "packagers-movers" },
  { name: "Water Purifier Service", icon: Wrench, slug: "water-purifier" },
];

// ─── Why Choose Nexora features ───────────────────────────────────────────────
const WHY_FEATURES = [
  {
    icon: BadgeCheck,
    title: "Verified Professionals",
    desc: "Work with trusted, background-checked and KYC-verified service professionals.",
    color: "text-[#0F3D30]",
    bg: "bg-[#0F3D30]/8",
  },
  {
    icon: Wallet,
    title: "Transparent Pricing",
    desc: "Know the exact service price before confirming your booking. No hidden charges.",
    color: "text-[#C3AB84]",
    bg: "bg-[#C3AB84]/15",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    desc: "Make safe and reliable payments through Nexora's secured payment gateway.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Zap,
    title: "Quick & Reliable",
    desc: "Get professional services at your preferred time and location, every time.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

// ─── How it works steps ───────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    num: "01",
    icon: Sparkles,
    title: "Choose a Service",
    desc: "Select from our wide range of professional home and beauty services.",
  },
  {
    num: "02",
    icon: MapPin,
    title: "Select Time & Location",
    desc: "Choose your preferred address, date and an available time slot.",
  },
  {
    num: "03",
    icon: UserCheck,
    title: "Professional Assigned",
    desc: "Our engine finds the best eligible professional based on capability, availability and location.",
  },
  {
    num: "04",
    icon: CheckCircle2,
    title: "Service Completed",
    desc: "Your professional arrives, completes the service and you confirm with OTP verification.",
  },
];

// ─── Static fallback reviews ───────────────────────────────────────────────────
const STATIC_REVIEWS = [
  {
    name: "Rohan Mehta",
    rating: 5,
    text: "Fantastic AC service! The auto-assigned partner was professional, arrived on schedule and verified using the OTP system. Very secure experience.",
    service: "AC Repair",
    date: "Aug 2026",
    avatar: "RM",
  },
  {
    name: "Priya Sharma",
    rating: 5,
    text: "Booked a women's salon appointment. The professional was excellent and highly skilled. The before-after photos uploaded kept everything transparent.",
    service: "Salon for Women",
    date: "Jul 2026",
    avatar: "PS",
  },
  {
    name: "Kunal Kapoor",
    rating: 4,
    text: "Easy to book and transparent pricing made the experience super smooth. Professional booking history tracking was a nice touch.",
    service: "Deep Cleaning",
    date: "Jul 2026",
    avatar: "KK",
  },
];

// Reusable ServiceCard component matching Step 2 criteria
export function ServiceCard({
  service,
  wishlist = [],
  onToggleWishlist
}: {
  service: any;
  wishlist?: string[];
  onToggleWishlist?: (id: string, name: string) => void;
}) {
  const isFav = wishlist.includes(service._id);

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gold/20 shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-gold/45 transition-all duration-300 group h-full">
      {/* Image Area */}
      <div className="relative block h-28 sm:h-48 bg-slate-100 overflow-hidden flex-shrink-0">
        <Link href={`/services/${service.slug || service._id}`} className="block w-full h-full">
          <img
            src={service.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80'}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />

        {/* Wishlist Icon */}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(service._id, service.name);
            }}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-sm border border-gold/20 flex items-center justify-center shadow hover:bg-white hover:scale-105 active:scale-95 transition-all z-20"
            title={isFav ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-foreground/45'}`} />
          </button>
        )}
      </div>

      {/* Body Content */}
      <div className="p-3 sm:p-6 flex flex-col flex-1">
        {/* Rating row */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-1 sm:mb-2.5">
          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
          <span className="text-[10px] sm:text-xs font-bold text-primary">{(service.rating || 4.7).toFixed(1)}</span>
          <span className="text-[9px] sm:text-xs text-foreground/45">({(service.reviewCount || 100) >= 1000 ? `${((service.reviewCount || 100) / 1000).toFixed(1)}K` : (service.reviewCount || 100)}+)</span>
        </div>

        {/* Name & Short description */}
        <Link href={`/services/${service.slug || service._id}`}>
          <h3 className="font-serif text-[11px] sm:text-base font-bold text-primary mb-1 sm:mb-1.5 line-clamp-1 hover:text-primary/80 transition-colors h-4 sm:h-6">
            {service.name}
          </h3>
        </Link>
        <p className="hidden sm:block text-xs text-foreground/55 line-clamp-2 flex-1 mb-4 h-8">
          {service.description || 'Professional, verified home service.'}
        </p>

        {/* Price & Book Now button */}
        <div className="pt-2 sm:pt-4 border-t border-gold/10 flex items-center justify-between gap-1.5 mt-auto">
          <div>
            <p className="text-[7px] sm:text-[10px] text-foreground/45 uppercase tracking-wider font-semibold">Starting At</p>
            <span className="font-serif font-bold text-primary text-xs sm:text-lg flex items-center gap-0.5">
              <IndianRupee className="w-3 sm:w-3.5 h-3 sm:h-3.5" />{service.basePrice}
            </span>
          </div>
          <Link
            href={`/services/${service.slug || service._id}`}
            className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-primary text-white text-[9px] sm:text-xs font-bold rounded-full hover:bg-primary/95 active:scale-95 transition-all shadow-sm"
          >
            Book
          </Link>
        </div>
      </div>
    </div>
  );
}

// Reusable DealCard component matching Step 3 criteria
function DealCard({
  deal,
  wishlist = [],
  onToggleWishlist
}: {
  deal: any;
  wishlist?: string[];
  onToggleWishlist?: (id: string, name: string) => void;
}) {
  const targetId = deal._id;
  const isFav = wishlist.includes(targetId);

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gold/20 shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-gold/45 transition-all duration-300 group h-full">
      {/* Image & Discount Badge */}
      <div className="relative block h-28 sm:h-48 bg-slate-100 overflow-hidden flex-shrink-0">
        <Link href={deal.checkoutUrl ? `/deals/${deal.slug}` : `/services/${deal.slug}`} className="block w-full h-full">
          <img
            src={deal.imageUrl}
            alt={deal.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-500 text-white text-[9px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow pointer-events-none">
          {deal.discount}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />

        {/* Wishlist Icon */}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(targetId, deal.name);
            }}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-sm border border-gold/20 flex items-center justify-center shadow hover:bg-white hover:scale-105 active:scale-95 transition-all z-20"
            title={isFav ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-foreground/45'}`} />
          </button>
        )}
      </div>

      {/* Body Content */}
      <div className="p-3 sm:p-6 flex flex-col flex-1">
        {/* Rating row */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-1 sm:mb-2.5">
          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
          <span className="text-[10px] sm:text-xs font-bold text-primary">{deal.rating.toFixed(1)}</span>
          <span className="text-[9px] sm:text-xs text-foreground/45">({deal.reviewCount >= 1000 ? `${(deal.reviewCount / 1000).toFixed(1)}K` : deal.reviewCount}+)</span>
        </div>

        {/* Name & Short description */}
        <Link href={deal.checkoutUrl ? `/deals/${deal.slug}` : `/services/${deal.slug}`}>
          <h3 className="font-serif text-[11px] sm:text-base font-bold text-primary mb-1 sm:mb-1.5 line-clamp-1 hover:text-primary/80 transition-colors h-4 sm:h-6">
            {deal.name}
          </h3>
        </Link>
        <p className="hidden sm:block text-xs text-foreground/55 line-clamp-2 flex-1 mb-4 h-8">
          {deal.description}
        </p>

        {/* Price & Book Now button */}
        <div className="pt-2 sm:pt-4 border-t border-gold/10 flex items-center justify-between gap-1.5 mt-auto">
          <div>
            <p className="text-[7px] sm:text-[10px] text-foreground/45 uppercase tracking-wider font-semibold">Offer Price</p>
            <div className="flex flex-wrap items-baseline gap-0.5 sm:gap-1.5">
              <span className="font-serif font-bold text-primary text-xs sm:text-lg flex items-center gap-0.5">
                <IndianRupee className="w-3 sm:w-3.5 h-3 sm:h-3.5" />{deal.offerPrice}
              </span>
              <span className="text-[8px] sm:text-xs text-foreground/45 line-through flex items-center gap-0.5">
                <IndianRupee className="w-2.5 sm:w-3 h-2.5 sm:h-3" />{deal.originalPrice}
              </span>
            </div>
          </div>
          <Link
            href={deal.checkoutUrl || `/services/${deal.slug}`}
            className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-primary text-white text-[9px] sm:text-xs font-bold rounded-full hover:bg-primary/95 active:scale-95 transition-all shadow-sm"
          >
            Book
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Packages Data (structured, ready for MongoDB/API integration) ─────────────
const PACKAGES_DATA = [
  {
    id: 'basic-home-care',
    slug: 'basic-home-care',
    name: 'Basic Home Care',
    description: 'Essential maintenance package for your home covering cleaning, electrical and plumbing needs.',
    shortDesc: 'Your everyday home maintenance essentials.',
    includedServices: ['Cleaning', 'Electrician', 'Plumbing'],
    price: 699,
    savings: '₹150 saved',
    badge: 'Popular',
    badgeColor: 'bg-primary text-white',
    duration: '3-4 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=80',
    benefits: [
      'Includes professional home cleaning',
      'Electrician fault diagnosis visit',
      'Plumbing tap and pipe leak check',
      'Verified & background-checked professionals',
    ],
    terms: 'Service must be used within 30 days of booking. Professional will arrive within the selected time slot.',
  },
  {
    id: 'deep-home-care',
    slug: 'deep-home-care',
    name: 'Deep Home Care',
    description: 'Comprehensive deep cleaning package for bathroom, kitchen and sofa — leaving your home spotless.',
    shortDesc: 'Deep-clean your entire home in one booking.',
    includedServices: ['Bathroom Cleaning', 'Kitchen Cleaning', 'Sofa Cleaning'],
    price: 1299,
    savings: '₹250 saved',
    badge: 'Best Value',
    badgeColor: 'bg-gold text-primary',
    duration: '5-6 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=80',
    benefits: [
      'Acid wash bathroom tile and closet scrub',
      'Kitchen hob, counters and exhaust degreasing',
      'Sofa extraction wet and dry foam cleaning',
      'All chemicals and equipment included',
    ],
    terms: 'Minimum 2 BHK required for this package. All cleaning agents are eco-friendly and non-toxic.',
  },
  {
    id: 'move-in-care',
    slug: 'move-in-care',
    name: 'Move-In Care',
    description: 'Get your new home fresh and pest-free before moving in with a full home clean and pest treatment.',
    shortDesc: 'Move into a clean, sanitized, pest-free home.',
    includedServices: ['Full Home Cleaning', 'Pest Control'],
    price: 1999,
    savings: '₹400 saved',
    badge: 'New Home',
    badgeColor: 'bg-emerald-600 text-white',
    duration: '6-8 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80',
    benefits: [
      'Full floor-to-ceiling home cleaning',
      'Herbal gel cockroach and pest treatment',
      'Post-construction dust and residue removal',
      'Safe for children and pets after 2 hours',
    ],
    terms: 'Recommended for new homes or homes left unoccupied for 3+ months. Pest control is a single treatment.',
  },
  {
    id: 'annual-home-care',
    slug: 'annual-home-care',
    name: 'Annual Home Care',
    description: 'Year-round home maintenance with quarterly AC, RO, electrical and plumbing service visits.',
    shortDesc: 'Complete annual care for a worry-free home.',
    includedServices: ['AC Service', 'RO Service', 'Electrical Service', 'Plumbing Service'],
    price: 2999,
    savings: '₹800 saved',
    badge: 'All Inclusive',
    badgeColor: 'bg-amber-600 text-white',
    duration: 'Quarterly visits',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=80',
    benefits: [
      '4 quarterly visit slots per service type',
      'Priority partner assignment with no wait',
      'AC filter wash and gas pressure check',
      'RO membrane and filter replacement included',
      'Dedicated relationship manager for all issues',
    ],
    terms: 'Annual plan valid for 12 months from activation. Transfers to new address within same city.',
  },
];

// Reusable PackageCard component for Step 5
function PackageCard({ pkg }: { pkg: any }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gold/20 shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-gold/40 transition-all duration-300 group">
      {/* Image */}
      <Link href={`/packages/${pkg.slug}`} className="relative block h-48 bg-slate-100 overflow-hidden flex-shrink-0">
        <img
          src={pkg.imageUrl}
          alt={pkg.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        {/* Badge */}
        <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${pkg.badgeColor} shadow`}>
          {pkg.badge}
        </span>
        {/* Savings tag */}
        {pkg.savings && (
          <span className="absolute top-3 right-3 text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full shadow">
            {pkg.savings}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <Link href={`/packages/${pkg.slug}`}>
          <h3 className="font-serif text-base font-bold text-primary mb-1 line-clamp-1 hover:text-primary/80 transition-colors">
            {pkg.name}
          </h3>
        </Link>
        <p className="text-xs text-foreground/55 line-clamp-2 mb-3">{pkg.shortDesc}</p>

        {/* Included services pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {pkg.includedServices.map((s: any, i: number) => (
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
            <p className="text-[10px] text-foreground/45 uppercase tracking-wider font-semibold">Starting At</p>
            <span className="font-serif font-bold text-primary text-lg flex items-center gap-0.5">
              <IndianRupee className="w-3.5 h-3.5" />{pkg.price.toLocaleString('en-IN')}
            </span>
          </div>
          <Link
            href={`/packages/${pkg.slug}`}
            className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/95 active:scale-95 transition-all shadow-sm flex-shrink-0"
          >
            View Package
          </Link>
        </div>
      </div>
    </div>
  );
}

// Reusable CategoryServiceSection component matching Step 4 criteria
function CategoryServiceSection({
  title,
  desc,
  link,
  services,
  wishlist = [],
  onToggleWishlist
}: {
  title: string;
  desc: string;
  link: string;
  services: any[];
  wishlist?: string[];
  onToggleWishlist?: (id: string, name: string) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const slide = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmt = direction === 'left' ? -350 : 350;
      rowRef.current.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (rowRef.current) {
      setCanScrollLeft(rowRef.current.scrollLeft > 0);
    }
  };

  return (
    <div className="py-6 border-b border-gold/10 last:border-0 relative group">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-primary">{title}</h3>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1">{desc}</p>
        </div>

        {/* Right side navigation link */}
        <div className="flex items-center gap-2">
          <Link
            href={link}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-all flex-shrink-0"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Slider view container with centered absolute overlay arrow buttons */}
      <div className="relative px-2">
        {/* Left arrow — only visible after scrolling */}
        {canScrollLeft && services && services.length >= 4 && (
          <button
            onClick={() => slide('left')}
            className="absolute left-[-5px] sm:left-[-20px] top-[96px] -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-gold/30 rounded-full hover:bg-beige text-primary transition-all shadow-md group-hover:scale-105"
            aria-label="Slide Left"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {services && services.length >= 4 && (
          <button
            onClick={() => slide('right')}
            className="absolute right-[-5px] sm:right-[-20px] top-[96px] -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-gold/30 rounded-full hover:bg-beige text-primary transition-all shadow-md group-hover:scale-105"
            aria-label="Slide Right"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-4 pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
        >
          {services.slice(0, 8).map((service, idx) => (
            <div
              key={`${service.slug}-${idx}`}
              className="w-[calc(50%-8px)] sm:w-[calc(33.33%-11px)] lg:w-[calc(25%-12px)] flex-shrink-0 snap-start"
            >
              <ServiceCard
                service={service}
                wishlist={wishlist}
                onToggleWishlist={onToggleWishlist}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 10 categories mapping services data for Step 4
const CATEGORIES_SERVICES_MAP = [
  {
    title: 'Salon for Women',
    desc: 'Professional beauty, grooming, hair and makeup services by top artists at home.',
    link: '/services?category=Salon%20for%20Women',
    services: [
      { name: "Women's Haircut", slug: 'womens-haircut', description: 'Style haircut, trim, and blow-dry by top stylists.', basePrice: 299, rating: 4.8, reviewCount: 1800, categoryId: { name: 'Salon for Women' }, imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=500&q=80' },
      { name: 'Hair Spa', slug: 'hair-spa', description: 'Deep nourishing scalp massage and hair cream mask.', basePrice: 699, rating: 4.7, reviewCount: 198, categoryId: { name: 'Salon for Women' }, imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80' },
      { name: 'Hair Coloring', slug: 'hair-colour-highlights', description: 'Global hair color and touch up services at home.', basePrice: 1999, rating: 4.7, reviewCount: 145, categoryId: { name: 'Salon for Women' }, imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430f33?auto=format&fit=crop&w=500&q=80' },
      { name: 'Facial', slug: 'facial-women', description: 'Hydrating clean-up facial for absolute skin glow.', basePrice: 599, rating: 4.8, reviewCount: 389, categoryId: { name: 'Salon for Women' }, imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=500&q=80' },
      { name: 'Cleanup', slug: 'cleanup-men', description: 'Exfoliating scrubbing mask for absolute skin shine.', basePrice: 299, rating: 4.7, reviewCount: 234, categoryId: { name: 'Salon for Women' }, imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=500&q=80' },
      { name: 'Manicure', slug: 'manicure', description: 'Relaxing hand massage, nail scrub and polish.', basePrice: 299, rating: 4.8, reviewCount: 267, categoryId: { name: 'Salon for Women' }, imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=500&q=80' }
    ]
  },
  {
    title: 'Salon for Men',
    desc: 'Expert barbers for cuts, clean shaves, beard trimming and skin grooming.',
    link: '/services?category=Salon%20for%20Men',
    services: [
      { name: "Men's Haircut", slug: 'haircut-men', description: 'Classic haircut, trim, and professional hair style finish.', basePrice: 249, rating: 4.8, reviewCount: 434, categoryId: { name: 'Salon for Men' }, imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=500&q=80' },
      { name: 'Beard Styling', slug: 'beard-grooming', description: 'Precise beard line trim, shaving and styling.', basePrice: 199, rating: 4.7, reviewCount: 312, categoryId: { name: 'Salon for Men' }, imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=500&q=80' },
      { name: 'Shaving', slug: 'beard-grooming', description: 'Smooth hot towel lather shave and skin moisturiser.', basePrice: 149, rating: 4.7, reviewCount: 280, categoryId: { name: 'Salon for Men' }, imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=500&q=80' },
      { name: 'Hair Coloring', slug: 'hair-colour-men', description: 'Grey coverage organic hair dye touch up at home.', basePrice: 599, rating: 4.5, reviewCount: 143, categoryId: { name: 'Salon for Men' }, imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430f33?auto=format&fit=crop&w=500&q=80' },
      { name: 'Facial', slug: 'facial-men', description: 'Exfoliating charcoal anti-pollution facial massage.', basePrice: 499, rating: 4.6, reviewCount: 189, categoryId: { name: 'Salon for Men' }, imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=500&q=80' },
      { name: 'Head Massage', slug: 'head-scalp-massage', description: 'Stress releasing hot oil head massage therapy.', basePrice: 399, rating: 4.8, reviewCount: 234, categoryId: { name: 'Salon for Men' }, imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=500&q=80' }
    ]
  },
  {
    title: 'AC & Appliance Repair',
    desc: 'Fast repair and service for your air conditioner, fridge, and other appliances.',
    link: '/services?category=AC%20%26%20Appliance%20Repair',
    services: [
      { name: 'AC Service', slug: 'ac-service', description: 'Comprehensive split/window air conditioner service filter wash.', basePrice: 299, rating: 4.8, reviewCount: 2500, categoryId: { name: 'AC & Appliance Repair' }, imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80' },
      { name: 'AC Repair', slug: 'ac-repair', description: 'Diagnosis of gas leaks, compressor check and cooling repair.', basePrice: 499, rating: 4.8, reviewCount: 342, categoryId: { name: 'AC & Appliance Repair' }, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80' },
      { name: 'AC Installation', slug: 'ac-installation', description: 'Split/window AC mounting, piping and configuration.', basePrice: 799, rating: 4.7, reviewCount: 215, categoryId: { name: 'AC & Appliance Repair' }, imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80' },
      { name: 'AC Uninstallation', slug: 'ac-uninstallation', description: 'Safe compressor gas pump down and unit unmounting.', basePrice: 399, rating: 4.6, reviewCount: 110, categoryId: { name: 'AC & Appliance Repair' }, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80' },
      { name: 'Refrigerator Repair', slug: 'refrigerator-repair', description: 'Compressor, thermostat and single/double door repair.', basePrice: 449, rating: 4.5, reviewCount: 143, categoryId: { name: 'AC & Appliance Repair' }, imageUrl: 'https://images.unsplash.com/photo-1571175432291-3a5f577ec7af?auto=format&fit=crop&w=500&q=80' },
      { name: 'Washing Machine Repair', slug: 'washing-machine-repair', description: 'Front-load/top-load motor and drum repair servicing.', basePrice: 399, rating: 4.6, reviewCount: 167, categoryId: { name: 'AC & Appliance Repair' }, imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80' }
    ]
  },
  {
    title: 'Cleaning & Pest Control',
    desc: 'Deep home cleanup, sofa extraction washing and eco-friendly pest control.',
    link: '/services?category=Cleaning%20%26%20Pest%20Control',
    services: [
      { name: 'Bathroom Cleaning', slug: 'bathroom-cleaning', description: 'Acid wash scrub of wall tiles, bathroom sinks and closets.', basePrice: 399, rating: 4.9, reviewCount: 3000, categoryId: { name: 'Cleaning & Pest Control' }, imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80' },
      { name: 'Kitchen Cleaning', slug: 'kitchen-deep-cleaning', description: 'Degreasing of hob, counters, ceiling fans and exhaust.', basePrice: 599, rating: 4.7, reviewCount: 234, categoryId: { name: 'Cleaning & Pest Control' }, imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=500&q=80' },
      { name: 'Full Home Cleaning', slug: 'deep-home-cleaning', description: 'Dusting, vacuuming, kitchen scrubbing and floor sanitisation.', basePrice: 799, rating: 4.9, reviewCount: 412, categoryId: { name: 'Cleaning & Pest Control' }, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80' },
      { name: 'Sofa Cleaning', slug: 'sofa-cleaning', description: 'Deep extraction shampoo washing for fabric or leather sofa.', basePrice: 499, rating: 4.8, reviewCount: 850, categoryId: { name: 'Cleaning & Pest Control' }, imageUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=500&q=80' },
      { name: 'Carpet Cleaning', slug: 'carpet-cleaning', description: 'Vacuum scrubbing wash of home rugs and carpets.', basePrice: 699, rating: 4.7, reviewCount: 156, categoryId: { name: 'Cleaning & Pest Control' }, imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=500&q=80' },
      { name: 'Pest Control', slug: 'pest-control', description: 'Herbal gel treatment for cockroaches and target bugs.', basePrice: 999, rating: 4.5, reviewCount: 143, categoryId: { name: 'Cleaning & Pest Control' }, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80' }
    ]
  },
  {
    title: 'Electrician & Plumbing',
    desc: 'Certified repair professionals for switch replacements, tap fixes and piping leaks.',
    link: '/services?category=Electrician%20%26%20Plumbing',
    services: [
      { name: 'Electrician Visit', slug: 'electrician-visit', description: 'Standard visit for checking switch, socket or MCB wiring faults.', basePrice: 99, rating: 4.7, reviewCount: 2000, categoryId: { name: 'Electrician & Plumbing' }, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80' },
      { name: 'Switch & Socket Repair', slug: 'switch-socket-repair', description: 'Faulty switch, board regulator and socket replacement.', basePrice: 199, rating: 4.7, reviewCount: 265, categoryId: { name: 'Electrician & Plumbing' }, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80' },
      { name: 'Fan Repair', slug: 'fan-installation', description: 'Ceiling/exhaust fan copper winding repair or mounting.', basePrice: 299, rating: 4.8, reviewCount: 387, categoryId: { name: 'Electrician & Plumbing' }, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80' },
      { name: 'Light Installation', slug: 'light-installation', description: 'Mounting of fancy pendant lights, tube lights or spotlights.', basePrice: 249, rating: 4.8, reviewCount: 289, categoryId: { name: 'Electrician & Plumbing' }, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80' },
      { name: 'Tap Repair', slug: 'tap-repair', description: 'Fixing leaking kitchen or bathroom mixer taps.', basePrice: 199, rating: 4.7, reviewCount: 312, categoryId: { name: 'Electrician & Plumbing' }, imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=500&q=80' },
      { name: 'Pipe Leakage', slug: 'pipe-leakage-repair', description: 'Pressure test leak search and sealing repairs.', basePrice: 599, rating: 4.5, reviewCount: 134, categoryId: { name: 'Electrician & Plumbing' }, imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=500&q=80' }
    ]
  },
  {
    title: 'Carpentry',
    desc: 'Expert carpenters for furniture repairs, lock assemblies and cabinet shelf works.',
    link: '/services?category=Carpentry',
    services: [
      { name: 'Furniture Repair', slug: 'furniture-repair', description: 'Cabinet door hinges fix, table drawer repairs and alignments.', basePrice: 299, rating: 4.8, reviewCount: 950, categoryId: { name: 'Carpentry' }, imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=500&q=80' },
      { name: 'Door Repair', slug: 'door-repair', description: 'Wooden door shaving, latch fixing and alignments.', basePrice: 349, rating: 4.7, reviewCount: 780, categoryId: { name: 'Carpentry' }, imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=500&q=80' },
      { name: 'Lock Installation', slug: 'lock-installation', description: 'Door handle lock, padlocks or cupboard lock installations.', basePrice: 249, rating: 4.8, reviewCount: 650, categoryId: { name: 'Carpentry' }, imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=500&q=80' },
      { name: 'Curtain Installation', slug: 'curtain-installation', description: 'Wall bracket screw mounting and curtain rod assembly.', basePrice: 199, rating: 4.8, reviewCount: 520, categoryId: { name: 'Carpentry' }, imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=500&q=80' },
      { name: 'Furniture Assembly', slug: 'furniture-assembly', description: 'Bed, wardrobe or study table layout installation.', basePrice: 599, rating: 4.9, reviewCount: 430, categoryId: { name: 'Carpentry' }, imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=500&q=80' },
      { name: 'Cupboard Repair', slug: 'cupboard-repair', description: 'Cupboard slide channel and door lock adjustments.', basePrice: 399, rating: 4.7, reviewCount: 290, categoryId: { name: 'Carpentry' }, imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=500&q=80' }
    ]
  },
  {
    title: 'Home Painting',
    desc: 'Add vibrancy to your home walls with texture coats, primers and waterproofing.',
    link: '/services?category=Home%20Painting',
    services: [
      { name: '1 BHK Painting', slug: '1-bhk-painting', description: 'Complete interior walls and ceiling repaint.', basePrice: 7999, rating: 4.9, reviewCount: 210, categoryId: { name: 'Home Painting' }, imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80' },
      { name: '2 BHK Painting', slug: '2-bhk-painting', description: 'Complete interior walls and ceiling repaint for 2 BHK flats.', basePrice: 11999, rating: 4.9, reviewCount: 180, categoryId: { name: 'Home Painting' }, imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80' },
      { name: '3 BHK Painting', slug: '3-bhk-painting', description: 'Complete interior wall coats and ceiling repainting.', basePrice: 15999, rating: 4.8, reviewCount: 120, categoryId: { name: 'Home Painting' }, imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80' },
      { name: 'Wall Painting', slug: 'wall-painting', description: 'Single accent wall emulsion coat paints application.', basePrice: 999, rating: 4.7, reviewCount: 340, categoryId: { name: 'Home Painting' }, imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80' },
      { name: 'Ceiling Painting', slug: 'ceiling-painting', description: 'White protective ceiling oil-bound distemper repaint.', basePrice: 1499, rating: 4.7, reviewCount: 160, categoryId: { name: 'Home Painting' }, imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80' },
      { name: 'Texture Painting', slug: 'texture-painting', description: 'Decorative accent wall texture designs painting.', basePrice: 2499, rating: 4.8, reviewCount: 95, categoryId: { name: 'Home Painting' }, imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80' }
    ]
  },
  {
    title: 'Spa & Therapies',
    desc: 'Relieve stress with deep tissue Swedish massages and home oil therapies.',
    link: '/services?category=Spa%20%26%20Therapies',
    services: [
      { name: 'Full Body Massage', slug: 'full-body-massage-women', description: 'Aromatic oils full body Swedish massage therapy.', basePrice: 1299, rating: 4.9, reviewCount: 312, categoryId: { name: 'Spa & Therapies' }, imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=500&q=80' },
      { name: 'Head Massage', slug: 'head-scalp-massage', description: 'Stress-releasing ayurvedic head scalp oil massage.', basePrice: 399, rating: 4.8, reviewCount: 234, categoryId: { name: 'Spa & Therapies' }, imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=500&q=80' },
      { name: 'Foot Massage', slug: 'pedicure', description: 'Nerve relaxing warm water foot massage scrub.', basePrice: 349, rating: 4.7, reviewCount: 198, categoryId: { name: 'Spa & Therapies' }, imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&q=80' },
      { name: 'Relaxation Massage', slug: 'full-body-massage-men', description: 'Therapeutic muscle pain relief oil body massage.', basePrice: 999, rating: 4.8, reviewCount: 290, categoryId: { name: 'Spa & Therapies' }, imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=500&q=80' },
      { name: 'Couples Spa', slug: 'full-body-massage-women', description: 'Simultaneous deep relaxation full body massage spa.', basePrice: 2499, rating: 4.9, reviewCount: 85, categoryId: { name: 'Spa & Therapies' }, imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&q=80' },
      { name: 'Spa at Home', slug: 'full-body-massage-men', description: 'Certified home therapy with massage tables and oils.', basePrice: 1499, rating: 4.8, reviewCount: 160, categoryId: { name: 'Spa & Therapies' }, imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=500&q=80' }
    ]
  },
  {
    title: 'Packers & Movers',
    desc: 'Local shifting, luggage loading/unloading and vehicle moving logistics.',
    link: '/services?category=Packers%20%26%20Movers',
    services: [
      { name: 'Local Shifting', slug: 'local-shifting', description: 'Same-city home goods loading and truck packing.', basePrice: 2999, rating: 4.8, reviewCount: 620, categoryId: { name: 'Packers & Movers' }, imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80' },
      { name: 'Home Shifting', slug: 'home-shifting', description: 'Domestic inter-city household loading and transport.', basePrice: 8999, rating: 4.7, reviewCount: 450, categoryId: { name: 'Packers & Movers' }, imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80' },
      { name: 'Office Shifting', slug: 'office-shifting', description: 'Safe transportation of server racks, chairs and desks.', basePrice: 9999, rating: 4.8, reviewCount: 180, categoryId: { name: 'Packers & Movers' }, imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80' },
      { name: 'Packing Service', slug: 'packing-service', description: 'Bubble wrapping of fragile glassware and electronic items.', basePrice: 999, rating: 4.7, reviewCount: 310, categoryId: { name: 'Packers & Movers' }, imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80' },
      { name: 'Loading & Unloading', slug: 'loading-unloading', description: 'Expert heavy carton and furniture lifting handlers.', basePrice: 1499, rating: 4.8, reviewCount: 220, categoryId: { name: 'Packers & Movers' }, imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80' },
      { name: 'Vehicle Transportation', slug: 'vehicle-transportation', description: 'Two-wheeler and four-wheeler container moving.', basePrice: 4999, rating: 4.6, reviewCount: 130, categoryId: { name: 'Packers & Movers' }, imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80' }
    ]
  },
  {
    title: 'Water Purifier Service',
    desc: 'RO system servicing, filters replacement and clean drinking water check.',
    link: '/services?category=Water%20Purifier%20Service',
    services: [
      { name: 'RO Service', slug: 'ro-service', description: 'Water filter check and chemical servicing.', basePrice: 299, rating: 4.7, reviewCount: 650, categoryId: { name: 'Water Purifier Service' }, imageUrl: 'https://images.unsplash.com/photo-1585832770485-e68a5dbfad52?auto=format&fit=crop&w=500&q=80' },
      { name: 'RO Repair', slug: 'ro-repair', description: 'SMPS adapter, booster pump and auto cut-off fix.', basePrice: 499, rating: 4.6, reviewCount: 310, categoryId: { name: 'Water Purifier Service' }, imageUrl: 'https://images.unsplash.com/photo-1585832770485-e68a5dbfad52?auto=format&fit=crop&w=500&q=80' },
      { name: 'Filter Replacement', slug: 'filter-replacement', description: 'Sediment carbon filter and membrane kit replacement.', basePrice: 1299, rating: 4.8, reviewCount: 420, categoryId: { name: 'Water Purifier Service' }, imageUrl: 'https://images.unsplash.com/photo-1585832770485-e68a5dbfad52?auto=format&fit=crop&w=500&q=80' },
      { name: 'RO Installation', slug: 'ro-installation', description: 'Wall mounting purifier unit, pipe connection setup.', basePrice: 599, rating: 4.7, reviewCount: 210, categoryId: { name: 'Water Purifier Service' }, imageUrl: 'https://images.unsplash.com/photo-1585832770485-e68a5dbfad52?auto=format&fit=crop&w=500&q=80' },
      { name: 'RO Uninstallation', slug: 'ro-uninstallation', description: 'Purifier unmounting and safe pipeline decoupling.', basePrice: 299, rating: 4.5, reviewCount: 95, categoryId: { name: 'Water Purifier Service' }, imageUrl: 'https://images.unsplash.com/photo-1585832770485-e68a5dbfad52?auto=format&fit=crop&w=500&q=80' },
      { name: 'Annual Maintenance', slug: 'ro-annual-maintenance', description: 'RO comprehensive service plan with priority support.', basePrice: 1899, rating: 4.8, reviewCount: 150, categoryId: { name: 'Water Purifier Service' }, imageUrl: 'https://images.unsplash.com/photo-1585832770485-e68a5dbfad52?auto=format&fit=crop&w=500&q=80' }
    ]
  }
];

export default function Home() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [approvedPartners, setApprovedPartners] = useState<any[]>([]);
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoText, setPromoText] = useState<string>('');
  const [promoBannerIdx, setPromoBannerIdx] = useState(0);
  const [mostBookedServices, setMostBookedServices] = useState<any[]>([]);

  // Dynamic MongoDB States
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [dbPackages, setDbPackages] = useState<any[]>([]);
  const [dbBanners, setDbBanners] = useState<any[]>([]);
  const [dbOffers, setDbOffers] = useState<any[]>([]);
  const [homepageDeals, setHomepageDeals] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [liveReviews, setLiveReviews] = useState<any[]>([]);
  const { user } = useAuth();
  const { selectedCity } = useLocation();

  const partnersScrollRef = useRef<HTMLDivElement>(null);
  const popScrollRef = useRef<HTMLDivElement>(null);
  const dealsScrollRef = useRef<HTMLDivElement>(null);

  const [popCanScrollLeft, setPopCanScrollLeft] = useState(false);
  const [dealsCanScrollLeft, setDealsCanScrollLeft] = useState(false);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPopularServices();
    fetchPromoSettings();
    fetchMostBooked();
    fetchDbCategories();
    fetchAllServices();
    fetchDbPackages();
    fetchDbBanners();
    fetchDbOffers();
    fetchHomepageDeals();
    fetchWishlist();
    fetchLiveReviews();
  }, [user]);

  const fetchLiveReviews = async () => {
    try {
      const { data } = await api.get('/public/reviews');
      if (data?.reviews) {
        setLiveReviews(data.reviews);
      }
    } catch { /* silent fallback */ }
  };

  const fetchWishlist = async () => {
    const local = localStorage.getItem('user_wishlist');
    if (local) {
      setWishlist(JSON.parse(local));
    }
    if (user) {
      try {
        const { data } = await api.get('/user/dashboard/wishlist');
        if (data?.wishlist) {
          const ids = data.wishlist.map((w: any) => w._id || w);
          setWishlist(ids);
          localStorage.setItem('user_wishlist', JSON.stringify(ids));
        }
      } catch { /* silent fallback */ }
    }
  };

  const toggleWishlist = async (id: string, serviceName: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexora_token') : '';
    
    if (!token || !user) {
      toast.error('Please login to save services to your wishlist.');
      window.location.href = '/login';
      return;
    }

    let updated = [...wishlist];
    const isAdded = !updated.includes(id);
    if (!isAdded) {
      updated = updated.filter(x => x !== id);
    } else {
      updated.push(id);
    }
    setWishlist(updated);
    localStorage.setItem('user_wishlist', JSON.stringify(updated));

    try {
      await api.post('/user/dashboard/wishlist/toggle', { serviceId: id });
      toast.success(isAdded ? `${serviceName} added to wishlist` : `${serviceName} removed from wishlist`);
    } catch (err: any) {
      // Revert UI on failure
      const reverted = isAdded ? wishlist.filter(x => x !== id) : [...wishlist, id];
      setWishlist(reverted);
      localStorage.setItem('user_wishlist', JSON.stringify(reverted));
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('nexora_token');
        localStorage.removeItem('nexora_role');
        localStorage.removeItem('nexora_user');
        window.location.href = '/login';
      } else if (status === 403) {
        toast.error('Only customer accounts can save to wishlist.');
      } else {
        toast.error(msg || 'Failed to update wishlist.');
      }
    }
  };


  const fetchHomepageDeals = async () => {
    try {
      const { data } = await api.get('/public/deals?limit=6');
      if (data?.success && Array.isArray(data.deals)) {
        setHomepageDeals(data.deals);
      }
    } catch (e) {
      console.error("Failed to fetch homepage deals", e);
    }
  };

  const fetchMostBooked = async () => {
    try {
      const { data } = await api.get('/public/services/most-booked?limit=6');
      if (data.success && data.services?.length > 0) {
        setMostBookedServices(data.services);
      }
    } catch (e) { /* falls back to static data */ }
  };

  const fetchDbCategories = async () => {
    try {
      const { data } = await api.get('/public/categories');
      if (Array.isArray(data)) {
        setDbCategories(data);
      }
    } catch (e) {
      console.error("Failed to fetch categories", e);
    }
  };

  const fetchAllServices = async () => {
    try {
      const { data } = await api.get('/public/services?limit=100');
      if (Array.isArray(data)) {
        setAllServices(data);
      }
    } catch (e) {
      console.error("Failed to fetch all services", e);
    }
  };

  const fetchDbPackages = async () => {
    try {
      const { data } = await api.get('/public/packages');
      if (data?.success && Array.isArray(data.packages)) {
        setDbPackages(data.packages);
      }
    } catch (e) {
      console.error("Failed to fetch packages", e);
    }
  };

  const fetchDbBanners = async () => {
    try {
      const { data } = await api.get('/public/banners');
      if (data?.success && Array.isArray(data.banners)) {
        setDbBanners(data.banners);
      } else if (Array.isArray(data)) {
        setDbBanners(data);
      }
    } catch (e) {
      console.error("Failed to fetch banners", e);
    }
  };

  const fetchDbOffers = async () => {
    try {
      const { data } = await api.get('/public/offers');
      if (data?.success && Array.isArray(data.offers)) {
        setDbOffers(data.offers);
      }
    } catch (e) {
      console.error("Failed to fetch offers", e);
    }
  };

  const fetchPopularServices = async () => {
    try {
      const { data } = await api.get('/public/services?isPopular=true');
      if (Array.isArray(data) && data.length > 0) {
        setPopularServices(data);
      } else {
        setPopularServices([]);
      }
    } catch (e) {
      setPopularServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchPromoSettings = async () => {
    try {
      const { data } = await api.get('/public/settings');
      if (data.success && data.promoCode) {
        setPromoCode(data.promoCode);
        setPromoText(data.promoText);
      }
    } catch (e) { /* silent */ }
  };

  const fetchApprovedPartners = async (city: string) => {
    setPartnersLoading(true);
    try {
      const url = city ? `/public/partners?limit=6&city=${encodeURIComponent(city)}` : '/public/partners?limit=6';
      const { data } = await api.get(url);
      if (data.success) setApprovedPartners(data.partners);
    } catch (e) { /* silent */ } finally {
      setPartnersLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedPartners(selectedCity);
  }, [selectedCity]);

  // ── Promo banner data ──────────────────────────────────────────────────────
  const promoBanners = [];
  if (promoCode || promoText) {
    promoBanners.push({
      badge: "Limited Time Offer",
      heading: "Special Offer",
      sub: "Professional services at your doorstep. Use code at checkout.",
      code: promoCode || "OFFER10",
      codeLabel: promoText || "Special discount on your booking",
      cta: "Book Now",
      href: "/services",
      gradient: "from-[#0F3D30] to-[#1D6B50]",
    });
  }

  promoBanners.push({
    badge: "New User Offer",
    heading: "Refer & Earn with Nexora",
    sub: "Invite your friends. Both of you get exclusive discounts on your next booking.",
    code: "REFER50",
    codeLabel: "Share your referral code with friends",
    cta: "Learn More",
    href: "/services",
    gradient: "from-[#3D1F0F] to-[#7A3A1A]",
  });

  const scrollPartners = (dir: 'left' | 'right') => {
    if (!partnersScrollRef.current) return;
    partnersScrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  // ── Avatar colour map ──────────────────────────────────────────────────────
  const avatarColors = ["bg-primary", "bg-secondary", "bg-[#C3AB84]", "bg-emerald-600", "bg-violet-600", "bg-amber-600"];

  // Dynamic Mappings for MongoDB Integration
  const getCategoryIcon = (categorySlug: string) => {
    const matched = CATEGORIES.find(c => c.slug === categorySlug);
    if (matched) return matched.icon;
    return SparkleIcon;
  };

  const displayCategories = dbCategories.map(cat => ({
    name: cat.name,
    icon: getCategoryIcon(cat.slug),
    slug: cat.slug
  }));

  const carouselBannersList = dbBanners.filter((b: any) => b.position !== 'PROMO_CARD');
  const activePromoBanners = carouselBannersList.length > 0 ? carouselBannersList.map((b: any) => ({
    badge: b.badgeText || "Promotional Offer",
    heading: b.title,
    sub: b.subtitle,
    code: b.promoCode || "NEXORA",
    codeLabel: b.ctaText || "Click to redeem discount",
    cta: b.ctaText || "Book Now",
    href: b.ctaRoute || "/services",
    gradient: b.gradient || "from-[#0F3D30] to-[#1D6B50]"
  })) : promoBanners;

  const dbPromoCard = dbBanners.find((b: any) => b.position === 'PROMO_CARD');
  const promoCardData = dbPromoCard ? {
    badge: dbPromoCard.badgeText || "Nexora Premium",
    heading: dbPromoCard.title,
    sub: dbPromoCard.subtitle,
    code: dbPromoCard.promoCode || "NEXORA150",
    cta: dbPromoCard.ctaText || "Book Service",
    href: dbPromoCard.ctaRoute || "/services",
    gradient: dbPromoCard.gradient || "from-primary to-[#18483B]"
  } : null;

  const dbDeals = allServices
    .filter(s => s.discountPercentage > 0)
    .map(s => ({
      name: s.name,
      slug: s.slug,
      description: s.description,
      originalPrice: s.basePrice,
      offerPrice: Math.round(s.basePrice * (1 - s.discountPercentage / 100)),
      discount: `${s.discountPercentage}% OFF`,
      rating: s.rating || 4.8,
      reviewCount: s.reviewCount || 150,
      imageUrl: s.imageUrl
    }));

  const mappedOffers = dbOffers.map(o => {
    const firstService = o.applicableServices?.[0] || {};
    return {
      name: o.title,
      slug: firstService.slug || 'services',
      description: o.description || `Special discount on ${firstService.name || 'our services'}`,
      originalPrice: firstService.basePrice || 499,
      offerPrice: o.discountType === 'PERCENTAGE'
        ? Math.round((firstService.basePrice || 499) * (1 - o.discountValue / 100))
        : Math.max(0, (firstService.basePrice || 499) - o.discountValue),
      discount: o.discountType === 'PERCENTAGE' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`,
      rating: firstService.rating || 4.8,
      reviewCount: firstService.reviewCount || 100,
      imageUrl: firstService.imageUrl || 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=500&q=80'
    };
  });

  const displayDeals = homepageDeals.length > 0 ? homepageDeals.map(d => ({
    _id: d._id,
    serviceId: d.serviceId,
    packageId: d.packageId,
    dealType: d.dealType,
    name: d.title,
    slug: d.slug,
    description: d.description || (d.serviceId?.name || d.packageId?.name || 'Special Deal'),
    originalPrice: d.originalPrice,
    offerPrice: d.finalPrice,
    discount: d.discountType === 'PERCENTAGE' ? `${d.discountValue}% OFF` : `₹${d.discountValue} OFF`,
    rating: d.serviceId?.rating || d.packageId?.rating || 4.8,
    reviewCount: d.serviceId?.reviewCount || d.packageId?.reviewCount || 120,
    imageUrl: d.imageUrl || d.serviceId?.imageUrl || d.packageId?.imageUrl || 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=500&q=80',
    checkoutUrl: d.dealType === 'SERVICE'
      ? `/checkout?serviceId=${d.serviceId?._id || d.serviceId}`
      : `/checkout?packageId=${d.packageId?._id || d.packageId}`
  })) : [];

  const dynamicCategoryServicesMap = dbCategories.map(cat => {
    const matchedServices = allServices.filter(s => {
      const catId = s.categoryId?._id || s.categoryId;
      return catId?.toString() === cat._id.toString();
    });
    return {
      title: cat.name,
      desc: cat.description || `Professional ${cat.name.toLowerCase()} services at home.`,
      link: `/services?category=${encodeURIComponent(cat.name)}`,
      services: matchedServices.slice(0, 6)
    };
  }).filter(item => item.services.length > 0);
  const displayCategoryServicesMap = dynamicCategoryServicesMap;

  const displayPackages = dbPackages.length > 0 ? dbPackages.map(p => ({
    name: p.name,
    slug: p.slug,
    shortDesc: p.description || 'Exclusive premium home care package.',
    imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80',
    badge: (p.categoryIds || []).map((c: any) => c.name).join(', ') || 'Package',
    badgeColor: 'bg-primary/10 text-primary',
    savings: p.discountPercentage > 0 ? `${p.discountPercentage}% OFF` : '',
    includedServices: (p.includedServices || []).map((s: any) => s.name),
    duration: `${(p.includedServices || []).reduce((acc: number, curr: any) => acc + (curr.estimatedDurationMins || 45), 0)} mins total`,
    price: p.basePrice,
  })) : [];

  return (
    <div className="flex-1 w-full bg-cream overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════
          1.  HERO SECTION  (unchanged)
      ══════════════════════════════════════════════════════════ */}
      <section className="relative pt-10 pb-8 lg:pb-12 min-h-[55vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute top-1/2 left-0 w-1/2 h-[300px] -translate-y-1/2 pointer-events-none z-0 opacity-80">
          <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="w-full h-full text-beige fill-current">
            <path d="M0,100 C150,200 350,0 500,150 L0,500 Z" opacity="0.5" />
          </svg>
        </div>

        <div
          className="absolute inset-y-0 right-0 w-full lg:w-[60%] hidden lg:block z-0"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)'
          }}
        >
          <Image
            src="/images/hero-interior.png"
            alt="Premium modern luxury living room interior"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 60vw"
            className="object-cover object-center"
            priority
          />
        </div>

        <div className="container relative mx-auto px-4 sm:px-8 lg:px-12 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 z-10">
          <div className="flex-1 text-center lg:text-left max-w-2xl w-full">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[4.5rem] font-bold tracking-tight text-primary leading-[1.1]">
              Premium services, <br />
              <span className="relative inline-block mt-2">
                delivered to you.
                <svg className="absolute -bottom-4 left-0 w-full h-3 text-gold" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  <path d="M2 9.5C50.5 4.5 140 1 298 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-8 sm:mt-12 text-base sm:text-lg text-foreground max-w-xl mx-auto lg:mx-0">
              Expert professionals for every home and beauty need. Trusted by millions, designed for quality.
            </p>

            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <Link href="/services" className="rounded-full bg-primary px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-medium text-white hover:bg-primary/90 transition-all w-full sm:w-auto text-center">
                Book a Service
              </Link>
              <Link href="/partner/login" className="rounded-full bg-cream border border-gold px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-medium text-foreground hover:bg-beige transition-all w-full sm:w-auto text-center">
                Join as Partner
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm font-medium text-primary/80">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-gold text-gold" />
                <span>4.8/5 Avg Rating</span>
              </div>
              <div className="w-px h-4 bg-primary/20"></div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Verified Pros</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block flex-1 w-full"></div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2.  CATEGORIES SECTION  (unchanged)
      ══════════════════════════════════════════════════════════ */}
      {displayCategories.length > 0 && (
        <section className="relative w-full pb-20">
          <div className="absolute inset-0 z-0 flex flex-col">
            <svg className="w-full h-[150px] md:h-[200px] lg:h-[250px]" viewBox="0 0 1200 250" preserveAspectRatio="none">
              <path d="M-10,249 L200,249 C350,249 350,20 500,20 L700,20 C850,20 850,249 1000,249 L1210,249" fill="none" stroke="#C3AB84" strokeWidth="2" opacity="0.5" />
              <path d="M0,250 L200,250 C350,250 350,20 500,20 L700,20 C850,20 850,250 1000,250 L1200,250 L1200,260 L0,260 Z" className="fill-beige" />
            </svg>
            <div className="flex-1 bg-beige"></div>
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-[60px] md:pt-[90px] lg:pt-[110px] z-10">
            <div className="text-center mb-16 lg:mb-24">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-primary">What are you looking for?</h2>
              <p className="mt-4 text-base text-foreground/70">Select a category to find top-rated professionals.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto relative z-20">
              {displayCategories.map((cat, i) => (
                <Link
                  key={i}
                  href={`/services?category=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center justify-center rounded-2xl bg-cream py-7 sm:py-10 px-3 sm:px-4 shadow-sm ring-1 ring-gold/20 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center mb-3 sm:mb-4 text-secondary group-hover:text-primary transition-colors">
                    <cat.icon strokeWidth={1.2} className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-foreground text-center leading-snug">{cat.name}</h3>
                </Link>
              ))}
            </div>

            <div className="flex justify-center mt-12 relative z-20">
              <Link
                href="/services"
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary/95 transition-all shadow-md"
              >
                View All Categories <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          3.  POPULAR SERVICES
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-cream py-20 relative group/pop">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Heading */}
          <div className="flex justify-between items-end mb-12 gap-4">
            <div>
              <span className="text-xs font-bold text-gold uppercase tracking-wider bg-gold/10 px-3 py-1 rounded-full">Most Requested</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary mt-3">Popular Services</h2>
              <p className="text-sm sm:text-base text-foreground/60 mt-2 max-w-lg">Book our most requested professional services at your doorstep.</p>
            </div>
            <Link
              href="/services"
              className="flex items-center gap-2 text-sm font-semibold text-primary border border-primary/20 px-5 py-2.5 rounded-full hover:bg-primary hover:text-white transition-all flex-shrink-0"
            >
              View All Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Cards slider */}
          {servicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl h-72 animate-pulse border border-gold/15" />
              ))}
            </div>
          ) : popularServices.length === 0 ? (
            <div className="p-12 text-center text-foreground/40 bg-white rounded-3xl border border-gold/20">
              <SparkleIcon className="w-10 h-10 mx-auto mb-3 text-gold/40" />
              <p className="text-sm">No services found. Add services via the Admin panel.</p>
            </div>
          ) : (
            <div className="relative px-2">
              {/* Left arrow — only visible after scrolling */}
              {popCanScrollLeft && popularServices && popularServices.length >= 4 && (
                <button
                  onClick={() => {
                    if (popScrollRef.current) popScrollRef.current.scrollBy({ left: -350, behavior: 'smooth' });
                  }}
                  className="absolute left-[-5px] sm:left-[-20px] top-[96px] -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-gold/30 rounded-full hover:bg-beige text-primary transition-all shadow-md group-hover/pop:scale-105"
                  aria-label="Slide Left"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {popularServices && popularServices.length >= 4 && (
                <button
                  onClick={() => {
                    if (popScrollRef.current) popScrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
                  }}
                  className="absolute right-[-5px] sm:right-[-20px] top-[96px] -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-gold/30 rounded-full hover:bg-beige text-primary transition-all shadow-md group-hover/pop:scale-105"
                  aria-label="Slide Right"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              <div
                ref={popScrollRef}
                onScroll={() => setPopCanScrollLeft((popScrollRef.current?.scrollLeft ?? 0) > 0)}
                className="flex overflow-x-auto gap-4 pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
              >
                {popularServices.map((service, idx) => (
                  <div
                    key={service._id}
                    className="w-[calc(50%-8px)] sm:w-[calc(33.33%-11px)] lg:w-[calc(25%-12px)] flex-shrink-0 snap-start"
                  >
                    <ServiceCard
                      service={service}
                      wishlist={wishlist}
                      onToggleWishlist={toggleWishlist}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3.5.  BEST DEALS FOR YOU SECTION
      ══════════════════════════════════════════════════════════ */}
      {displayDeals.length > 0 && (
        <section className="bg-beige/40 py-20 border-t border-b border-gold/10 relative group/deals">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Header */}
            <div className="flex justify-between items-end mb-12 gap-4">
              <div>
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider bg-red-500/10 px-3 py-1 rounded-full">Special Offers</span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary mt-3">🔥 Best Deals For You</h2>
                <p className="text-sm sm:text-base text-foreground/60 mt-2 max-w-lg">Claim exclusive limited-time discounts on top premium services.</p>
              </div>
              <Link
                href="/deals"
                className="flex items-center gap-2 text-sm font-semibold text-primary border border-primary/20 px-5 py-2.5 rounded-full hover:bg-primary hover:text-white transition-all flex-shrink-0"
              >
                View All Deals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Cards Grid / Slider */}
            <div className="relative px-2">
              {/* Left arrow — only visible after scrolling */}
              {dealsCanScrollLeft && displayDeals && displayDeals.length >= 4 && (
                <button
                  onClick={() => {
                    if (dealsScrollRef.current) dealsScrollRef.current.scrollBy({ left: -350, behavior: 'smooth' });
                  }}
                  className="absolute left-[-5px] sm:left-[-20px] top-[96px] -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-gold/30 rounded-full hover:bg-beige text-primary transition-all shadow-md group-hover/deals:scale-105"
                  aria-label="Slide Left"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {displayDeals && displayDeals.length >= 4 && (
                <button
                  onClick={() => {
                    if (dealsScrollRef.current) dealsScrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
                  }}
                  className="absolute right-[-5px] sm:right-[-20px] top-[96px] -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-gold/30 rounded-full hover:bg-beige text-primary transition-all shadow-md group-hover/deals:scale-105"
                  aria-label="Slide Right"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              <div
                ref={dealsScrollRef}
                onScroll={() => setDealsCanScrollLeft((dealsScrollRef.current?.scrollLeft ?? 0) > 0)}
                className="flex overflow-x-auto gap-4 pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
              >
                {displayDeals.map((deal, idx) => (
                  <div
                    key={deal.slug}
                    className="w-[calc(50%-8px)] sm:w-[calc(33.33%-11px)] lg:w-[calc(25%-12px)] flex-shrink-0 snap-start"
                  >
                    <DealCard
                      deal={deal}
                      wishlist={wishlist}
                      onToggleWishlist={toggleWishlist}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      )}



      {/* ══════════════════════════════════════════════════════════
          3.6.  SERVICES BY CATEGORY SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-cream py-20 border-b border-gold/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Section Main Header */}
          <div className="mb-14">
            <span className="text-xs font-bold text-gold uppercase tracking-wider bg-gold/10 px-3 py-1 rounded-full">Browse Categories</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary mt-3">Services by Category</h2>
            <p className="text-sm sm:text-base text-foreground/60 mt-2 max-w-lg">Explore individual verified bookable services tailored specifically by need.</p>
          </div>

          {/* Loop all 10 categories with custom details */}
          <div className="space-y-2">
            {displayCategoryServicesMap.map((catSection, idx) => (
              <React.Fragment key={catSection.title}>
                <CategoryServiceSection
                  title={catSection.title}
                  desc={catSection.desc}
                  link={catSection.link}
                  services={catSection.services}
                  wishlist={wishlist}
                  onToggleWishlist={toggleWishlist}
                />

                {/* Dynamically insert Why Choose Nexora under AC & Appliance Repair (index 2) */}
                {catSection.title === 'AC & Appliance Repair' && (
                  <div className="my-8 py-10 bg-white rounded-3xl border border-gold/15 shadow-sm px-6 sm:px-10">
                    <div className="text-center mb-10">
                      <span className="text-xs font-bold text-gold uppercase tracking-wider bg-gold/10 px-3 py-1 rounded-full">Why Nexora</span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary mt-3">Why Choose Nexora?</h2>
                      <p className="text-xs sm:text-sm text-foreground/60 mt-2 max-w-lg mx-auto">
                        Everything you need for a safe, reliable and hassle-free home service experience.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {WHY_FEATURES.map((feat, i) => (
                        <div
                          key={i}
                          className="bg-cream rounded-2xl p-6 border border-gold/10 hover:shadow-md hover:-translate-y-0.5 hover:border-gold/25 transition-all duration-300 group"
                        >
                          <div className={`w-10 h-10 ${feat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            <feat.icon className={`w-5 h-5 ${feat.color}`} />
                          </div>
                          <h4 className="font-serif text-sm font-bold text-primary mb-1.5">{feat.title}</h4>
                          <p className="text-xs text-foreground/60 leading-relaxed">{feat.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamically insert Top-Rated Professionals under Home Painting */}
                {catSection.title === 'Home Painting' && (
                  <div className="my-8 py-10 bg-white rounded-3xl border border-gold/15 shadow-sm px-6 sm:px-10">
                    {/* ══════════════════════════════════════════════════════════
          7.  TOP-RATED PROFESSIONALS
      ══════════════════════════════════════════════════════════ */}
                    <div className="text-center mb-12">
                      <span className="text-xs font-bold text-gold uppercase tracking-wider bg-gold/10 px-3 py-1 rounded-full">Our Team</span>
                      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary mt-3">Top-Rated Professionals</h2>
                      <p className="text-sm sm:text-base text-foreground/60 mt-3 max-w-md mx-auto">
                        Meet some of the trusted professionals available on Nexora.
                      </p>
                    </div>

                    {partnersLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      </div>
                    ) : approvedPartners.length === 0 ? (
                      <div className="relative">
                        {/* Static placeholder cards when no DB data */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[
                            { name: "Amit Sharma", category: "AC Repair & Installation", city: "Delhi", rating: "4.9", reviews: 124, exp: "8 Years" },
                            { name: "Priya Nair", category: "Salon for Women", city: "Mumbai", rating: "4.8", reviews: 98, exp: "5 Years" },
                            { name: "Rahul Singh", category: "Electrician & Plumber", city: "Bengaluru", rating: "4.7", reviews: 76, exp: "6 Years" },
                          ].map((p, i) => (
                            <div key={i} className="bg-cream rounded-3xl p-6 border border-gold/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                              <div className="flex items-start gap-4 mb-4">
                                <div className={`w-14 h-14 rounded-2xl ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                                  {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-serif font-bold text-primary text-base truncate">{p.name}</h3>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                                    <span className="text-sm font-bold text-primary">{p.rating}</span>
                                    <span className="text-xs text-foreground/50">({p.reviews} reviews)</span>
                                  </div>
                                </div>
                                <div className="ml-auto flex-shrink-0">
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                    <BadgeCheck className="w-3 h-3" /> Verified
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2 mb-5 text-xs text-foreground/60">
                                <div className="flex items-center gap-2">
                                  <Wrench className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                  <span className="truncate">{p.category}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Award className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                  <span>{p.exp} Experience</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                  <span>{p.city}</span>
                                </div>
                              </div>

                              <Link
                                href="/services"
                                className="block w-full py-2.5 text-center border border-primary/25 text-primary text-xs font-bold rounded-full hover:bg-primary hover:text-white transition-all"
                              >
                                View Profile
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Scroll buttons on mobile */}
                        <button onClick={() => scrollPartners('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gold/30 rounded-full shadow-md flex items-center justify-center hover:bg-cream transition-all lg:hidden">
                          <ChevronLeft className="w-5 h-5 text-primary" />
                        </button>
                        <button onClick={() => scrollPartners('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gold/30 rounded-full shadow-md flex items-center justify-center hover:bg-cream transition-all lg:hidden">
                          <ChevronRight className="w-5 h-5 text-primary" />
                        </button>

                        <div
                          ref={partnersScrollRef}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                          {approvedPartners.map((p, i) => (
                            <div key={p._id} className="bg-cream rounded-3xl p-6 border border-gold/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                              <div className="flex items-start gap-4 mb-4">
                                <div className={`w-14 h-14 rounded-2xl ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                                  {p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-serif font-bold text-primary text-base truncate">{p.name}</h3>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                                    <span className="text-sm font-bold text-primary">{(p.rating || 4.8).toFixed(1)}</span>
                                    <span className="text-xs text-foreground/50">({p.totalCompletedJobs || 0} jobs)</span>
                                  </div>
                                </div>
                                <div className="ml-auto flex-shrink-0">
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                    <BadgeCheck className="w-3 h-3" /> Verified
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2 mb-5 text-xs text-foreground/60">
                                <div className="flex items-center gap-2">
                                  <Wrench className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                  <span className="truncate">{p.category}</span>
                                </div>
                                {p.location?.city && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                    <span>{p.location.city}</span>
                                  </div>
                                )}
                              </div>

                              <Link
                                href={`/partner/${p._id}`}
                                className="block w-full py-2.5 text-center border border-primary/25 text-primary text-xs font-bold rounded-full hover:bg-primary hover:text-white transition-all"
                              >
                                View Profile
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3.7.  COMPLETE HOME CARE PACKAGES
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-beige/40 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
              <SparkleIcon className="w-3.5 h-3.5" />
              Curated Packages
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary mb-3">
              Complete Home Care
            </h2>
            <p className="text-foreground/55 text-base max-w-xl mx-auto">
              Convenient service packages for complete home maintenance.
            </p>
          </div>

          {/* 4 Package Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayPackages.map((pkg) => (
              <PackageCard key={pkg.slug} pkg={pkg} />
            ))}
          </div>

          {/* View All Packages CTA */}
          <div className="mt-10 text-center">
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-3.5 rounded-full hover:bg-primary/90 transition-colors shadow-md text-sm"
            >
              View All Packages
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3.8.  MOST BOOKED SERVICES
      ══════════════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════════
          3b.  MOST BOOKED SERVICES — Live API data
      ══════════════════════════════════════════════════════════ */}
      {(() => {
        const displayServices = mostBookedServices;
        if (displayServices.length === 0) return null;

        return (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div>
                  <span className="inline-flex items-center gap-2 bg-red-50 text-red-500 text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest border border-red-100">
                    🔥 Trending This Week
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary mb-2">
                    Most Booked Services
                  </h2>
                  <p className="text-foreground/55 text-base">
                    Services customers are booking the most this week.
                  </p>
                </div>
                <Link
                  href="/services"
                  className="flex-shrink-0 flex items-center gap-2 border border-primary/20 text-primary font-bold px-5 py-2.5 rounded-full text-sm hover:bg-primary hover:text-white transition-all"
                >
                  View All Services
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* 4-card responsive grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                {displayServices.slice(0, 4).map((service: any, idx: number) => (
                  <div key={service.slug || service._id || idx}>
                    <ServiceCard
                      service={service}
                      wishlist={wishlist}
                      onToggleWishlist={toggleWishlist}
                    />
                  </div>
                ))}
              </div>

              {/* Live data trust bar */}
              {displayServices.slice(0, 4).some((s: any) => (s.bookingCount && s.bookingCount > 0) || (s.reviewCount && s.reviewCount > 0)) && (
                <div className="mt-10 bg-gradient-to-r from-primary/5 via-beige/60 to-primary/5 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-center gap-6 border border-gold/10">
                  {displayServices.slice(0, 4).map((s: any) => {
                    const hasRealBookings = s.bookingCount && s.bookingCount > 0;
                    const hasRealReviews = s.reviewCount && s.reviewCount > 0;
                    if (!hasRealBookings && !hasRealReviews) return null;
                    return (
                      <div key={s.slug || s._id} className="flex items-center gap-2 text-xs text-foreground/60">
                        <span className="w-2 h-2 rounded-full bg-primary/40 flex-shrink-0" />
                        {hasRealBookings ? (
                          <><span className="font-semibold text-primary/80">{s.bookingCount.toLocaleString('en-IN')}</span><span>{s.name} bookings</span></>
                        ) : (
                          <><span className="font-semibold text-primary/80">{s.reviewCount >= 1000 ? `${(s.reviewCount / 1000).toFixed(1)}K` : s.reviewCount}</span><span>{s.name} bookings</span></>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })()}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {(() => {
            const currentBanner = activePromoBanners[promoBannerIdx] || activePromoBanners[0] || promoBanners[0];
            return (
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${currentBanner.gradient} text-white`}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice">
                    <circle cx="500" cy="-50" r="200" fill="white" />
                    <circle cx="50" cy="350" r="150" fill="white" />
                  </svg>
                </div>

                <div className="relative flex flex-col lg:flex-row items-center gap-8 p-8 sm:p-12 lg:p-16">
                  {/* Left content */}
                  <div className="flex-1 text-center lg:text-left">
                    <span className="inline-block text-xs font-bold bg-white/20 border border-white/30 px-3 py-1 rounded-full mb-4 tracking-wider uppercase">
                      {currentBanner.badge}
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                      {currentBanner.heading}
                    </h2>
                    <p className="text-white/80 text-base mb-6 max-w-lg mx-auto lg:mx-0">
                      {currentBanner.sub}
                    </p>

                    {/* Coupon code */}
                    <div 
                      className="inline-flex items-center gap-3 bg-white/10 border border-white/25 rounded-2xl px-5 py-3 mb-8 cursor-pointer hover:bg-white/20 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(currentBanner.code);
                        toast.success('Promo code copied!');
                      }}
                      title="Click to copy"
                    >
                      <Tag className="w-4 h-4 text-white/70 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-[10px] text-white/60 uppercase tracking-wider">Promo Code</p>
                        <p className="font-mono font-bold text-lg tracking-widest">{currentBanner.code}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                      <Link
                        href={currentBanner.href}
                        className="px-8 py-3.5 bg-white text-primary font-bold rounded-full hover:bg-white/90 transition-all text-sm shadow-lg"
                      >
                        {currentBanner.cta}
                      </Link>
                    </div>
                  </div>

                  {/* Right visual */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-4">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <div className="text-center">
                        <p className="font-serif text-5xl sm:text-6xl font-black text-white">{currentBanner.code.replace(/[^0-9%]/g, '') || '20'}
                          <span className="text-2xl">%</span>
                        </p>
                        <p className="text-xs text-white/70 mt-1 uppercase tracking-wider">OFF</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/60 text-center max-w-[180px]">{currentBanner.codeLabel}</p>
                  </div>
                </div>

                {/* Carousel dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {activePromoBanners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPromoBannerIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === promoBannerIdx ? 'bg-white w-5' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5.  WHY CHOOSE NEXORA
      ══════════════════════════════════════════════════════════ */}
      {/* <section className="bg-white py-20 border-y border-gold/15">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-gold uppercase tracking-wider bg-gold/10 px-3 py-1 rounded-full">Why Nexora</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary mt-3">Why Choose Nexora?</h2>
            <p className="text-sm sm:text-base text-foreground/60 mt-3 max-w-lg mx-auto">
              Everything you need for a safe, reliable and hassle-free home service experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_FEATURES.map((feat, i) => (
              <div
                key={i}
                className="bg-cream rounded-3xl p-7 border border-gold/15 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-gold/30 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 ${feat.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feat.icon className={`w-6 h-6 ${feat.color}`} />
                </div>
                <h3 className="font-serif text-base font-bold text-primary mb-2">{feat.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ══════════════════════════════════════════════════════════
          6.  HOW NEXORA WORKS
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-cream py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-gold uppercase tracking-wider bg-gold/10 px-3 py-1 rounded-full">Process</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary mt-3">How Nexora Works</h2>
            <p className="text-sm sm:text-base text-foreground/60 mt-3 max-w-md mx-auto">
              Book a professional service in just a few simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-[2.75rem] left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-gold/30 via-gold/60 to-gold/30 z-0" />

            {HOW_STEPS.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                {/* Step circle */}
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center border-4 border-cream shadow-lg z-10 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                {/* Number */}
                <span className="font-serif text-3xl font-extrabold text-gold/30 absolute top-14 left-1/2 -translate-x-1/2 -translate-y-1 pointer-events-none select-none">
                  {step.num}
                </span>

                <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm hover:shadow-md hover:border-gold/40 transition-all mt-4 w-full flex-1 flex flex-col justify-center">
                  <h3 className="font-serif text-base font-bold text-primary mb-2">{step.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════
          8.  CUSTOMER REVIEWS
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-cream py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-gold uppercase tracking-wider bg-gold/10 px-3 py-1 rounded-full">Reviews</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary mt-3">What Our Customers Say</h2>
            <p className="text-sm sm:text-base text-foreground/60 mt-3 max-w-md mx-auto">
              Real experiences from customers who booked services through Nexora.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(liveReviews.length > 0 ? liveReviews.map(r => ({
              rating: r.rating,
              text: r.reviewText,
              service: r.serviceId?.name || r.categoryId?.name || 'General Service',
              avatar: r.userId?.name?.charAt(0) || 'U',
              name: r.userId?.name || 'Customer',
              date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            })) : STATIC_REVIEWS).slice(0, 3).map((review, i) => (
              <div key={i} className="bg-white rounded-3xl p-7 border border-gold/15 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, si) => (
                    <Star key={si} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>

                {/* Quote */}
                <MessageSquareQuote className="w-6 h-6 text-gold/40 mb-2" />
                <p className="text-sm text-foreground/75 italic leading-relaxed flex-1">"{review.text}"</p>

                {/* Service tag */}
                <span className="mt-4 self-start text-[10px] font-bold text-primary bg-primary/8 px-2.5 py-1 rounded-full">
                  {review.service}
                </span>

                {/* Author */}
                <div className="mt-5 pt-4 border-t border-gold/10 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{review.name}</p>
                    <p className="text-xs text-foreground/40">{review.date} · Verified Customer</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          9.  APP DOWNLOAD CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 border-y border-gold/15">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="bg-gradient-to-br from-primary to-[#1D5C44] rounded-3xl overflow-hidden relative">
            {/* Background circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-x-10 -translate-y-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-x-10 translate-y-10 pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16 p-10 sm:p-14 lg:p-16">
              {/* Left content */}
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-block text-xs font-bold bg-white/15 border border-white/25 px-3 py-1 rounded-full mb-5 text-white/80 uppercase tracking-wider">
                  Mobile App
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                  Get Professional Services Anytime with Nexora
                </h2>
                <p className="text-white/70 text-base mb-8 max-w-md mx-auto lg:mx-0">
                  Book trusted professionals, manage your bookings and track your service from anywhere.
                </p>

                {/* Coming soon message */}
                <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 mb-6">
                  <Smartphone className="w-6 h-6 text-white/70 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-xs text-white/60 uppercase tracking-wider">App Status</p>
                    <p className="font-bold text-white">Coming Soon on Android & iOS</p>
                  </div>
                </div>

                <p className="text-white/50 text-xs">
                  We're working hard to launch the Nexora mobile app. Stay tuned for updates.
                </p>
              </div>

              {/* Right phone mockup */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="w-44 h-72 sm:w-52 sm:h-80 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center px-4">
                    <p className="font-serif font-bold text-white text-sm">Nexora</p>
                    <p className="text-xs text-white/60 mt-1">App Coming Soon</p>
                  </div>
                  <div className="w-24 h-24 bg-white/15 rounded-2xl flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-1">
                      {[...Array(9)].map((_, qi) => (
                        <div key={qi} className="w-2 h-2 bg-white/60 rounded-sm" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40">Scan QR · Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          10. FINAL BOOKING CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-cream py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <span className="text-xs font-bold text-gold uppercase tracking-wider bg-gold/10 px-3 py-1 rounded-full">Get Started</span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-primary mt-4 mb-4">Need a Service Today?</h2>
          <p className="text-base text-foreground/60 mb-10 max-w-xl mx-auto">
            Book trusted professionals and get quality services at your doorstep.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/services"
              className="w-full sm:w-auto px-10 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all shadow-lg text-base"
            >
              Book a Service
            </Link>
            <Link
              href="/services"
              className="w-full sm:w-auto px-10 py-4 border-2 border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-all text-base"
            >
              Explore Services
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-foreground/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>KYC-Verified Professionals</span>
            </div>
            <div className="w-px h-4 bg-foreground/20"></div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>OTP-Protected Service Start</span>
            </div>
            <div className="w-px h-4 bg-foreground/20"></div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-gold text-gold" />
              <span>4.8/5 Customer Rating</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
