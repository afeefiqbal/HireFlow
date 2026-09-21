'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ApplicationQueueGroup, ApplicationStatus, Job } from '@ai-job-agent/shared';
import { ClientDate } from '@/components/ClientDate';
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
  GripVertical,
  BellRing,
} from 'lucide-react';

interface ToastState {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function ApplicationQueuePage() {
  const [queue, setQueue] = useState<ApplicationQueueGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Drag and Drop state
  const [draggedJob, setDraggedJob] = useState<Job | null>(null);
  const [draggedFromCol, setDraggedFromCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFamilyFilter, setRoleFamilyFilter] = useState('ALL');
  const [seniorityFilter, setSeniorityFilter] = useState('ALL');
  const [remoteFilter, setRemoteFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [onlyFollowUpsDue, setOnlyFollowUpsDue] = useState(false);

  const fetchQueue = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      const data = await api.getApplicationQueue();
      setQueue(data);
    } catch (err: any) {
      console.error('Failed to load application queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();

    // SWR / cross-page synchronization listeners
    const handleSync = () => fetchQueue(true);
    const handleFocus = () => fetchQueue(true);

    window.addEventListener('hireflow:application-updated', handleSync);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('hireflow:application-updated', handleSync);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchQueue]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Follow-up calculations across all jobs
  const followUpStats = useMemo(() => {
    if (!queue) return { overdue: 0, dueToday: 0, upcoming: 0 };
    const allJobs = [
      ...(queue.shortlisted || []),
      ...(queue.preparing || queue.needsInput || queue.cvReady || []),
      ...(queue.readyToApply || []),
      ...(queue.applied || []),
      ...(queue.interview || []),
      ...(queue.offer || []),
      ...(queue.archived || queue.rejected || []),
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdue = 0;
    let dueToday = 0;
    let upcoming = 0;

    allJobs.forEach((job) => {
      const dStr = job.application?.nextFollowUpAt;
      if (!dStr) return;
      const target = new Date(dStr);
      target.setHours(0, 0, 0, 0);
      const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0) overdue++;
      else if (diff === 0) dueToday++;
      else upcoming++;
    });

    return { overdue, dueToday, upcoming };
  }, [queue]);

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
          OVERDUE ({Math.abs(diffDays)}d)
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Clock className="w-2.5 h-2.5" />
          DUE TODAY
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <Clock className="w-2.5 h-2.5" />
          IN {diffDays}d
        </span>
      );
    }
  };

  // Filter predicate
  const filterJob = (job: Job) => {
    if (onlyFollowUpsDue) {
      const dStr = job.application?.nextFollowUpAt;
      if (!dStr) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dStr);
      target.setHours(0, 0, 0, 0);
      const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) return false;
    }

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
  const shortlistedItems = useMemo(() => rawShortlisted.filter(filterJob), [rawShortlisted, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter, onlyFollowUpsDue]);
  const preparingItems = useMemo(() => rawPreparing.filter(filterJob), [rawPreparing, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter, onlyFollowUpsDue]);
  const readyToApplyItems = useMemo(() => rawReadyToApply.filter(filterJob), [rawReadyToApply, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter, onlyFollowUpsDue]);
  const appliedItems = useMemo(() => rawApplied.filter(filterJob), [rawApplied, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter, onlyFollowUpsDue]);
  const interviewItems = useMemo(() => rawInterview.filter(filterJob), [rawInterview, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter, onlyFollowUpsDue]);
  const offerItems = useMemo(() => rawOffer.filter(filterJob), [rawOffer, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter, onlyFollowUpsDue]);
  const archivedItems = useMemo(() => rawArchived.filter(filterJob), [rawArchived, searchTerm, roleFamilyFilter, seniorityFilter, remoteFilter, sourceFilter, onlyFollowUpsDue]);

  const columns = [
    {
      id: 'SHORTLISTED',
      targetStatus: 'SHORTLISTED' as ApplicationStatus,
      title: 'Shortlisted',
      items: shortlistedItems,
      icon: <BookmarkCheck className="h-4 w-4 text-sky-600" />,
      border: 'border-slate-200/80 bg-slate-100/60',
      badge: 'bg-sky-50 text-sky-700 border border-sky-200',
      activeBorder: 'border-sky-400 bg-sky-50/60',
    },
    {
      id: 'PREPARING',
      targetStatus: 'PREPARING' as ApplicationStatus,
      title: 'Preparing',
      items: preparingItems,
      icon: <FileText className="h-4 w-4 text-blue-600" />,
      border: 'border-slate-200/80 bg-slate-100/60',
      badge: 'bg-blue-50 text-blue-700 border border-blue-200',
      activeBorder: 'border-blue-400 bg-blue-50/60',
    },
    {
      id: 'READY_TO_APPLY',
      targetStatus: 'READY_TO_APPLY' as ApplicationStatus,
      title: 'Ready to Apply',
      items: readyToApplyItems,
      icon: <CheckCircle2 className="h-4 w-4 text-[#00b074]" />,
      border: 'border-slate-200/80 bg-slate-100/60',
      badge: 'bg-emerald-50 text-[#009a65] border border-emerald-200',
      activeBorder: 'border-emerald-400 bg-emerald-50/60',
    },
    {
      id: 'APPLIED',
      targetStatus: 'APPLIED' as ApplicationStatus,
      title: 'Applied',
      items: appliedItems,
      icon: <Send className="h-4 w-4 text-teal-600" />,
      border: 'border-slate-200/80 bg-slate-100/60',
      badge: 'bg-teal-50 text-teal-700 border border-teal-200',
      activeBorder: 'border-teal-400 bg-teal-50/60',
    },
    {
      id: 'INTERVIEW',
      targetStatus: 'INTERVIEW' as ApplicationStatus,
      title: 'Interview',
      items: interviewItems,
      icon: <Calendar className="h-4 w-4 text-purple-600" />,
      border: 'border-slate-200/80 bg-slate-100/60',
      badge: 'bg-purple-50 text-purple-700 border border-purple-200',
      activeBorder: 'border-purple-400 bg-purple-50/60',
    },
    {
      id: 'OFFER',
      targetStatus: 'OFFER' as ApplicationStatus,
      title: 'Offer',
      items: offerItems,
      icon: <Award className="h-4 w-4 text-amber-600" />,
      border: 'border-slate-200/80 bg-slate-100/60',
      badge: 'bg-amber-50 text-amber-700 border border-amber-200',
      activeBorder: 'border-amber-400 bg-amber-50/60',
    },
    {
      id: 'ARCHIVED',
      targetStatus: 'WITHDRAWN' as ApplicationStatus,
      title: 'Archived',
      items: archivedItems,
      icon: <XCircle className="h-4 w-4 text-rose-600" />,
      border: 'border-slate-200/80 bg-slate-100/60',
      badge: 'bg-rose-50 text-rose-700 border border-rose-200',
      activeBorder: 'border-rose-400 bg-rose-50/60',
    },
  ];

  const visibleColumns = statusFilter === 'ALL'
    ? columns
    : columns.filter((col) => col.id === statusFilter);

  const totalFilteredCount = columns.reduce((acc, col) => acc + col.items.length, 0);

  // ==========================================
  // DRAG AND DROP HANDLERS WITH OPTIMISTIC UI
  // ==========================================

  const handleDragStart = (e: React.DragEvent, job: Job, fromColId: string) => {
    setDraggedJob(job);
    setDraggedFromCol(fromColId);
    e.dataTransfer.setData('text/plain', JSON.stringify({ jobId: job.id, fromColId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: string) => {
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedJob(null);
    setDraggedFromCol(null);
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverCol(null);

    if (!draggedJob || !draggedFromCol || draggedFromCol === targetColId) {
      return;
    }

    const targetCol = columns.find((c) => c.id === targetColId);
    if (!targetCol) return;

    const previousQueue = queue;
    if (!previousQueue) return;

    const movingJob = { ...draggedJob };
    const targetStatus = targetCol.targetStatus;

    // 1. Optimistic Local State Update
    const removeFromBucket = (list?: Job[]) => (list || []).filter((j) => j.id !== movingJob.id);
    const updatedJob: Job = {
      ...movingJob,
      application: movingJob.application
        ? { ...movingJob.application, status: targetStatus }
        : {
            id: movingJob.id,
            jobId: movingJob.id,
            status: targetStatus,
            appliedDate: targetStatus === 'APPLIED' ? new Date().toISOString() : null,
            lastUpdated: new Date().toISOString(),
          },
    };

    const nextQueue: ApplicationQueueGroup = {
      ...previousQueue,
      shortlisted: targetColId === 'SHORTLISTED' ? [updatedJob, ...removeFromBucket(previousQueue.shortlisted)] : removeFromBucket(previousQueue.shortlisted),
      preparing: targetColId === 'PREPARING' ? [updatedJob, ...removeFromBucket(previousQueue.preparing)] : removeFromBucket(previousQueue.preparing),
      needsInput: removeFromBucket(previousQueue.needsInput),
      cvReady: removeFromBucket(previousQueue.cvReady),
      readyToApply: targetColId === 'READY_TO_APPLY' ? [updatedJob, ...removeFromBucket(previousQueue.readyToApply)] : removeFromBucket(previousQueue.readyToApply),
      applied: targetColId === 'APPLIED' ? [updatedJob, ...removeFromBucket(previousQueue.applied)] : removeFromBucket(previousQueue.applied),
      interview: targetColId === 'INTERVIEW' ? [updatedJob, ...removeFromBucket(previousQueue.interview)] : removeFromBucket(previousQueue.interview),
      offer: targetColId === 'OFFER' ? [updatedJob, ...removeFromBucket(previousQueue.offer)] : removeFromBucket(previousQueue.offer),
      archived: targetColId === 'ARCHIVED' ? [updatedJob, ...removeFromBucket(previousQueue.archived)] : removeFromBucket(previousQueue.archived),
      rejected: removeFromBucket(previousQueue.rejected),
    };

    setQueue(nextQueue);
    showToast('info', `Moving "${movingJob.title}" to ${targetCol.title}...`);

    // 2. Authoritative API Call
    try {
      await api.updateApplicationStatus(
        movingJob.id,
        targetStatus,
        `Transitioned to ${targetStatus} via Kanban drag & drop`,
        'USER'
      );
      showToast('success', `✓ Moved "${movingJob.title}" to ${targetCol.title}`);
      window.dispatchEvent(new CustomEvent('hireflow:application-updated'));
      await fetchQueue(true);
    } catch (err: any) {
      // 3. Rollback on Failure
      setQueue(previousQueue);
      showToast('error', `⚠️ Transition rejected: ${err.message || 'Illegal lifecycle transition'}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-96 bg-white rounded-xl animate-pulse border border-slate-200" />
          <div className="h-96 bg-white rounded-xl animate-pulse border border-slate-200" />
          <div className="h-96 bg-white rounded-xl animate-pulse border border-slate-200" />
          <div className="h-96 bg-white rounded-xl animate-pulse border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold shadow-xl border transition-all ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : toast.type === 'success'
              ? 'bg-[#00b074] text-white border-emerald-400'
              : 'bg-white text-slate-800 border-slate-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
          ) : (
            <RefreshCw className="h-4 w-4 text-emerald-600 animate-spin shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Inbox className="h-6 w-6 text-[#00b074]" />
            Application Intelligence &amp; Kanban Queue
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200">
              V5 Pipeline
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Drag cards between columns to advance lifecycle states with optimistic updates and strict gate enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchQueue(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#00b074]' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Board'}</span>
          </button>
        </div>
      </div>

      {/* Follow-Up Action Alert Banner */}
      {(followUpStats.overdue > 0 || followUpStats.dueToday > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
              <BellRing className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                Action Required: Follow-ups Pending
                {followUpStats.overdue > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[10px] font-extrabold border border-rose-200">
                    {followUpStats.overdue} OVERDUE
                  </span>
                )}
                {followUpStats.dueToday > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                    {followUpStats.dueToday} DUE TODAY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Maintain communication cadence with hiring teams to maximize interview conversion.
              </p>
            </div>
          </div>

          <button
            onClick={() => setOnlyFollowUpsDue(!onlyFollowUpsDue)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 border ${
              onlyFollowUpsDue
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-white hover:bg-slate-50 text-amber-800 border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{onlyFollowUpsDue ? 'Clear Follow-Up Filter' : 'Filter Follow-ups Due'}</span>
          </button>
        </div>
      )}

      {/* Filter Control Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="h-4 w-4 text-[#00b074]" />
            <span>Kanban Filters</span>
            <span className="text-slate-400 font-medium">({totalFilteredCount} matching cards)</span>
          </div>

          {(searchTerm || statusFilter !== 'ALL' || roleFamilyFilter !== 'ALL' || seniorityFilter !== 'ALL' || remoteFilter !== 'ALL' || sourceFilter !== 'ALL' || onlyFollowUpsDue) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setRoleFamilyFilter('ALL');
                setSeniorityFilter('ALL');
                setRemoteFilter('ALL');
                setSourceFilter('ALL');
                setOnlyFollowUpsDue(false);
              }}
              className="text-[11px] text-[#009a65] hover:text-[#007a50] font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search company/title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00b074]"
            />
          </div>

          {/* Column/Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-[#00b074]"
          >
            <option value="ALL">All Columns</option>
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
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-[#00b074]"
          >
            <option value="ALL">All Role Families</option>
            <option value="SOFTWARE_ENGINEERING">Software Engineering</option>
            <option value="DATA_AI">Data &amp; AI</option>
            <option value="PRODUCT_DESIGN">Product &amp; Design</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
          </select>

          {/* Seniority */}
          <select
            value={seniorityFilter}
            onChange={(e) => setSeniorityFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-[#00b074]"
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
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-[#00b074]"
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
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-[#00b074]"
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
        {visibleColumns.map((col) => {
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-xl border transition-all duration-150 ${
                isOver ? col.activeBorder + ' ring-2 ring-[#00b074]/30' : col.border
              } p-3 space-y-3 min-h-[460px] flex flex-col justify-between`}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
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
                    <div className="text-center py-10 text-[11px] text-slate-400 italic border-2 border-dashed border-slate-200 bg-white/50 rounded-lg">
                      {isOver ? 'Drop card here' : 'No applications'}
                    </div>
                  ) : (
                    col.items.map((job) => {
                      const isFresh = job.ageStatus === 'FRESH';
                      const followUpBadge = getFollowUpBadge(job.application?.nextFollowUpAt);
                      const priorityScore = job.applicationPriority;
                      const priorityReasons = job.priorityReasons || [];
                      const isBeingDragged = draggedJob?.id === job.id;

                      return (
                        <div
                          key={job.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, job, col.id)}
                          onDragEnd={handleDragEnd}
                          className={`rounded-lg border bg-white p-3 space-y-2.5 shadow-2xs transition-all cursor-grab active:cursor-grabbing hover:border-[#00b074] hover:shadow-xs ${
                            isBeingDragged
                              ? 'opacity-40 border-[#00b074] scale-95'
                              : 'border-slate-200'
                          }`}
                        >
                          {/* Header: Priority, Drag Handle & Freshness */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {priorityScore != null ? (
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                    priorityScore >= 80
                                      ? 'bg-emerald-50 text-[#009a65] border border-emerald-200'
                                      : priorityScore >= 50
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                  title={priorityReasons.join(', ')}
                                >
                                  Priority {priorityScore}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-slate-400">Standard</span>
                              )}
                            </div>

                            {isFresh && (
                              <span className="shrink-0 text-[#00b074] flex items-center gap-0.5 text-[9px] font-bold" title="Fresh <24h">
                                <Flame className="h-3 w-3" />
                                Fresh
                              </span>
                            )}
                          </div>

                          {/* Title & Company */}
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs line-clamp-1 hover:text-[#00b074] transition-colors">
                              {job.title}
                            </h4>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{job.company}</span>
                            </div>
                          </div>

                          {/* Location & Seniority */}
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="flex items-center gap-0.5 truncate">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              {job.location || 'Unknown'}
                            </span>
                            {job.seniority && job.seniority !== 'UNKNOWN' && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                                {job.seniority}
                              </span>
                            )}
                          </div>

                          {/* Role Family tag */}
                          {job.roleFamily && job.roleFamily !== 'UNKNOWN' && (
                            <div className="text-[9px] font-medium text-slate-500 flex items-center gap-1">
                              <Briefcase className="w-2.5 h-2.5 text-slate-400" />
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
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <Link
                              href={`/applications/${job.application?.id || job.id}`}
                              className="text-[11px] text-[#009a65] hover:text-[#007a50] font-bold flex items-center gap-1"
                              title="Open V5 Application Workspace"
                            >
                              <span>Workspace</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>

                            <div className="flex items-center gap-2">
                              <Link
                                href={`/jobs/${job.id}/apply`}
                                className="text-[10px] text-slate-500 hover:text-slate-800 font-medium"
                                title="Copilot Preparation"
                              >
                                Copilot
                              </Link>
                              <a
                                href={job.applicationUrl || job.canonicalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-slate-400 hover:text-[#00b074] flex items-center gap-0.5"
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

              <div className="text-[10px] text-slate-400 text-center pt-2">
                Drag to transition status
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
