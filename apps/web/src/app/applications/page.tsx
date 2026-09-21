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
  { key: 'SAVED', label: 'Saved', color: 'border-slate-200 bg-slate-100 text-slate-700' },
  { key: 'READY_TO_APPLY', label: 'Ready to Apply', color: 'border-emerald-200 bg-emerald-50 text-[#009a65]' },
  { key: 'APPLIED', label: 'Applied', color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { key: 'INTERVIEW', label: 'Interviewing', color: 'border-purple-200 bg-purple-50 text-purple-700' },
  { key: 'OFFER', label: 'Offer Received', color: 'border-amber-200 bg-amber-50 text-amber-700' },
  { key: 'REJECTED', label: 'Archived / Rejected', color: 'border-rose-200 bg-rose-50 text-rose-700' },
  { key: 'EXPIRED', label: 'Expired / Closed', color: 'border-slate-200 bg-slate-50 text-slate-500' },
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <KanbanSquare className="h-6 w-6 text-[#00b074]" />
            Application Lifecycle Pipeline
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200">
              {applications.length} Tracked
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Human-controlled application tracking across European and remote opportunities.
          </p>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
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
              className="rounded-xl border border-slate-200/80 bg-slate-100/60 p-3 flex flex-col min-h-[400px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {column.label}
                </span>
                <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {colApps.length}
                </span>
              </div>

              {/* Cards in this stage */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colApps.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-2 hover:border-[#00b074] transition-all shadow-2xs"
                  >
                    <div className="font-bold text-slate-900 line-clamp-1 hover:text-[#00b074]">
                      <Link href={`/jobs/${app.job.id}`}>{app.job.title}</Link>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      <span className="truncate">{app.job.company}</span>
                    </div>

                    {app.job.latestMatch && (
                      <div className="flex items-center gap-1 text-[11px] text-[#009a65] font-bold">
                        <Sparkles className="h-3 w-3" />
                        <span>{app.job.latestMatch.overall_match}% Match</span>
                      </div>
                    )}

                    {app.notes && (
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-[11px] text-slate-600 flex items-start gap-1">
                        <MessageSquare className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{app.notes}</span>
                      </div>
                    )}

                    {/* Status Change Selector */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleStatusUpdate(app.job.id, e.target.value as ApplicationStatus)
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 focus:border-[#00b074] focus:outline-none w-full"
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
                  <div className="h-28 rounded-lg border border-dashed border-slate-200 bg-white/50 flex items-center justify-center text-[11px] text-slate-400">
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
