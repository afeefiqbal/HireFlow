'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DashboardStats, Job } from '@ai-job-agent/shared';
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
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [strongestMatches, setStrongestMatches] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboard();
      setStats(data.stats);
      setStrongestMatches(data.strongestMatches || []);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunDiscovery = async () => {
    setDiscovering(true);
    try {
      const res = await api.triggerDiscovery();
      setToastMessage(
        `Discovery complete! Ingested ${res.newSaved} real jobs (${res.freshSaved} fresh <24h) from Greenhouse, Lever, Ashby & EU Boards.`
      );
      setTimeout(() => setToastMessage(null), 6000);
      await loadData();
    } catch (err: any) {
      alert(`Discovery failed: ${err.message}`);
    } finally {
      setDiscovering(false);
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d1726] via-[#0f1d30] to-[#0d1726] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-ping" />
              Private Candidate Command Center · Live ATS Ingestion
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, Afeef Iqbal
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Real-time job discovery engine scanning live public boards (Greenhouse, Lever, Ashby &amp; European Tech feeds) with strict 24-hour verification against your verified 7+ years profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Run Real Discovery Engine Button */}
            <button
              onClick={handleRunDiscovery}
              disabled={discovering}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-500 transition-colors shadow-lg shadow-teal-900/30 disabled:opacity-50"
            >
              <Radio className={`h-4 w-4 ${discovering ? 'animate-pulse' : ''}`} />
              {discovering ? 'Scanning ATS Boards...' : 'Run Real Discovery'}
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

      {/* AI Provider Status Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stats?.ai?.status === 'Connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">AI Provider: {stats?.ai?.provider || 'None'}</div>
              <div className="text-xs text-slate-400">Model: {stats?.ai?.model || 'Not Configured'}</div>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${stats?.ai?.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {stats?.ai?.status || 'Unknown'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex items-center justify-between">
           <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">AI Usage Today</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{stats?.ai?.callsToday || 0}</span>
                <span className="text-sm text-slate-400">requests</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tokens Used</div>
              <div className="text-lg font-semibold text-teal-400">{stats?.ai?.tokensUsedToday?.toLocaleString() || 0}</div>
            </div>
        </div>
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
            variant="teal"
          />
          <MetricCard
            label="Strong Matches"
            value={stats?.strongMatchesCount ?? '—'}
            subtext="Score ≥85%"
            icon={Sparkles}
            variant="emerald"
          />
          <MetricCard
            label="Ready to Apply"
            value={stats?.applicationsReady ?? '—'}
            icon={Clock}
            variant="amber"
          />
          <MetricCard
            label="Submitted"
            value={stats?.applicationsSubmitted ?? '—'}
            icon={Send}
            variant="default"
          />
          <MetricCard
            label="Interviews"
            value={stats?.interviewsCount ?? '—'}
            icon={Calendar}
            variant="purple"
          />
          <MetricCard
            label="Rejected"
            value={stats?.rejectedCount ?? '—'}
            icon={XCircle}
            variant="default"
          />
        </div>
      </div>

      {/* Today's Strongest Matches Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-400" />
              Today's Strongest Matches
            </h2>
            <p className="text-xs text-slate-400">
              Verified fresh postings (&lt;24h) from Greenhouse, Lever &amp; European tech boards matching Laravel, PHP, Node.js &amp; Vue.js
            </p>
          </div>
          <Link
            href="/jobs?freshOnly=true"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
          >
            <span>View all fresh jobs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 animate-pulse"
              />
            ))}
          </div>
        ) : strongestMatches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-400">
            <Briefcase className="mx-auto h-8 w-8 text-slate-500 mb-2" />
            <p className="font-semibold text-white">No strong matches analyzed yet today</p>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;Run Real Discovery&quot; above to scan live Greenhouse, Lever, Ashby, and Arbeitnow boards.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {strongestMatches.map((job) => (
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
