"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock, CheckCircle2, IndianRupee, ArrowLeft, ArrowRight,
  ShieldCheck, ChevronDown, ChevronUp, Star, Zap, Package,
  Sparkles, BadgeCheck, CalendarCheck
} from 'lucide-react';

// ─── Shared Package Registry ──────────────────────────────────────────────────
// Mirrors the PACKAGES_DATA in page.tsx. In a production app, this would be
// fetched from an API endpoint.
const PACKAGES_DATA = [
  {
    id: 'basic-home-care',
    slug: 'basic-home-care',
    name: 'Basic Home Care',
    tagline: 'Your everyday home maintenance essentials.',
    description: 'Essential maintenance package for your home covering cleaning, electrical and plumbing needs. Our verified professionals ensure your home is maintained to the highest standard, keeping it safe and comfortable.',
    includedServices: ['Cleaning', 'Electrician', 'Plumbing'],
    price: 699,
    originalPrice: 849,
    savings: '₹150 saved',
    badge: 'Popular',
    badgeColor: 'bg-primary text-white',
    duration: '3-4 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
    benefits: [
      'Professional home cleaning (kitchen, hall, and bathrooms)',
      'Electrician fault diagnosis and minor repair visit',
      'Plumbing tap, pipe and drain leak check and fixing',
      'Verified & background-checked professionals only',
      'All tools and materials for minor repairs included',
    ],
    inclusions: [
      { service: 'Cleaning', tasks: ['Sweeping and mopping all rooms', 'Kitchen counter and sink cleaning', 'Bathroom scrub and sanitization', 'Dusting fans and ceiling corners'] },
      { service: 'Electrician', tasks: ['Fault diagnosis for switches and MCBs', 'Minor wiring and socket repair', 'LED bulb and fan installation (material extra)'] },
      { service: 'Plumbing', tasks: ['Tap and faucet leak check and repair', 'Drain blockage inspection', 'Toilet flush and cistern check'] },
    ],
    faqs: [
      { q: 'How long does the service take?', a: 'The complete package takes approximately 3-4 hours depending on the home size and scope of work.' },
      { q: 'Do I need to provide any materials?', a: 'Our professionals bring all cleaning supplies and basic tools. For electrical or plumbing parts like new fittings, material costs are charged extra.' },
      { q: 'Can I customize the services included?', a: 'This is a fixed package. For custom combinations, please contact our support team or book individual services.' },
    ],
    terms: 'Service must be used within 30 days of booking. Professional will arrive within the selected time slot.',
    rating: 4.8,
    reviewCount: 2140,
    gradient: 'from-primary to-primary/80',
  },
  {
    id: 'deep-home-care',
    slug: 'deep-home-care',
    name: 'Deep Home Care',
    tagline: 'Deep-clean your entire home in one booking.',
    description: 'Comprehensive deep cleaning package for bathroom, kitchen and sofa — leaving your home spotless and hygienically clean. Ideal for monthly or quarterly refreshes to maintain a healthy living environment.',
    includedServices: ['Bathroom Cleaning', 'Kitchen Cleaning', 'Sofa Cleaning'],
    price: 1299,
    originalPrice: 1549,
    savings: '₹250 saved',
    badge: 'Best Value',
    badgeColor: 'bg-amber-500 text-white',
    duration: '5-6 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
    benefits: [
      'Acid wash bathroom tile, closet and fixture deep scrub',
      'Kitchen hob, counters, shelves and exhaust degreasing',
      'Sofa extraction wet and dry foam cleaning',
      'All eco-friendly chemicals and equipment included',
      '100% satisfaction guarantee or free re-clean',
    ],
    inclusions: [
      { service: 'Bathroom Cleaning', tasks: ['Tiles acid wash and scrub', 'Toilet bowl and seat disinfection', 'Basin, mirror and fixture polish', 'Exhaust fan cleaning'] },
      { service: 'Kitchen Cleaning', tasks: ['Hob and burner degreasing', 'Cabinet shelves and counters wipe', 'Sink deep scrub', 'Microwave and chimney interior (basic)'] },
      { service: 'Sofa Cleaning', tasks: ['Foam extraction (wet and dry method)', 'Stain treatment on fabric', 'Deodorizing and sanitization spray'] },
    ],
    faqs: [
      { q: 'What is included in the sofa cleaning?', a: 'We use foam extraction (wet and dry cleaning) that removes embedded dirt, dust mites and stains. The sofa will be dry within 3-4 hours.' },
      { q: 'Are the chemicals safe for children and pets?', a: 'Yes, all chemicals used are eco-friendly, non-toxic and safe for children and pets after a 1-hour ventilation period.' },
      { q: 'Do I need to be home during the service?', a: 'We recommend being present at the start and end of the service. Our professionals are verified and trustworthy.' },
    ],
    terms: 'Minimum 2 BHK required for this package. All cleaning agents are eco-friendly and non-toxic.',
    rating: 4.9,
    reviewCount: 3612,
    gradient: 'from-amber-600 to-amber-700',
  },
  {
    id: 'move-in-care',
    slug: 'move-in-care',
    name: 'Move-In Care',
    tagline: 'Move into a clean, sanitized, pest-free home.',
    description: 'Get your new home fresh and pest-free before moving in with a full home clean and herbal pest treatment. Ideal for newly constructed homes or homes that have been vacant for extended periods.',
    includedServices: ['Full Home Cleaning', 'Pest Control'],
    price: 1999,
    originalPrice: 2399,
    savings: '₹400 saved',
    badge: 'New Home',
    badgeColor: 'bg-emerald-600 text-white',
    duration: '6-8 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    benefits: [
      'Floor-to-ceiling full home cleaning',
      'Herbal gel cockroach and general pest treatment',
      'Post-construction dust and residue removal',
      'Safe for children and pets after 2 hours',
      'Deodorizing and fresh-air spray treatment included',
    ],
    inclusions: [
      { service: 'Full Home Cleaning', tasks: ['All rooms sweep, mop and dusting', 'All bathrooms and kitchen deep clean', 'Window glass and frame wipe', 'Post-construction dust and cement residue removal', 'Balcony and utility area clean'] },
      { service: 'Pest Control', tasks: ['Herbal gel bait for cockroaches', 'Spray treatment for ants and silver fish', 'Perimeter treatment for entry points', 'Free follow-up within 15 days if pests reappear'] },
    ],
    faqs: [
      { q: 'When should I book this for a new home?', a: 'We recommend booking 2-3 days before your move-in date so the home is completely dry and ventilated before you bring in furniture.' },
      { q: 'Is the pest control chemical harmful?', a: 'We use herbal gel bait (for cockroaches) which is odorless and safe. The spray is water-based and non-toxic after a 2-hour window.' },
      { q: 'Does this include furniture polishing?', a: 'Furniture polishing is not included in this package but can be added as a separate service on request.' },
    ],
    terms: 'Recommended for new homes or homes left unoccupied for 3+ months. Pest control is a single treatment.',
    rating: 4.9,
    reviewCount: 1892,
    gradient: 'from-emerald-700 to-emerald-800',
  },
  {
    id: 'annual-home-care',
    slug: 'annual-home-care',
    name: 'Annual Home Care',
    tagline: 'Complete annual care for a worry-free home.',
    description: 'Year-round home maintenance with quarterly AC, RO, electrical and plumbing service visits. Your dedicated relationship manager ensures all visits are scheduled at your convenience and all issues are resolved proactively.',
    includedServices: ['AC Service', 'RO Service', 'Electrical Service', 'Plumbing Service'],
    price: 2999,
    originalPrice: 3799,
    savings: '₹800 saved',
    badge: 'All Inclusive',
    badgeColor: 'bg-amber-600 text-white',
    duration: 'Quarterly visits',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    benefits: [
      '4 quarterly visit slots per service type (16 visits total)',
      'Priority partner assignment with no wait',
      'AC filter wash, gas pressure and coil check',
      'RO membrane and filter replacement included (up to 1 set)',
      'Dedicated relationship manager for all issues',
      'Free emergency electrical or plumbing call (1 per quarter)',
    ],
    inclusions: [
      { service: 'AC Service (Quarterly)', tasks: ['Filter cleaning and sanitization', 'Cooling gas pressure check', 'Coil and condenser inspection', 'Remote and thermostat calibration'] },
      { service: 'RO Service (Quarterly)', tasks: ['Pre-filter and sediment filter replacement', 'Water TDS output test', 'Membrane flush and check', 'Tap and tank leak inspection'] },
      { service: 'Electrical Service (Quarterly)', tasks: ['MCB and switchboard safety check', 'Earthing test', 'Fan and fixture inspection', 'Minor wiring issue repair'] },
      { service: 'Plumbing Service (Quarterly)', tasks: ['Tap and valve check and tightening', 'Drain and waste pipe inspection', 'Flush and cistern servicing', 'Water heater safety check'] },
    ],
    faqs: [
      { q: 'How are the quarterly visits scheduled?', a: 'After purchase, our relationship manager contacts you within 24 hours to schedule all visits for the year. You can also reschedule via the app.' },
      { q: 'What if I need service in between scheduled visits?', a: 'Each plan includes 1 free emergency call per quarter (per service type). Additional emergency calls are available at a discounted rate.' },
      { q: 'Is the plan transferable if I move to a new address?', a: 'Yes, the plan is transferable within the same city at no extra cost. For inter-city transfers, please contact support.' },
    ],
    terms: 'Annual plan valid for 12 months from activation. Transfers to new address within same city.',
    rating: 4.9,
    reviewCount: 4230,
    gradient: 'from-[#1a1a2e] to-[#2d2d44]',
  },
];

