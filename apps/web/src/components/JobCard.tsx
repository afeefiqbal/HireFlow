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
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200"
          title="Posting timestamp could not be verified by ATS source"
        >
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          Posting age unknown
        </span>
      );
    }

    const hours = job.jobAgeHours;
    const hoursText = hours < 1 ? '<1h ago' : `${Math.round(hours)}h ago`;

    if (job.freshnessStatus === 'FRESH' || hours < 6.0) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#009a65] border border-emerald-200 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-[#00b074] animate-pulse" />
          Fresh &lt;6h ({hoursText})
        </span>
      );
    }

    if (job.freshnessStatus === 'RECENT' || hours <= 12.0) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
          Recent ({hoursText})
        </span>
      );
    }

    if (job.freshnessStatus === 'TODAY' || hours <= 24.0) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
          Today ({hoursText})
        </span>
      );
    }

    const days = Math.max(1, Math.round(hours / 24));
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
        Posted {days}d ago
      </span>
    );
  };

  const salaryText =
    job.salaryMin && job.salaryMax
      ? `€${Math.round(job.salaryMin / 1000)}k–€${Math.round(job.salaryMax / 1000)}k`
      : 'Competitive Salary';

  let postedLabel = 'Timestamp unverified';
  if (job.jobAgeHours !== null && job.jobAgeHours !== undefined) {
    if (job.jobAgeHours < 1) postedLabel = 'Under 1h ago';
    else if (job.jobAgeHours <= 24) postedLabel = `${Math.round(job.jobAgeHours)}h ago`;
    else postedLabel = `${Math.round(job.jobAgeHours / 24)}d ago`;
  }

  // Company avatar initial letter
  const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : 'J';

  return (
    <div className="job-item p-5 mb-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-[#00b074] hover:shadow-md transition-all group">
      {/* Main Row: Company Avatar + Body Info + Match Badge */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {/* JobEntry Company Logo / Avatar Container */}
          <div className="hidden sm:flex h-14 w-14 rounded-xl border border-slate-200 bg-slate-50 items-center justify-center font-black text-slate-700 text-xl flex-shrink-0 shadow-xs group-hover:border-[#00b074]/40 group-hover:bg-emerald-50/40 transition-colors">
            {companyInitial}
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            {/* Title & Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/jobs/${job.id}`}
                className="text-lg font-bold text-slate-900 group-hover:text-[#00b074] transition-colors"
              >
                {job.title}
              </Link>
              {renderAgeBadge()}
              {job.roleFamily && job.roleFamily !== 'UNKNOWN' && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 uppercase">
                  {job.seniority && job.seniority !== 'UNKNOWN' ? `${job.seniority} · ` : ''}
                  {job.roleFamily.replace(/_/g, ' ')}
                </span>
              )}
              {job.remoteType && job.remoteType !== 'UNKNOWN' && (
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold border uppercase ${
                    job.remoteType === 'REMOTE'
                      ? 'bg-emerald-50 text-[#009a65] border-emerald-200'
                      : job.remoteType === 'HYBRID'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {job.remoteType}
                </span>
              )}
              {job.application?.status && (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                  Pipeline: {job.application.status}
                </span>
              )}
            </div>

            {/* JobEntry Signature Meta Info Row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Building2 className="h-3.5 w-3.5 text-[#00b074]" />
                {job.company}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-[#00b074]" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-[#00b074]" />
                {postedLabel}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-900">
                <DollarSign className="h-3.5 w-3.5 text-[#00b074]" />
                {salaryText}
              </span>
            </div>

            {/* Attributes row: Visa, Relocation, Source */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 border font-medium ${
                  job.visaSponsorship === 'AVAILABLE' || job.visaStatus === 'OFFERED'
                    ? 'bg-emerald-50 text-[#009a65] border-emerald-200'
                    : job.visaSponsorship === 'NOT_AVAILABLE' || job.visaStatus === 'NOT_OFFERED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
                title={job.visaEvidence?.evidence || 'Visa status'}
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
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 border bg-teal-50 text-teal-800 border-teal-200 text-xs font-semibold"
                  title={job.relocationEvidence?.evidence || 'Relocation offered'}
                >
                  ✓ Relocation Assistance
                </span>
              )}

              {job.experienceRequired && (
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 font-medium">
                  Exp: {job.experienceRequired}
                </span>
              )}

              {/* Clickable Source */}
              <a
                href={job.sourceUrl || job.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-[#00b074] hover:border-emerald-300 transition-colors"
                title={`View on source board: ${job.source}`}
              >
                <span>Board: <strong>{job.source || 'Company ATS'}</strong></span>
                <ExternalLink className="h-3 w-3 ml-0.5 text-slate-400 group-hover:text-[#00b074]" />
              </a>
            </div>
          </div>
        </div>

        {/* AI Match Assessment Badge */}
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
        {(Array.isArray(job.techStack) ? job.techStack : Array.isArray((job as any).tech_stack) ? (job as any).tech_stack : []).map((tech: string) => {
          const isStrongMatch = match?.strong_matches?.includes(tech);
          return (
            <span
              key={tech}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium border ${
                isStrongMatch
                  ? 'bg-emerald-50 text-[#009a65] border-emerald-200 font-semibold'
                  : 'bg-slate-100/90 text-slate-700 border-slate-200/80'
              }`}
            >
              {isStrongMatch && <CheckCircle2 className="h-3 w-3 text-[#00b074]" />}
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#009a65] hover:text-[#007a50] transition-colors bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1 shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#00b074]" />
            <span>WHY THIS JOB?</span>
            {job.applicationPriority !== undefined && job.applicationPriority !== null && (
              <span className="ml-1 rounded bg-[#00b074] px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                Priority: {job.applicationPriority}/9
              </span>
            )}
            {showWhy ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showWhy && (
            <div className="mt-2.5 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 text-xs space-y-3.5">
              {job.whyThisJob ? (
                <>
                  {/* Priority Reasons */}
                  {Array.isArray(job.whyThisJob.priorityReasons) && job.whyThisJob.priorityReasons.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-bold text-[#009a65] uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-[#00b074]" />
                        Deterministic Match Evidence ({job.whyThisJob.priorityScore || 0}/9 Score)
                      </span>
                      <ul className="space-y-1 text-slate-700">
                        {job.whyThisJob.priorityReasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#00b074] font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 2-Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2.5 border-t border-emerald-100">
                    {/* Column 1: Structural Compatibility */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-700 text-[11px] block">
                        Structural Compatibility
                      </span>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200">
                          <span className="text-slate-500">Role Family:</span>
                          <span
                            className={`font-bold ${
                              job.whyThisJob.roleFamily?.status === 'MATCH' ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {job.whyThisJob.roleFamily?.status === 'MATCH' ? '✓' : '⚠'}{' '}
                            {job.whyThisJob.roleFamily?.value?.replace(/_/g, ' ') || 'ENGINEERING'} ({job.whyThisJob.roleFamily?.status || 'MATCH'})
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200">
                          <span className="text-slate-500">Seniority:</span>
                          <span
                            className={`font-bold ${
                              job.whyThisJob.seniority?.status === 'MATCH' ? 'text-emerald-700' : 'text-amber-600'
                            }`}
                          >
                            {job.whyThisJob.seniority?.status === 'MATCH' ? '✓' : '◐'}{' '}
                            {job.whyThisJob.seniority?.value || 'SENIOR'} ({job.whyThisJob.seniority?.status || 'MATCH'})
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200">
                          <span className="text-slate-500">Work Setup:</span>
                          <span className="text-slate-800 font-semibold">
                            {job.whyThisJob.workSetup?.remoteType || 'REMOTE'} · {job.whyThisJob.workSetup?.location || job.location}
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200">
                          <span className="text-slate-500">Application URL:</span>
                          <span
                            className={`font-bold ${
                              job.whyThisJob.applicationUrlQuality?.isAuthenticAts
                                ? 'text-emerald-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {job.whyThisJob.applicationUrlQuality?.isAuthenticAts ? '✓ Authentic ATS' : 'Portal Link'}{' '}
                            ({job.whyThisJob.applicationUrlQuality?.domain || 'Direct'})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: 4-State Technology Evidence */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-700 text-[11px] block">
                        Technologies (4-State Evidence)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(job.whyThisJob.technologies || []).map((item, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                              item.status === 'DIRECT'
                                ? 'bg-emerald-50 text-[#009a65] border-emerald-200'
                                : item.status === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
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
                /* Legacy Match Fallback */
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Assessment Evidence &amp; Reasoning
                  </span>
                  <ul className="space-y-1 text-slate-700">
                    {(match?.reasoning || ["Strong match with core skills and experience."]).map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#00b074] font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons - JobEntry Styled */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            VIEW DETAILS
          </Link>

          <button
            type="button"
            onClick={() => onAnalyze && onAnalyze(job.id)}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-[#009a65] hover:bg-emerald-100 transition-colors disabled:opacity-50 shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#00b074]" />
            {isAnalyzing ? 'ANALYZING...' : 'ANALYZE'}
          </button>

          {/* PREPARE APPLICATION BUTTON */}
          <Link
            href={`/jobs/${job.id}/apply`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-[#009a65] hover:bg-emerald-50 transition-colors shadow-2xs"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-[#00b074]" />
            <span>PREPARE APPLICATION</span>
          </Link>

          <button
            type="button"
            onClick={() => onSave && onSave(job.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#00b074] hover:border-emerald-300 transition-colors shadow-2xs"
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>SAVE</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* OPEN APPLICATION (Human-controlled) */}
          <a
            href={job.applicationUrl || job.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2 text-xs font-bold text-white transition-all shadow-sm"
          >
            <span>APPLY NOW</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
