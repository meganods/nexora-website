"use client";

import React, { useState, useEffect } from 'react';
import { IndianRupee, ArrowUpRight, ArrowDownRight, Loader2, AlertTriangle, TrendingUp, CheckCircle2, Briefcase } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerWalletPage() {
  const [balance, setBalance] = useState(0);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchWalletAndTransactions();
  }, []);

  const fetchWalletAndTransactions = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [profileRes, bookingsRes] = await Promise.all([
        api.get('/partner/profile'),
        api.get('/partner/my-requests')
      ]);

      if (profileRes.data?.vendor) {
        const v = profileRes.data.vendor;
        setBalance(v.walletBalance || 0);
        setBankDetails(v.bankDetails);
      }

      // Build transactions from ALL completed bookings
      const allBookings: any[] = bookingsRes.data || [];
      const completed = allBookings.filter((r: any) => r.status === 'COMPLETED');
      setCompletedCount(completed.length);

      const txs = completed.map((r: any) => {
        const paid = r.paymentDetails?.amount || r.finalPrice || r.totalAmount || 0;
        const platformFee = r.customerPlatformFee || 0;
        const commission = r.commissionAmount || 0;
        const earning = Math.max(0, paid - platformFee - commission);
        return {
          id: r._id,
          description: `Payout for ${r.serviceId?.name || 'Home Service'}`,
          date: r.updatedAt
            ? new Date(r.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })
            : 'Recent',
          amount: earning,
          rawPaid: paid,
          type: 'credit',
        };
      });

      // Sort newest first
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txs);
      setTotalEarned(txs.reduce((sum, t) => sum + t.amount, 0));

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load wallet balance and transaction logs.');
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
        <h1 className="font-serif text-2xl font-bold text-primary">Earnings & Wallet</h1>
        <p className="text-xs text-foreground/50">Track your completed jobs and payout logs</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gold/15 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gold uppercase tracking-wider">Available Balance</p>
            <p className="font-serif text-xl font-bold text-primary">₹{balance.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white border border-gold/15 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gold uppercase tracking-wider">Total Earned</p>
            <p className="font-serif text-xl font-bold text-primary">₹{totalEarned.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white border border-gold/15 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gold uppercase tracking-wider">Bookings Completed</p>
            <p className="font-serif text-xl font-bold text-primary">{completedCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bank Details Card */}
        <div className="lg:col-span-1 bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">Total Available Balance</span>
            <div className="flex items-center text-primary font-serif text-3xl font-bold">
              <IndianRupee className="w-7 h-7 flex-shrink-0" />
              <span>{balance.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-foreground/50 leading-relaxed">
              Earnings are calculated dynamically based on completed bookings minus the standard platform commissions.
            </p>
          </div>

          <div className="border-t border-gold/10 pt-4 space-y-3">
            <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">Associated Bank Account</span>
            {bankDetails?.accountNumber ? (
              <div className="text-xs text-foreground/70 space-y-1 bg-cream/30 p-3 rounded-xl border border-gold/10 font-mono">
                <p><span className="font-sans font-bold text-primary">Bank:</span> {bankDetails.bankName}</p>
                <p><span className="font-sans font-bold text-primary">A/C:</span> XXXXXX{bankDetails.accountNumber.slice(-4)}</p>
                <p><span className="font-sans font-bold text-primary">IFSC:</span> {bankDetails.ifscCode}</p>
              </div>
            ) : (
              <p className="text-xs text-foreground/50">No bank details added yet.</p>
            )}
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="lg:col-span-2 bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-primary text-base">All Transactions</h3>
            <span className="text-xs text-foreground/40">{transactions.length} records</span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Briefcase className="w-8 h-8 text-foreground/20 mx-auto" />
              <p className="text-xs text-foreground/45">
                No transactions yet. Transactions are recorded automatically on job completion.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-cream max-h-[420px] overflow-y-auto pr-1">
              {transactions.map(tx => (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-primary">{tx.description}</p>
                      <p className="text-[10px] text-foreground/40 mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 whitespace-nowrap">
                    + ₹{tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
