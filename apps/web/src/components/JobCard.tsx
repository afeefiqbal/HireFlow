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

  // V4 Freshness verification badge logic
  const renderAgeBadge = () => {
    if (job.freshnessStatus === 'UNKNOWN' || job.jobAgeHours === null || job.jobAgeHours === undefined) {
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

    const hours = job.jobAgeHours;
    const hoursText = hours < 1 ? '<1h ago' : `${Math.round(hours)}h ago`;

    if (job.freshnessStatus === 'FRESH' || hours < 6.0) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/50 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Fresh &lt;6h ({hoursText})
        </span>
      );
    }

    if (job.freshnessStatus === 'RECENT' || hours <= 12.0) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded bg-teal-500/20 px-2.5 py-0.5 text-[11px] font-bold text-teal-300 border border-teal-500/40">
          Recent ({hoursText})
        </span>
      );
    }

    if (job.freshnessStatus === 'TODAY' || hours <= 24.0) {
      return (
        <span className="inline-flex items-center rounded bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-300 border border-blue-500/30">
          Today ({hoursText})
        </span>
      );
    }

    const days = Math.max(1, Math.round(hours / 24));
    return (
      <span className="inline-flex items-center rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700">
        Posted {days}d ago (STALE)
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
            {job.roleFamily && job.roleFamily !== 'UNKNOWN' && (
              <span className="rounded bg-indigo-950/70 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-700/50 uppercase">
                {job.seniority && job.seniority !== 'UNKNOWN' ? `${job.seniority} · ` : ''}
                {job.roleFamily.replace(/_/g, ' ')}
              </span>
            )}
            {job.remoteType && job.remoteType !== 'UNKNOWN' && (
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold border uppercase ${
                  job.remoteType === 'REMOTE'
                    ? 'bg-teal-950/60 text-teal-300 border-teal-800/60'
                    : job.remoteType === 'HYBRID'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {job.remoteType}
              </span>
            )}
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

          {/* Attributes row: Visa, Relocation, Experience, Clickable Source */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 border ${
                job.visaSponsorship === 'AVAILABLE' || job.visaStatus === 'OFFERED'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : job.visaSponsorship === 'NOT_AVAILABLE' || job.visaStatus === 'NOT_OFFERED'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700'
              }`}
              title={job.visaEvidence?.evidence || 'Visa sponsorship status'}
            >
              <Globe2 className="h-3 w-3" />
              Visa:{' '}
              {job.visaSponsorship === 'AVAILABLE' || job.visaStatus === 'OFFERED'
                ? 'Sponsorship Available'
                : job.visaSponsorship === 'NOT_AVAILABLE' || job.visaStatus === 'NOT_OFFERED'
                ? 'No Sponsorship'
                : 'Not stated'}
            </span>

            {job.relocation === 'AVAILABLE' && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 border bg-cyan-950/40 text-cyan-300 border-cyan-700/40 text-xs font-semibold"
                title={job.relocationEvidence?.evidence || 'Relocation assistance offered'}
              >
                ✓ Relocation Assistance
              </span>
            )}

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

      {/* Expandable "WHY THIS JOB?" evidence panel */}
      {(job.whyThisJob || match) && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowWhy(!showWhy)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors bg-teal-950/30 border border-teal-500/30 rounded-lg px-2.5 py-1"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>WHY THIS JOB?</span>
            {job.applicationPriority !== undefined && job.applicationPriority !== null && (
              <span className="ml-1 rounded bg-teal-500/20 px-1.5 py-0.2 text-[10px] font-black text-teal-300 border border-teal-500/30">
                Priority: {job.applicationPriority}/9
              </span>
            )}
            {showWhy ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showWhy && (
            <div className="mt-2.5 rounded-lg border border-slate-800 bg-[#090f1b] p-4 text-xs space-y-3.5 animate-fadeIn">
              {job.whyThisJob ? (
                <>
                  {/* Priority Reasons */}
                  {job.whyThisJob.priorityReasons?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-bold text-teal-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Deterministic Match Evidence ({job.whyThisJob.priorityScore}/9 Score)
                      </span>
                      <ul className="space-y-1 text-slate-300">
                        {job.whyThisJob.priorityReasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-teal-400 font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 2-Column Grid: Role/Seniority & Technologies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2.5 border-t border-slate-800">
                    {/* Column 1: Role Family & Seniority Gate */}
                    <div className="space-y-2">
                      <span className="font-semibold text-slate-300 text-[11px] block">
                        Structural Compatibility
                      </span>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between rounded bg-slate-900/80 p-2 border border-slate-800">
                          <span className="text-slate-400">Role Family:</span>
                          <span
                            className={`font-bold ${
                              job.whyThisJob.roleFamily.status === 'MATCH' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {job.whyThisJob.roleFamily.status === 'MATCH' ? '✓' : '⚠'}{' '}
                            {job.whyThisJob.roleFamily.value?.replace(/_/g, ' ')} ({job.whyThisJob.roleFamily.status})
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded bg-slate-900/80 p-2 border border-slate-800">
                          <span className="text-slate-400">Seniority:</span>
                          <span
                            className={`font-bold ${
                              job.whyThisJob.seniority.status === 'MATCH' ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {job.whyThisJob.seniority.status === 'MATCH' ? '✓' : '◐'}{' '}
                            {job.whyThisJob.seniority.value} ({job.whyThisJob.seniority.status})
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded bg-slate-900/80 p-2 border border-slate-800">
                          <span className="text-slate-400">Work Setup:</span>
                          <span className="text-slate-200 font-semibold">
                            {job.whyThisJob.workSetup.remoteType} · {job.whyThisJob.workSetup.location}
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded bg-slate-900/80 p-2 border border-slate-800">
                          <span className="text-slate-400">Application URL:</span>
                          <span
                            className={`font-bold ${
                              job.whyThisJob.applicationUrlQuality.isAuthenticAts
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {job.whyThisJob.applicationUrlQuality.isAuthenticAts ? '✓ Authentic ATS' : 'Portal Link'}{' '}
                            ({job.whyThisJob.applicationUrlQuality.domain})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: 4-State Technology Evidence */}
                    <div className="space-y-2">
                      <span className="font-semibold text-slate-300 text-[11px] block">
                        Technologies (4-State Evidence)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.whyThisJob.technologies?.map((item, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold border ${
                              item.status === 'DIRECT'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                : item.status === 'PARTIAL'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-700/60'
                            }`}
                            title={item.evidence}
                          >
                            {item.status === 'DIRECT' && '✓'}
                            {item.status === 'PARTIAL' && '◐'}
                            {item.status === 'NOT_VERIFIED' && '?'}
                            <span>{item.technology}</span>
                            <span className="opacity-70 text-[9px]">({item.status})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Legacy AI Match Fallback */
                <>
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                      AI Assessment Evidence &amp; Reasoning
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      {match?.reasoning.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-teal-400 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
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
