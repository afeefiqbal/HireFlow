'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ApplicationDetailRecord,
  ApplicationStatus,
} from '@ai-job-agent/shared';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  FileText,
  MessageSquare,
  Sparkles,
  Plus,
  ShieldCheck,
  Flame,
  Globe2,
  Send,
  XCircle,
  Tag,
} from 'lucide-react';

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = params?.id as string;

  const [detail, setDetail] = useState<ApplicationDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Note form state
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Follow-up form state
  const [customFollowUpDate, setCustomFollowUpDate] = useState('');
  const [updatingFollowUp, setUpdatingFollowUp] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getApplicationById(applicationId);
      setDetail(data);
    } catch (err: any) {
      console.error('Failed to load application detail:', err);
      setError(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [applicationId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleStatusTransition = async (toStatus: ApplicationStatus) => {
    if (!detail) return;
    try {
      await api.updateApplicationStatus(
        detail.jobId,
        toStatus,
        `User transitioned status to ${toStatus}`,
        'USER'
      );
      showToast(`Status transitioned to ${toStatus}`);
      await fetchDetail();
    } catch (err: any) {
      alert(`Status transition rejected: ${err.message}`);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !detail) return;
    setSavingNote(true);
    try {
      await api.addApplicationNote(detail.id, noteContent.trim());
      setNoteContent('');
      showToast('Note added to application timeline');
      await fetchDetail();
    } catch (err: any) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  const handleSetFollowUp = async (daysFromNow?: number, clear: boolean = false) => {
    if (!detail) return;
    setUpdatingFollowUp(true);
    try {
      let targetDate: string | null = null;
      if (!clear) {
        if (daysFromNow !== undefined) {
          const d = new Date();
          d.setDate(d.getDate() + daysFromNow);
          targetDate = d.toISOString();
        } else if (customFollowUpDate) {
          targetDate = new Date(customFollowUpDate).toISOString();
        }
      }
      await api.setFollowUpDate(detail.id, targetDate);
      setCustomFollowUpDate('');
      showToast(clear ? 'Follow-up cleared' : 'Follow-up date updated');
      await fetchDetail();
    } catch (err: any) {
      alert(`Failed to set follow-up: ${err.message}`);
    } finally {
      setUpdatingFollowUp(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-6">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-44 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-900 rounded-xl animate-pulse border border-slate-800 col-span-2" />
          <div className="h-80 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Application Not Found</h2>
        <p className="text-sm text-slate-400">{error || 'Unable to retrieve application details.'}</p>
        <Link
          href="/application-queue"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Application Queue
        </Link>
      </div>
    );
  }

  const { job, healthChecklist, snapshotJson } = detail;

  // Allowed transitions depending on current status
  const getAllowedActions = (current: ApplicationStatus): { label: string; status: ApplicationStatus; color: string }[] => {
    switch (current) {
      case 'SHORTLISTED':
      case 'SAVED':
        return [
          { label: 'Start Preparation', status: 'PREPARING', color: 'bg-indigo-600 hover:bg-indigo-500 text-white' },
          { label: 'Mark Ready to Apply', status: 'READY_TO_APPLY', color: 'bg-teal-600 hover:bg-teal-500 text-white' },
          { label: 'Withdraw', status: 'WITHDRAWN', color: 'bg-slate-800 hover:bg-slate-700 text-slate-300' },
          { label: 'Mark Expired', status: 'EXPIRED', color: 'bg-slate-800 hover:bg-slate-700 text-slate-300' },
        ];
      case 'PREPARING':
      case 'CV_READY':
        return [
          { label: 'Mark Ready to Apply', status: 'READY_TO_APPLY', color: 'bg-teal-600 hover:bg-teal-500 text-white' },
          { label: 'Back to Shortlist', status: 'SHORTLISTED', color: 'bg-slate-800 hover:bg-slate-700 text-slate-300' },
          { label: 'Withdraw', status: 'WITHDRAWN', color: 'bg-slate-800 hover:bg-slate-700 text-slate-300' },
        ];
      case 'READY_TO_APPLY':
        return [
          { label: 'Confirm Applied (Freeze Snapshot)', status: 'APPLIED', color: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
          { label: 'Revisit Preparation', status: 'PREPARING', color: 'bg-slate-800 hover:bg-slate-700 text-slate-300' },
          { label: 'Withdraw', status: 'WITHDRAWN', color: 'bg-slate-800 hover:bg-slate-700 text-slate-300' },
        ];
      case 'APPLIED':
        return [
          { label: 'Schedule Interview', status: 'INTERVIEW', color: 'bg-purple-600 hover:bg-purple-500 text-white' },
          { label: 'Record Offer', status: 'OFFER', color: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
          { label: 'Mark Rejected', status: 'REJECTED', color: 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700' },
          { label: 'Withdraw', status: 'WITHDRAWN', color: 'bg-slate-800 hover:bg-slate-700 text-slate-300' },
        ];
      case 'INTERVIEW':
        return [
          { label: 'Record Offer', status: 'OFFER', color: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
          { label: 'Mark Rejected', status: 'REJECTED', color: 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700' },
          { label: 'Withdraw', status: 'WITHDRAWN', color: 'bg-slate-800 hover:bg-slate-700 text-slate-300' },
        ];
      case 'REJECTED':
      case 'OFFER':
      case 'WITHDRAWN':
      case 'EXPIRED':
        return [];
      default:
        return [
          { label: 'Shortlist Job', status: 'SHORTLISTED', color: 'bg-teal-600 hover:bg-teal-500 text-white' },
        ];
    }
  };

  const allowedActions = getAllowedActions(detail.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/application-queue"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-teal-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Application Queue
        </Link>
        <Link
          href={`/jobs/${detail.jobId}/apply`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600/20 border border-teal-500/40 px-3 py-1.5 text-xs font-semibold text-teal-300 hover:bg-teal-600/30 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Open Preparation Copilot
        </Link>
      </div>

      {/* Job Ground Truth Header */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/40 border border-teal-800/60 px-2 py-0.5 rounded">
                {detail.status}
              </span>
              {job.roleFamily && (
                <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {job.roleFamily.replace(/_/g, ' ')}
                </span>
              )}
              {job.seniority && (
                <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {job.seniority}
                </span>
              )}
              {job.remoteType && (
                <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {job.remoteType}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">{job.title}</h1>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-slate-200">
                <Building2 className="h-3.5 w-3.5 text-teal-400" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                {job.location}
              </span>
              {job.applicationPriority !== null && job.applicationPriority !== undefined && (
                <span className="flex items-center gap-1 font-semibold text-amber-400">
                  Priority: {job.applicationPriority}/9
                </span>
              )}
              {job.source && (
                <span className="text-[11px] text-slate-400">
                  Source: <strong className="text-slate-300">{job.source}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {job.applicationUrl && (
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors border border-slate-700"
              >
                <span>Visit Authentic ATS</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Status Transition Control Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Human Status Transition:</span> Click an action below to advance or update this opportunity.
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {allowedActions.length > 0 ? (
              allowedActions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleStatusTransition(action.status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-sm ${action.color}`}
                >
                  {action.label}
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">Terminal status reached ({detail.status}).</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Health + Snapshot) & Right Column (Follow-up + Notes + Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Factual Application Health Checklist */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              Application Health Checklist (Deterministic)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                {healthChecklist.resumeReady ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">
                    Tailored CV: {healthChecklist.resumeReady ? 'Ready' : 'Not Generated'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {healthChecklist.resumeVersionName || 'No resume artifact saved'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                {healthChecklist.coverLetterReady ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">
                    Cover Letter: {healthChecklist.coverLetterReady ? 'Ready' : 'Not Generated'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {healthChecklist.coverLetterReady ? 'Tailored body text saved' : 'Draft not started'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                {healthChecklist.screeningReady ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">
                    Screening Questions: {healthChecklist.screeningReady ? 'Ready' : 'Input Needed'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {healthChecklist.screeningPendingCount > 0
                      ? `${healthChecklist.screeningPendingCount} questions await your answer`
                      : 'All questions have verified answers'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                {healthChecklist.isApplied ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">
                    Submission Status: {healthChecklist.isApplied ? 'Applied' : 'Pending Confirmation'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {healthChecklist.appliedDate
                      ? `Applied on ${new Date(healthChecklist.appliedDate).toLocaleDateString()}`
                      : 'Human confirmation required'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Application Snapshot Viewer (Frozen truth) */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-400" />
                Application Snapshot {snapshotJson ? '(Frozen Historical Truth)' : '(Pre-application Draft)'}
              </h2>
              {snapshotJson?.appliedDate && (
                <span className="text-xs text-emerald-400 font-mono">
                  Applied: {new Date(snapshotJson.appliedDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {snapshotJson ? (
              <div className="space-y-4 text-xs">
                {/* Candidate & Job info used */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-300">Candidate Snapshot Data:</div>
                  <div className="text-slate-400">
                    Candidate: <strong className="text-white">{(snapshotJson as any).candidate?.fullName || 'Afeef Iqbal'}</strong> | Notice Period: <strong className="text-teal-300">{(snapshotJson as any).candidate?.noticePeriod || '30 days'}</strong> | Visa: <strong className="text-slate-200">{(snapshotJson as any).candidate?.visaSponsorship || 'Required'}</strong>
                  </div>
                </div>

                {/* Resume Version */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-300">Resume Artifact Snapshot:</div>
                  <div className="text-slate-400">
                    Version: <strong className="text-teal-300">{snapshotJson.resume.versionName}</strong> | Target Role: <strong className="text-slate-200">{snapshotJson.resume.targetRole || job.title}</strong>
                  </div>
                  {snapshotJson.resume.summary && (
                    <div className="text-[11px] text-slate-400 italic mt-1">
                      &quot;{snapshotJson.resume.summary}&quot;
                    </div>
                  )}
                </div>

                {/* Cover Letter */}
                {snapshotJson.coverLetter && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-semibold text-slate-300">Cover Letter Snapshot:</div>
                    <div className="p-2.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px] whitespace-pre-wrap max-h-44 overflow-y-auto">
                      {snapshotJson.coverLetter.fullText}
                    </div>
                  </div>
                )}

                {/* Screening Answers */}
                {snapshotJson.screeningAnswers && snapshotJson.screeningAnswers.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-semibold text-slate-300">
                      Screening Answers Snapshot ({snapshotJson.screeningAnswers.length}):
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {snapshotJson.screeningAnswers.map((item, idx) => (
                        <div key={idx} className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1">
                          <div className="font-medium text-slate-200">{item.question}</div>
                          <div className="text-slate-300">{item.answer || <span className="italic text-slate-500">Unanswered</span>}</div>
                          <div className="text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono ${
                                item.source === 'USER_PROVIDED'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {item.source}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-slate-900/50 border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-2">
                <p>No frozen snapshot exists yet. The snapshot is finalized permanently upon marking <strong>APPLIED</strong>.</p>
                <Link
                  href={`/jobs/${detail.jobId}/apply`}
                  className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Review materials in Application Copilot
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Follow-up + User Notes + Activity Timeline */}
        <div className="space-y-6">
          {/* Follow-up Date Manager */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              Follow-Up Schedule
            </h2>

            <div className="text-xs">
              {detail.nextFollowUpAt ? (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 mb-3 space-y-1">
                  <div className="text-slate-400">Scheduled for:</div>
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>{new Date(detail.nextFollowUpAt).toLocaleDateString()}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        healthChecklist.followUpStatus === 'TODAY'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : healthChecklist.followUpStatus === 'OVERDUE'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      }`}
                    >
                      {healthChecklist.followUpStatus === 'TODAY'
                        ? 'FOLLOW UP TODAY'
                        : healthChecklist.followUpStatus === 'OVERDUE'
                        ? `OVERDUE (${Math.abs(healthChecklist.followUpDaysRemaining || 0)}d)`
                        : `IN ${healthChecklist.followUpDaysRemaining} DAYS`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic mb-3">No follow-up scheduled.</div>
              )}

              {/* Quick follow-up presets */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <button
                  type="button"
                  disabled={updatingFollowUp}
                  onClick={() => handleSetFollowUp(2)}
                  className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700"
                >
                  +2 Days
                </button>
                <button
                  type="button"
                  disabled={updatingFollowUp}
                  onClick={() => handleSetFollowUp(7)}
                  className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700"
                >
                  +7 Days
                </button>
                <button
                  type="button"
                  disabled={updatingFollowUp || !detail.nextFollowUpAt}
                  onClick={() => handleSetFollowUp(undefined, true)}
                  className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 text-[11px] font-medium border border-slate-700 disabled:opacity-40"
                >
                  Clear
                </button>
              </div>

              {/* Custom Date Input */}
              <div className="flex items-center gap-1.5 mt-2">
                <input
                  type="date"
                  value={customFollowUpDate}
                  onChange={(e) => setCustomFollowUpDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  disabled={updatingFollowUp || !customFollowUpDate}
                  onClick={() => handleSetFollowUp()}
                  className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Set
                </button>
              </div>
            </div>
          </div>

          {/* User Notes */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              Private Notes ({detail.notesList?.length || 0})
            </h2>

            {/* Note form */}
            <form onSubmit={handleAddNote} className="space-y-2 text-xs">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="e.g. Recruiter contacted on LinkedIn, interview scheduled for Monday..."
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={savingNote || !noteContent.trim()}
                className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Note
              </button>
            </form>

            {/* Notes List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {detail.notesList && detail.notesList.length > 0 ? (
                detail.notesList.map((note) => (
                  <div key={note.id} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-1">
                    <div className="text-slate-200">{note.content}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(note.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic text-center py-2">No notes added yet.</div>
              )}
            </div>
          </div>

          {/* Activity Timeline (Append-Only Event History) */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              Activity Timeline ({detail.events?.length || 0})
            </h2>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
              {detail.events && detail.events.length > 0 ? (
                detail.events.map((event) => (
                  <div key={event.id} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-200">{event.type}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {event.note && <div className="text-slate-400 text-[11px]">{event.note}</div>}
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Source: {event.source || 'USER'}</span>
                      <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic text-center py-2">No timeline events recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
