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
  // V4 Ground Truth Filters
  const [selectedRoleFamily, setSelectedRoleFamily] = useState<string>('');
  const [selectedSeniority, setSelectedSeniority] = useState<string>('');
  const [selectedRemoteType, setSelectedRemoteType] = useState<string>('');
  const [selectedFreshness, setSelectedFreshness] = useState<string>('');

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
        roleFamily: selectedRoleFamily || undefined,
        seniority: selectedSeniority || undefined,
        remoteType: selectedRemoteType || undefined,
        freshnessStatus: selectedFreshness || undefined,
      });
      setJobs(res.jobs || []);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    freshOnly,
    selectedRole,
    selectedTech,
    selectedLocation,
    selectedSource,
    remoteOnly,
    visaFilter,
    minMatch,
    selectedRoleFamily,
    selectedSeniority,
    selectedRemoteType,
    selectedFreshness,
  ]);

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
    setSelectedRoleFamily('');
    setSelectedSeniority('');
    setSelectedRemoteType('');
    setSelectedFreshness('');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#00b074] px-5 py-3 text-sm font-bold text-white shadow-xl animate-fadeIn">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Real Job Discovery Engine
            <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200">
              {jobs.length} Active Positions
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real postings ingested from Greenhouse, Lever, Ashby, and European tech career portals filtered for Afeef Iqbal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Run Discovery Button */}
          <button
            onClick={handleRunDiscovery}
            disabled={discovering}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2 text-xs font-bold text-white transition-all shadow-xs disabled:opacity-50"
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
                ? 'bg-emerald-50 text-[#009a65] border-emerald-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            <Flame className={`h-4 w-4 ${freshOnly ? 'text-[#00b074]' : 'text-slate-400'}`} />
            <span>Strict &lt;24h Filter: {freshOnly ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={fetchJobs}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh jobs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Matrix Card - JobEntry Clean White Box */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        {/* Top Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#00b074]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, company, technology, or keywords..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#00b074] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        {/* V4 Ground Truth Row */}
        <div className="rounded-xl bg-emerald-50/40 p-4 border border-emerald-100">
          <div className="text-[11px] font-bold text-[#009a65] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#00b074]" />
            <span>Ground Truth Compatibility Filters</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Role Family */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Role Family</label>
              <select
                value={selectedRoleFamily}
                onChange={(e) => setSelectedRoleFamily(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 font-medium focus:border-[#00b074] focus:outline-none"
              >
                <option value="">All Role Families</option>
                <option value="SOFTWARE_ENGINEERING">Software Engineering</option>
                <option value="ENGINEERING_MANAGEMENT">Eng Management</option>
                <option value="PRODUCT_MANAGEMENT">Product Management</option>
                <option value="DEVOPS_SRE">DevOps & Cloud</option>
                <option value="DATA_ENGINEERING">Data Engineering</option>
                <option value="QA_TESTING">QA / Testing</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Seniority */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Seniority Level</label>
              <select
                value={selectedSeniority}
                onChange={(e) => setSelectedSeniority(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 font-medium focus:border-[#00b074] focus:outline-none"
              >
                <option value="">All Seniorities</option>
                <option value="LEAD">Lead / Staff / Principal</option>
                <option value="SENIOR">Senior</option>
                <option value="MID">Mid-level</option>
                <option value="JUNIOR">Junior / Entry</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>

            {/* Work Setup */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Work Setup</label>
              <select
                value={selectedRemoteType}
                onChange={(e) => setSelectedRemoteType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 font-medium focus:border-[#00b074] focus:outline-none"
              >
                <option value="">Any Setup</option>
                <option value="REMOTE">Remote Only</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
            </div>

            {/* Freshness Tier */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Freshness Tier</label>
              <select
                value={selectedFreshness}
                onChange={(e) => setSelectedFreshness(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 font-medium focus:border-[#00b074] focus:outline-none"
              >
                <option value="">All Tiers</option>
                <option value="FRESH">&lt; 6 hours (Fresh)</option>
                <option value="RECENT">6 - 12 hours (Recent)</option>
                <option value="TODAY">12 - 24 hours (Today)</option>
                <option value="STALE">&gt; 24 hours (Stale)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Detailed Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
          {/* Target Role */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Keyword Title</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 font-medium focus:border-[#00b074] focus:outline-none"
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
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Core Tech</label>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 font-medium focus:border-[#00b074] focus:outline-none"
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
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 font-medium focus:border-[#00b074] focus:outline-none"
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
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Source ATS</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 font-medium focus:border-[#00b074] focus:outline-none"
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
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Visa Policy</label>
            <select
              value={visaFilter}
              onChange={(e) => setVisaFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 font-medium focus:border-[#00b074] focus:outline-none"
            >
              <option value="ALL">All Policies</option>
              <option value="OFFERED">Sponsorship Offered</option>
              <option value="NOT_STATED">Not Stated</option>
              <option value="NOT_OFFERED">No Sponsorship</option>
            </select>
          </div>

          {/* Min Match Score */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">AI Assessment</label>
            <select
              value={minMatch}
              onChange={(e) => setMinMatch(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 font-medium focus:border-[#00b074] focus:outline-none"
            >
              <option value={0}>Any Score</option>
              <option value={80}>≥ 80% High</option>
              <option value={90}>≥ 90% Strong</option>
            </select>
          </div>

          {/* Remote Only Toggle */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2 text-slate-700">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="rounded border-slate-300 text-[#00b074] focus:ring-[#00b074]"
              />
              <span className="font-semibold">Remote Only</span>
            </label>
          </div>
        </div>

        {/* Active Filters Reset Bar */}
        {(selectedRole ||
          selectedTech ||
          selectedLocation ||
          selectedSource ||
          remoteOnly ||
          visaFilter !== 'ALL' ||
          minMatch > 0 ||
          search ||
          !freshOnly ||
          selectedRoleFamily ||
          selectedSeniority ||
          selectedRemoteType ||
          selectedFreshness) && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>Active filters applied.</span>
              {!freshOnly && <span className="text-amber-600 font-medium">(24h filter disabled)</span>}
            </div>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[#009a65] hover:text-[#007a50] font-bold"
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
                className="h-44 rounded-xl border border-slate-200 bg-white p-5 animate-pulse shadow-xs"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-xs">
            <Filter className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <h3 className="text-base font-bold text-slate-800">No matching jobs found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try clicking &quot;Run Real Discovery&quot; to scan live public boards, or adjust your filter criteria.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
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
