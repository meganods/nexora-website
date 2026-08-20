"use client";

import React, { useState, useEffect } from 'react';
import { Heart, Loader2, Star, IndianRupee, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/user/dashboard/wishlist');
      if (data?.success) {
        setWishlist(data.wishlist || []);
      }
    } catch (err: any) {
      console.error("Failed to load wishlist error details:", {
        message: err.message,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
        method: err.config?.method,
        status: err.response?.status,
        data: err.response?.data
      });
      setErrorMsg('Failed to load your wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (id: string, name: string) => {
    try {
      setWishlist(prev => prev.filter(item => item._id !== id));
      await api.post('/user/dashboard/wishlist/toggle', { serviceId: id });
      toast.success(`${name} removed from wishlist`);
      
      // Update local storage representation
      const local = localStorage.getItem('user_wishlist');
      if (local) {
        const list = JSON.parse(local).filter((x: string) => x !== id);
        localStorage.setItem('user_wishlist', JSON.stringify(list));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove item. Please try again.');
      fetchWishlist(); // reload on error to revert state
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gold/15 pb-4">
        <h1 className="font-serif text-3xl font-bold text-primary">My Wishlist</h1>
        <p className="text-xs text-foreground/50">Your handpicked premium services ready for bookings</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <p className="text-xs text-red-700 font-bold">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : wishlist.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-16 text-center">
          <Heart className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">Your wishlist is empty</h3>
          <p className="text-xs text-foreground/50 leading-relaxed max-w-sm mx-auto mb-6">
            Explore Nexora's top categories and save your favorite professional services.
          </p>
          <Link href="/services" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-all shadow-sm">
            Browse Services <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((service) => (
            <div key={service._id} className="bg-white rounded-3xl overflow-hidden border border-gold/20 shadow-sm flex flex-col hover:shadow-md transition-all duration-300 group">
              {/* Image & Heart icon */}
              <div className="relative h-44 bg-slate-100 overflow-hidden flex-shrink-0">
                <img
                  src={service.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80'}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                <button
                  onClick={() => handleRemoveFromWishlist(service._id, service.name)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-gold/20 flex items-center justify-center shadow hover:bg-white transition-all z-10"
                  title="Remove from wishlist"
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-grow justify-between gap-4">
                <div className="space-y-2">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                    <span className="text-xs font-bold text-primary">{(service.rating || 4.7).toFixed(1)}</span>
                    <span className="text-[10px] text-foreground/45">({service.reviewCount || 120}+ reviews)</span>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="font-serif font-bold text-primary text-sm line-clamp-1">{service.name}</h3>
                  <p className="text-xs text-foreground/50 line-clamp-2 leading-relaxed">{service.description || 'Verified professional home service.'}</p>
                </div>

                {/* Price & Book now action */}
                <div className="pt-3 border-t border-gold/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-foreground/40 block">Starting price</span>
                    <span className="font-serif font-bold text-primary text-base flex items-center gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5" />{service.basePrice}
                    </span>
                  </div>
                  <Link
                    href={
                      service.type === 'deal'
                        ? `/deals/${service.slug || service._id}`
                        : service.type === 'package'
                          ? `/packages/${service.slug || service._id}`
                          : `/services/${service.slug || service._id}`
                    }
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/95 transition-all shadow-sm"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
