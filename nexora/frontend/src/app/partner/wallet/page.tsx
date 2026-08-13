"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, IndianRupee, ArrowDownRight, ArrowUpRight, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerWalletPage() {
  const [balance, setBalance] = useState(0);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  
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

        // Populate transactions from completed bookings
        const completed = (bookingsRes.data || []).filter((r: any) => r.status === 'COMPLETED');
        const txs = completed.map((r: any) => ({
          id: r._id,
          description: `Payout for ${r.serviceId?.name || 'Home Service'}`,
          date: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : 'Recent',
          amount: r.finalPrice || 0,
          type: 'credit'
        }));
        setTransactions(txs);
      }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Wallet Balance Card */}
        <div className="lg:col-span-1 bg-white border border-gold/15 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
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
          <h3 className="font-serif font-bold text-primary text-base">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-foreground/45">
              No transactions logged. Transactions are recorded automatically on job completion.
            </div>
          ) : (
            <div className="divide-y divide-cream">
              {transactions.map(tx => (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-primary">{tx.description}</p>
                      <p className="text-[10px] text-foreground/40 mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 flex items-center">
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
