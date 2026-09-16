import React, { useState } from 'react';
import Link from 'next/link';
import { Job } from '@ai-job-agent/shared';
import { MatchScoreBadge } from './MatchScoreBadge';
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Globe2,
  Sparkles,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Briefcase,
  XCircle,
} from 'lucide-react';

interface JobCardProps {
  job: Job;
  onAnalyze?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  isAnalyzing?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onAnalyze,
  onSave,
  isAnalyzing = false,
}) => {
  const [showWhy, setShowWhy] = useState(false);
  const match = job.latestMatch;

  // 24-Hour verification badge logic
  const renderAgeBadge = () => {
    if (job.ageStatus === 'UNKNOWN' || job.jobAgeHours === null || job.jobAgeHours === undefined) {
      return (
        <span
          className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/30"
          title="Posting timestamp could not be verified by ATS source"
        >
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          Posting age unknown
        </span>
      );
    }

    if (job.ageStatus === 'FRESH' && job.jobAgeHours <= 24) {
      const hoursText = job.jobAgeHours < 1 ? '<1h ago' : `${Math.round(job.jobAgeHours)}h ago`;
      return (
        <span className="inline-flex items-center gap-1.5 rounded bg-teal-500/20 px-2.5 py-0.5 text-[11px] font-bold text-teal-300 border border-teal-500/40">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
          Fresh &lt;24h ({hoursText})
        </span>
      );
    }

    const days = Math.max(1, Math.round(job.jobAgeHours / 24));
    return (
      <span className="inline-flex items-center rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700">
        Posted {days}d ago
      </span>
    );
  };

  const salaryText =
    job.salaryMin && job.salaryMax
      ? `€${Math.round(job.salaryMin / 1000)}k–€${Math.round(job.salaryMax / 1000)}k`
      : 'Competitive / Unspecified';

  let postedLabel = 'Timestamp unverified';
  if (job.jobAgeHours !== null && job.jobAgeHours !== undefined) {
    if (job.jobAgeHours < 1) postedLabel = 'Under 1 hour ago';
    else if (job.jobAgeHours <= 24) postedLabel = `${Math.round(job.jobAgeHours)} hours ago`;
    else postedLabel = `${Math.round(job.jobAgeHours / 24)} days ago`;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-card transition-all hover:border-slate-700">
      {/* Header: Title, Company, Status, and Match Badge */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/jobs/${job.id}`}
              className="text-lg font-bold text-white hover:text-teal-400 transition-colors"
            >
              {job.title}
            </Link>
            {renderAgeBadge()}
            {job.application?.status && (
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-300 border border-blue-500/30">
                Pipeline: {job.application.status}
              </span>
            )}
          </div>

          {/* Company & Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium text-slate-200">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {job.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {postedLabel}
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <DollarSign className="h-3.5 w-3.5" />
              {salaryText}
            </span>
          </div>

          {/* Attributes row: Visa, Experience, Clickable Source */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 border ${
                job.visaStatus === 'OFFERED'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : job.visaStatus === 'NOT_OFFERED'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700'
              }`}
            >
              <Globe2 className="h-3 w-3" />
              Visa: {job.visaStatus === 'OFFERED' ? 'Sponsorship Offered' : job.visaStatus === 'NOT_OFFERED' ? 'No Sponsorship' : 'Not stated'}
            </span>

            {job.experienceRequired && (
              <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-slate-300">
                Exp: {job.experienceRequired}
              </span>
            )}

            {/* Clickable Source as requested */}
            <a
              href={job.sourceUrl || job.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-teal-500/30 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-teal-400 hover:text-teal-300 hover:border-teal-400 transition-colors"
              title={`View on source board: ${job.source}`}
            >
              <span>Source: <strong>{job.source || 'Company Careers'}</strong></span>
              <ExternalLink className="h-3 w-3 ml-0.5 text-teal-500" />
            </a>
          </div>
        </div>

        {/* AI Match Assessment Card */}
        <div className="flex-shrink-0">
          <MatchScoreBadge
            match={match}
            score={match?.overall_match}
            recommendation={match?.recommendation}
          />
        </div>
      </div>

      {/* Tech stack tags */}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        {job.techStack.map((tech) => {
          const isStrongMatch = match?.strong_matches?.includes(tech);
          return (
            <span
              key={tech}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border ${
                isStrongMatch
                  ? 'bg-teal-950/50 text-teal-300 border-teal-500/40'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700/60'
              }`}
            >
              {isStrongMatch && <CheckCircle2 className="h-3 w-3 text-teal-400" />}
              {tech}
            </span>
          );
        })}
      </div>

      {/* Expandable "Why this assessment?" section */}
      {match && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowWhy(!showWhy)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Why this assessment?</span>
            {showWhy ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showWhy && (
            <div className="mt-2.5 rounded-lg border border-slate-800 bg-[#090f1b] p-3.5 text-xs space-y-3 animate-fadeIn">
              <div className="space-y-1.5">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                  AI Assessment Evidence &amp; Reasoning
                </span>
                <ul className="space-y-1 text-slate-300">
                  {match.reasoning.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-teal-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                {/* Strong matches */}
                <div>
                  <span className="font-semibold text-emerald-400 text-[11px] flex items-center gap-1 mb-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Matches ({match.strong_matches.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {match.strong_matches.map((s) => (
                      <span key={s} className="rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing requirements or concerns */}
                <div>
                  <span className="font-semibold text-amber-400 text-[11px] flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    Concerns / Missing ({match.missing_requirements.length + match.concerns.length})
                  </span>
                  <ul className="space-y-0.5 text-[11px] text-slate-400">
                    {match.missing_requirements.map((m) => (
                      <li key={m} className="text-rose-400">• Missing: {m} (Unverified)</li>
                    ))}
                    {match.concerns.map((c, i) => (
                      <li key={i} className="text-amber-300">• {c}</li>
                    ))}
                    {match.missing_requirements.length === 0 && match.concerns.length === 0 && (
                      <li className="text-emerald-400">Zero friction points detected</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            VIEW JOB
          </Link>

          <button
            type="button"
            onClick={() => onAnalyze && onAnalyze(job.id)}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300 hover:bg-teal-500/20 transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isAnalyzing ? 'ANALYZING...' : 'ANALYZE'}
          </button>

          {/* V2 PREPARE APPLICATION BUTTON */}
          <Link
            href={`/jobs/${job.id}/apply`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/60 bg-teal-950/40 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-900/50 transition-colors"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-teal-400" />
            <span>PREPARE APPLICATION</span>
          </Link>

          <button
            type="button"
            onClick={() => onSave && onSave(job.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Bookmark className="h-3.5 w-3.5" />
            SAVE
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* OPEN APPLICATION (Human-controlled) */}
          <a
            href={job.applicationUrl || job.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500 transition-colors shadow-sm"
          >
            <span>OPEN APPLICATION</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
