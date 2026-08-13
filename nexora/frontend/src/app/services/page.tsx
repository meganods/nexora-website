"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, Clock, IndianRupee, ArrowRight, ChevronLeft,
  Loader2, SearchX, Search, SlidersHorizontal, X, Grid3X3
} from 'lucide-react';
import api from '@/lib/api';
import { ServiceCard } from '../page';

const CATEGORY_ICONS: Record<string, string> = {
  'ac-appliance-repair': '❄️',
  'cleaning-pest': '🧹',
  'electrician-plumber': '⚡',
  'salon-women': '💅',
  'salon-men': '✂️',
  'womens-therapies': '🌸',
  'mens-therapies': '💆',
  'hair-skin-nails': '💇',
};

function ServicesList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('q');

  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || '');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [allServices, setAllServices] = useState<any[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [svcRes, catRes] = await Promise.all([
        api.get('/public/services'),
        api.get('/public/categories'),
      ]);
      setAllServices(svcRes.data);
      setCategories(catRes.data);
      applyFilters(svcRes.data, categoryFilter || '', searchQuery || '', sortBy);
    } catch (err) {
      console.error('Failed to load services', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (svcList: any[], cat: string, q: string, sort: string) => {
    let filtered = [...svcList];

    if (cat) {
      filtered = filtered.filter((s: any) =>
        s.categoryId?.name?.toLowerCase().includes(cat.toLowerCase()) ||
        s.categoryId?.slug === cat ||
        s.name?.toLowerCase().includes(cat.toLowerCase())
      );
    }

    if (q) {
      const qLow = q.toLowerCase();
      filtered = filtered.filter((s: any) =>
        s.name?.toLowerCase().includes(qLow) ||
        s.description?.toLowerCase().includes(qLow) ||
        s.categoryId?.name?.toLowerCase().includes(qLow)
      );
    }

    if (sort === 'price-asc') filtered.sort((a, b) => a.basePrice - b.basePrice);
    else if (sort === 'price-desc') filtered.sort((a, b) => b.basePrice - a.basePrice);
    else if (sort === 'rating') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));

    setServices(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(allServices, selectedCategory, searchInput, sortBy);
    const params = new URLSearchParams();
    if (searchInput) params.set('q', searchInput);
    if (selectedCategory) params.set('category', selectedCategory);
    router.replace(`/services?${params.toString()}`);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    applyFilters(allServices, cat, searchInput, sortBy);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    applyFilters(allServices, selectedCategory, searchInput, sort);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSelectedCategory('');
    setSortBy('popular');
    setServices(allServices);
    router.replace('/services');
  };

  const activeFiltersCount = [searchInput, selectedCategory].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden">

      {/* Header */}
      <div className="bg-primary text-white pt-10 pb-24 px-4 sm:px-8 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white mb-5 transition-colors text-sm w-fit">
            <ChevronLeft className="w-5 h-5" /> Home
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">
            {selectedCategory || (searchQuery ? `Results for "${searchQuery}"` : 'All Services')}
          </h1>
          <p className="text-white/70 text-sm sm:text-base">
            {loading ? 'Loading...' : `${services.length} service${services.length !== 1 ? 's' : ''} available`}
          </p>

          {/* Search bar in header */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search services..."
                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-white/50 text-sm"
              />
            </div>
            <button type="submit" className="px-6 py-3 bg-gold text-primary font-bold rounded-2xl text-sm hover:bg-gold/90 transition-all">
              Search
            </button>
          </form>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 -mt-12 pb-24">

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar filters (desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm sticky top-8">
              <h3 className="font-serif font-bold text-primary mb-4 text-base">Filter Services</h3>

              {/* Categories */}
              <div className="mb-6">
                <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-3">Category</p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${!selectedCategory ? 'bg-primary text-white font-bold' : 'text-foreground/70 hover:bg-cream'}`}
                  >
                    <Grid3X3 className="inline w-3.5 h-3.5 mr-2" /> All Categories
                  </button>
                  {categories.map((cat: any) => (
                    <button
                      key={cat._id}
                      onClick={() => handleCategoryChange(cat.name)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${selectedCategory === cat.name ? 'bg-primary text-white font-bold' : 'text-foreground/70 hover:bg-cream'}`}
                    >
                      {CATEGORY_ICONS[cat.slug] || '🔧'} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-3">Sort By</p>
                <div className="space-y-1">
                  {[
                    { value: 'popular', label: '🔥 Most Popular' },
                    { value: 'rating', label: '⭐ Top Rated' },
                    { value: 'price-asc', label: '💰 Price: Low to High' },
                    { value: 'price-desc', label: '💎 Price: High to Low' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleSortChange(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${sortBy === opt.value ? 'bg-gold/20 text-primary font-bold' : 'text-foreground/70 hover:bg-cream'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="w-full py-2.5 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </button>
              )}
            </div>
          </aside>

          {/* Mobile filter bar */}
          <div className="lg:hidden mt-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium flex-shrink-0 transition-all ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white border-gold/30 text-foreground'}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>
              {categories.slice(0, 5).map((cat: any) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryChange(selectedCategory === cat.name ? '' : cat.name)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium flex-shrink-0 transition-all ${selectedCategory === cat.name ? 'bg-primary text-white border-primary' : 'bg-white border-gold/30 text-foreground/70'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {showFilters && (
              <div className="mt-3 bg-white rounded-2xl p-4 border border-gold/20 shadow-sm flex flex-wrap gap-2">
                {[
                  { value: 'popular', label: '🔥 Popular' },
                  { value: 'rating', label: '⭐ Top Rated' },
                  { value: 'price-asc', label: '💰 Cheapest' },
                  { value: 'price-desc', label: '💎 Premium' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSortChange(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${sortBy === opt.value ? 'bg-primary text-white border-primary' : 'border-gold/30 text-foreground/70'}`}
                  >
                    {opt.label}
                  </button>
                ))}
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 text-red-500">
                    ✕ Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Services grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-gold/15" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gold/20 px-6">
                <SearchX className="w-14 h-14 text-gold/60 mb-4" />
                <h3 className="font-serif text-xl font-bold text-primary mb-2">No Services Found</h3>
                <p className="text-foreground/60 mb-6 text-sm max-w-xs">
                  {searchInput
                    ? `We couldn't find services matching "${searchInput}".`
                    : selectedCategory
                    ? `No services in "${selectedCategory}" yet.`
                    : 'No services available.'}
                </p>
                <button onClick={clearFilters} className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors text-sm">
                  Browse All Services
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {services.map((service: any) => (
                  <div key={service._id} className="h-full">
                    <ServiceCard service={service} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <ServicesList />
    </Suspense>
  );
}
