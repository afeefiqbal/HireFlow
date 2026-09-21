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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-[#00b074]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              AI Match Intelligence
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#009a65] border border-emerald-200">
                Ground Truth Verified
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated against Afeef Iqbal's verified 7+ years profile
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Overall Match</div>
            <div className="text-3xl font-black tracking-tight text-[#009a65]">{match.overall_match}%</div>
          </div>
          <div className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider ${badge.className}`}>
            {badge.label}
          </div>
        </div>
      </div>

      {/* 4 Score Vectors Grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Technical */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <Cpu className="h-3.5 w-3.5 text-[#00b074]" />
              Technical
            </span>
            <span className="font-bold text-slate-900">{match.technical_match}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-[#00b074] rounded-full"
              style={{ width: `${match.technical_match}%` }}
            />
          </div>
        </div>

        {/* Experience */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              Experience
            </span>
            <span className="font-bold text-slate-900">{match.experience_match}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${match.experience_match}%` }}
            />
          </div>
        </div>

        {/* Location */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="h-3.5 w-3.5 text-purple-600" />
              Location
            </span>
            <span className="font-bold text-slate-900">{match.location_match}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${match.location_match}%` }}
            />
          </div>
        </div>

        {/* Visa */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
              Visa
            </span>
            <span
              className={`font-bold capitalize ${
                match.visa_compatibility === 'compatible'
                  ? 'text-[#009a65]'
                  : match.visa_compatibility === 'incompatible'
                  ? 'text-rose-600'
                  : 'text-amber-600'
              }`}
            >
              {match.visa_compatibility}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                match.visa_compatibility === 'compatible'
                  ? 'w-full bg-[#00b074]'
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
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-2">
            <CheckCircle2 className="h-4 w-4 text-[#00b074]" />
            <span>Strong Matches ({match.strong_matches.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {match.strong_matches.map((item) => (
              <span
                key={item}
                className="rounded-md bg-white border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-[#009a65] shadow-2xs"
              >
                {item}
              </span>
            ))}
            {match.strong_matches.length === 0 && (
              <span className="text-xs text-slate-400 italic">No direct primary overlaps</span>
            )}
          </div>
        </div>

        {/* Missing Requirements */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-2">
            <XCircle className="h-4 w-4 text-rose-500" />
            <span>Missing Requirements ({match.missing_requirements.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {match.missing_requirements.map((item) => (
              <span
                key={item}
                className="rounded-md bg-white border border-rose-200 px-2 py-0.5 text-xs font-semibold text-rose-700 shadow-2xs"
              >
                {item}
              </span>
            ))}
            {match.missing_requirements.length === 0 && (
              <span className="text-xs text-[#009a65] font-bold">None! 100% requirements fulfilled</span>
            )}
          </div>
        </div>

        {/* Potential Concerns */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Potential Concerns ({match.concerns.length})</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-700">
            {match.concerns.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="text-amber-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
            {match.concerns.length === 0 && (
              <span className="text-xs text-[#009a65] font-bold">Zero friction points detected</span>
            )}
          </ul>
        </div>
      </div>

      {/* Explicit AI Reasoning */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#00b074]" />
          AI Audit Reasoning &amp; Evidence
        </h4>
        <ul className="space-y-2">
          {match.reasoning.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-[#009a65] shrink-0 mt-0.5">
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
