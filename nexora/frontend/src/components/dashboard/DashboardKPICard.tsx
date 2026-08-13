import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardKPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  bg?: string;
  text?: string;
  trend?: string;
}

export default function DashboardKPICard({
  label,
  value,
  icon: Icon,
  bg = 'bg-primary/10',
  text = 'text-primary',
  trend
}: DashboardKPICardProps) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-gold/20 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-gold/30">
      <div className="flex items-center gap-2.5">
        <div className={`w-8.5 h-8.5 rounded-full ${bg} flex items-center justify-center ${text} flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-[10px] text-foreground/55 uppercase tracking-wider font-semibold truncate leading-none mt-0.5">{label}</p>
      </div>
      <div className="mt-4">
        <p className="text-xl sm:text-2xl font-bold text-primary font-serif tracking-tight leading-none">{value}</p>
        {trend && (
          <p className="text-[11px] font-bold mt-2 flex items-center gap-1">
            <span className={trend.startsWith('-') ? 'text-red-500' : 'text-green-500'}>{trend}</span>
            <span className="text-foreground/45 font-semibold text-[10px]">from last month</span>
          </p>
        )}
      </div>
    </div>
  );
}
