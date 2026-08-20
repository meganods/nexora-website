import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

export default function PartnerNewCouponPage() {
  const router = useRouter();
  
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [usageLimit, setUsageLimit] = useState<number | string>('');
  const [perUserLimit, setPerUserLimit] = useState<number | string>('1');
  const [isFirstTimeOnly, setIsFirstTimeOnly] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [applicableCategories, setApplicableCategories] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data } = await api.get('/public/categories');
        if (Array.isArray(data)) setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        code: code.toUpperCase().trim(),
        description,
        discountType,
        discountValue,
        minOrderValue,
        maxDiscountAmount,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        usageLimit: usageLimit ? parseInt(usageLimit.toString()) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit.toString()) : 1,
        isFirstTimeOnly,
        applicableCategories
      };

      const { data } = await api.post('/partner/coupons', payload);
      if (data.success) {
        router.push('/partner/coupons');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit coupon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-gold/15 pb-4">
        <button onClick={() => router.push('/partner/coupons')} className="p-1.5 hover:bg-cream rounded-full transition-colors text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Create New Coupon</h1>
          <p className="text-xs text-foreground/50">Submit a promotional discount code for admin approval</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gold/15 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Coupon Code *</label>
          <input 
            type="text" required value={code} onChange={e => setCode(e.target.value)}
            placeholder="e.g. EXTRA25" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none uppercase font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Description *</label>
          <textarea 
            required value={description} onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Valid on minimum booking value of ₹500" rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Discount Type *</label>
            <select 
              value={discountType} onChange={e => setDiscountType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 bg-white focus:outline-none"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT">Flat Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Discount Value *</label>
            <input 
              type="number" required value={discountValue} onChange={e => setDiscountValue(parseInt(e.target.value) || 0)}
              placeholder="e.g. 25" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Min Booking Value (₹) *</label>
            <input 
              type="number" required value={minOrderValue} onChange={e => setMinOrderValue(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Max Discount Amount (₹)</label>
            <input 
              type="number" value={maxDiscountAmount} onChange={e => setMaxDiscountAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Start Date</label>
            <input 
              type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">End Date</label>
            <input 
              type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Max Total Uses</label>
            <input 
              type="number" value={usageLimit} onChange={e => setUsageLimit(e.target.value)}
              placeholder="e.g. 100" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Uses Per User</label>
            <input 
              type="number" value={perUserLimit} onChange={e => setPerUserLimit(e.target.value)}
              placeholder="e.g. 1" className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer py-1.5">
            <input type="checkbox" checked={isFirstTimeOnly} onChange={e => setIsFirstTimeOnly(e.target.checked)} className="rounded text-[#0F3D30] border-gold/30 focus:ring-[#0F3D30]" />
            <span className="text-xs font-bold text-foreground/75 uppercase tracking-wider">First-time users only</span>
          </label>
        </div>

        {/* Applicable Categories — Interactive Multi-Select Pill Layout */}
        <div>
          <label className="block text-xs font-bold text-foreground/75 mb-1.5 uppercase tracking-wider">Applicable Categories (Empty = All)</label>
          <div className="flex flex-wrap gap-2.5 mt-2 bg-[#F8F4EE] border border-[#C3AB84]/30 rounded-2xl p-4">
            {categories.map((c) => {
              const isSelected = applicableCategories.includes(c._id);
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => {
                    const selected = isSelected
                      ? applicableCategories.filter((id) => id !== c._id)
                      : [...applicableCategories, c._id];
                    setApplicableCategories(selected);
                  }}
                  className={`text-xs px-3.5 py-2 rounded-full font-semibold border transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white border-[#C3AB84]/35 text-[#0F3D30]/85 hover:bg-[#FAF6F0]'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition-all text-xs flex items-center justify-center gap-1.5 mt-4"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
