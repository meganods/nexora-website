"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, IndianRupee, MapPin, Clock, CalendarDays, Loader2, AlertTriangle, ArrowRight 
} from 'lucide-react';
import api from '@/lib/api';

export default function PartnerRequestsPage() {
  const router = useRouter();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/partner/available-requests');
      setRequests(data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load available service requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    setErrorMsg('');
    try {
      const { data } = await api.post(`/partner/requests/${id}/accept`);
      if (data.success) {
        router.push('/partner/jobs');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to accept request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    setErrorMsg('');
    try {
      await api.post(`/partner/requests/${id}/reject`, { reason: 'Declined by partner' });
      fetchRequests();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setActionLoading(null);
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
      <div className="flex items-center justify-between border-b border-gold/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Accept Bookings</h1>
          <p className="text-xs text-foreground/50">Review and accept incoming service requests</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">No booking requests yet</h3>
          <p className="text-xs text-foreground/50 leading-relaxed">
            Ensure you are online and have matching services in your profile. New booking requests will appear here once the assignment engine matches you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map(req => (
            <div key={req._id} className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-gold/30 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-wider bg-gold/10 px-2.5 py-0.5 rounded-full">
                    {req.serviceId?.name || 'General Service'}
                  </span>
                  <span className="font-serif font-bold text-primary text-base flex items-center">
                    <IndianRupee className="w-4 h-4" /> {req.finalPrice || req.serviceId?.basePrice}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-foreground/60">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{req.location?.address || 'Service Locality'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{req.scheduledDate ? new Date(req.scheduledDate).toLocaleDateString() : 'Scheduled Date'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{req.scheduledSlot || 'Scheduled Slot'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gold/10 mt-6">
                <button 
                  onClick={() => handleReject(req._id)}
                  disabled={actionLoading !== null}
                  className="w-1/3 py-2.5 border border-red-200 text-red-700 hover:bg-red-50/20 text-xs font-bold rounded-full transition-all"
                >
                  Decline
                </button>
                <button 
                  onClick={() => handleAccept(req._id)}
                  disabled={actionLoading !== null}
                  className="w-2/3 py-2.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5"
                >
                  {actionLoading === req._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Accept Booking'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