// ─── FAQ Accordion Item ────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gold/10 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-primary transition-colors"
      >
        <span className="font-semibold text-sm text-foreground/80">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-primary" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-foreground/40" />}
      </button>
      {open && (
        <p className="pb-4 text-sm text-foreground/60 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

// ─── Main Package Detail Page ─────────────────────────────────────────────────
export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const pkg = PACKAGES_DATA.find((p) => p.slug === slug);

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-beige px-4">
        <Package className="w-16 h-16 text-primary/30" />
        <h1 className="font-serif text-2xl font-bold text-primary">Package Not Found</h1>
        <p className="text-foreground/55 text-sm text-center max-w-sm">
          The package you are looking for does not exist or may have been removed.
        </p>
        <Link href="/" className="mt-2 px-6 py-3 bg-primary text-white font-bold rounded-full text-sm hover:bg-primary/90 transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const otherPackages = PACKAGES_DATA.filter((p) => p.slug !== slug);

  return (
    <div className="min-h-screen bg-beige">
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative h-64 sm:h-80 lg:h-[420px] overflow-hidden">
        <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-r ${pkg.gradient} opacity-75`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-5 left-4 sm:left-8 flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Hero Content */}
        <div className="absolute bottom-6 left-4 sm:left-8 lg:left-16 right-4">
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${pkg.badgeColor} shadow`}>
            {pkg.badge}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-5xl font-bold text-white drop-shadow mb-1">
            {pkg.name}
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-2xl">{pkg.tagline}</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-gold fill-gold" />
              <span className="text-white font-bold text-sm">{pkg.rating}</span>
              <span className="text-white/65 text-xs">({pkg.reviewCount.toLocaleString()} reviews)</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/75 text-xs">
              <Clock className="w-3.5 h-3.5" />
              {pkg.duration}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Layout ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Main column */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gold/10">
              <h2 className="font-serif text-xl font-bold text-primary mb-3">About This Package</h2>
              <p className="text-foreground/65 leading-relaxed text-sm">{pkg.description}</p>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gold/10">
              <h2 className="font-serif text-xl font-bold text-primary mb-4">What's Included</h2>
              <ul className="space-y-3">
                {pkg.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/70">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Service Inclusions (accordion per service) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gold/10">
              <h2 className="font-serif text-xl font-bold text-primary mb-5">Service Breakdown</h2>
              <div className="space-y-6">
                {pkg.inclusions.map((inc, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-bold text-primary/80 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gold" />
                      {inc.service}
                    </h3>
                    <ul className="space-y-1.5 pl-6">
                      {inc.tasks.map((task, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-foreground/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gold/10">
              <h2 className="font-serif text-xl font-bold text-primary mb-4">Frequently Asked Questions</h2>
              <div>
                {pkg.faqs.map((faq, i) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="bg-beige/60 rounded-2xl p-5 border border-gold/10 text-xs text-foreground/50 leading-relaxed">
              <strong className="text-foreground/70">Terms & Conditions: </strong>
              {pkg.terms}
            </div>
          </div>

          {/* Right / Sticky Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-5">
              {/* Price card */}
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-gold/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground/45 uppercase tracking-wider font-semibold">Package Price</span>
                  <span className="text-xs font-bold bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">
                    {pkg.savings}
                  </span>
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="font-serif text-3xl font-bold text-primary flex items-center gap-1">
                    <IndianRupee className="w-5 h-5" />{pkg.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-foreground/35 line-through mb-1">₹{pkg.originalPrice.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs text-foreground/45 mb-5">onwards · taxes included</p>

                {/* Included services pills */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {pkg.includedServices.map((s, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-beige border border-gold/20 text-primary/80 px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href={`/checkout?packageId=${pkg.slug}`}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-md mb-3"
                >
                  Book This Package
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/services"
                  className="w-full flex items-center justify-center gap-2 border border-primary/20 text-primary/70 font-semibold py-3 rounded-2xl text-xs hover:bg-primary/5 transition-colors"
                >
                  Browse Individual Services
                </Link>
              </div>

              {/* Trust signals */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gold/10 space-y-3">
                {[
                  { icon: BadgeCheck, label: 'Verified Professionals', sub: 'Background-checked & KYC verified' },
                  { icon: ShieldCheck, label: 'Secure Payments', sub: 'SSL encrypted checkout' },
                  { icon: CalendarCheck, label: 'Easy Scheduling', sub: 'Choose your preferred slot' },
                  { icon: Sparkles, label: 'Satisfaction Guaranteed', sub: 'Free re-service if not happy' },
                ].map(({ icon: Icon, label, sub }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground/80">{label}</p>
                      <p className="text-[10px] text-foreground/45">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Other Packages ──────────────────────────────────────────────────── */}
        {otherPackages.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl font-bold text-primary mb-6">Explore Other Packages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPackages.map((p) => (
                <Link
                  key={p.slug}
                  href={`/packages/${p.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden border border-gold/15 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-0.5 rounded-full ${p.badgeColor} shadow`}>{p.badge}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif font-bold text-sm text-primary mb-1">{p.name}</h3>
                    <p className="text-xs text-foreground/50 line-clamp-2 mb-3">{p.tagline}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary flex items-center gap-0.5 text-sm">
                        <IndianRupee className="w-3 h-3" />{p.price.toLocaleString('en-IN')}
                        <span className="text-xs text-foreground/40 font-normal ml-1">onwards</span>
                      </span>
                      <span className="text-xs font-semibold text-primary/70 flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
