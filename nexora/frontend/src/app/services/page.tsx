"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, Clock, IndianRupee, ArrowRight, ChevronRight,
  Loader2, SearchX, Search, SlidersHorizontal, X, Grid3X3,
  CheckCircle2, ShieldCheck, BadgePercent, Heart, MapPin
} from 'lucide-react';
import api from '@/lib/api';
import { useLocation } from '@/lib/location';

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
    return 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80';
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
  return 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80'; // fallback technician
};

function ServicesList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('q');
  const { selectedCity } = useLocation();

  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || '');
  const [sortBy, setSortBy] = useState('popular');
  const [allServices, setAllServices] = useState<any[]>([]);

  // Filter States
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [availability, setAvailability] = useState<string>('any');
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    // Load local wishlist
    const local = localStorage.getItem('user_wishlist');
    if (local) setWishlist(JSON.parse(local));
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [svcRes, catRes] = await Promise.all([
        api.get('/public/services'),
        api.get('/public/categories'),
      ]);
      setAllServices(svcRes.data || []);
      setCategories(catRes.data || []);
      applyFilters(svcRes.data || [], categoryFilter || '', searchQuery || '', sortBy, [0, 5000], null, 'any');
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

  const toggleWishlist = (id: string) => {
    let updated = [...wishlist];
    if (updated.includes(id)) {
      updated = updated.filter(x => x !== id);
    } else {
      updated.push(id);
    }
    setWishlist(updated);
    localStorage.setItem('user_wishlist', JSON.stringify(updated));
  };

  const handlePricePreset = (min: number, max: number) => {
    setPriceRange([min, max]);
    applyFilters(allServices, selectedCategory, searchInput, sortBy, [min, max], minRating, availability);
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
    setPriceRange([0, 5000]);
    setMinRating(null);
    setAvailability('any');
    setServices(allServices);
    router.replace('/services');
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-20">
      
      {/* Search Header Banner */}
      <div className="bg-[#0F3D30] text-white pt-6 pb-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
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
      <div className="bg-[#F3EDE2] border-b border-[#C3AB84]/20 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-4 text-xs font-semibold text-[#0F3D30]/80">
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

      <div className="max-w-7xl mx-auto px-4 mt-6">
        
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

          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 bg-white rounded-3xl p-5 border border-[#C3AB84]/20 shadow-sm space-y-6 h-fit sticky top-24 z-10">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-[#0F3D30] text-sm">Filters</h3>
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
                <button onClick={() => handlePricePreset(1999, 5000)} className={`py-1.5 rounded-xl border text-center transition-colors ${priceRange[0] === 1999 ? 'border-[#0F3D30] bg-[#0F3D30]/5 text-[#0F3D30]' : 'border-gray-200 text-foreground/60'}`}>
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
              <div className="flex items-center gap-2 text-xs">
                <span className="text-foreground/50">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={e => {
                    setSortBy(e.target.value);
                    applyFilters(allServices, selectedCategory, searchInput, e.target.value, priceRange, minRating, availability);
                  }}
                  className="bg-transparent font-bold text-[#0F3D30] focus:outline-none cursor-pointer"
                >
                  <option value="popular">Popularity</option>
                  <option value="rating">Rating</option>
                  <option value="price-asc">Price Low to High</option>
                  <option value="price-desc">Price High to Low</option>
                  <option value="most-booked">Most Booked</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
              <span className="text-[10px] font-semibold text-foreground/50">Showing {services.length} of {allServices.length} services</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl h-64 border border-[#C3AB84]/15 animate-pulse" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service: any) => {
                  const isFav = wishlist.includes(service._id);
                  const isDiscounted = service.discountPercentage > 0;
                  const finalPrice = isDiscounted ? Math.round(service.basePrice * (1 - service.discountPercentage / 100)) : service.basePrice;

                  return (
                    <div key={service._id} className="bg-white border border-[#C3AB84]/20 rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative">
                      
                      {/* Wishlist toggle button */}
                      <button onClick={() => toggleWishlist(service._id)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 border border-gray-100 flex items-center justify-center shadow-sm">
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-foreground/40'}`} />
                      </button>

                      {/* Card Content */}
                      <div>
                        <div className="w-full h-36 rounded-2xl overflow-hidden relative bg-gray-50 mb-3 border border-gray-100">
                          <img 
                            src={service.imageUrl || getFallbackServiceImage(service.categoryId?.name, service.name)} 
                            alt={service.name} 
                            loading="lazy" 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                            {isDiscounted && (
                              <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm w-fit">
                                {service.discountPercentage}% OFF
                              </span>
                            )}
                            {service.isMostBooked && (
                              <span className="bg-[#0F3D30] text-[#C3AB84] text-[8px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider w-fit">
                                Most Booked
                              </span>
                            )}
                            {service.isPopular && (
                              <span className="bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider w-fit">
                                Trending
                              </span>
                            )}
                            {service.newArrival && (
                              <span className="bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider w-fit">
                                New
                              </span>
                            )}
                            {service.isFeatured && (
                              <span className="bg-[#C3AB84] text-[#0F3D30] text-[8px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider w-fit">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#C3AB84] uppercase tracking-wider">
                          <span>{service.categoryId?.name || 'Home Service'}</span>
                        </div>

                        <h3 className="font-serif text-sm font-bold text-[#0F3D30] mt-1">{service.name}</h3>

                        <div className="flex items-center gap-1 text-[10px] text-foreground/60 mt-1">
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-bold text-[#0F3D30]">{service.rating || '4.5'}</span>
                          </span>
                          <span>({service.reviewCount || 0} reviews)</span>
                          <span className="text-foreground/20">•</span>
                          <span>{service.estimatedDurationMins} mins</span>
                        </div>

                        {service.description && (
                          <p className="text-foreground/50 text-[10px] line-clamp-2 mt-2 leading-relaxed">{service.description}</p>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-[#C3AB84]/15 flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-serif text-sm font-black text-[#0F3D30]">₹{finalPrice}</span>
                            {isDiscounted && (
                              <span className="text-[10px] line-through text-foreground/40">₹{service.basePrice}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center w-full">
                          <Link href={`/services/${service.slug}`} className="w-full text-center px-4 py-2 bg-[#0F3D30] text-white font-bold rounded-full text-[11px] hover:bg-[#0F3D30]/90 transition-colors shadow-sm">
                            Book Now
                          </Link>
                        </div>
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
