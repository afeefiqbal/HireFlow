'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

export default function ApplicationQueuePage() {
  const [queue, setQueue] = useState<ApplicationQueueGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
          <div className="h-96 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
          <div className="h-96 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
        </div>
      </div>
    );
  }

  const columns = [
    {
      id: 'readyToApply',
      title: 'Ready To Apply',
      items: queue?.readyToApply || [],
      icon: <CheckCircle2 className="h-4 w-4 text-teal-400" />,
      border: 'border-teal-500/30',
      badge: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
    },
    {
      id: 'needsInput',
      title: 'Needs Your Input',
      items: queue?.needsInput || [],
      icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      id: 'cvReady',
      title: 'CV Ready',
      items: queue?.cvReady || [],
      icon: <FileText className="h-4 w-4 text-blue-400" />,
      border: 'border-blue-500/30',
      badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    },
    {
      id: 'applied',
      title: 'Applied',
      items: queue?.applied || [],
      icon: <Send className="h-4 w-4 text-emerald-400" />,
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    },
    {
      id: 'interview',
      title: 'Interview Stage',
      items: queue?.interview || [],
      icon: <Calendar className="h-4 w-4 text-purple-400" />,
      border: 'border-purple-500/30',
      badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    },
    {
      id: 'rejected',
      title: 'Archived / Rejected',
      items: queue?.rejected || [],
      icon: <XCircle className="h-4 w-4 text-rose-400" />,
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    },
  ];

  const totalItems = columns.reduce((acc, col) => acc + col.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Inbox className="h-6 w-6 text-teal-400" />
            Application Queue &amp; Preparation Board
            <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-300 border border-teal-500/30">
              V2 Pipeline
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track materials readiness, pending user declarations, and active application pipeline.
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

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total in Pipeline</div>
          <div className="text-2xl font-black text-white mt-1">{totalItems}</div>
        </div>

        <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400">Ready To Apply</div>
          <div className="text-2xl font-black text-teal-300 mt-1">
            {queue?.readyToApply?.length || 0}
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Needs Your Input</div>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {queue?.needsInput?.length || 0}
          </div>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Active Interviews</div>
          <div className="text-2xl font-black text-purple-300 mt-1">
            {queue?.interview?.length || 0}
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`rounded-xl border ${col.border} bg-[#0b1324] p-3.5 space-y-3 min-h-[400px] flex flex-col justify-between`}
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
                    No applications in this stage
                  </div>
                ) : (
                  col.items.map((job) => {
                    const isFresh = job.ageStatus === 'FRESH';

                    return (
                      <div
                        key={job.id}
                        className="rounded-lg border border-slate-800 bg-[#0f172a] p-3 space-y-2 shadow-sm hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-white text-xs line-clamp-1">
                            {job.title}
                          </span>
                          {isFresh && (
                            <span className="shrink-0 text-teal-400" title="Fresh <24h">
                              <Flame className="h-3 w-3" />
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-500" />
                          <span className="truncate">{job.company}</span>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                          <Link
                            href={`/jobs/${job.id}/apply`}
                            className="text-[11px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
                          >
                            <span>Prepare</span>
                            <ArrowRight className="h-3 w-3" />
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
