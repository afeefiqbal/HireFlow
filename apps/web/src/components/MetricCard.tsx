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
    default: 'text-slate-400 border-slate-800 bg-slate-900/60',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20',
    teal: 'text-teal-400 border-teal-500/20 bg-teal-950/20',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-950/20',
    blue: 'text-blue-400 border-blue-500/20 bg-blue-950/20',
    purple: 'text-purple-400 border-purple-500/20 bg-purple-950/20',
  };

  const iconBgStyles = {
    default: 'bg-slate-800 text-slate-300',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    teal: 'bg-teal-500/10 text-teal-400 border border-teal-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
  };

  return (
    <div className={`rounded-xl border p-4 transition-all hover:border-slate-700 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBgStyles[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {subtext && <span className="text-xs text-slate-400">{subtext}</span>}
      </div>
    </div>
  );
};
