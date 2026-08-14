"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IndianRupee, Star, Search, SlidersHorizontal, Loader2, ArrowRight, ChevronDown } from 'lucide-react';
import api from '@/lib/api';

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch categories
    api.get('/public/categories').then(res => setCategories(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (search.trim()) params.set('search', search.trim());
    if (selectedCat) params.set('categoryId', selectedCat);
    if (sortBy !== 'recommended') params.set('sort', sortBy);

    api.get(`/public/deals?${params}`)
      .then(res => {
        if (res.data?.success) {
          setDeals(res.data.deals || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, selectedCat, sortBy]);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <main className="flex-grow container mx-auto px-4 sm:px-8 lg:px-12 py-10 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="text-xs text-foreground/50 mb-6 flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-primary font-bold">Best Deals</span>
        </nav>

        {/* Hero Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-3">Best Deals For You</h1>
          <p className="text-sm sm:text-base text-foreground/60 max-w-2xl">
            Save big on verified luxury home services. Limited-time bookable deals created by premium certified experts.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-3xl border border-gold/20 p-5 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search deals..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gold/30 bg-cream text-sm focus:outline-none focus:border-primary transition-colors placeholder-foreground/45 text-foreground font-medium"
              />
            </div>

            {/* Selects */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gold flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">Filters:</span>
              </div>
              
              {/* Custom Category Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCatDropdownOpen(!catDropdownOpen);
                    setSortDropdownOpen(false);
                  }}
                  className="bg-cream border border-gold/30 rounded-2xl px-4 py-2.5 text-base sm:text-sm font-semibold text-primary focus:outline-none cursor-pointer flex items-center justify-between gap-2 min-w-[160px]"
                >
                  <span>{categories.find(c => c._id === selectedCat)?.name || "All Categories"}</span>
                  <ChevronDown className={`w-4 h-4 text-gold transition-transform duration-200 ${catDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {catDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCatDropdownOpen(false)} />
                    <div className="absolute right-0 sm:left-0 mt-2 w-56 bg-white border border-gold/20 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-1 duration-100">
                      <button
                        onClick={() => {
                          setSelectedCat("");
                          setCatDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${!selectedCat ? 'bg-primary text-white' : 'text-foreground/75 hover:bg-cream'}`}
                      >
                        All Categories
                      </button>
                      {categories.map((c: any) => (
                        <button
                          key={c._id}
                          onClick={() => {
                            setSelectedCat(c._id);
                            setCatDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${selectedCat === c._id ? 'bg-primary text-white' : 'text-foreground/75 hover:bg-cream'}`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Custom Sort Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSortDropdownOpen(!sortDropdownOpen);
                    setCatDropdownOpen(false);
                  }}
                  className="bg-cream border border-gold/30 rounded-2xl px-4 py-2.5 text-base sm:text-sm font-semibold text-primary focus:outline-none cursor-pointer flex items-center justify-between gap-2 min-w-[160px]"
                >
                  <span>
                    {sortBy === "recommended" && "Sort: Recommended"}
                    {sortBy === "highest_discount" && "Highest Discount"}
                    {sortBy === "lowest_price" && "Lowest Price"}
                    {sortBy === "newest" && "Newest Deals"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gold transition-transform duration-200 ${sortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {sortDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSortDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gold/20 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-1 duration-100">
                      {[
                        { value: "recommended", label: "Sort: Recommended" },
                        { value: "highest_discount", label: "Highest Discount" },
                        { value: "lowest_price", label: "Lowest Price" },
                        { value: "newest", label: "Newest Deals" }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value);
                            setSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${sortBy === opt.value ? 'bg-primary text-white' : 'text-foreground/75 hover:bg-cream'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Clear Filters button to redirect */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCat("");
                  setSearch("");
                  setSortBy("recommended");
                  router.push("/services");
                }}
                className="bg-red-50 hover:bg-red-100 border border-red-200/30 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-red-700 focus:outline-none cursor-pointer transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-foreground/50 font-medium">Fetching verified offers...</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gold/20 shadow-sm max-w-xl mx-auto">
            <SlidersHorizontal className="w-12 h-12 text-gold/30 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-bold text-primary mb-1">No Deals Active Right Now</h3>
            <p className="text-xs text-foreground/60 px-6">
              Try adjusting your filters or category choice. New vendor deals are published daily after admin verification.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map(deal => {
              const original = deal.originalPrice;
              const final = deal.finalPrice;
              const discountStr = deal.discountType === 'PERCENTAGE' ? `${deal.discountValue}% OFF` : `₹${deal.discountValue} OFF`;
              const imageUrl = deal.imageUrl || deal.serviceId?.imageUrl || deal.packageId?.imageUrl || 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=500&q=80';
              const rating = deal.serviceId?.rating || deal.packageId?.rating || 4.7;
              const reviewCount = deal.serviceId?.reviewCount || deal.packageId?.reviewCount || 100;
              const targetCheckout = deal.dealType === 'SERVICE' 
                ? `/checkout?serviceId=${deal.serviceId?._id || deal.serviceId}`
                : `/checkout?packageId=${deal.packageId?._id || deal.packageId}`;

              return (
                <div key={deal._id} className="bg-white rounded-3xl overflow-hidden border border-gold/20 shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-gold/45 transition-all duration-300 group">
                  {/* Thumbnail & Badge */}
                  <Link href={`/deals/${deal.slug}`} className="relative block h-52 bg-slate-100 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={deal.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      {discountStr}
                    </div>
                    {deal.isFeatured && (
                      <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow border border-gold/30">
                        ★ FEATURED
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
                  </Link>

                  {/* Details */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Rating row */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="w-4 h-4 fill-gold text-gold" />
                      <span className="text-xs font-bold text-primary">{rating.toFixed(1)}</span>
                      <span className="text-xs text-foreground/45">({reviewCount}+ bookings)</span>
                    </div>

                    {/* Title */}
                    <Link href={`/deals/${deal.slug}`}>
                      <h3 className="font-serif text-lg font-bold text-primary mb-1.5 hover:text-primary/80 transition-colors line-clamp-1">
                        {deal.title}
                      </h3>
                    </Link>

                    {/* Sub title / service name */}
                    <p className="text-xs font-bold text-gold uppercase tracking-wider mb-2">
                      {deal.serviceId?.name || deal.packageId?.name || 'Home Service Package'}
                    </p>

                    {/* Description */}
                    <p className="text-xs text-foreground/55 line-clamp-2 flex-1 mb-5">
                      {deal.description || 'Professional and completely verified luxury home solution.'}
                    </p>

                    {/* Pricing footer */}
                    <div className="pt-4 border-t border-gold/10 flex items-center justify-between gap-2 mt-auto">
                      <div>
                        <p className="text-[10px] text-foreground/45 uppercase tracking-wider font-semibold">Special Offer</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-serif font-bold text-primary text-xl flex items-center gap-0.5">
                            <IndianRupee className="w-3.5 h-3.5" />{final}
                          </span>
                          <span className="text-xs text-foreground/45 line-through flex items-center gap-0.5">
                            <IndianRupee className="w-3 h-3" />{original}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={targetCheckout}
                        className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/95 transition-all shadow-sm flex items-center gap-1"
                      >
                        Book Now
                      </Link>
                    </div>
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
