import React from 'react';
import { ShoppingBag, UserPlus, CheckCircle, Percent, IndianRupee } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'booking' | 'partner' | 'service_approve' | 'coupon_approve' | 'payout';
  title: string;
  subtitle: string;
  time: string;
}

interface DashboardActivityFeedProps {
  activities?: ActivityItem[];
}

export default function DashboardActivityFeed({
  activities = [
    { id: '1', type: 'booking', title: 'New Booking Request', subtitle: 'A/C service booked by Amit S.', time: '5 mins ago' },
    { id: '2', type: 'partner', title: 'New Partner Onboarded', subtitle: 'Rahul Sharma completed GST KYC validation.', time: '1 hr ago' },
    { id: '3', type: 'service_approve', title: 'Service Request Approved', subtitle: 'AC Deep Clean approved for Partner Rahul.', time: '2 hrs ago' },
    { id: '4', type: 'coupon_approve', title: 'Promotion Activated', subtitle: 'SAVE20 global promo approved.', time: '1 day ago' },
    { id: '5', type: 'payout', title: 'Payout Released', subtitle: '₹14,500 payout cleared for ProCleaners.', time: '2 days ago' }
  ]
}: DashboardActivityFeedProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return { Icon: ShoppingBag, bg: 'bg-green-50', text: 'text-green-600' };
      case 'partner':
        return { Icon: UserPlus, bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'service_approve':
        return { Icon: CheckCircle, bg: 'bg-purple-50', text: 'text-purple-600' };
      case 'coupon_approve':
        return { Icon: Percent, bg: 'bg-amber-50', text: 'text-amber-600' };
      default:
        return { Icon: IndianRupee, bg: 'bg-pink-50', text: 'text-pink-600' };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="font-serif font-bold text-primary text-sm mb-1">Live Activity Feed</h3>
        <p className="text-[10px] text-foreground/45 font-semibold uppercase tracking-wider mb-6">Real-time Platform Updates</p>
      </div>
      <div className="space-y-4">
        {activities.map(item => {
          const config = getIcon(item.type);
          return (
            <div key={item.id} className="flex gap-3 items-start border-b border-cream last:border-b-0 pb-3 last:pb-0">
              <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center ${config.text} flex-shrink-0`}>
                <config.Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-primary leading-tight">{item.title}</h4>
                <p className="text-[10px] text-foreground/60 leading-normal truncate">{item.subtitle}</p>
                <span className="text-[9px] font-semibold text-foreground/40 block mt-0.5">{item.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
