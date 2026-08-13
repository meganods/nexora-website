"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, CalendarDays, Menu, X, Search, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocation } from '@/lib/location';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const { selectedCity, setSelectedCity } = useLocation();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Search and Suggestions State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Supported cities list (derived dynamically from database)
  const [cities, setCities] = useState<string[]>(["Delhi", "Mumbai", "Bengaluru", "Kolkata", "Chennai"]);

  useEffect(() => {
    const fetchActiveCities = async () => {
      try {
        const res = await api.get('/locations/public/cities?limit=100');
        if (res.data?.success && res.data.data) {
          const names = res.data.data.filter((c: any) => c.isActive).map((c: any) => c.name);
          if (names.length > 0) {
            setCities(names);
            if (!names.includes(selectedCity)) {
              setSelectedCity(names[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load active cities:", err);
      }
    };
    fetchActiveCities();
  }, [selectedCity, setSelectedCity]);

  useEffect(() => {
    // Close suggestions if clicked outside
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Query search endpoint with current query and selected city
      const { data } = await api.get(`/public/services/search?q=${encodeURIComponent(val)}&city=${encodeURIComponent(selectedCity)}`);
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (e) {
      console.error("Suggestions search failed:", e);
    }
  };

  const triggerSearchSubmit = (queryStr: string) => {
    if (!queryStr.trim()) return;
    setShowSuggestions(false);
    // Route to services list page passing the query parameter 'q'
    router.push(`/services?q=${encodeURIComponent(queryStr.trim())}&city=${encodeURIComponent(selectedCity)}`);
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    router.push('/');
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    // Re-trigger search suggestion filtering if searchQuery has text
    if (searchQuery.trim()) {
      handleSearchChange(searchQuery);
    }
  };

  return (
    <header className="w-full bg-cream border-b border-gold/20 relative z-50">
      <div className="container mx-auto flex h-16 sm:h-20 items-center justify-between px-4 sm:px-8 lg:px-12 gap-4">

        {/* Logo */}
        <Link href="/" className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-primary flex-shrink-0">
          Nexora
        </Link>

        {/* Combined Location Dropdown + Inline Search Bar */}
        <div className="flex-1 max-w-lg relative" ref={suggestionRef}>
          <div className="flex items-center w-full rounded-full border border-gold bg-cream px-3 py-1 shadow-sm focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary transition-all">
            
            {/* Location Selector Drodown (Left) */}
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-gold/30">
              <MapPin className="w-4 h-4 text-gold fill-gold/20 flex-shrink-0" />
              <select
                value={selectedCity}
                onChange={e => handleCitySelect(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-primary focus:outline-none cursor-pointer pr-1"
              >
                {cities.map((city) => (
                  <option key={city} value={city} className="bg-white text-foreground font-sans">
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input Field (Right) */}
            <div className="flex items-center flex-1 min-w-0 pl-2.5 relative">
              <Search className="w-4 h-4 text-gold mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                onKeyDown={e => e.key === 'Enter' && triggerSearchSubmit(searchQuery)}
                placeholder="Search for AC repair, salon, cleaning..."
                className="w-full py-1.5 bg-transparent text-foreground text-xs sm:text-sm focus:outline-none placeholder-foreground/40 min-w-0"
              />
            </div>
          </div>

          {/* Suggestions List */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gold/20 rounded-2xl shadow-xl z-50 py-2 overflow-hidden">
              <p className="text-[10px] uppercase font-bold text-foreground/45 px-4 py-1.5 tracking-wider">Available in {selectedCity}</p>
              {suggestions.map((s) => (
                <button
                  key={s._id}
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                    router.push(`/services/${s.slug || s._id}`);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-cream transition-colors flex items-center gap-2.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary truncate leading-tight">{s.name}</p>
                    {s.categoryId?.name && <p className="text-[10px] text-foreground/45 mt-0.5 truncate">{s.categoryId.name}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
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

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gold/20 shadow-lg z-40 px-4 py-5 space-y-3">
          {isLoading ? (
            <div className="h-8 w-32 bg-gold/20 rounded-full animate-pulse" />
          ) : user ? (
            <>
              <div className="flex items-center gap-2 pb-3 border-b border-gold/20">
                <User className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="font-semibold text-primary truncate">{user.name}</span>
              </div>
              <Link href="/profile" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                <User className="w-4 h-4 flex-shrink-0 text-primary" />
                My Account
              </Link>

              <Link href="/bookings" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                <CalendarDays className="w-4 h-4 flex-shrink-0 text-primary" />
                My Bookings
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-2 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors w-full text-left border-t border-gold/10 pt-3">
                <LogOut className="w-4 h-4 flex-shrink-0" />
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-primary">
              Login / Sign Up
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
