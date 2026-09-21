'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Code2,
  Server,
  Cloud,
  Cpu,
  MapPin,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [strongestMatches, setStrongestMatches] = useState<Job[]>([]);
  const [qualifiedOpportunities, setQualifiedOpportunities] = useState<QualifiedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [preparingJobId, setPreparingJobId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search Bar State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword) params.set('search', searchKeyword);
    if (searchCategory) params.set('role', searchCategory);
    if (searchLocation) params.set('location', searchLocation);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <div className="space-y-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#00b074] px-5 py-3.5 text-sm font-bold text-white shadow-xl border border-emerald-400 animate-fadeIn">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* JOBENTRY HERO & SEARCH SECTION */}
      {/* ============================================================ */}
      <div className="space-y-6">
        <div className="text-center sm:text-left max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-[#009a65]">
            <Radio className="h-3 w-3 animate-pulse text-[#00b074]" />
            Continuous Autonomous Discovery &lt;24h Active
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Find High-Signal Roles <br className="hidden sm:inline" />
            <span className="text-[#00b074]">Tailored To Your Ground Truth</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Candidate-First career command center for senior full-stack engineers. Ingesting authentic listings directly from Greenhouse, Lever, and Ashby with 100% deterministic compatibility.
          </p>
        </div>

        {/* JobEntry Signature Emerald Search Banner */}
        <div className="bg-[#00b074] rounded-2xl p-5 sm:p-7 shadow-lg">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Input 1: Keyword */}
            <div className="md:col-span-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4 text-[#00b074]" />
              </div>
              <input
                type="text"
                placeholder="Job Title or Keyword (e.g. Full Stack, Laravel, React)"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
              />
            </div>

            {/* Input 2: Specialization / Role */}
            <div className="md:col-span-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Briefcase className="h-4 w-4 text-[#00b074]" />
              </div>
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="w-full pl-10 pr-8 py-3 rounded-xl bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs appearance-none cursor-pointer"
              >
                <option value="">All Specializations</option>
                <option value="FULL_STACK">Full Stack Engineering</option>
                <option value="BACKEND">Backend & Distributed</option>
                <option value="FRONTEND">Frontend & Web Systems</option>
                <option value="DEVOPS">DevOps & Cloud Architecture</option>
                <option value="AI_ENGINEER">AI & Autonomous Agents</option>
              </select>
            </div>

            {/* Input 3: Location / Remote */}
            <div className="md:col-span-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="h-4 w-4 text-[#00b074]" />
              </div>
              <select
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full pl-10 pr-8 py-3 rounded-xl bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs appearance-none cursor-pointer"
              >
                <option value="">Location / Work Setup</option>
                <option value="REMOTE">Remote (Global / EU)</option>
                <option value="Berlin">Berlin, Germany</option>
                <option value="Amsterdam">Amsterdam, Netherlands</option>
                <option value="London">London, UK</option>
                <option value="HYBRID">Hybrid Roles</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#2b3940] hover:bg-slate-900 text-white text-sm font-bold transition shadow-sm flex items-center justify-center gap-2"
              >
                <span>Search Jobs</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Quick Filter Tags below search inputs */}
          <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center gap-2 text-xs text-white">
            <span className="font-semibold text-emerald-100">Quick Match Tags:</span>
            {['Senior Full Stack', 'Laravel 11', 'Node.js / Express', 'React / Next.js', 'PostgreSQL', 'Remote EU'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchKeyword(tag);
                  router.push(`/jobs?search=${encodeURIComponent(tag)}`);
                }}
                className="bg-white/20 hover:bg-white/30 text-white rounded-full px-3 py-1 font-medium transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* EXPLORE BY SPECIALIZATION (JobEntry .cat-item style) */}
      {/* ============================================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Explore By Specialization</h2>
            <p className="text-xs text-slate-500">Curated tracks aligned with your 7+ years engineering career.</p>
          </div>
          <Link href="/jobs" className="text-xs font-bold text-[#009a65] hover:underline flex items-center gap-1">
            Browse All Roles <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/jobs?role=FULL_STACK"
            className="cat-item p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#00b074] hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#00b074] mb-3.5 group-hover:scale-105 transition-transform">
              <Code2 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-[#00b074] transition-colors">
              Full-Stack Engineering
            </h3>
            <p className="text-xs text-slate-500 mt-1">Laravel · Node.js · React · Next.js</p>
            <span className="inline-block mt-3 text-[11px] font-semibold text-[#009a65] bg-emerald-50 px-2 py-0.5 rounded">
              High Compatibility
            </span>
          </Link>

          <Link
            href="/jobs?role=BACKEND"
            className="cat-item p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#00b074] hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#00b074] mb-3.5 group-hover:scale-105 transition-transform">
              <Server className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-[#00b074] transition-colors">
              Backend &amp; Distributed
            </h3>
            <p className="text-xs text-slate-500 mt-1">APIs · Postgres · Redis · Microservices</p>
            <span className="inline-block mt-3 text-[11px] font-semibold text-[#009a65] bg-emerald-50 px-2 py-0.5 rounded">
              Verified Experience
            </span>
          </Link>

          <Link
            href="/jobs?role=DEVOPS"
            className="cat-item p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#00b074] hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#00b074] mb-3.5 group-hover:scale-105 transition-transform">
              <Cloud className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-[#00b074] transition-colors">
              Cloud &amp; Infrastructure
            </h3>
            <p className="text-xs text-slate-500 mt-1">Cloudflare · AWS · Docker · CI/CD</p>
            <span className="inline-block mt-3 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Active Pipeline
            </span>
          </Link>

          <Link
            href="/jobs?role=AI_ENGINEER"
            className="cat-item p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#00b074] hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#00b074] mb-3.5 group-hover:scale-105 transition-transform">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-[#00b074] transition-colors">
              AI &amp; Autonomous Agents
            </h3>
            <p className="text-xs text-slate-500 mt-1">LLM Gateways · RAG · Workflows</p>
            <span className="inline-block mt-3 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              Emerging Focus
            </span>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 7 KEY METRICS CARDS */}
      {/* ============================================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pipeline Analytics (PostgreSQL Live)
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunContinuousDiscovery}
              disabled={discovering}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
            >
              <Zap className={`h-3.5 w-3.5 ${discovering ? 'animate-spin' : ''}`} />
              <span>{discovering ? 'Scanning...' : 'Trigger Scan'}</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>
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
            variant="emerald"
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
      {/* QUALIFIED OPPORTUNITIES STREAM */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#00b074]" />
              Qualified Opportunities Stream ({qualifiedOpportunities.length})
            </h2>
            <p className="text-xs text-slate-500">
              Matched against your active Ground Truth with 4-State Tech Evidence and Role Family Gate.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 font-semibold">Tier 1: Qualified</span>
            <span className="rounded px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 font-semibold">Tier 2: Prepared</span>
            <span className="rounded px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[#009a65] font-semibold">Tier 3: Auto-Apply Ready</span>
          </div>
        </div>

        {qualifiedOpportunities.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-3 shadow-xs">
            <Sparkles className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No qualified opportunities surfaced yet.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Run continuous discovery to ingest fresh jobs from Greenhouse, Lever, Ashby, and Arbeitnow and match them automatically against your profile.
            </p>
            <button
              onClick={handleRunContinuousDiscovery}
              disabled={discovering}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2 text-xs font-bold text-white shadow-xs"
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
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 hover:border-[#00b074] transition-all shadow-xs"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{opp.job.title}</h3>
                        <span className="text-xs font-semibold text-slate-400">at</span>
                        <span className="text-sm font-bold text-[#009a65]">{opp.job.company}</span>
                        {opp.job.isRemote && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#009a65] border border-emerald-200">
                            Remote
                          </span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] text-slate-600 font-medium">
                          {opp.job.location}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        {/* Score Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                          opp.matchScore >= 85 ? 'bg-emerald-50 text-[#009a65] border border-emerald-200' :
                          opp.matchScore >= 75 ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {opp.matchScore}% Compatibility
                        </span>

                        {/* Opportunity Tier Badge */}
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          isApplied ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          opp.tier === 'AUTO_APPLY_ELIGIBLE' ? 'bg-emerald-50 text-[#009a65] border border-emerald-200' :
                          opp.tier === 'AUTO_PREPARED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {opp.tier.replace(/_/g, ' ')}
                        </span>

                        {/* ATS Support Status */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          opp.atsMechanism !== 'MANUAL_EXTERNAL'
                            ? 'bg-emerald-50 text-[#009a65] border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {opp.atsMechanism === 'LEVER_DIRECT' ? '✓ Lever Direct Supported' :
                           opp.atsMechanism === 'GREENHOUSE_DIRECT' ? '✓ Greenhouse Board Supported' :
                           '⚠ External ATS (Manual Direct)'}
                        </span>

                        {/* Submission Receipt Indicator if APPLIED */}
                        {isApplied && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#009a65] border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Verified Submission ({opp.submissionReceipt?.receiptId || 'Recorded'})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isApplied ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-[#009a65]">
                          <CheckCircle2 className="h-4 w-4 text-[#00b074]" />
                          <span>Submitted &amp; Verified</span>
                        </div>
                      ) : isAutoApplyReady ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAutoApply(opp.job.id, true)}
                            disabled={applyingJobId === opp.job.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                          >
                            <span>Dry-Run Test</span>
                          </button>
                          <button
                            onClick={() => handleAutoApply(opp.job.id, false)}
                            disabled={applyingJobId === opp.job.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition-colors"
                          >
                            <Zap className={`h-4 w-4 ${applyingJobId === opp.job.id ? 'animate-spin' : ''}`} />
                            <span>{applyingJobId === opp.job.id ? 'Submitting...' : 'Auto-Apply (Verified)'}</span>
                          </button>
                        </div>
                      ) : !opp.preparationStatus.cvReady ? (
                        <button
                          onClick={() => handleAutoPrepare(opp.job.id)}
                          disabled={preparingJobId === opp.job.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-xs"
                        >
                          <FileCheck className={`h-4 w-4 ${preparingJobId === opp.job.id ? 'animate-spin' : ''}`} />
                          <span>{preparingJobId === opp.job.id ? 'Generating...' : 'Auto-Prepare Application'}</span>
                        </button>
                      ) : opp.atsMechanism === 'MANUAL_EXTERNAL' ? (
                        <a
                          href={opp.job.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
                        >
                          <span>Apply on Employer Site</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link
                          href={`/jobs/${opp.job.id}/apply`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-3.5 py-2 text-xs font-bold text-white transition-colors shadow-xs"
                        >
                          <span>Review in Copilot</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}

                      <Link
                        href={`/jobs/${opp.job.id}/apply`}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition-colors shadow-2xs"
                        title="Open Application Preparation Workspace"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Preparation Checklist Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Check className={`h-3.5 w-3.5 ${opp.preparationStatus.cvReady ? 'text-[#00b074]' : 'text-slate-300'}`} />
                        <span className={opp.preparationStatus.cvReady ? 'text-slate-800 font-semibold' : 'text-slate-400'}>Tailored CV</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Check className={`h-3.5 w-3.5 ${opp.preparationStatus.coverLetterReady ? 'text-[#00b074]' : 'text-slate-300'}`} />
                        <span className={opp.preparationStatus.coverLetterReady ? 'text-slate-800 font-semibold' : 'text-slate-400'}>Cover Letter</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Check className={`h-3.5 w-3.5 ${opp.preparationStatus.screeningReady ? 'text-[#00b074]' : 'text-slate-300'}`} />
                        <span className={opp.preparationStatus.screeningReady ? 'text-slate-800 font-semibold' : 'text-slate-400'}>Screening Q&amp;A</span>
                      </span>

                      {opp.preparationStatus.pendingQuestionsCount > 0 && (
                        <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] text-rose-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {opp.preparationStatus.pendingQuestionsCount} question(s) require manual input
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium">
                      {opp.tierReason}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* TODAY'S TOP MATCHES FEED */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#00b074]" />
              Latest Match Pipeline
            </h2>
            <span className="rounded-full bg-emerald-50 text-[#009a65] border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
              {strongestMatches.length} Opportunities
            </span>
          </div>

          <Link
            href="/jobs"
            className="group flex items-center gap-1 text-xs font-bold text-[#009a65] hover:underline"
          >
            <span>View Full Database</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {strongestMatches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
            <p className="text-sm font-medium text-slate-500">No active job matches found in this view.</p>
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
