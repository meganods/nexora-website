"use client";

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, IndianRupee, MapPin, Clock, CalendarDays, Loader2, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck 
} from 'lucide-react';
import api from '@/lib/api';

export default function PartnerActiveJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OTP inputs per-job
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/partner/my-requests');
      // Filter operational active statuses
      const active = (data || []).filter((r: any) => ['ASSIGNED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
      setJobs(active);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load active jobs.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartJob = async (id: string) => {
    setActionLoading(id);
    setErrorMsg('');
    const otp = otpInputs[id] || '';
    if (!otp) {
      setErrorMsg('Please enter the customer verification OTP to start the job.');
      setActionLoading(null);
      return;
    }

    try {
      const { data } = await api.patch(`/partner/requests/${id}/status`, {
        status: 'IN_PROGRESS',
        otp
      });
      if (data.success) {
        setSuccessMsg('Job started successfully! Proceed with service execution.');
        fetchJobs();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid OTP. Please request the customer for the correct OTP code.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteJob = async (id: string) => {
    setActionLoading(id);
    setErrorMsg('');
    try {
      const { data } = await api.patch(`/partner/requests/${id}/status`, {
        status: 'COMPLETED'
      });
      if (data.success) {
        setSuccessMsg('Job marked as completed successfully! Wallet earnings updated.');
        fetchJobs();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to complete job.');
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
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Active Bookings</h1>
        <p className="text-xs text-foreground/50">Manage and complete your accepted service bookings</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-2 items-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs text-emerald-700 font-bold leading-normal">{successMsg}</p>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <Briefcase className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="font-serif text-base font-bold text-primary mb-1">No active bookings</h3>
          <p className="text-xs text-foreground/50 leading-relaxed">
            Go to "Accept Bookings" to review and accept pending service requests.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map(job => (
            <div key={job._id} className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-wider bg-gold/10 px-2.5 py-0.5 rounded-full">
                    {job.serviceId?.name || 'Home Service'}
                  </span>
                  <span className="text-xs font-bold text-foreground/60">Status: {job.status}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-foreground/60">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{job.location?.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'Scheduled Date'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{job.scheduledSlot}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-gold flex-shrink-0" />
                    <span className="font-bold">₹{job.finalPrice}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[240px] md:border-l border-gold/15 md:pl-6 pt-6 md:pt-0">
                {job.status === 'ASSIGNED' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input 
                        type="text" maxLength={4}
                        placeholder="Enter 4-Digit OTP"
                        value={otpInputs[job._id] || ''}
                        onChange={e => setOtpInputs({ ...otpInputs, [job._id]: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gold/30 text-center font-mono font-bold focus:outline-none text-xs"
                      />
                    </div>
                    <button 
                      onClick={() => handleStartJob(job._id)}
                      disabled={actionLoading !== null}
                      className="w-full py-2.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === job._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify OTP & Start Job'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-xl px-2 py-1 justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" /> Job is Verified
                    </span>
                    <button 
                      onClick={() => handleCompleteJob(job._id)}
                      disabled={actionLoading !== null}
                      className="w-full py-2.5 bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === job._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Complete Job & Request Payment'}
                    </button>
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
