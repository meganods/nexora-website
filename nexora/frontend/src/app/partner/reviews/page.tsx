"use client";

import React, { useState, useEffect } from 'react';
import { Star, Loader2, AlertTriangle, User } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/partner/profile');
      if (data?.vendor?.reviews) {
        setReviews(data.vendor.reviews);
      } else {
        // Fallback: search booking records for reviews/ratings
        const bookingsRes = await api.get('/partner/my-requests');
        const reviewed = (bookingsRes.data || []).filter((b: any) => b.review || b.rating);
        setReviews(reviewed.map((b: any) => ({
          _id: b._id,
          rating: b.rating || 5,
          comment: b.review || 'Excellent service completed!',
          customerName: b.userId?.name || 'Customer'
        })));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load customer reviews.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gold/15 pb-4">
        <h1 className="font-serif text-2xl font-bold text-primary">Customer Reviews</h1>
        <p className="text-xs text-foreground/50">Feedback and ratings from your completed service calls</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center">
          <Star className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">No reviews yet</h3>
          <p className="text-xs text-foreground/50 leading-relaxed">
            Reviews will be posted here automatically once customers submit feedback for your completed jobs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(rev => (
            <div key={rev._id} className="bg-white border border-gold/15 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary">{rev.customerName || 'Nexora Customer'}</h4>
                    <p className="text-[10px] text-foreground/40">Verified Booking Client</p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star 
                      key={idx} 
                      className={`w-4 h-4 ${idx < rev.rating ? 'fill-gold text-gold' : 'text-foreground/20'}`} 
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-foreground/75 leading-relaxed bg-cream/10 p-3 rounded-xl border border-gold/5 font-medium">
                "{rev.comment || 'Verified professional work.'}"
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
