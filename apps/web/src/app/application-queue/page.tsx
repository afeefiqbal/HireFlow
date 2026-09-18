'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ApplicationQueueGroup, Job } from '@ai-job-agent/shared';
import {
  Inbox,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Send,
  Calendar,
  XCircle,
  ExternalLink,
  Building2,
  MapPin,
  Flame,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Clock,
  Briefcase,
  Layers,
  Award,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';

export default function ApplicationQueuePage() {
  const [queue, setQueue] = useState<ApplicationQueueGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFamilyFilter, setRoleFamilyFilter] = useState('ALL');
  const [seniorityFilter, setSeniorityFilter] = useState('ALL');
  const [remoteFilter, setRemoteFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await api.getApplicationQueue();
      setQueue(data);
    } catch (err: any) {
      console.error('Failed to load application queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Follow-up state badge helper
  const getFollowUpBadge = (nextFollowUpAt?: string | null) => {
    if (!nextFollowUpAt) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(nextFollowUpAt);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
          <Clock className="w-2.5 h-2.5" />
          FOLLOW UP OVERDUE ({Math.abs(diffDays)}d)
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Clock className="w-2.5 h-2.5" />
          FOLLOW UP TODAY
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <Clock className="w-2.5 h-2.5" />
          FOLLOW UP IN {diffDays}d
        </span>
      );
    }
  };

  // Filter predicate
  const filterJob = (job: Job) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchesCompany = job.company?.toLowerCase().includes(q);
      const matchesTitle = job.title?.toLowerCase().includes(q);
      if (!matchesCompany && !matchesTitle) return false;
    }
    if (roleFamilyFilter !== 'ALL' && job.roleFamily !== roleFamilyFilter) {
      return false;
    }
    if (seniorityFilter !== 'ALL' && job.seniority !== seniorityFilter) {
      return false;
    }
    if (remoteFilter !== 'ALL') {
      if (remoteFilter === 'REMOTE' && job.remoteType !== 'REMOTE' && !job.isRemote) return false;
      if (remoteFilter === 'HYBRID' && job.remoteType !== 'HYBRID') return false;
      if (remoteFilter === 'ONSITE' && job.remoteType !== 'ONSITE') return false;
    }
    if (sourceFilter !== 'ALL') {
      if (!job.source?.toLowerCase().includes(sourceFilter.toLowerCase())) return false;
    }
    return true;
  };

  // Base raw column buckets
  const rawShortlisted = queue?.shortlisted || [];
  const rawPreparing = queue?.preparing || queue?.needsInput || queue?.cvReady || [];
  const rawReadyToApply = queue?.readyToApply || [];
  const rawApplied = queue?.applied || [];
  const rawInterview = queue?.interview || [];
  const rawOffer = queue?.offer || [];
  const rawArchived = queue?.archived || queue?.rejected || [];

  // Apply filters
  const shortlistedItems = useMemo(() => rawShortlisted.filter(filterJob), [rawShortlisted, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter]);
  const preparingItems = useMemo(() => rawPreparing.filter(filterJob), [rawPreparing, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter]);
  const readyToApplyItems = useMemo(() => rawReadyToApply.filter(filterJob), [rawReadyToApply, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter]);
  const appliedItems = useMemo(() => rawApplied.filter(filterJob), [rawApplied, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter]);
  const interviewItems = useMemo(() => rawInterview.filter(filterJob), [rawInterview, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter]);
  const offerItems = useMemo(() => rawOffer.filter(filterJob), [rawOffer, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter]);
  const archivedItems = useMemo(() => rawArchived.filter(filterJob), [rawArchived, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter]);

  const columns = [
    {
      id: 'SHORTLISTED',
      title: 'Shortlisted',
      items: shortlistedItems,
      icon: <BookmarkCheck className="h-4 w-4 text-sky-400" />,
      border: 'border-sky-500/30',
      badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
    },
    {
      id: 'PREPARING',
      title: 'Preparing',
      items: preparingItems,
      icon: <FileText className="h-4 w-4 text-blue-400" />,
      border: 'border-blue-500/30',
      badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    },
    {
      id: 'READY_TO_APPLY',
      title: 'Ready to Apply',
      items: readyToApplyItems,
      icon: <CheckCircle2 className="h-4 w-4 text-teal-400" />,
      border: 'border-teal-500/30',
      badge: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
    },
    {
      id: 'APPLIED',
      title: 'Applied',
      items: appliedItems,
      icon: <Send className="h-4 w-4 text-emerald-400" />,
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    },
    {
      id: 'INTERVIEW',
      title: 'Interview',
      items: interviewItems,
      icon: <Calendar className="h-4 w-4 text-purple-400" />,
      border: 'border-purple-500/30',
      badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    },
    {
      id: 'OFFER',
      title: 'Offer',
      items: offerItems,
      icon: <Award className="h-4 w-4 text-amber-400" />,
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      id: 'ARCHIVED',
      title: 'Archived',
      items: archivedItems,
      icon: <XCircle className="h-4 w-4 text-rose-400" />,
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    },
  ];

  const visibleColumns = statusFilter === 'ALL'
    ? columns
    : columns.filter((col) => col.id === statusFilter);

  const totalFilteredCount = columns.reduce((acc, col) => acc + col.items.length, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-96 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
          <div className="h-96 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
          <div className="h-96 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
          <div className="h-96 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Inbox className="h-6 w-6 text-teal-400" />
            Application Intelligence &amp; Kanban Queue
            <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-300 border border-teal-500/30">
              V5 Pipeline
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative lifecycle progression, follow-up management, and immutable application tracking.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Pipeline
        </button>
      </div>

      {/* Summary Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</div>
          <div className="text-xl font-black text-white mt-1">{totalFilteredCount}</div>
        </div>
        <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Shortlist</div>
          <div className="text-xl font-black text-sky-300 mt-1">{shortlistedItems.length}</div>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Preparing</div>
          <div className="text-xl font-black text-blue-300 mt-1">{preparingItems.length}</div>
        </div>
        <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Ready</div>
          <div className="text-xl font-black text-teal-300 mt-1">{readyToApplyItems.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Applied</div>
          <div className="text-xl font-black text-emerald-300 mt-1">{appliedItems.length}</div>
        </div>
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Interview</div>
          <div className="text-xl font-black text-purple-300 mt-1">{interviewItems.length}</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Offer</div>
          <div className="text-xl font-black text-amber-300 mt-1">{offerItems.length}</div>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Archived</div>
          <div className="text-xl font-black text-rose-300 mt-1">{archivedItems.length}</div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0b1324] p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Filter className="w-3.5 h-3.5 text-teal-400" />
          Filter Applications
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search company or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Stages</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY_TO_APPLY">Ready to Apply</option>
            <option value="APPLIED">Applied</option>
            <option value="INTERVIEW">Interview</option>
            <option value="OFFER">Offer</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Role Family */}
          <select
            value={roleFamilyFilter}
            onChange={(e) => setRoleFamilyFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Role Families</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="DevOps">DevOps</option>
            <option value="Data">Data</option>
            <option value="QA">QA</option>
            <option value="Engineering Management">Engineering Management</option>
            <option value="Other">Other</option>
          </select>

          {/* Seniority */}
          <select
            value={seniorityFilter}
            onChange={(e) => setSeniorityFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Seniorities</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Staff/Principal">Staff/Principal</option>
            <option value="Director+">Director+</option>
          </select>

          {/* Remote */}
          <select
            value={remoteFilter}
            onChange={(e) => setRemoteFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Setups</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">Onsite</option>
          </select>

          {/* Source */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Sources</option>
            <option value="Greenhouse">Greenhouse</option>
            <option value="Lever">Lever</option>
            <option value="Ashby">Ashby</option>
            <option value="Arbeitnow">Arbeitnow</option>
            <option value="Careers">Company Careers</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 items-start">
        {visibleColumns.map((col) => (
          <div
            key={col.id}
            className={`rounded-xl border ${col.border} bg-[#0b1324] p-3 space-y-3 min-h-[420px] flex flex-col justify-between`}
          >
            <div>
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  {col.icon}
                  <span>{col.title}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${col.badge}`}>
                  {col.items.length}
                </span>
              </div>

              {/* Card Items */}
              <div className="space-y-2.5">
                {col.items.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-slate-600 italic">
                    No applications
                  </div>
                ) : (
                  col.items.map((job) => {
                    const isFresh = job.ageStatus === 'FRESH';
                    const followUpBadge = getFollowUpBadge(job.application?.nextFollowUpAt);
                    const priorityScore = job.applicationPriority;
                    const priorityReasons = job.priorityReasons || [];

                    return (
                      <div
                        key={job.id}
                        className="rounded-lg border border-slate-800 bg-[#0f172a] p-3 space-y-2.5 shadow-sm hover:border-slate-700 transition-colors"
                      >
                        {/* Header: Priority & Freshness */}
                        <div className="flex items-center justify-between gap-1">
                          {priorityScore != null ? (
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                priorityScore >= 80
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : priorityScore >= 50
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                              }`}
                              title={priorityReasons.join(', ')}
                            >
                              Priority {priorityScore}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-500">Standard</span>
                          )}

                          {isFresh && (
                            <span className="shrink-0 text-teal-400 flex items-center gap-0.5 text-[9px] font-bold" title="Fresh <24h">
                              <Flame className="h-3 w-3" />
                              Fresh
                            </span>
                          )}
                        </div>

                        {/* Title & Company */}
                        <div>
                          <h4 className="font-bold text-white text-xs line-clamp-1">
                            {job.title}
                          </h4>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="truncate">{job.company}</span>
                          </div>
                        </div>

                        {/* Location & Seniority */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                            {job.location || 'Unknown'}
                          </span>
                          {job.seniority && job.seniority !== 'UNKNOWN' && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {job.seniority}
                            </span>
                          )}
                        </div>

                        {/* Role Family tag */}
                        {job.roleFamily && job.roleFamily !== 'UNKNOWN' && (
                          <div className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                            <Briefcase className="w-2.5 h-2.5 text-slate-500" />
                            {job.roleFamily}
                          </div>
                        )}

                        {/* Follow-up State Badge */}
                        {followUpBadge && (
                          <div className="pt-1">
                            {followUpBadge}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                          <Link
                            href={`/applications/${job.application?.id || job.id}`}
                            className="text-[11px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
                            title="Open V5 Application Workspace"
                          >
                            <span>Workspace</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/jobs/${job.id}/apply`}
                              className="text-[10px] text-slate-400 hover:text-slate-200"
                              title="Copilot Preparation"
                            >
                              Copilot
                            </Link>
                            <a
                              href={job.applicationUrl || job.canonicalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5"
                              title="Open Official Employer Portal"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-600 text-center pt-2">
              Human-Controlled Submission
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
