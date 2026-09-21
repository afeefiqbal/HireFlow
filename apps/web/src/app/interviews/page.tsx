'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  InterviewRecord,
  InterviewStatsSummary,
  InterviewStatus,
  InterviewRoundType,
} from '@ai-job-agent/shared';
import { ClientDate } from '@/components/ClientDate';
import {
  Video,
  Calendar,
  Clock,
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  PlusCircle,
} from 'lucide-react';

export default function InterviewsCommandCenterPage() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [stats, setStats] = useState<InterviewStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'TODAY' | 'DEBRIEF' | 'ALL'>('UPCOMING');

  const loadData = async () => {
    try {
      setLoading(true);
      const [listData, statsData] = await Promise.all([
        api.getInterviews(),
        api.getInterviewStats(),
      ]);
      setInterviews(listData || []);
      setStats(statsData || null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load interviews:', err);
      setError(err.message || 'Failed to load interview command center data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helpers
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000;

  const filteredInterviews = interviews.filter((item) => {
    // Search query
    const comp = item.application?.job?.company?.toLowerCase() || '';
    const title = item.application?.job?.title?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || comp.includes(q) || title.includes(q);

    // Status filter
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    if (!matchesSearch || !matchesStatus) return false;

    // Tab filter
    if (activeTab === 'TODAY') {
      return item.rounds.some((r) => {
        if (!r.scheduledAt) return false;
        const time = new Date(r.scheduledAt).getTime();
        return time >= startOfToday && time < endOfToday;
      });
    }

    if (activeTab === 'UPCOMING') {
      return (
        item.status === 'PLANNED' ||
        item.status === 'SCHEDULED' ||
        item.status === 'IN_PROGRESS' ||
        item.rounds.some((r) => r.status === 'SCHEDULED')
      );
    }

    if (activeTab === 'DEBRIEF') {
      const hasCompletedRound = item.rounds.some((r) => r.status === 'COMPLETED');
      const hasDebrief = item.debriefs && item.debriefs.length > 0;
      return hasCompletedRound && !hasDebrief;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-[#00b074]">
              <Video className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Interview Intelligence Command Center
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200">
              V6 Active
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Multi-stage interview tracking, predicted question drills, STAR answers, and real-time simulator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/application-queue"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
          >
            <PlusCircle className="h-3.5 w-3.5 text-[#00b074]" />
            From Queue
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Interviews</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalInterviews ?? 0}</div>
          <span className="text-[11px] text-slate-400">Tracked opportunities</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-purple-600">In Progress</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats?.activeInterviews ?? 0}</div>
          <span className="text-[11px] text-slate-400">Active pipelines</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-[#00b074]">Rounds Done</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats?.completedRounds ?? 0}</div>
          <span className="text-[11px] text-slate-400">Executed rounds</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-teal-600">Upcoming Rounds</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats?.upcomingRounds ?? 0}</div>
          <span className="text-[11px] text-slate-400">Scheduled ahead</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-600">Questions Bank</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats?.questionsRecorded ?? 0}</div>
          <span className="text-[11px] text-slate-400">Predicted &amp; asked</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-blue-600">Debriefs Done</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats?.debriefsCompleted ?? 0}</div>
          <span className="text-[11px] text-slate-400">Post-round reviews</span>
        </div>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'UPCOMING', label: 'Upcoming & Active' },
            { id: 'TODAY', label: "Today's Interviews" },
            { id: 'DEBRIEF', label: 'Debrief Reminders' },
            { id: 'ALL', label: 'All Tracked' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#00b074] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-64 rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#00b074] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#00b074] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PLANNED">PLANNED</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#00b074] border-t-transparent mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading interview pipelines...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-center text-rose-700 shadow-xs">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <p className="font-semibold">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <Video className="mx-auto h-12 w-12 text-[#00b074]/50 mb-3" />
          <h3 className="text-base font-bold text-slate-900">No interviews found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            {activeTab === 'DEBRIEF'
              ? 'No completed interviews needing debrief right now. Great job!'
              : activeTab === 'TODAY'
              ? 'No interviews scheduled for today.'
              : 'You have not scheduled any interview rounds yet. Go to your application queue to open an application and launch the Interview Cockpit.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/application-queue"
              className="inline-flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-2 text-xs font-bold text-white hover:bg-[#009a65] transition-colors shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              View Application Queue
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInterviews.map((item) => {
            const nextRound = item.rounds.find((r) => r.status === 'SCHEDULED') || item.rounds[0];
            const completedCount = item.rounds.filter((r) => r.status === 'COMPLETED').length;
            const hasPrepKit = item.prepKits && item.prepKits.length > 0;
            const hasDebrief = item.debriefs && item.debriefs.length > 0;
            const job = item.application?.job;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#00b074] transition-all group"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'IN_PROGRESS'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : item.status === 'COMPLETED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : item.status === 'SCHEDULED'
                              ? 'bg-emerald-50 text-[#009a65] border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {item.status}
                        </span>
                        {hasPrepKit && (
                          <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-[#009a65] flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> Prep Kit Ready
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#00b074] transition-colors line-clamp-1">
                        {job?.title || 'Job Opportunity'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{job?.company || 'Company'}</span>
                        {job?.location && (
                          <>
                            <span>•</span>
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>{job.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stage & Rounds Summary */}
                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Pipeline Progress</span>
                      <span className="text-purple-700 font-semibold">
                        {completedCount} / {item.rounds.length} Rounds Done
                      </span>
                    </div>

                    {/* Mini Round Pills */}
                    {item.rounds.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.rounds.map((round) => (
                          <span
                            key={round.id}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              round.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : round.status === 'SCHEDULED'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            R{round.sequence}: {round.roundType}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No rounds defined yet</p>
                    )}

                    {/* Next Scheduled Round Info */}
                    {nextRound && nextRound.scheduledAt ? (
                      <div className="flex items-center gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/80">
                        <Calendar className="h-3.5 w-3.5 text-[#00b074]" />
                        <span>Next:</span>
                        <span className="font-semibold text-slate-900">
                          <ClientDate date={nextRound.scheduledAt} type="datetime" />
                        </span>
                        {nextRound.interviewerName && (
                          <span className="text-slate-500 truncate">
                            (w/ {nextRound.interviewerName})
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Debrief notice if needed */}
                  {item.rounds.some((r) => r.status === 'COMPLETED') && !hasDebrief && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                      <span>Post-round debrief pending</span>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/applications/${item.applicationId}`}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    View App
                  </Link>

                  <Link
                    href={`/applications/${item.applicationId}/interview`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#009a65] transition-colors shadow-2xs"
                  >
                    <span>Open Cockpit</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
