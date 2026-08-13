"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Tag, AlertTriangle, Loader2, ArrowRight, Star, X } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review Modal State
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const statusParam = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
      const { data } = await api.get(`/user/dashboard/bookings?type=history&page=${page}&limit=5${statusParam}`);
      if (data?.success) {
        setBookings(data.data || []);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load booking history.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    try {
      setSubmittingReview(true);
      const { data } = await api.post('/user/dashboard/reviews', {
        bookingId: selectedBooking._id,
        rating,
        reviewText
      });

      if (data?.success) {
        alert('Review submitted successfully! It will appear publicly once approved by admin.');
        setSelectedBooking(null);
        setReviewText('');
        setRating(5);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
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
      <div className="border-b border-gold/15 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Booking History</h1>
          <p className="text-xs text-foreground/50">Browse completed, cancelled, and past invoices</p>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-foreground/60 uppercase">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gold/20 rounded-xl bg-white text-xs font-semibold px-3 py-2 text-primary focus:outline-none"
          >
            <option value="ALL">All Past Bookings</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center">
          <Calendar className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">No past bookings</h3>
          <p className="text-xs text-foreground/50 leading-relaxed max-w-md mx-auto">
            You don't have any bookings matching this filter in your history.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const serviceName = b.serviceId?.name || b.packageId?.name || 'Home Service';
            const price = b.finalPrice || b.serviceId?.basePrice || b.packageId?.basePrice || 0;
            const isCompleted = b.status === 'COMPLETED';

            return (
              <div key={b._id} className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gold/30 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-sm text-primary">{serviceName}</h3>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isCompleted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/55 font-mono">
                    ID: {String(b._id).toUpperCase()} · Created: {new Date(b.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-bold text-primary">Price Paid: ₹{price.toLocaleString('en-IN')}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/bookings/${b._id}`} className="text-xs font-bold bg-primary/5 text-primary border border-primary/10 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all">
                    View Details
                  </Link>
                  {isCompleted && (
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="text-xs font-bold bg-gold text-primary px-4 py-2 rounded-xl hover:bg-gold/80 transition-all flex items-center gap-1"
                    >
                      <Star className="w-4 h-4 text-primary fill-primary" /> Rate &amp; Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 border border-gold/20 text-xs font-bold rounded-xl disabled:opacity-50 hover:bg-white text-primary"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-primary font-mono">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 border border-gold/20 text-xs font-bold rounded-xl disabled:opacity-50 hover:bg-white text-primary"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review & Ratings Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl border border-gold/30 w-full max-w-md p-6 relative">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-cream rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h3 className="font-serif text-lg font-bold text-primary mb-4">Rate &amp; Review Service</h3>
            
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-2 py-4 border-b border-gold/10">
                <p className="text-xs font-semibold text-foreground/50 uppercase">Your rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-gold"
                    >
                      <Star className={`w-8 h-8 ${rating >= star ? 'fill-gold' : 'text-gold/30'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">Written Review</label>
                <textarea
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this service partner..."
                  className="w-full border border-gold/20 rounded-xl px-3 py-2 text-sm h-28 focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
