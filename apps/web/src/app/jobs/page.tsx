'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Job, VisaStatus } from '@ai-job-agent/shared';
import { JobCard } from '@/components/JobCard';
import {
  Search,
  Filter,
  Flame,
  Globe2,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  X,
  Radio,
  ShieldCheck,
} from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [freshOnly, setFreshOnly] = useState(true); // Default: <= 24 hours
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [visaFilter, setVisaFilter] = useState<string>('ALL');
  const [minMatch, setMinMatch] = useState<number>(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getJobs({
        search: search || undefined,
        freshOnly: freshOnly,
        roles: selectedRole ? [selectedRole] : undefined,
        technologies: selectedTech ? [selectedTech] : undefined,
        locations: selectedLocation ? [selectedLocation] : undefined,
        source: selectedSource || undefined,
        remoteOnly: remoteOnly,
        visaSponsorship: visaFilter !== 'ALL' ? (visaFilter as VisaStatus) : undefined,
        minMatchScore: minMatch > 0 ? minMatch : undefined,
      });
      setJobs(res.jobs || []);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, freshOnly, selectedRole, selectedTech, selectedLocation, selectedSource, remoteOnly, visaFilter, minMatch]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleRunDiscovery = async () => {
    setDiscovering(true);
    try {
      const res = await api.triggerDiscovery();
      setToastMessage(
        `Discovered & ingested ${res.newSaved} new jobs (${res.freshSaved} fresh <24h) from Greenhouse, Lever, Ashby & EU Boards.`
      );
      setTimeout(() => setToastMessage(null), 6000);
      await fetchJobs();
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
      setToastMessage('AI Match Analysis evaluated!');
      setTimeout(() => setToastMessage(null), 4000);
      await fetchJobs();
    } catch (err: any) {
      alert(`AI Match analysis failed: ${err.message}`);
    } finally {
      setAnalyzingJobId(null);
    }
  };

  const handleSave = async (jobId: string) => {
    try {
      await api.updateApplicationStatus(jobId, 'SAVED', 'Saved from discovery page');
      setToastMessage('Saved to pipeline');
      setTimeout(() => setToastMessage(null), 3000);
      await fetchJobs();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setFreshOnly(true);
    setSelectedRole('');
    setSelectedTech('');
    setSelectedLocation('');
    setSelectedSource('');
    setRemoteOnly(false);
    setVisaFilter('ALL');
    setMinMatch(0);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Real Job Discovery Engine
            <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-300 border border-teal-500/30">
              {jobs.length} Available
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real postings from Greenhouse, Lever, Ashby, and European tech career portals filtered for Afeef Iqbal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Run Discovery Button */}
          <button
            onClick={handleRunDiscovery}
            disabled={discovering}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-500 transition-colors shadow-lg shadow-teal-900/30 disabled:opacity-50"
          >
            <Radio className={`h-3.5 w-3.5 ${discovering ? 'animate-pulse' : ''}`} />
            {discovering ? 'Scanning ATS Boards...' : 'Run Real Discovery'}
          </button>

          {/* Strict 24h filter toggle */}
          <button
            type="button"
            onClick={() => setFreshOnly(!freshOnly)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all border ${
              freshOnly
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-glow-primary'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Flame className={`h-4 w-4 ${freshOnly ? 'text-teal-400' : 'text-slate-500'}`} />
            <span>Strict &lt;24h Filter: {freshOnly ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={fetchJobs}
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 transition-colors"
            title="Refresh jobs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Matrix Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 shadow-sm space-y-4">
        {/* Top Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, company, technology, or keywords..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Filter Badges & Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 text-xs">
          {/* Target Role */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="Laravel">Laravel</option>
              <option value="PHP">PHP</option>
              <option value="Full Stack">Full Stack</option>
              <option value="Backend">Backend</option>
              <option value="Node">Node.js</option>
            </select>
          </div>

          {/* Technology */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Core Tech</label>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="">All Technologies</option>
              <option value="Laravel">Laravel</option>
              <option value="PHP">PHP</option>
              <option value="Vue.js">Vue.js</option>
              <option value="Node.js">Node.js</option>
              <option value="MySQL">MySQL</option>
              <option value="PostgreSQL">PostgreSQL</option>
              <option value="Docker">Docker</option>
              <option value="AWS">AWS</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Any Region</option>
              <option value="Germany">Germany</option>
              <option value="Netherlands">Netherlands</option>
              <option value="Berlin">Berlin</option>
              <option value="Amsterdam">Amsterdam</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          {/* Source Platform */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Source ATS</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="">All Sources</option>
              <option value="Greenhouse">Greenhouse</option>
              <option value="Lever">Lever</option>
              <option value="Ashby">Ashby</option>
              <option value="Company Careers">Company Careers</option>
            </select>
          </div>

          {/* Visa Sponsorship */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Visa Policy</label>
            <select
              value={visaFilter}
              onChange={(e) => setVisaFilter(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">All Policies</option>
              <option value="OFFERED">Sponsorship Offered</option>
              <option value="NOT_STATED">Not Stated</option>
              <option value="NOT_OFFERED">No Sponsorship</option>
            </select>
          </div>

          {/* Min Match Score */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">AI Assessment</label>
            <select
              value={minMatch}
              onChange={(e) => setMinMatch(Number(e.target.value))}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value={0}>Any Score</option>
              <option value={80}>≥ 80% High</option>
              <option value={90}>≥ 90% Strong</option>
            </select>
          </div>

          {/* Remote Only Toggle */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2 text-slate-300">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-teal-600 focus:ring-teal-500"
              />
              <span className="font-medium">Remote Only</span>
            </label>
          </div>
        </div>

        {/* Active Filters Reset Bar */}
        {(selectedRole || selectedTech || selectedLocation || selectedSource || remoteOnly || visaFilter !== 'ALL' || minMatch > 0 || search || !freshOnly) && (
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Active filters applied.</span>
              {!freshOnly && <span className="text-amber-400">(24h filter disabled)</span>}
            </div>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 font-semibold"
            >
              <X className="h-3 w-3" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Jobs Feed List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 animate-pulse"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
            <Filter className="mx-auto h-8 w-8 text-slate-500 mb-2" />
            <h3 className="text-base font-semibold text-white">No matching jobs found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try clicking &quot;Run Real Discovery&quot; to scan live public boards, or adjust your filter criteria.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
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
