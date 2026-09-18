'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DashboardStats, Job, QualifiedOpportunity } from '@ai-job-agent/shared';
import { MetricCard } from '@/components/MetricCard';
import { JobCard } from '@/components/JobCard';
import {
  Briefcase,
  Flame,
  Sparkles,
  Send,
  Calendar,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ExternalLink,
  Layers,
  FileCheck,
  Check,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [strongestMatches, setStrongestMatches] = useState<Job[]>([]);
  const [qualifiedOpportunities, setQualifiedOpportunities] = useState<QualifiedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [preparingJobId, setPreparingJobId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboard();
      setStats(data.stats);
      setStrongestMatches(data.strongestMatches || []);
      if ((data as any).qualifiedOpportunities) {
        setQualifiedOpportunities((data as any).qualifiedOpportunities);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunContinuousDiscovery = async () => {
    setDiscovering(true);
    try {
      const res = await api.runContinuousDiscovery();
      setToastMessage(
        `Autonomous discovery complete: ${res.scanned} scanned, ${res.newJobs} new, ${res.tier1Count} qualified, ${res.autoAppliedCount} auto-applied.`
      );
      setTimeout(() => setToastMessage(null), 7000);
      await loadData();
    } catch (err: any) {
      alert(`Discovery failed: ${err.message}`);
    } finally {
      setDiscovering(false);
    }
  };

  const handleAutoApply = async (jobId: string, dryRun: boolean = false) => {
    setApplyingJobId(jobId);
    try {
      const res = await api.autoApply(jobId, dryRun);
      if (res.mode === 'SANDBOX') {
        setToastMessage(`Sandbox dry-run passed: Schema valid for ${res.sandboxResult?.targetMechanism}. Status not changed.`);
      } else {
        setToastMessage(`Application verified! Receipt ID: ${res.receipt?.receiptId}. Status updated to APPLIED.`);
      }
      setTimeout(() => setToastMessage(null), 6000);
      await loadData();
    } catch (err: any) {
      alert(`Auto-apply error: ${err.message}`);
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleAutoPrepare = async (jobId: string) => {
    setPreparingJobId(jobId);
    try {
      await api.autoPrepare(jobId);
      setToastMessage('Application materials generated (Tailored CV, Cover Letter, Screening Answers)!');
      setTimeout(() => setToastMessage(null), 5000);
      await loadData();
    } catch (err: any) {
      alert(`Auto-prepare error: ${err.message}`);
    } finally {
      setPreparingJobId(null);
    }
  };

  const handleAnalyze = async (jobId: string) => {
    setAnalyzingJobId(jobId);
    try {
      await api.analyzeJob(jobId);
      setToastMessage('AI Match Analysis completed!');
      setTimeout(() => setToastMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzingJobId(null);
    }
  };

  const handleSave = async (jobId: string) => {
    try {
      await api.updateApplicationStatus(jobId, 'SAVED', 'Saved from Dashboard');
      setToastMessage('Job saved to your application pipeline!');
      setTimeout(() => setToastMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-xl border border-teal-400">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
              <Radio className="h-3 w-3 animate-pulse text-teal-400" />
              Continuous Autonomous Job Search
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Autonomous Career Command Center
            </h1>
            <p className="max-w-2xl text-sm text-slate-400">
              Continuous job discovery across Greenhouse, Lever, Ashby, and Arbeitnow. Automatic multi-tier matching, preparation, and verified auto-apply.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunContinuousDiscovery}
              disabled={discovering}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 hover:bg-teal-500 disabled:opacity-50 transition-all"
            >
              <Zap className={`h-4 w-4 ${discovering ? 'animate-spin' : ''}`} />
              {discovering ? 'Running Autonomous Loop...' : 'Run Autonomous Discovery'}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Search className="h-4 w-4" />
              Jobs Matrix
            </Link>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      {/* 7 Key Dashboard Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Pipeline Analytics (PostgreSQL Live)
          </h2>
          <span className="text-xs text-slate-500">Strict Time Verification</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <MetricCard
            label="Discovered Today"
            value={stats?.jobsDiscoveredToday ?? '—'}
            icon={Briefcase}
            variant="blue"
          />
          <MetricCard
            label="Fresh (<24h)"
            value={stats?.freshJobs24h ?? '—'}
            subtext="Strict Time"
            icon={Flame}
            variant="amber"
          />
          <MetricCard
            label="Strong Matches"
            value={stats?.strongMatchesCount ?? '—'}
            subtext="Score ≥ 85%"
            icon={Sparkles}
            variant="purple"
          />
          <MetricCard
            label="Ready to Apply"
            value={stats?.applicationsReady ?? '—'}
            icon={Clock}
            variant="blue"
          />
          <MetricCard
            label="Applications Sent"
            value={stats?.applicationsSubmitted ?? '—'}
            icon={Send}
            variant="teal"
          />
          <MetricCard
            label="Interviews"
            value={stats?.interviewsCount ?? '—'}
            icon={Calendar}
            variant="emerald"
          />
          <MetricCard
            label="Rejections"
            value={stats?.rejectedCount ?? '—'}
            icon={XCircle}
            variant="default"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* PROMINENT SECTION: QUALIFIED OPPORTUNITIES STREAM */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-teal-400" />
              Qualified Opportunities Stream ({qualifiedOpportunities.length})
            </h2>
            <p className="text-xs text-slate-400">
              Matched against your active Candidate Ground Truth with 4-State Tech Evidence and Role Family Gate.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded px-2 py-0.5 bg-blue-950/60 border border-blue-800 text-blue-300 font-semibold">Tier 1: Qualified</span>
            <span className="rounded px-2 py-0.5 bg-purple-950/60 border border-purple-800 text-purple-300 font-semibold">Tier 2: Prepared</span>
            <span className="rounded px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-semibold">Tier 3: Auto-Apply Ready</span>
          </div>
        </div>

        {qualifiedOpportunities.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-8 text-center space-y-3">
            <Sparkles className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No qualified opportunities surfaced yet.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Run continuous discovery to ingest fresh jobs from Greenhouse, Lever, Ashby, and Arbeitnow and match them automatically against your profile.
            </p>
            <button
              onClick={handleRunContinuousDiscovery}
              disabled={discovering}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-500"
            >
              <Zap className="h-3.5 w-3.5" />
              Run Discovery Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {qualifiedOpportunities.slice(0, 10).map((opp) => {
              const isApplied = opp.applicationStatus === 'APPLIED' || opp.tier === 'APPLIED';
              const isAutoApplyReady = opp.tier === 'AUTO_APPLY_ELIGIBLE' && !isApplied;

              return (
                <div
                  key={opp.job.id}
                  className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4 hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white">{opp.job.title}</h3>
                        <span className="text-xs font-semibold text-slate-400">at</span>
                        <span className="text-sm font-bold text-teal-300">{opp.job.company}</span>
                        {opp.job.isRemote && (
                          <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-500/30">
                            Remote
                          </span>
                        )}
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          {opp.job.location}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        {/* Score Badge */}
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          opp.matchScore >= 85 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          opp.matchScore >= 75 ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {opp.matchScore}% Compatibility
                        </span>

                        {/* Opportunity Tier Badge */}
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          isApplied ? 'bg-teal-900/60 text-teal-300 border border-teal-700' :
                          opp.tier === 'AUTO_APPLY_ELIGIBLE' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' :
                          opp.tier === 'AUTO_PREPARED' ? 'bg-purple-950/60 text-purple-300 border border-purple-800' :
                          'bg-blue-950/60 text-blue-300 border border-blue-800'
                        }`}>
                          {opp.tier.replace(/_/g, ' ')}
                        </span>

                        {/* ATS Support Status */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          opp.atsMechanism !== 'MANUAL_EXTERNAL'
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                            : 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                        }`}>
                          {opp.atsMechanism === 'LEVER_DIRECT' ? '✓ Lever Direct Supported' :
                           opp.atsMechanism === 'GREENHOUSE_DIRECT' ? '✓ Greenhouse Board Supported' :
                           '⚠ External ATS (Manual Direct)'}
                        </span>

                        {/* Submission Receipt Indicator if APPLIED */}
                        {isApplied && (
                          <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-500/40 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Verified Submission ({opp.submissionReceipt?.receiptId || 'Recorded'})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isApplied ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-teal-950/80 border border-teal-500/50 px-3.5 py-2 text-xs font-bold text-teal-300">
                          <CheckCircle2 className="h-4 w-4 text-teal-400" />
                          <span>Submitted & Verified</span>
                        </div>
                      ) : isAutoApplyReady ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAutoApply(opp.job.id, true)}
                            disabled={applyingJobId === opp.job.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                          >
                            <span>Dry-Run Test</span>
                          </button>
                          <button
                            onClick={() => handleAutoApply(opp.job.id, false)}
                            disabled={applyingJobId === opp.job.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                          >
                            <Zap className={`h-4 w-4 ${applyingJobId === opp.job.id ? 'animate-spin' : ''}`} />
                            <span>{applyingJobId === opp.job.id ? 'Submitting...' : 'Auto-Apply (Verified)'}</span>
                          </button>
                        </div>
                      ) : !opp.preparationStatus.cvReady ? (
                        <button
                          onClick={() => handleAutoPrepare(opp.job.id)}
                          disabled={preparingJobId === opp.job.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
                        >
                          <FileCheck className={`h-4 w-4 ${preparingJobId === opp.job.id ? 'animate-spin' : ''}`} />
                          <span>{preparingJobId === opp.job.id ? 'Generating...' : 'Auto-Prepare Application'}</span>
                        </button>
                      ) : opp.atsMechanism === 'MANUAL_EXTERNAL' ? (
                        <a
                          href={opp.job.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-950/40 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-900/60 transition-colors"
                        >
                          <span>Apply on Employer Site</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link
                          href={`/jobs/${opp.job.id}/apply`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-500 transition-colors"
                        >
                          <span>Review in Copilot</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}

                      <Link
                        href={`/jobs/${opp.job.id}/apply`}
                        className="rounded-lg border border-slate-700 bg-slate-800/60 p-2 text-slate-300 hover:bg-slate-700 transition-colors"
                        title="Open Application Preparation Workspace"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Preparation Checklist Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Check className={`h-3.5 w-3.5 ${opp.preparationStatus.cvReady ? 'text-teal-400' : 'text-slate-600'}`} />
                        <span className={opp.preparationStatus.cvReady ? 'text-slate-200' : 'text-slate-500'}>Tailored CV</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Check className={`h-3.5 w-3.5 ${opp.preparationStatus.coverLetterReady ? 'text-teal-400' : 'text-slate-600'}`} />
                        <span className={opp.preparationStatus.coverLetterReady ? 'text-slate-200' : 'text-slate-500'}>Cover Letter</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Check className={`h-3.5 w-3.5 ${opp.preparationStatus.screeningReady ? 'text-teal-400' : 'text-slate-600'}`} />
                        <span className={opp.preparationStatus.screeningReady ? 'text-slate-200' : 'text-slate-500'}>Screening Q&A</span>
                      </span>

                      {opp.preparationStatus.pendingQuestionsCount > 0 && (
                        <span className="rounded bg-rose-950/60 border border-rose-800 px-2 py-0.5 text-[11px] text-rose-300 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {opp.preparationStatus.pendingQuestionsCount} question(s) require manual input
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500">
                      {opp.tierReason}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Today's Top Matches Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-400" />
              Latest Match Pipeline
            </h2>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
              {strongestMatches.length} Opportunities
            </span>
          </div>

          <Link
            href="/jobs"
            className="group flex items-center gap-1 text-xs font-semibold text-teal-400 hover:text-teal-300"
          >
            View Full Database
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {strongestMatches.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
            <p className="text-sm text-slate-400">No active job matches found in this view.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {strongestMatches.slice(0, 5).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAnalyze={handleAnalyze}
                onSave={handleSave}
                isAnalyzing={analyzingJobId === job.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
