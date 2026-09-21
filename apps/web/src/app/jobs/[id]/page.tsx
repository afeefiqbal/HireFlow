'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Job, AIMatchResult } from '@ai-job-agent/shared';
import { AiMatchAnalysisCard } from '@/components/AiMatchAnalysisCard';
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Globe2,
  Sparkles,
  ExternalLink,
  Bookmark,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Flame,
} from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const data = await api.getJobById(id);
      setJob(data);
    } catch (err: any) {
      console.error('Error fetching job:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await api.analyzeJob(id);
      setToastMessage('AI Match Analysis evaluated!');
      setTimeout(() => setToastMessage(null), 4000);
      await fetchJob();
    } catch (err: any) {
      alert(`AI Match analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusChange = async (status: any) => {
    try {
      await api.updateApplicationStatus(id, status, `Application moved to ${status}`);
      setToastMessage(`Application status updated to ${status}`);
      setTimeout(() => setToastMessage(null), 4000);
      await fetchJob();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 rounded-xl bg-white animate-pulse border border-slate-200 shadow-xs" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Job Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">This job listing may have expired or been removed.</p>
        <Link
          href="/jobs"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Jobs Matrix
        </Link>
      </div>
    );
  }

  const isFresh = job.ageStatus === 'FRESH';
  const salaryText =
    job.salaryMin && job.salaryMax
      ? `€${Math.round(job.salaryMin / 1000)}k–€${Math.round(job.salaryMax / 1000)}k`
      : 'Competitive / Not stated';

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#00b074] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Jobs Matrix</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-[#009a65] hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-[#00b074]" />
            {analyzing ? 'Evaluating Match...' : job.latestMatch ? 'Re-Analyze Match' : 'Analyze Match'}
          </button>

          <button
            onClick={() => handleStatusChange('SAVED')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Bookmark className="h-4 w-4" />
            Save Job
          </button>

          <Link
            href={`/jobs/${job.id}/apply`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-[#009a65] hover:bg-emerald-100 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>PREPARE APPLICATION</span>
          </Link>

          {/* OPEN APPLICATION as requested */}
          <a
            href={job.applicationUrl || job.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleStatusChange('READY_TO_APPLY')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] px-4 py-2 text-xs font-bold text-white hover:bg-[#009a65] transition-colors shadow-sm"
          >
            <span>OPEN APPLICATION</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Human-Controlled Safety Workflow Notice */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#00b074] shrink-0" />
          <span>
            <strong className="text-slate-900">Human-in-the-Loop Protocol:</strong> OPEN APPLICATION opens the official portal. Submission remains 100% human-controlled.
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          Workflow: Open Application → Review AI Prep → Human Submit
        </div>
      </div>

      {/* Section 1: JOB OVERVIEW */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{job.title}</h1>
          {isFresh ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200">
              <Flame className="h-3.5 w-3.5 text-[#00b074]" />
              Verified Fresh &lt;24h
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
              Older posting ({Math.round((job.jobAgeHours || 0) / 24)}d ago)
            </span>
          )}
          {job.application?.status && (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              Application: {job.application.status}
            </span>
          )}
        </div>

        {/* Overview Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-slate-200 py-4 text-xs">
          <div>
            <span className="text-slate-400 block uppercase tracking-wider font-bold text-[11px]">Company</span>
            <span className="text-slate-900 font-bold flex items-center gap-1 mt-1 text-sm">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {job.company}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block uppercase tracking-wider font-bold text-[11px]">Location &amp; Remote</span>
            <span className="text-slate-800 font-medium flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {job.location} {job.isRemote && '(Remote)'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block uppercase tracking-wider font-bold text-[11px]">Compensation</span>
            <span className="text-[#009a65] font-bold flex items-center gap-1 mt-1 text-sm">
              <DollarSign className="h-3.5 w-3.5" />
              {salaryText}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block uppercase tracking-wider font-bold text-[11px]">Visa Policy</span>
            <span
              className={`font-semibold flex items-center gap-1 mt-1 ${
                job.visaStatus === 'OFFERED'
                  ? 'text-[#009a65]'
                  : job.visaStatus === 'NOT_OFFERED'
                  ? 'text-rose-600'
                  : 'text-slate-600'
              }`}
            >
              <Globe2 className="h-3.5 w-3.5" />
              {job.visaStatus === 'OFFERED' ? 'Sponsorship Offered' : job.visaStatus === 'NOT_OFFERED' ? 'No Sponsorship' : 'Not Stated'}
            </span>
          </div>
        </div>

        {/* Tech Stack Pills */}
        <div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-2">
            Target Stack &amp; Technologies
          </span>
          <div className="flex flex-wrap gap-2">
            {job.techStack.map((tech) => {
              const isStrong = job.latestMatch?.strong_matches?.includes(tech);
              return (
                <span
                  key={tech}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold border ${
                    isStrong
                      ? 'bg-emerald-50 text-[#009a65] border-emerald-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {isStrong && <CheckCircle2 className="h-3.5 w-3.5 text-[#00b074]" />}
                  {tech}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: AI MATCH ANALYSIS */}
      {job.latestMatch ? (
        <AiMatchAnalysisCard match={job.latestMatch} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <Sparkles className="mx-auto h-8 w-8 text-[#00b074] mb-2" />
          <h3 className="text-base font-bold text-slate-900">AI Match Analysis Pending</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Analyze this position against Afeef Iqbal's verified ground-truth profile (7+ years Laravel, PHP, Node.js, Vue.js).
          </p>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] px-4 py-2 text-xs font-bold text-white hover:bg-[#009a65] transition-colors shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Run Anti-Hallucination Match
          </button>
        </div>
      )}

      {/* Section 3: REQUIREMENTS & DESCRIPTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Job Description */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
            Job Description
          </h2>
          <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-line space-y-3">
            {job.description}
          </div>
        </div>

        {/* Requirements Sidebar */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
              Mandatory Requirements
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#00b074] font-bold">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {job.preferredSkills && job.preferredSkills.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
                Preferred Qualifications
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                {job.preferredSkills.map((pref, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>{pref}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sourcing & Canonical Origin */}
          <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 space-y-1">
            <div>
              Source:{' '}
              <a
                href={job.sourceUrl || job.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#009a65] hover:text-[#007a50] font-bold underline inline-flex items-center gap-1"
              >
                <span>{job.source || 'Company Careers'}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="truncate">
              Canonical URL:{' '}
              <a
                href={job.canonicalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-600 hover:text-[#00b074]"
              >
                {job.canonicalUrl}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
