import React from 'react';
import { AIMatchResult } from '@ai-job-agent/shared';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Cpu,
  Clock,
  MapPin,
  FileCheck2,
} from 'lucide-react';

interface AiMatchAnalysisCardProps {
  match: AIMatchResult;
}

export const AiMatchAnalysisCard: React.FC<AiMatchAnalysisCardProps> = ({ match }) => {
  const getRecommendationBadge = () => {
    switch (match.recommendation) {
      case 'APPLY':
        return {
          label: 'RECOMMENDED: APPLY',
          className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'REVIEW':
        return {
          label: 'CAUTION: REVIEW FIRST',
          className: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'SKIP':
        return {
          label: 'NOT RECOMMENDED: SKIP',
          className: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
      default:
        return {
          label: match.recommendation,
          className: 'bg-slate-700 text-slate-200 border-slate-600',
        };
    }
  };

  const badge = getRecommendationBadge();

  return (
    <div className="rounded-xl border border-teal-500/30 bg-gradient-to-b from-[#0f1d2e] to-[#0d1626] p-6 shadow-xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              AI Match Intelligence
              <span className="rounded bg-teal-950 px-2 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-800">
                Ground Truth Verified
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated against Afeef Iqbal's verified 7+ years profile
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Overall Match</div>
            <div className="text-3xl font-black tracking-tight text-teal-300">{match.overall_match}%</div>
          </div>
          <div className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider ${badge.className}`}>
            {badge.label}
          </div>
        </div>
      </div>

      {/* 4 Score Vectors Grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Technical */}
        <div className="rounded-lg border border-slate-800 bg-[#090e18] p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-teal-400" />
              Technical
            </span>
            <span className="font-bold text-white">{match.technical_match}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full"
              style={{ width: `${match.technical_match}%` }}
            />
          </div>
        </div>

        {/* Experience */}
        <div className="rounded-lg border border-slate-800 bg-[#090e18] p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              Experience
            </span>
            <span className="font-bold text-white">{match.experience_match}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${match.experience_match}%` }}
            />
          </div>
        </div>

        {/* Location */}
        <div className="rounded-lg border border-slate-800 bg-[#090e18] p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-purple-400" />
              Location
            </span>
            <span className="font-bold text-white">{match.location_match}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${match.location_match}%` }}
            />
          </div>
        </div>

        {/* Visa */}
        <div className="rounded-lg border border-slate-800 bg-[#090e18] p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" />
              Visa
            </span>
            <span
              className={`font-bold capitalize ${
                match.visa_compatibility === 'compatible'
                  ? 'text-emerald-400'
                  : match.visa_compatibility === 'incompatible'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {match.visa_compatibility}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                match.visa_compatibility === 'compatible'
                  ? 'w-full bg-emerald-500'
                  : match.visa_compatibility === 'incompatible'
                  ? 'w-1/4 bg-rose-500'
                  : 'w-2/3 bg-amber-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Breakdown Lists: Strong matches, Missing requirements, Concerns */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strong Matches */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Strong Matches ({match.strong_matches.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {match.strong_matches.map((item) => (
              <span
                key={item}
                className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300 border border-emerald-500/30"
              >
                {item}
              </span>
            ))}
            {match.strong_matches.length === 0 && (
              <span className="text-xs text-slate-500 italic">No direct primary overlaps</span>
            )}
          </div>
        </div>

        {/* Missing Requirements */}
        <div className="rounded-lg border border-rose-500/20 bg-rose-950/10 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-2">
            <XCircle className="h-4 w-4" />
            <span>Missing Requirements ({match.missing_requirements.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {match.missing_requirements.map((item) => (
              <span
                key={item}
                className="rounded bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-300 border border-rose-500/30"
              >
                {item}
              </span>
            ))}
            {match.missing_requirements.length === 0 && (
              <span className="text-xs text-emerald-400 font-medium">None! 100% requirements fulfilled</span>
            )}
          </div>
        </div>

        {/* Potential Concerns */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Potential Concerns ({match.concerns.length})</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {match.concerns.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="text-amber-400 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
            {match.concerns.length === 0 && (
              <span className="text-xs text-emerald-400 font-medium">Zero friction points detected</span>
            )}
          </ul>
        </div>
      </div>

      {/* Explicit AI Reasoning */}
      <div className="mt-5 rounded-lg border border-slate-800 bg-[#0a0f1a] p-4">
        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-teal-400" />
          AI Audit Reasoning &amp; Evidence
        </h4>
        <ul className="space-y-2">
          {match.reasoning.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-bold text-teal-400 shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
