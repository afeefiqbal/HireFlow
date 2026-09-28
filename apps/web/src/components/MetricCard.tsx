import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'default' | 'emerald' | 'teal' | 'amber' | 'blue' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'border-slate-200 bg-white text-slate-700',
    emerald: 'border-emerald-200 bg-white text-emerald-800',
    teal: 'border-teal-200 bg-white text-teal-800',
    amber: 'border-amber-200 bg-white text-amber-800',
    blue: 'border-blue-200 bg-white text-blue-800',
    purple: 'border-purple-200 bg-white text-purple-800',
  };

  const iconBgStyles = {
    default: 'bg-slate-100 text-slate-600 border border-slate-200',
    emerald: 'bg-emerald-50 text-[#00b074] border border-emerald-100',
    teal: 'bg-teal-50 text-teal-600 border border-teal-100',
    amber: 'bg-amber-50 text-amber-600 border border-amber-100',
    blue: 'bg-blue-50 text-[#2b9bff] border border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border border-purple-100',
  };

  return (
    <div className={`rounded-xl border p-3.5 sm:p-4 transition-all shadow-xs hover:shadow-md hover:border-slate-300 ${variantStyles[variant]} flex flex-col justify-between min-h-[96px]`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug line-clamp-2">{label}</span>
        <div className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg ${iconBgStyles[variant]} shadow-2xs`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{value}</span>
        {subtext && <span className="text-[11px] font-medium text-slate-500">{subtext}</span>}
      </div>
    </div>
  );
};
