"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, LogOut, CalendarDays, Menu, X, Search, Sparkles, MapPin, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocation } from '@/lib/location';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const { selectedCity, setSelectedCity } = useLocation();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ─── Search State ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any>({ services: [], categories: [], vendors: [], locations: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);          // keyboard nav
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<any[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showCityDropdownMobile, setShowCityDropdownMobile] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const suggestionRefMobile = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Supported cities (live from DB) ───────────────────────────────────────
  const [cities, setCities] = useState<string[]>(["Delhi", "Mumbai", "Bengaluru", "Kolkata", "Chennai"]);

  useEffect(() => {
    const fetchActiveCities = async () => {
      try {
        const res = await api.get('/locations/public/cities?limit=100');
        if (res.data?.success && res.data.data) {
          const names = res.data.data.filter((c: any) => c.isActive).map((c: any) => c.name);
          if (names.length > 0) {
            setCities(names);
            if (!names.includes(selectedCity)) setSelectedCity(names[0]);
          }
        }
      } catch { /* silent */ }
    };
    fetchActiveCities();
  }, [selectedCity, setSelectedCity]);

  // ─── Fetch recent + popular searches on open ────────────────────────────────
  const fetchPreSearchData = useCallback(async () => {
    // Popular from booking aggregation (public, no auth)
    try {
      const { data } = await api.get('/public/services/popular-searches');
      if (data?.success) setPopularSearches(data.data || []);
    } catch { /* silent */ }

    // Recent searches (logged-in only)
    if (user) {
      try {
        const { data } = await api.get('/user/search-history');
        if (data?.success) setRecentSearches(data.data.map((h: any) => h.query));
      } catch { /* silent */ }
    }
  }, [user]);

  useEffect(() => {
    fetchPreSearchData();
  }, [fetchPreSearchData]);

  // ─── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const outsideDesktop = suggestionRef.current && !suggestionRef.current.contains(target);
      const outsideMobile = suggestionRefMobile.current && !suggestionRefMobile.current.contains(target);
      if (outsideDesktop && outsideMobile) {
        setShowSuggestions(false);
        setShowCityDropdown(false);
        setShowCityDropdownMobile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Debounced autocomplete ─────────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setSuggestions({ services: [], categories: [], vendors: [], locations: [] });
      setSearchLoading(false);
      setShowSuggestions(true); // Show recent/popular when empty
      return;
    }

    setSearchLoading(true);
    setShowSuggestions(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/public/services/autocomplete?q=${encodeURIComponent(val.trim())}`);
        setSuggestions(data || { services: [], categories: [], vendors: [], locations: [] });
      } catch {
        setSuggestions({ services: [], categories: [], vendors: [], locations: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 280);
  };

  // ─── Save to history and navigate ──────────────────────────────────────────
  const triggerSearchSubmit = (queryStr: string) => {
    if (!queryStr.trim()) return;
    setShowSuggestions(false);
    setSearchQuery('');
    // Persist to MongoDB for logged-in users (fire-and-forget)
    if (user) {
      api.post('/user/search-history', { query: queryStr.trim() }).catch(() => {});
    }
    router.push(`/services?q=${encodeURIComponent(queryStr.trim())}&city=${encodeURIComponent(selectedCity)}`);
  };

  const removeRecentSearch = async (q: string) => {
    setRecentSearches(prev => prev.filter(r => r !== q));
    if (user) api.delete('/user/search-history', { data: { query: q } }).catch(() => {});
  };

  const clearAllRecent = async () => {
    setRecentSearches([]);
    if (user) api.delete('/user/search-history').catch(() => {});
  };

  // ─── Build flat list for keyboard nav ──────────────────────────────────────
  const flatSuggestions: { label: string; route: string }[] = [
    ...(suggestions.services || []).map((s: any) => ({ label: s.name, route: `/services/${s.slug || s._id}` })),
    ...(suggestions.categories || []).map((c: any) => ({ label: c.name, route: `/services?category=${encodeURIComponent(c.name)}` })),
    ...(suggestions.vendors || []).map((v: any) => ({ label: v.name, route: `/partner/${v._id}` })),
    ...(suggestions.locations || []).map((loc: string) => ({ label: loc, route: `/services?city=${encodeURIComponent(loc)}` })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, flatSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && flatSuggestions[activeIndex]) {
        setShowSuggestions(false);
        setSearchQuery('');
        router.push(flatSuggestions[activeIndex].route);
      } else {
        triggerSearchSubmit(searchQuery);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    router.push('/');
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    if (searchQuery.trim()) handleSearchChange(searchQuery);
  };

  // ─── Skeleton loader ─────────────────────────────────────────────────────────
  const SearchSkeleton = () => (
    <div className="px-4 py-3 space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
          <div className="h-3 bg-gray-100 rounded animate-pulse flex-grow" style={{ width: `${60 + i * 10}%` }} />
        </div>
      ))}
    </div>
  );

  // ─── Reusable suggestion dropdown JSX ───────────────────────────────────────
  const hasResults = suggestions.services?.length > 0 || suggestions.categories?.length > 0 || suggestions.vendors?.length > 0 || suggestions.locations?.length > 0;
  const showPreSearch = !searchQuery.trim() && (recentSearches.length > 0 || popularSearches.length > 0);

  const SuggestionsDropdown = () => {
    let globalIndex = 0;
    const mkItem = (label: string, route: string, icon: React.ReactNode, extra?: string) => {
      const idx = globalIndex++;
      const isActive = idx === activeIndex;
      return (
        <button
          key={`${label}-${idx}`}
          onClick={() => { setSearchQuery(''); setShowSuggestions(false); router.push(route); }}
          className={`w-full text-left px-4 py-2 transition-colors flex items-center gap-2.5 ${isActive ? 'bg-gold/10' : 'hover:bg-cream'}`}
        >
          {icon}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary truncate">{label}</p>
            {extra && <p className="text-[10px] text-foreground/40 truncate">{extra}</p>}
          </div>
        </button>
      );
    };

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gold/20 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
        {searchLoading ? (
          <SearchSkeleton />
        ) : showPreSearch ? (
          <>
            {recentSearches.length > 0 && (
              <div className="px-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] uppercase font-bold text-foreground/40 tracking-wider">Recent Searches</p>
                  <button onClick={clearAllRecent} className="text-[9px] text-foreground/40 hover:text-red-500 transition-colors">Clear all</button>
                </div>
                {recentSearches.slice(0, 5).map((q, i) => (
                  <div key={i} className="flex items-center group">
                    <button onClick={() => triggerSearchSubmit(q)} className="flex items-center gap-2.5 flex-1 py-1.5 text-left hover:text-primary transition-colors">
                      <Clock className="w-3 h-3 text-foreground/30 flex-shrink-0" />
                      <p className="text-xs font-medium text-foreground/70 truncate">{q}</p>
                    </button>
                    <button onClick={() => removeRecentSearch(q)} className="opacity-0 group-hover:opacity-100 p-1 text-foreground/30 hover:text-red-500 transition-all">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {popularSearches.length > 0 && (
              <div className={`px-4 py-2 ${recentSearches.length > 0 ? 'border-t border-gray-50' : ''}`}>
                <p className="text-[9px] uppercase font-bold text-foreground/40 tracking-wider mb-1.5">
                  <TrendingUp className="inline w-2.5 h-2.5 mr-1" />Trending
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {popularSearches.slice(0, 6).map((s, i) => (
                    <button key={i} onClick={() => triggerSearchSubmit(s.name)}
                      className="px-2.5 py-1 rounded-full border border-gold/30 text-[10px] font-semibold text-primary hover:bg-gold/10 hover:border-gold/60 transition-all">
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!recentSearches.length && !popularSearches.length && (
              <div className="px-4 py-6 text-center">
                <Search className="w-6 h-6 text-foreground/20 mx-auto mb-1" />
                <p className="text-xs text-foreground/40">Start typing to search services, categories, or professionals</p>
              </div>
            )}
          </>
        ) : hasResults ? (
          <>
            {suggestions.services?.length > 0 && (
              <>
                <p className="text-[9px] uppercase font-bold text-foreground/40 px-4 pt-2.5 pb-1 tracking-wider">Services</p>
                {suggestions.services.map((s: any) => mkItem(s.name, `/services/${s.slug || s._id}`, <Sparkles className="w-3 h-3 text-gold flex-shrink-0" />))}
              </>
            )}
            {suggestions.categories?.length > 0 && (
              <>
                <p className="text-[9px] uppercase font-bold text-foreground/40 px-4 pt-2 pb-1 tracking-wider border-t border-gray-50 mt-1">Categories</p>
                {suggestions.categories.map((c: any) => mkItem(c.name, `/services?category=${encodeURIComponent(c.name)}`, <MapPin className="w-3 h-3 text-[#C3AB84] flex-shrink-0" />))}
              </>
            )}
            {suggestions.vendors?.length > 0 && (
              <>
                <p className="text-[9px] uppercase font-bold text-foreground/40 px-4 pt-2 pb-1 tracking-wider border-t border-gray-50 mt-1">Professionals</p>
                {suggestions.vendors.map((v: any) => mkItem(v.name, `/partner/${v._id}`, <User className="w-3 h-3 text-emerald-600 flex-shrink-0" />))}
              </>
            )}
            {suggestions.locations?.length > 0 && (
              <>
                <p className="text-[9px] uppercase font-bold text-foreground/40 px-4 pt-2 pb-1 tracking-wider border-t border-gray-50 mt-1">Locations</p>
                {suggestions.locations.map((loc: string) => mkItem(loc, `/services?city=${encodeURIComponent(loc)}`, <MapPin className="w-3 h-3 text-amber-500 flex-shrink-0" />))}
              </>
            )}
          </>
        ) : searchQuery.trim() ? (
          <div className="px-4 py-6 text-center">
            <Search className="w-6 h-6 text-foreground/20 mx-auto mb-1" />
            <p className="text-xs text-foreground/40">No results for "<span className="font-semibold">{searchQuery}</span>"</p>
            <button onClick={() => triggerSearchSubmit(searchQuery)} className="mt-2 text-[10px] font-bold text-primary hover:underline">Search all services →</button>
          </div>
        ) : null}
      </div>
    );
  };



  return (
    <header className="sticky top-0 w-full bg-cream border-b border-gold/20 z-50">
      <div className={pathname?.startsWith('/profile') || pathname?.startsWith('/bookings') 
        ? "w-full flex h-16 sm:h-20 items-center justify-between px-6 md:px-10 gap-4" 
        : "container mx-auto flex h-16 sm:h-20 items-center justify-between px-4 sm:px-8 lg:px-12 gap-4"
      }>

        {/* Logo */}
        <Link href="/" className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-primary flex-shrink-0">
          Nexora
        </Link>

        {/* Combined Location Dropdown + Inline Search Bar */}
        <div className="hidden md:block flex-1 max-w-lg relative" ref={suggestionRef}>
          <div className="flex items-center w-full rounded-full border border-gold bg-cream px-3 py-1 shadow-sm focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary transition-all">
            
            {/* Custom Location Selector Dropdown (Left) */}
            <div className="relative flex items-center gap-1.5 pr-2.5 border-r border-gold/30">
              <button
                type="button"
                onClick={() => {
                  setShowCityDropdown(!showCityDropdown);
                  setShowSuggestions(false);
                }}
                className="flex items-center gap-1 bg-transparent text-xs sm:text-sm font-semibold text-primary focus:outline-none cursor-pointer pr-1 py-1"
              >
                <MapPin className="w-4 h-4 text-gold fill-gold/20 flex-shrink-0" />
                <span>{selectedCity}</span>
              </button>

              {showCityDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gold/20 rounded-xl shadow-xl py-1 z-50 max-h-60 overflow-y-auto">
                  {cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        handleCitySelect(city);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-cream transition-colors ${
                        selectedCity === city ? 'text-primary bg-gold/10' : 'text-foreground/75'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Input Field (Right) */}
            <div className="flex items-center flex-1 min-w-0 pl-2.5 relative">
              <Search className="w-4 h-4 text-gold mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search for AC repair, salon, cleaning..."
                className="w-full py-1.5 bg-transparent text-foreground text-xs sm:text-sm focus:outline-none placeholder-foreground/40 min-w-0"
              />
            </div>
          </div>

          {/* Suggestions Dropdown (Desktop) */}
          {showSuggestions && <SuggestionsDropdown />}
        </div>

        {/* Right — desktop */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {isLoading ? (
            <div className="h-8 w-24 bg-gold/20 rounded-full animate-pulse" />
          ) : user ? (
            <>
              <NotificationBell tokenKey="nexora_token" theme="light" />
              <Link href="/profile" className="flex items-center gap-2 border border-gold/40 rounded-full px-4 py-2 hover:bg-beige transition-all text-primary font-semibold text-sm">
                <User className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Profile</span>
              </Link>
            </>
          ) : (
            <Link href="/login"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Login <span className="text-gray-300 mx-1">|</span> Sign Up
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-2 flex-shrink-0">
          {user && <NotificationBell tokenKey="nexora_token" theme="light" />}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-full hover:bg-beige transition-colors text-foreground">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Row (Mobile Viewports Only) */}
      <div className="md:hidden px-4 pb-3 pt-1 border-t border-gold/10" ref={suggestionRefMobile}>
        <div className="relative">
          <div className="flex items-center w-full rounded-full border border-gold bg-[#FAF6F0] px-3 py-1 shadow-sm focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary transition-all">
            
            {/* Custom Location Selector (Left) */}
            <div className="relative flex items-center gap-1.5 pr-2 border-r border-gold/30 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCityDropdownMobile(!showCityDropdownMobile);
                  setShowSuggestions(false);
                }}
                className="flex items-center gap-1 bg-transparent text-[11px] font-bold text-primary focus:outline-none cursor-pointer pr-1 py-1"
              >
                <MapPin className="w-3.5 h-3.5 text-gold fill-gold/20 flex-shrink-0" />
                <span>{selectedCity}</span>
              </button>

              {showCityDropdownMobile && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gold/20 rounded-xl shadow-xl py-1 z-50 max-h-48 overflow-y-auto">
                  {cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        handleCitySelect(city);
                        setShowCityDropdownMobile(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[10px] font-bold hover:bg-cream transition-colors ${
                        selectedCity === city ? 'text-primary bg-gold/10' : 'text-foreground/75'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Input Field (Right) */}
            <div className="flex items-center flex-1 min-w-0 pl-2 relative">
              <Search className="w-3.5 h-3.5 text-gold mr-1.5 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search AC repair, salon, cleaning..."
                className="w-full py-1.5 bg-transparent text-foreground text-xs focus:outline-none placeholder-foreground/35 min-w-0"
              />
            </div>
          </div>

          {/* Suggestions Dropdown (Mobile) */}
          {showSuggestions && <SuggestionsDropdown />}
        </div>
      </div>

      {/* Mobile Sidebar Backdrop Drawer (Sliding from Right-to-Left, occupying partial width) */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden transition-all duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 right-0 w-[65vw] sm:w-[50vw] max-w-xs bg-[#0F3D30] text-[#FAF6F0] z-50 flex flex-col border-l border-[#C3AB84]/20 h-full overflow-hidden shadow-2xl transition-all duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#C3AB84]/20 flex-shrink-0 flex items-center justify-between">
          <h2 className="font-serif text-sm font-bold text-[#C3AB84]">Menu</h2>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-white/70 hover:text-white font-bold text-lg p-1"
          >
            ×
          </button>
        </div>

        {/* Drawer Menu Items */}
        <div className="flex-grow p-5 space-y-4 overflow-y-auto">
          {isLoading ? (
            <div className="h-8 w-32 bg-gold/20 rounded-full animate-pulse" />
          ) : user ? (
            <>
              <div className="flex items-center gap-2 pb-3 border-b border-[#C3AB84]/20">
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-bold text-gold uppercase text-xs">
                  {user.name?.slice(0, 2)}
                </div>
                <span className="font-semibold text-white truncate text-xs">{user.name}</span>
              </div>

              <Link href="/profile" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-2 text-sm font-medium text-white/80 hover:text-[#C3AB84] hover:bg-white/5 transition-colors rounded-lg px-2">
                <User className="w-4 h-4 flex-shrink-0 text-gold" />
                My Account
              </Link>

              <Link href="/bookings" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-2 text-sm font-medium text-white/80 hover:text-[#C3AB84] hover:bg-white/5 transition-colors rounded-lg px-2">
                <CalendarDays className="w-4 h-4 flex-shrink-0 text-gold" />
                My Bookings
              </Link>
            </>
          ) : (
            <Link href="/login" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-2.5 px-4 bg-[#C3AB84] text-[#0F3D30] text-xs font-bold rounded-xl justify-center transition-all hover:bg-[#b8a078]">
              Login / Sign Up
            </Link>
          )}
        </div>

        {/* Logout Footer */}
        {user && (
          <div className="p-4 border-t border-[#C3AB84]/20 bg-black/10 flex-shrink-0">
            <button
              onClick={() => {
                handleLogout();
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:text-red-200 hover:bg-white/5 transition-all text-left"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              Logout
            </button>
          </div>
        )}
      </aside>
    </header>
  );
}
