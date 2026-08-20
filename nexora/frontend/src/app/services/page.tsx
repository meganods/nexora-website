"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, Clock, IndianRupee, ArrowRight, ChevronRight,
  SlidersHorizontal, X, Grid3X3, ChevronDown, Loader2, SearchX, Search,
  CheckCircle2, ShieldCheck, BadgePercent, Heart, MapPin
} from 'lucide-react';
import api from '@/lib/api';
import { useLocation } from '@/lib/location';
import toast from 'react-hot-toast';

const getFallbackServiceImage = (categoryName: string = '', serviceName: string = ''): string => {
  const cat = categoryName.toLowerCase();
  const name = serviceName.toLowerCase();
  
  if (cat.includes('women') || cat.includes('salon-women') || name.includes('bridal') || name.includes('facial') || name.includes('manicure') || name.includes('pedicure') || name.includes('makeup') || name.includes('spa')) {
    return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('men') || cat.includes('salon-men') || name.includes('haircut') || name.includes('beard') || name.includes('shave')) {
    return 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('spa') || cat.includes('therapies') || cat.includes('massage') || name.includes('massage') || name.includes('therapy')) {
    return 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('clean') || cat.includes('pest') || name.includes('sofa') || name.includes('bathroom') || name.includes('kitchen') || name.includes('pest')) {
    return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('ac') || name.includes('air conditioner') || name.includes('ac service') || name.includes('gas refill')) {
    return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('electric') || name.includes('wire') || name.includes('switch') || name.includes('fan')) {
    return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('plumb') || name.includes('pipe') || name.includes('tap') || name.includes('leak') || name.includes('tank')) {
    return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('paint') || name.includes('paint') || name.includes('wall')) {
    return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('carpenter') || cat.includes('wood') || name.includes('furniture') || name.includes('sofa repair') || name.includes('door')) {
    return 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('ro') || name.includes('water purifier') || name.includes('filter') || name.includes('purifier')) {
    return 'https://images.unsplash.com/photo-1585832770485-e289c02d9048?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80'; // fallback technician
};

function ServicesList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('q');
  const sortParam = searchParams.get('sort') || 'popular';
  const { selectedCity } = useLocation();

  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || '');
  const [sortBy, setSortBy] = useState(sortParam);
  const [allServices, setAllServices] = useState<any[]>([]);

  // Filter States
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Infinity]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [availability, setAvailability] = useState<string>('any');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    // Load local wishlist
    const local = localStorage.getItem('user_wishlist');
    if (local) setWishlist(JSON.parse(local));
    fetchWishlist();
    fetchAll();
  }, []);

  useEffect(() => {
    setSearchInput(searchQuery || '');
    setSelectedCategory(categoryFilter || '');
    setSortBy(sortParam);
    if (allServices.length > 0) {
      applyFilters(allServices, categoryFilter || '', searchQuery || '', sortParam, priceRange, minRating, availability);
    }
  }, [searchQuery, categoryFilter, sortParam, allServices]);

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get('/user/dashboard/wishlist');
      if (data?.wishlist) {
        const ids = data.wishlist.map((w: any) => w._id || w);
        setWishlist(ids);
        localStorage.setItem('user_wishlist', JSON.stringify(ids));
      }
    } catch (err) {
      console.warn("Guest user: skipping wishlist MongoDB sync.");
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [svcRes, catRes] = await Promise.all([
        api.get('/public/services'),
        api.get('/public/categories'),
      ]);
      setAllServices(svcRes.data || []);
      setCategories(catRes.data || []);
      applyFilters(svcRes.data || [], categoryFilter || '', searchQuery || '', sortParam, [0, Infinity], null, 'any');
    } catch (err) {
      console.error('Failed to load services', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (
    svcList: any[],
    cat: string,
    q: string,
    sort: string,
    price: [number, number],
    rating: number | null,
    avail: string
  ) => {
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
        (s.description && s.description.toLowerCase().includes(qLow)) ||
        s.categoryId?.name?.toLowerCase().includes(qLow)
      );
    }

    // Price Bounds
    filtered = filtered.filter((s: any) => s.basePrice >= price[0] && s.basePrice <= price[1]);

    // Ratings Bounds
    if (rating !== null) {
      filtered = filtered.filter((s: any) => (s.rating || 0) >= rating);
    }

    // Sorting
    if (sort === 'price-asc') filtered.sort((a, b) => a.basePrice - b.basePrice);
    else if (sort === 'price-desc') filtered.sort((a, b) => b.basePrice - a.basePrice);
    else if (sort === 'rating') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'most-booked') filtered.sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0));
    else if (sort === 'newest') filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)); // popularity

    setServices(filtered);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(allServices, selectedCategory, searchInput, sortBy, priceRange, minRating, availability);
    const params = new URLSearchParams();
    if (searchInput) params.set('q', searchInput);
    if (selectedCategory) params.set('category', selectedCategory);
    router.replace(`/services?${params.toString()}`);
  };

  const handleCategoryClick = (catName: string) => {
    const nextCat = selectedCategory === catName ? '' : catName;
    setSelectedCategory(nextCat);
    applyFilters(allServices, nextCat, searchInput, sortBy, priceRange, minRating, availability);
  };

  const toggleWishlist = async (id: string, serviceName: string = 'Service') => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('nexora_role') : '';
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexora_token') : '';
    
    if (!token) {
      toast.error('Please login to save services to your wishlist.');
      router.push('/login');
      return;
    }
    if (role !== 'user') {
      toast.error('Only customer accounts can use the wishlist.');
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
    } catch (err) {
      console.error(err);
      // Revert UI on failure
      const reverted = isAdded ? wishlist.filter(x => x !== id) : [...wishlist, id];
      setWishlist(reverted);
      localStorage.setItem('user_wishlist', JSON.stringify(reverted));
      toast.error('Failed to update wishlist. Please try again.');
    }
  };

  const handlePricePreset = (min: number, max: number) => {
    // Toggle: if same range already selected, deselect (reset to all)
    const isAlreadySelected = priceRange[0] === min && priceRange[1] === max;
    const nextRange: [number, number] = isAlreadySelected ? [0, Infinity] : [min, max];
    setPriceRange(nextRange);
    applyFilters(allServices, selectedCategory, searchInput, sortBy, nextRange, minRating, availability);
  };

  const handleRatingFilter = (r: number) => {
    const nextRating = minRating === r ? null : r;
    setMinRating(nextRating);
    applyFilters(allServices, selectedCategory, searchInput, sortBy, priceRange, nextRating, availability);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSelectedCategory('');
    setSortBy('popular');
    setPriceRange([0, Infinity]);
    setMinRating(null);
    setAvailability('any');
    setServices(allServices);
    router.replace('/services');
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-20">
      
      {/* Search Header Banner */}
      <div className="bg-[#0F3D30] text-white pt-6 pb-12">
        <div className="container mx-auto px-4 sm:px-8 lg:px-12 space-y-4">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/80">All Services</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-3xl font-bold text-[#C3AB84]">All Services</h1>
                <span className="bg-[#C3AB84]/20 border border-[#C3AB84]/30 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full font-serif">
                  {services.length} Services
                </span>
              </div>
              <p className="text-[#FAF6F0]/70 text-xs mt-1">Find the best home services near you in {selectedCity}</p>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search for AC repair, cleaning, salon..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/50"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-[#C3AB84] hover:bg-[#C3AB84]/90 text-[#0F3D30] font-bold rounded-xl text-xs transition-colors">
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-[#F3EDE2] border-b border-[#C3AB84]/20 py-3">
        <div className="container mx-auto px-4 sm:px-8 lg:px-12 flex flex-wrap justify-between gap-4 text-xs font-semibold text-[#0F3D30]/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C3AB84]" />
            <span>100% Verified Professionals</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C3AB84]" />
            <span>On-Time Reliable Service</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C3AB84]" />
            <span>Best Price Guarantee</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 lg:px-12 mt-6">
        
        {/* Best Deals & Promos Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-[#0F3D30] to-[#1D5C4A] text-white p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C3AB84]">Exclusive Offer</span>
              <h3 className="font-serif text-lg font-bold mt-1 text-[#FAF6F0]">Best Deals For You 🔥</h3>
              <p className="text-white/70 text-xs mt-1">Get up to 40% OFF on Top Home Services</p>
            </div>
            <Link href="/deals" className="mt-4 bg-[#C3AB84] text-[#0F3D30] font-bold px-3 py-1.5 rounded-xl text-[10px] w-fit hover:bg-white transition-colors">
              View Deals
            </Link>
          </div>

          <div className="bg-white border border-[#C3AB84]/20 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">FLAT 25% OFF</span>
              <h4 className="font-serif text-xs font-bold text-[#0F3D30] pt-1">On First Booking</h4>
              <p className="text-[10px] text-foreground/50">Use Code: <span className="font-mono font-bold text-[#0F3D30]">NEX25</span></p>
            </div>
            <BadgePercent className="w-12 h-12 text-[#C3AB84]/30" />
          </div>

          <div className="bg-white border border-[#C3AB84]/20 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">UPTO 30% CASHBACK</span>
              <h4 className="font-serif text-xs font-bold text-[#0F3D30] pt-1">On Wallet Payment</h4>
              <p className="text-[10px] text-foreground/50">Use Code: <span className="font-mono font-bold text-[#0F3D30]">NEXWALLET</span></p>
            </div>
            <BadgePercent className="w-12 h-12 text-[#C3AB84]/30" />
          </div>
        </div>

        {/* Main Columns */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Mobile Overlay Backdrop */}
          {mobileFiltersOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity"
              onClick={() => setMobileFiltersOpen(false)}
            />
          )}

          {/* Filters Sidebar */}
          <aside className={`
            fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white p-6 shadow-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto
            lg:relative lg:top-auto lg:left-auto lg:h-auto lg:w-64 lg:max-w-none lg:bg-white lg:shadow-sm lg:rounded-3xl lg:p-5 lg:border lg:border-[#C3AB84]/20 lg:z-10 lg:translate-x-0 lg:transition-none lg:overflow-visible
            ${mobileFiltersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Mobile close header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#C3AB84]/15 mb-4 lg:hidden">
              <h3 className="font-serif font-bold text-[#0F3D30] text-sm">Filters</h3>
              <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center text-[#0F3D30]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-[#0F3D30] text-sm hidden lg:block">Filters</h3>
              <button onClick={clearFilters} className="text-[10px] font-bold text-red-600 hover:text-red-500 transition-colors uppercase tracking-wider">
                Clear All
              </button>
            </div>

            {/* Categories filter */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground/40">Categories</span>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => handleCategoryClick('')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!selectedCategory ? 'bg-[#0F3D30] text-white' : 'text-foreground/70 hover:bg-[#FAF6F0]'}`}
                >
                  All Categories
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat._id}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${selectedCategory === cat.name ? 'bg-[#0F3D30] text-white' : 'text-foreground/70 hover:bg-[#FAF6F0]'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Presets */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground/40">Price Range</span>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
                <button onClick={() => handlePricePreset(0, 499)} className={`py-1.5 rounded-xl border text-center transition-colors ${priceRange[1] === 499 ? 'border-[#0F3D30] bg-[#0F3D30]/5 text-[#0F3D30]' : 'border-gray-200 text-foreground/60'}`}>
                  Under ₹499
                </button>
                <button onClick={() => handlePricePreset(499, 999)} className={`py-1.5 rounded-xl border text-center transition-colors ${priceRange[0] === 499 && priceRange[1] === 999 ? 'border-[#0F3D30] bg-[#0F3D30]/5 text-[#0F3D30]' : 'border-gray-200 text-foreground/60'}`}>
                  ₹499 - ₹999
                </button>
                <button onClick={() => handlePricePreset(999, 1999)} className={`py-1.5 rounded-xl border text-center transition-colors ${priceRange[0] === 999 && priceRange[1] === 1999 ? 'border-[#0F3D30] bg-[#0F3D30]/5 text-[#0F3D30]' : 'border-gray-200 text-foreground/60'}`}>
                  ₹999 - ₹1999
                </button>
                <button onClick={() => handlePricePreset(1999, Infinity)} className={`py-1.5 rounded-xl border text-center transition-colors ${priceRange[0] === 1999 ? 'border-[#0F3D30] bg-[#0F3D30]/5 text-[#0F3D30]' : 'border-gray-200 text-foreground/60'}`}>
                  ₹1999+
                </button>
              </div>
            </div>

            {/* Rating presets */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground/40">Ratings</span>
              <div className="space-y-1 text-xs">
                {[4.5, 4.0, 3.5, 3.0].map(r => (
                  <button
                    key={r}
                    onClick={() => handleRatingFilter(r)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-lg transition-colors ${minRating === r ? 'bg-[#0F3D30]/5 text-[#0F3D30] font-bold' : 'text-foreground/70 hover:bg-[#FAF6F0]'}`}
                  >
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#C3AB84] text-[#C3AB84]" />
                      {r.toFixed(1)} & above
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Service Cards Grid Container */}
          <div className="flex-1 space-y-6">
            
            {/* Sorting controls */}
            <div className="flex items-center justify-between bg-white border border-[#C3AB84]/20 px-4 py-3 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F0] border border-[#C3AB84]/30 rounded-xl font-bold text-[#0F3D30] transition-colors hover:bg-[#F3EDE2]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#C3AB84]" />
                  <span>Filters</span>
                </button>
                <div className="flex items-center gap-2 relative">
                  <span className="text-foreground/50">Sort By:</span>
                  <button
                    type="button"
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    className="flex items-center gap-1 font-bold text-[#0F3D30] focus:outline-none cursor-pointer text-base lg:text-xs"
                  >
                    <span>
                      {sortBy === "popular" && "Popularity"}
                      {sortBy === "rating" && "Rating"}
                      {sortBy === "price-asc" && "Price Low to High"}
                      {sortBy === "price-desc" && "Price High to Low"}
                      {sortBy === "most-booked" && "Most Booked"}
                      {sortBy === "newest" && "Newest"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#C3AB84] transition-transform duration-200" />
                  </button>
                  {sortDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setSortDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#C3AB84]/30 rounded-2xl shadow-xl z-50 overflow-hidden py-0 animate-in fade-in slide-in-from-top-1 duration-100 divide-y divide-[#C3AB84]/5">
                        {[
                          { value: "popular", label: "Popularity" },
                          { value: "rating", label: "Rating" },
                          { value: "price-asc", label: "Price Low to High" },
                          { value: "price-desc", label: "Price High to Low" },
                          { value: "most-booked", label: "Most Booked" },
                          { value: "newest", label: "Newest" }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSortBy(opt.value);
                              setSortDropdownOpen(false);
                              applyFilters(allServices, selectedCategory, searchInput, opt.value, priceRange, minRating, availability);
                            }}
                            className={`w-full text-left px-5 py-3 text-[13px] font-bold transition-all ${sortBy === opt.value ? 'bg-[#0F3D30] text-white' : 'text-foreground/75 hover:bg-[#FAF6F0] hover:text-[#0F3D30]'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
            </div>
            <span className="text-[10px] font-semibold text-foreground/50">Showing {services.length} of {allServices.length} services</span>
          </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl h-44 sm:h-64 border border-[#C3AB84]/15 animate-pulse" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-[#C3AB84]/20 p-6 shadow-sm">
                <SearchX className="w-14 h-14 text-[#C3AB84]/40 mb-3" />
                <h3 className="font-serif text-lg font-bold text-[#0F3D30]">No Services Match</h3>
                <p className="text-xs text-foreground/50 max-w-xs mb-6">Try clearing category selection or widening price and ratings parameters.</p>
                <button onClick={clearFilters} className="px-6 py-2.5 bg-[#0F3D30] text-white rounded-full text-xs font-bold shadow-sm">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                {services.map((service: any) => {
                  const isFav = wishlist.includes(service._id);
                  const isDiscounted = service.discountPercentage > 0;
                  const finalPrice = isDiscounted ? Math.round(service.basePrice * (1 - service.discountPercentage / 100)) : service.basePrice;

                  return (
                    <div key={service._id} className="bg-white border border-[#C3AB84]/20 rounded-3xl p-2.5 sm:p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative">
                      
                      {/* Wishlist toggle button */}
                      <button onClick={() => toggleWishlist(service._id, service.name)} className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 border border-gray-100 flex items-center justify-center shadow-sm">
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-foreground/40'}`} />
                      </button>

                      {/* Card Content */}
                      <div>
                        <div className="w-full h-24 sm:h-36 rounded-2xl overflow-hidden relative bg-gray-50 mb-2 sm:mb-3 border border-gray-100">
                          <img 
                            src={service.imageUrl || getFallbackServiceImage(service.categoryId?.name, service.name)} 
                            alt={service.name} 
                            loading="lazy" 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex flex-col gap-1">
                            {isDiscounted && (
                              <span className="bg-red-500 text-white text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded sm:rounded-md shadow-sm w-fit">
                                {service.discountPercentage}% OFF
                              </span>
                            )}
                          </div>
                        </div>

                        {service.vendorId && (
                          <div className="flex items-center gap-1.5 mb-2 bg-[#FAF6F0]/80 p-1.5 rounded-xl border border-gold/10">
                            {service.vendorId.profilePictureUrl ? (
                              <img src={service.vendorId.profilePictureUrl} className="w-5 h-5 rounded-full object-cover border border-gold/25" alt="vendor" />
                            ) : (
                              <div className="w-5 h-5 bg-gold/15 text-gold flex items-center justify-center rounded-full text-[8px] font-bold border border-gold/25">
                                {service.vendorId.name.charAt(0)}
                              </div>
                            )}
                            <div className="text-[9px] text-[#0F3D30] font-bold truncate flex-1">
                              {service.vendorId.name}
                            </div>
                            <span className="text-[7px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 uppercase tracking-wider shrink-0 scale-90">
                              Verified
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold text-[#C3AB84] uppercase tracking-wider">
                          <span>{service.categoryId?.name || 'Home Service'}</span>
                        </div>

                        <h3 className="font-serif text-[11px] sm:text-sm font-bold text-[#0F3D30] mt-0.5 sm:mt-1 line-clamp-1 h-4 sm:h-5">{service.name}</h3>

                        <div className="flex flex-wrap items-center gap-1 text-[9px] sm:text-[10px] text-foreground/60 mt-0.5 sm:mt-1">
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                            <span className="font-bold text-[#0F3D30]">{service.rating || '4.5'}</span>
                          </span>
                          <span className="text-foreground/80 font-medium">({service.reviewCount || 15} reviews)</span>
                          <span className="text-foreground/20 hidden xs:inline">•</span>
                          <span>{service.estimatedDurationMins}m</span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {service.isMostBooked && (
                            <span className="text-[8px] sm:text-[10px] text-gold font-bold bg-[#FAF6F0] border border-gold/15 px-1.5 py-0.5 rounded-md shrink-0">
                              🔥 Most Booked
                            </span>
                          )}
                        </div>

                        {service.description && (
                          <p className="hidden sm:block text-foreground/50 text-[10px] line-clamp-2 mt-2 leading-relaxed">{service.description}</p>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-2.5 pt-2 sm:mt-4 sm:pt-3 border-t border-[#C3AB84]/15 flex items-center justify-between gap-1.5">
                        <div>
                          <span className="text-[7px] sm:text-[9px] text-foreground/45 block font-bold uppercase tracking-wider leading-none mb-0.5">Starting From</span>
                          <div className="flex items-baseline gap-1">
                            <span className="font-serif text-xs sm:text-sm font-black text-[#0F3D30]">₹{finalPrice}</span>
                            {isDiscounted && (
                              <span className="text-[8px] sm:text-[10px] line-through text-foreground/40">₹{service.basePrice}</span>
                            )}
                          </div>
                        </div>

                        <Link href={`/services/${service.slug}`} className="px-3 py-1.5 bg-[#0F3D30] text-white font-bold rounded-full text-[9px] sm:text-[11px] hover:bg-[#0F3D30]/90 transition-colors shadow-sm whitespace-nowrap">
                          Book Now
                        </Link>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom listing subcategories routing */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-8">
              <Link href="/services?sort=most-booked" className="bg-[#F3EDE2] border border-[#C3AB84]/20 p-3 rounded-2xl text-center space-y-1 hover:bg-[#FAF6F0] transition-colors">
                <span className="block text-[10px] font-bold text-[#0F3D30]/60 uppercase tracking-wider">Most Booked</span>
                <span className="block font-serif text-xs font-bold text-[#0F3D30]">Popular Picks</span>
              </Link>
              <Link href="/services?sort=rating" className="bg-[#F3EDE2] border border-[#C3AB84]/20 p-3 rounded-2xl text-center space-y-1 hover:bg-[#FAF6F0] transition-colors">
                <span className="block text-[10px] font-bold text-[#0F3D30]/60 uppercase tracking-wider">Trending</span>
                <span className="block font-serif text-xs font-bold text-[#0F3D30]">Highly Rated</span>
              </Link>
              <Link href="/services?sort=rating" className="bg-[#F3EDE2] border border-[#C3AB84]/20 p-3 rounded-2xl text-center space-y-1 hover:bg-[#FAF6F0] transition-colors">
                <span className="block text-[10px] font-bold text-[#0F3D30]/60 uppercase tracking-wider">Top Rated</span>
                <span className="block font-serif text-xs font-bold text-[#0F3D30]">Superb Quality</span>
              </Link>
              <Link href="/services?sort=newest" className="bg-[#F3EDE2] border border-[#C3AB84]/20 p-3 rounded-2xl text-center space-y-1 hover:bg-[#FAF6F0] transition-colors">
                <span className="block text-[10px] font-bold text-[#0F3D30]/60 uppercase tracking-wider">New Arrivals</span>
                <span className="block font-serif text-xs font-bold text-[#0F3D30]">Fresh Additions</span>
              </Link>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen bg-[#FAF6F0]"><Loader2 className="w-8 h-8 animate-spin text-[#0F3D30]" /></div>}>
      <ServicesList />
    </Suspense>
  );
}
