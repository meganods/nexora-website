"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Building, Globe, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

export default function CustomerLocationsPage() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any>({ countries: [], states: [], cities: [], areas: [], pincodes: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/locations/public');
      if (res.data?.success) {
        setLocations(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await api.get(`/locations/public/search?q=${searchQuery}`);
        if (res.data?.success) {
          setSearchResults(res.data.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const activeStates = locations.states || [];
  const activeCities = locations.cities || [];
  const activeAreas = locations.areas || [];
  const activePincodes = locations.pincodes || [];

  const popularCities = activeCities.filter((c: any) => c.popular);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0F3D30] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#F8F4EE] min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary text-white py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(195,171,132,0.15),transparent)] pointer-events-none" />
        <div className="container mx-auto max-w-4xl space-y-4">
          <span className="text-[#C3AB84] text-xs font-bold uppercase tracking-widest block">Coverage Area</span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">We Currently Serve</h1>
          <p className="text-white/70 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Nexora is expanding rapidly. Search for your city, area, or pincode to check service availability at your doorstep.
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto relative mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search city, area, or pincode..."
              className="w-full pl-12 pr-4 py-3.5 rounded-full border border-gold/30 focus:outline-none focus:ring-2 focus:ring-gold bg-white text-foreground text-sm shadow-lg transition-all"
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12 space-y-16">
        {/* Search Results Drawer */}
        {searchQuery.trim() !== '' && (
          <div className="bg-white rounded-3xl border border-gold/20 p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-[#0F3D30] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold" /> Search Results for &ldquo;{searchQuery}&rdquo;
            </h2>
            {searchResults.length === 0 ? (
              <p className="text-sm text-foreground/50 italic">No matching serviceable locations found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map((res: any) => (
                  <div key={res.id} className="p-4 border border-gold/10 hover:border-gold/30 rounded-2xl bg-[#F8F4EE] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider block w-fit mb-1">{res.type}</span>
                      <p className="text-sm font-semibold text-primary">{res.display}</p>
                    </div>
                    <Link href={`/services?city=${res.name}`} className="p-1.5 bg-primary text-white rounded-full hover:bg-primary/95 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular Cities */}
        {popularCities.length > 0 && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0F3D30] text-center">Popular Cities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {popularCities.map((city: any) => (
                <Link
                  href={`/services?city=${city.name}`}
                  key={city._id}
                  className="bg-white border border-gold/15 rounded-3xl p-5 text-center hover:shadow-md transition-all group hover:-translate-y-0.5"
                >
                  <Building className="w-8 h-8 text-gold mx-auto mb-3 group-hover:scale-105 transition-transform" />
                  <h3 className="font-serif font-bold text-[#0F3D30] text-sm sm:text-base">{city.name}</h3>
                  <p className="text-[10px] text-foreground/45 mt-1 font-semibold uppercase tracking-wider">Service Active</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* State Wise Hierarchy Listings */}
        <div className="space-y-6">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0F3D30]">Browse Locations We Serve</h2>
          {activeStates.length === 0 ? (
            <p className="text-sm text-foreground/40 italic">No locations configured yet.</p>
          ) : (
            <div className="space-y-8">
              {activeStates.map((state: any) => {
                const stateCities = activeCities.filter((c: any) => (c.stateId?._id || c.stateId) === state._id);
                if (stateCities.length === 0) return null;

                return (
                  <div key={state._id} className="bg-white rounded-3xl border border-gold/20 p-6 sm:p-8 space-y-6 shadow-sm">
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0F3D30] flex items-center gap-2 border-b pb-3">
                      <Globe className="w-5 h-5 text-gold" /> {state.name}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {stateCities.map((city: any) => {
                        const cityAreas = activeAreas.filter((a: any) => (a.cityId?._id || a.cityId) === city._id);
                        return (
                          <div key={city._id} className="space-y-3 p-4 border border-gold/10 rounded-2xl bg-[#F8F4EE]/40">
                            <h4 className="font-serif font-bold text-primary text-base flex items-center justify-between">
                              <span>{city.name}</span>
                              <Link href={`/services?city=${city.name}`} className="text-xs text-gold font-bold hover:underline flex items-center gap-0.5">
                                Book Services <ArrowRight className="w-3 h-3" />
                              </Link>
                            </h4>

                            {cityAreas.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Active Areas</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {cityAreas.map((area: any) => {
                                    const areaPincodes = activePincodes.filter((p: any) => (p.areaId?._id || p.areaId) === area._id);
                                    const pincodeText = areaPincodes.length > 0 ? ` (${areaPincodes.map((p: any) => p.code).join(', ')})` : '';
                                    return (
                                      <Link
                                        key={area._id}
                                        href={`/services?city=${city.name}&area=${area.name}`}
                                        className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-primary border border-gold/15 hover:border-gold/45 transition-colors"
                                      >
                                        {area.name}{pincodeText}
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-foreground/40 italic">Entire city area serviceable.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic SEO Landing Copy Section */}
        {activeCities.length > 0 && (
          <div className="bg-primary/5 border border-gold/15 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0F3D30] text-center">Services in Major Locations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCities.slice(0, 6).map((city: any) => (
                <div key={city._id} className="space-y-2">
                  <h3 className="font-serif font-bold text-[#0F3D30] text-sm">Services available in {city.name}</h3>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Get premium home cleaning, expert plumbing, professional salon services, and appliance repair at your doorstep in {city.name}. Fully verified service professionals.
                  </p>
                  <Link href={`/services?city=${city.name}`} className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1">
                    Book in {city.name} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
