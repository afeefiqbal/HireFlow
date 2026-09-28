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
  ChevronLeft,
  ChevronRight,
  Layers,
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

  // Column Pagination (4 columns per page)
  const [columnPage, setColumnPage] = useState(1);
  const COLUMNS_PER_PAGE = 4;

  const totalColumnPages = Math.max(1, Math.ceil(STATUS_COLUMNS.length / COLUMNS_PER_PAGE));
  const effectiveColumnPage = Math.min(columnPage, totalColumnPages);
  const startIndex = (effectiveColumnPage - 1) * COLUMNS_PER_PAGE;
  const endIndex = Math.min(startIndex + COLUMNS_PER_PAGE, STATUS_COLUMNS.length);
  const paginatedColumns = STATUS_COLUMNS.slice(startIndex, endIndex);

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

      {/* Kanban Column Pagination Bar */}
      {totalColumnPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Pipeline Stage:
            </span>
            {Array.from({ length: totalColumnPages }, (_, i) => i + 1).map((p) => {
              const pStart = (p - 1) * COLUMNS_PER_PAGE + 1;
              const pEnd = Math.min(p * COLUMNS_PER_PAGE, STATUS_COLUMNS.length);
              const isActive = p === effectiveColumnPage;
              const colNames = STATUS_COLUMNS.slice(pStart - 1, pEnd).map((c) => c.label).join(', ');

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setColumnPage(p)}
                  title={colNames}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#00b074] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                  }`}
                >
                  <span>Page {p}</span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    Cols {pStart}–{pEnd}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">
              Columns <strong className="text-slate-800 font-bold">{startIndex + 1}–{endIndex}</strong> of {STATUS_COLUMNS.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setColumnPage((prev) => Math.max(1, prev - 1))}
                disabled={effectiveColumnPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Columns"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs font-bold text-slate-700">
                {effectiveColumnPage} / {totalColumnPages}
              </span>
              <button
                type="button"
                onClick={() => setColumnPage((prev) => Math.min(totalColumnPages, prev + 1))}
                disabled={effectiveColumnPage >= totalColumnPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Columns"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Pipeline Board - 4 Columns Grid */}
      <div className="pb-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start w-full">
          {paginatedColumns.map((column) => {
            const colApps = applications.filter((app) => app.status === column.key);

            return (
              <div
                key={column.key}
                className="w-full rounded-xl border border-slate-200/80 bg-slate-100/60 p-3.5 flex flex-col min-h-[480px] shadow-2xs"
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

          {/* Consistent width spacer for Page 2 with 3 columns */}
          {paginatedColumns.length === 3 && (
            <div className="hidden xl:flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/90 bg-slate-50/60 p-6 min-h-[480px] text-center text-slate-400 w-full">
              <Layers className="h-8 w-8 text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-xs font-bold text-slate-600">Stage 2 Pipeline</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                Showing final lifecycle stages.
              </p>
              <button
                type="button"
                onClick={() => setColumnPage(1)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#00b074] hover:text-[#009a65] transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Back to Page 1</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pagination Footer */}
      {totalColumnPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 font-medium">
            Kanban Page <strong className="text-slate-800 font-bold">{effectiveColumnPage}</strong> of {totalColumnPages} (Showing columns {startIndex + 1}–{endIndex} of {STATUS_COLUMNS.length})
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setColumnPage((prev) => Math.max(1, prev - 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={effectiveColumnPage <= 1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous 4 Columns</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setColumnPage((prev) => Math.min(totalColumnPages, prev + 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={effectiveColumnPage >= totalColumnPages}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              <span>Next Columns</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
