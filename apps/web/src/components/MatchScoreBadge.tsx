import React from 'react';
import { RecommendationType, AIMatchResult } from '@ai-job-agent/shared';
import { Sparkles, HelpCircle } from 'lucide-react';

interface MatchScoreBadgeProps {
  match?: AIMatchResult | null;
  score?: number | null;
  recommendation?: RecommendationType | null;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  match,
  score: fallbackScore,
  recommendation: fallbackRecommendation,
  size = 'md',
  compact = false,
}) => {
  const overallScore = match?.overall_match ?? fallbackScore;
  const recommendation = match?.recommendation ?? fallbackRecommendation;

  // Before AI analysis: Show "Not Analyzed"
  if (overallScore === null || overallScore === undefined) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
        <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-semibold">Not Analyzed</span>
      </div>
    );
  }

  // Color coding
  let colorClasses = 'border-emerald-200 bg-emerald-50/70 text-emerald-800';
  let badgeClasses = 'bg-[#00b074] text-white border-transparent';
  let ringClasses = 'text-[#00b074]';

  if (overallScore < 65 || recommendation === 'SKIP') {
    colorClasses = 'border-rose-200 bg-rose-50/70 text-rose-800';
    badgeClasses = 'bg-rose-600 text-white border-transparent';
    ringClasses = 'text-rose-600';
  } else if (overallScore < 80 || recommendation === 'REVIEW') {
    colorClasses = 'border-amber-200 bg-amber-50/70 text-amber-800';
    badgeClasses = 'bg-amber-600 text-white border-transparent';
    ringClasses = 'text-amber-600';
  }

  // Compact badge for tight spaces
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-xs ${colorClasses}`}>
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-bold">{overallScore}% Match</span>
        {recommendation && (
          <span className={`ml-1 rounded px-1.5 py-0.5 text-[9px] uppercase font-black ${badgeClasses}`}>
            {recommendation}
          </span>
        )}
      </div>
    );
  }

  const visaScore =
    match?.visa_compatibility === 'compatible'
      ? 100
      : match?.visa_compatibility === 'unknown'
      ? 70
      : 30;

  return (
    <div className={`rounded-xl border p-3.5 shadow-xs max-w-xs text-right sm:text-left ${colorClasses}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-[#00b074]" />
          Match Intelligence
        </span>
        {recommendation && (
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-xs ${badgeClasses}`}>
            {recommendation}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className={`text-2xl font-black tracking-tight ${ringClasses}`}>
          {overallScore}%
        </div>
        <span className="text-[10px] text-slate-500 font-medium">
          Ground Truth Verified
        </span>
      </div>

      {match && (
        <div className="mt-2.5 pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center justify-between text-slate-600">
            <span>Technical</span>
            <span className="font-bold text-slate-900">{match.technical_match}%</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Experience</span>
            <span className="font-bold text-slate-900">{match.experience_match}%</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Location</span>
            <span className="font-bold text-slate-900">{match.location_match}%</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Visa</span>
            <span className="font-bold text-slate-900">{visaScore}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
