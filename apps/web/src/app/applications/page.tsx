'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ApplicationRecord, ApplicationStatus } from '@ai-job-agent/shared';
import {
  KanbanSquare,
  Building2,
  Calendar,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const STATUS_COLUMNS: { key: ApplicationStatus; label: string; color: string }[] = [
  { key: 'SAVED', label: 'Saved', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
  { key: 'READY_TO_APPLY', label: 'Ready to Apply', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300' },
  { key: 'APPLIED', label: 'Applied', color: 'border-blue-500/40 bg-blue-950/20 text-blue-300' },
  { key: 'INTERVIEW', label: 'Interviewing', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300' },
  { key: 'OFFER', label: 'Offer Received', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' },
  { key: 'REJECTED', label: 'Archived / Rejected', color: 'border-rose-500/40 bg-rose-950/20 text-rose-300' },
  { key: 'EXPIRED', label: 'Expired / Closed', color: 'border-slate-800 bg-slate-950/60 text-slate-400' },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getApplications();
      setApplications(data || []);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusUpdate = async (jobId: string, newStatus: ApplicationStatus) => {
    try {
      await api.updateApplicationStatus(jobId, newStatus, `Transitioned to ${newStatus}`);
      setToastMessage(`Updated status to ${newStatus}`);
      setTimeout(() => setToastMessage(null), 3000);
      await fetchApplications();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <KanbanSquare className="h-6 w-6 text-teal-400" />
            Application Lifecycle Pipeline
            <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-300 border border-teal-500/30">
              {applications.length} Tracked
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Human-controlled application tracking across European and remote opportunities.
          </p>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <span>Find more jobs</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Kanban Pipeline Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {STATUS_COLUMNS.map((column) => {
          const colApps = applications.filter((app) => app.status === column.key);

          return (
            <div
              key={column.key}
              className="rounded-xl border border-slate-800 bg-[#0d1524] p-3 flex flex-col min-h-[400px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {column.label}
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-400">
                  {colApps.length}
                </span>
              </div>

              {/* Cards in this stage */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colApps.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-lg border border-slate-800 bg-[#121c2e] p-3 text-xs space-y-2 hover:border-slate-700 transition-all shadow-sm"
                  >
                    <div className="font-bold text-white line-clamp-1 hover:text-teal-300">
                      <Link href={`/jobs/${app.job.id}`}>{app.job.title}</Link>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 font-medium">
                      <Building2 className="h-3 w-3 text-slate-500" />
                      <span className="truncate">{app.job.company}</span>
                    </div>

                    {app.job.latestMatch && (
                      <div className="flex items-center gap-1 text-[11px] text-teal-400 font-semibold">
                        <Sparkles className="h-3 w-3" />
                        <span>{app.job.latestMatch.overall_match}% Match</span>
                      </div>
                    )}

                    {app.notes && (
                      <div className="rounded bg-slate-900 p-2 text-[11px] text-slate-400 flex items-start gap-1">
                        <MessageSquare className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{app.notes}</span>
                      </div>
                    )}

                    {/* Status Change Selector */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleStatusUpdate(app.job.id, e.target.value as ApplicationStatus)
                        }
                        className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300 focus:border-teal-500 focus:outline-none w-full"
                      >
                        {STATUS_COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>
                            Move to {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {colApps.length === 0 && (
                  <div className="h-28 rounded-lg border border-dashed border-slate-800/60 flex items-center justify-center text-[11px] text-slate-600">
                    No items in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
