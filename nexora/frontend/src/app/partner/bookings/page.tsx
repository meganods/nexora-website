"use client";

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, IndianRupee, MapPin, Clock, CalendarDays, Loader2, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck 
} from 'lucide-react';
import api from '@/lib/api';
import ImageUpload from '@/app/admin/_components/ImageUpload';

export default function PartnerActiveJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OTP inputs per-job
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  // Before & After photos per-job
  const [beforePhotos, setBeforePhotos] = useState<Record<string, string>>({});
  const [afterPhotos, setAfterPhotos] = useState<Record<string, string>>({});
  const [etaInputs, setEtaInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchJobs();
  }, []);

  // Live Geolocation Tracking Hook (only for ON_THE_WAY bookings)
  useEffect(() => {
    const activeWayJobs = jobs.filter(j => j.status === 'ON_THE_WAY');
    if (activeWayJobs.length === 0) return;

    const updateTripLocations = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            let addressStr = 'In transit to customer site';
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
              const geo = await res.json();
              if (geo && geo.display_name) addressStr = geo.display_name;
            } catch (err) {
              console.warn("Reverse lookup failed, using fallback.");
            }

            // Update each ON_THE_WAY booking location
            for (const job of activeWayJobs) {
              const etaVal = etaInputs[job._id] ? parseInt(etaInputs[job._id]) : 15;
              await api.put(`/partner/bookings/${job._id}/trip-location`, {
                longitude,
                latitude,
                address: addressStr,
                etaMins: isNaN(etaVal) ? 15 : etaVal
              });
            }
            console.log("Trip locations updated successfully.");
          } catch (apiErr) {
            console.error("Failed to update trip location:", apiErr);
          }
        },
        (geoErr) => console.warn("GPS tracking error:", geoErr),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    updateTripLocations();
    const interval = setInterval(updateTripLocations, 30000);
    return () => clearInterval(interval);
  }, [jobs, etaInputs]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await api.get('/partner/my-requests');
      // Filter operational active statuses including all new workflow states
      const active = (data || []).filter((r: any) => 
        ['ASSIGNED', 'PARTNER_ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'OTP_VERIFICATION', 'IN_PROGRESS'].includes(r.status)
      );
      setJobs(active);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load active bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (id: string) => {
    setActionLoading(id);
    setErrorMsg('');
    try {
      const { data } = await api.patch(`/partner/requests/${id}/status`, {
        status: 'PARTNER_ACCEPTED'
      });
      if (data.success) {
        setSuccessMsg('Booking accepted! You can now start your journey.');
        fetchJobs();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to accept booking.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartJourney = async (id: string) => {
    setActionLoading(id);
    setErrorMsg('');
    try {
      const { data } = await api.patch(`/partner/requests/${id}/status`, {
        status: 'ON_THE_WAY'
      });
      if (data.success) {
        setSuccessMsg('Status updated: On the Way. Live tracking started.');
        fetchJobs();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to start journey.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReachedLocation = async (id: string) => {
    setActionLoading(id);
    setErrorMsg('');
    try {
      const { data } = await api.patch(`/partner/requests/${id}/status`, {
        status: 'ARRIVED'
      });
      if (data.success) {
        setSuccessMsg('Status updated: Arrived at location. Please verify OTP.');
        fetchJobs();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update arrival.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyOtp = async (id: string) => {
    setActionLoading(id);
    setErrorMsg('');
    const otp = otpInputs[id] || '';
    if (!otp) {
      setErrorMsg('Please enter the customer verification OTP.');
      setActionLoading(null);
      return;
    }

    try {
      const { data } = await api.patch(`/partner/requests/${id}/status`, {
        status: 'OTP_VERIFICATION',
        otp
      });
      if (data.success) {
        setSuccessMsg('OTP verified successfully! Please upload Before photos to start work.');
        fetchJobs();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid OTP. Please check the code.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartWork = async (id: string) => {
    setActionLoading(id);
    setErrorMsg('');
    const beforePhotoUrl = beforePhotos[id] || '';
    if (!beforePhotoUrl) {
      setErrorMsg('Before photos are required to start the service work.');
      setActionLoading(null);
      return;
    }

    try {
      const { data } = await api.patch(`/partner/requests/${id}/status`, {
        status: 'IN_PROGRESS',
        beforePhotoUrl
      });
      if (data.success) {
        setSuccessMsg('Work started! Complete the service and upload After photos.');
        fetchJobs();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to start work.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteService = async (id: string) => {
    setActionLoading(id);
    setErrorMsg('');
    const afterPhotoUrl = afterPhotos[id] || '';
    if (!afterPhotoUrl) {
      setErrorMsg('After photos are required to complete this service.');
      setActionLoading(null);
      return;
    }

    try {
      const { data } = await api.patch(`/partner/requests/${id}/status`, {
        status: 'COMPLETED',
        afterPhotoUrl
      });
      if (data.success) {
        setSuccessMsg('Booking marked as completed successfully! Wallet earnings updated.');
        fetchJobs();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to complete service.');
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
            <div key={job._id} className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow-md transition-all">
              <div className="space-y-4 flex-1">
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

                {['OTP_VERIFICATION', 'IN_PROGRESS'].includes(job.status) && (
                  <div className="pt-4 border-t border-gold/10 mt-4 max-w-md">
                    <p className="text-xs font-bold text-primary mb-3">Service Photos Execution (Required)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-foreground/50 uppercase block mb-1">Before Work Image</span>
                        {job.status === 'OTP_VERIFICATION' ? (
                          <ImageUpload
                            label="Before Photo"
                            imageUrl={beforePhotos[job._id] || job.beforePhotoUrl || ''}
                            imagePublicId=""
                            onChange={(url) => setBeforePhotos({ ...beforePhotos, [job._id]: url })}
                          />
                        ) : (
                          <div className="bg-cream/45 border border-gold/10 p-2.5 rounded-2xl text-center text-[10px] text-foreground/60">
                            {beforePhotos[job._id] || job.beforePhotoUrl ? (
                              <img src={beforePhotos[job._id] || job.beforePhotoUrl || ''} alt="Before" className="h-16 w-auto mx-auto object-cover rounded-xl border border-gold/15" />
                            ) : (
                              'No photo uploaded'
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-foreground/50 uppercase block mb-1">After Work Image</span>
                        {job.status === 'IN_PROGRESS' ? (
                          <ImageUpload
                            label="After Photo"
                            imageUrl={afterPhotos[job._id] || job.afterPhotoUrl || ''}
                            imagePublicId=""
                            onChange={(url) => setAfterPhotos({ ...afterPhotos, [job._id]: url })}
                          />
                        ) : (
                          <div className="bg-cream/45 border border-gold/10 p-4 rounded-2xl text-center text-[10px] text-foreground/40">
                            Upload enabled in In Progress step
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 min-w-[240px] md:border-l border-gold/15 md:pl-6 pt-6 md:pt-0">
                {job.status === 'ASSIGNED' ? (
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleAcceptBooking(job._id)}
                      disabled={actionLoading !== null}
                      className="w-full py-2.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === job._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Accept Booking'}
                    </button>
                  </div>
                ) : job.status === 'PARTNER_ACCEPTED' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input 
                        type="number" min={1}
                        placeholder="ETA (in minutes, e.g. 20)"
                        value={etaInputs[job._id] || ''}
                        onChange={e => setEtaInputs({ ...etaInputs, [job._id]: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gold/30 text-center text-xs focus:outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => handleStartJourney(job._id)}
                      disabled={actionLoading !== null}
                      className="w-full py-2.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === job._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Start Journey'}
                    </button>
                  </div>
                ) : job.status === 'ON_THE_WAY' ? (
                  <div className="space-y-2">
                    <div className="bg-[#1D3B31]/5 border border-primary/10 rounded-2xl p-3 text-center space-y-1">
                      <span className="text-[10px] font-bold text-[#1D3B31] block">Live Location Sharing Active</span>
                      <span className="text-[9px] text-foreground/50 block">Sharing GPS coordinates with customer</span>
                    </div>
                    <button 
                      onClick={() => handleReachedLocation(job._id)}
                      disabled={actionLoading !== null}
                      className="w-full py-2.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === job._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reached Location'}
                    </button>
                  </div>
                ) : job.status === 'ARRIVED' ? (
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
                      onClick={() => handleVerifyOtp(job._id)}
                      disabled={actionLoading !== null}
                      className="w-full py-2.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === job._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify OTP'}
                    </button>
                  </div>
                ) : job.status === 'OTP_VERIFICATION' ? (
                  <div className="space-y-2">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-xl px-2 py-1 justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" /> OTP Verified
                    </span>
                    <button 
                      onClick={() => handleStartWork(job._id)}
                      disabled={actionLoading !== null}
                      className="w-full py-2.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === job._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Start Work'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-xl px-2 py-1 justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" /> Work is Started
                    </span>
                    <button 
                      onClick={() => handleCompleteService(job._id)}
                      disabled={actionLoading !== null}
                      className="w-full py-2.5 bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === job._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Complete Service'}
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
