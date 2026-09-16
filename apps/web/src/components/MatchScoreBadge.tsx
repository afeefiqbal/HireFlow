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
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-400">
        <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
        <span className="font-medium">Not Analyzed</span>
      </div>
    );
  }

  // Color coding
  let colorClasses = 'border-teal-500/30 bg-teal-950/40 text-teal-300';
  let badgeClasses = 'bg-teal-500/20 text-teal-300 border-teal-500/40';

  if (overallScore < 65 || recommendation === 'SKIP') {
    colorClasses = 'border-rose-500/30 bg-rose-950/40 text-rose-300';
    badgeClasses = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  } else if (overallScore < 80 || recommendation === 'REVIEW') {
    colorClasses = 'border-amber-500/30 bg-amber-950/40 text-amber-300';
    badgeClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }

  // Compact badge for tight spaces
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${colorClasses}`}>
        <Sparkles className="h-3.5 w-3.5" />
        <span>{overallScore}% Match</span>
        {recommendation && (
          <span className={`ml-1 rounded px-1.5 py-0.2 text-[10px] uppercase font-bold border ${badgeClasses}`}>
            {recommendation}
          </span>
        )}
      </div>
    );
  }

  // Full AI Assessment card as requested:
  // AI ASSESSMENT
  // 91%
  // Technical 94% · Experience 90% · Location 100% · Visa 80%
  const visaScore =
    match?.visa_compatibility === 'compatible'
      ? 100
      : match?.visa_compatibility === 'unknown'
      ? 70
      : 30;

  return (
    <div className={`rounded-xl border p-3 ${colorClasses} shadow-sm max-w-xs text-right sm:text-left`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-1.5 mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-teal-400" />
          AI Assessment
        </span>
        {recommendation && (
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${badgeClasses}`}>
            {recommendation}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-black tracking-tight text-white">
          {overallScore}%
        </div>
        <span className="text-[10px] text-slate-400 italic">
          Based on available information
        </span>
      </div>

      {match && (
        <div className="mt-2 pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>Technical</span>
            <span className="font-semibold text-slate-200">{match.technical_match}%</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Experience</span>
            <span className="font-semibold text-slate-200">{match.experience_match}%</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Location</span>
            <span className="font-semibold text-slate-200">{match.location_match}%</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Visa</span>
            <span className="font-semibold text-slate-200">{visaScore}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
