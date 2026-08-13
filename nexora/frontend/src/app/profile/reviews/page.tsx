"use client";

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function UserReviewsPage() {
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
      const { data } = await api.get('/user/dashboard/reviews');
      if (data?.success) {
        setReviews(data.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load submitted reviews.');
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
        <h1 className="font-serif text-2xl font-bold text-primary">Reviews &amp; Ratings</h1>
        <p className="text-xs text-foreground/50">Manage reviews and view approvals status of your completed orders</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">No reviews yet</h3>
          <p className="text-xs text-foreground/50 leading-relaxed max-w-sm mx-auto">
            You will be able to write reviews for services once they are completed by a Service Partner.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r._id}
              className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-4 hover:border-gold/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-primary">
                    {r.serviceId?.name || 'Home Service'}
                  </h4>
                  <p className="text-[10px] text-foreground/45 mt-0.5">
                    Service Partner: {r.vendorId?.name || 'Partner Assigned'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center text-gold">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${r.rating >= star ? 'fill-gold' : 'text-gold/20'}`}
                      />
                    ))}
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase font-mono tracking-wider ${
                    r.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    r.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {r.approvalStatus}
                  </span>
                </div>
              </div>

              <div className="bg-cream/10 border border-gold/10 rounded-2xl p-4">
                <p className="text-xs text-foreground/80 leading-relaxed italic">
                  "{r.reviewText}"
                </p>

                {r.vendorReply && (
                  <div className="mt-3 pt-3 border-t border-gold/10 pl-4 border-l-2 border-primary">
                    <p className="text-[10px] font-bold text-primary">Partner Reply:</p>
                    <p className="text-[11px] text-foreground/70 mt-0.5 leading-normal italic">
                      "{r.vendorReply}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
