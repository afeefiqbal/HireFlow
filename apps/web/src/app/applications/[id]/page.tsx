'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ApplicationDetailRecord,
  ApplicationStatus,
} from '@ai-job-agent/shared';
import { ClientDate } from '@/components/ClientDate';
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
  Video,
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
      window.dispatchEvent(new CustomEvent('hireflow:application-updated'));
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
      window.dispatchEvent(new CustomEvent('hireflow:application-updated'));
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
      window.dispatchEvent(new CustomEvent('hireflow:application-updated'));
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
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-44 bg-white rounded-xl animate-pulse border border-slate-200 shadow-xs" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-white rounded-xl animate-pulse border border-slate-200 col-span-2 shadow-xs" />
          <div className="h-80 bg-white rounded-xl animate-pulse border border-slate-200 shadow-xs" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Application Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'Unable to retrieve application details.'}</p>
        <Link
          href="/application-queue"
          className="inline-flex items-center gap-2 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2 text-xs font-bold text-white shadow-xs"
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
          { label: 'Mark Ready to Apply', status: 'READY_TO_APPLY', color: 'bg-[#00b074] hover:bg-[#009a65] text-white' },
          { label: 'Withdraw', status: 'WITHDRAWN', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' },
          { label: 'Mark Expired', status: 'EXPIRED', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' },
        ];
      case 'PREPARING':
      case 'CV_READY':
        return [
          { label: 'Mark Ready to Apply', status: 'READY_TO_APPLY', color: 'bg-[#00b074] hover:bg-[#009a65] text-white' },
          { label: 'Back to Shortlist', status: 'SHORTLISTED', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' },
          { label: 'Withdraw', status: 'WITHDRAWN', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' },
        ];
      case 'READY_TO_APPLY':
        return [
          { label: 'Confirm Applied (Freeze Snapshot)', status: 'APPLIED', color: 'bg-[#00b074] hover:bg-[#009a65] text-white' },
          { label: 'Revisit Preparation', status: 'PREPARING', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' },
          { label: 'Withdraw', status: 'WITHDRAWN', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' },
        ];
      case 'APPLIED':
        return [
          { label: 'Schedule Interview', status: 'INTERVIEW', color: 'bg-purple-600 hover:bg-purple-500 text-white' },
          { label: 'Record Offer', status: 'OFFER', color: 'bg-[#00b074] hover:bg-[#009a65] text-white' },
          { label: 'Mark Rejected', status: 'REJECTED', color: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' },
          { label: 'Withdraw', status: 'WITHDRAWN', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' },
        ];
      case 'INTERVIEW':
        return [
          { label: 'Record Offer', status: 'OFFER', color: 'bg-[#00b074] hover:bg-[#009a65] text-white' },
          { label: 'Mark Rejected', status: 'REJECTED', color: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' },
          { label: 'Withdraw', status: 'WITHDRAWN', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' },
        ];
      case 'OFFER':
      case 'REJECTED':
      case 'WITHDRAWN':
      case 'EXPIRED':
      default:
        return [];
    }
  };

  const allowedActions = getAllowedActions(detail.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/application-queue"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Application Intelligence Queue
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/applications/${detail.id}/interview`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Video className="h-3.5 w-3.5 text-purple-600" />
            Interview Cockpit
          </Link>
          <Link
            href={`/jobs/${detail.jobId}/apply`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-[#009a65] hover:bg-emerald-100 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#00b074]" />
            Open Preparation Copilot
          </Link>
        </div>
      </div>

      {/* Job Ground Truth Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[#009a65] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                {detail.status}
              </span>
              {job.roleFamily && (
                <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {job.roleFamily.replace(/_/g, ' ')}
                </span>
              )}
              {job.seniority && (
                <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {job.seniority}
                </span>
              )}
              {job.remoteType && (
                <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {job.remoteType}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Building2 className="h-3.5 w-3.5 text-[#00b074]" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {job.location}
              </span>
              {job.applicationPriority !== null && job.applicationPriority !== undefined && (
                <span className="flex items-center gap-1 font-bold text-amber-600">
                  Priority: {job.applicationPriority}/9
                </span>
              )}
              {job.source && (
                <span className="text-[11px] text-slate-500">
                  Source: <strong className="text-slate-700">{job.source}</strong>
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors border border-slate-200 shadow-2xs"
              >
                <span>Visit Authentic ATS</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Status Transition Control Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-800">Human Status Transition:</span> Click an action below to advance or update this opportunity.
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {allowedActions.length > 0 ? (
              allowedActions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleStatusTransition(action.status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-2xs ${action.color}`}
                >
                  {action.label}
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Terminal status reached ({detail.status}).</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Health + Snapshot) & Right Column (Follow-up + Notes + Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Factual Application Health Checklist */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#00b074]" />
              Application Health Checklist (Deterministic)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                {healthChecklist.resumeReady ? (
                  <CheckCircle2 className="h-4 w-4 text-[#00b074] shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-800">
                    Tailored CV: {healthChecklist.resumeReady ? 'Ready' : 'Not Generated'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {healthChecklist.resumeVersionName || 'No resume artifact saved'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                {healthChecklist.coverLetterReady ? (
                  <CheckCircle2 className="h-4 w-4 text-[#00b074] shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-800">
                    Cover Letter: {healthChecklist.coverLetterReady ? 'Ready' : 'Not Generated'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {healthChecklist.coverLetterReady ? 'Tailored body text saved' : 'Draft not started'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                {healthChecklist.screeningReady ? (
                  <CheckCircle2 className="h-4 w-4 text-[#00b074] shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-800">
                    Screening Questions: {healthChecklist.screeningReady ? 'Ready' : 'Input Needed'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {healthChecklist.screeningPendingCount > 0
                      ? `${healthChecklist.screeningPendingCount} questions await your answer`
                      : 'All questions have verified answers'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                {healthChecklist.isApplied ? (
                  <CheckCircle2 className="h-4 w-4 text-[#00b074] shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-800">
                    Submission Status: {healthChecklist.isApplied ? 'Applied' : 'Pending Confirmation'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {healthChecklist.appliedDate ? (
                      <>Applied on <ClientDate date={healthChecklist.appliedDate} /></>
                    ) : (
                      'Human confirmation required'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Application Snapshot Viewer (Frozen truth) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#00b074]" />
                Application Snapshot {snapshotJson ? '(Frozen Historical Truth)' : '(Pre-application Draft)'}
              </h2>
              {snapshotJson?.appliedDate && (
                <span className="text-xs text-[#009a65] font-mono font-bold">
                  Applied: <ClientDate date={snapshotJson.appliedDate} />
                </span>
              )}
            </div>

            {snapshotJson ? (
              <div className="space-y-4 text-xs">
                {/* Candidate & Job info used */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800">Candidate Snapshot Data:</div>
                  <div className="text-slate-600">
                    Candidate: <strong className="text-slate-900">{(snapshotJson as any).candidate?.fullName || 'Afeef Iqbal'}</strong> | Notice Period: <strong className="text-[#009a65]">{(snapshotJson as any).candidate?.noticePeriod || '30 days'}</strong> | Visa: <strong className="text-slate-900">{(snapshotJson as any).candidate?.visaSponsorship || 'Required'}</strong>
                  </div>
                </div>

                {/* Resume Version */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800">Resume Artifact Snapshot:</div>
                  <div className="text-slate-600">
                    Version: <strong className="text-[#009a65]">{snapshotJson.resume.versionName}</strong> | Target Role: <strong className="text-slate-900">{snapshotJson.resume.targetRole || job.title}</strong>
                  </div>
                  {snapshotJson.resume.summary && (
                    <div className="text-[11px] text-slate-500 italic mt-1">
                      &quot;{snapshotJson.resume.summary}&quot;
                    </div>
                  )}
                </div>

                {/* Cover Letter */}
                {snapshotJson.coverLetter && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-semibold text-slate-800">Cover Letter Snapshot:</div>
                    <div className="p-2.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px] whitespace-pre-wrap max-h-44 overflow-y-auto">
                      {snapshotJson.coverLetter.fullText}
                    </div>
                  </div>
                )}

                {/* Screening Answers */}
                {snapshotJson.screeningAnswers && snapshotJson.screeningAnswers.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-semibold text-slate-800">
                      Screening Answers Snapshot ({snapshotJson.screeningAnswers.length}):
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {snapshotJson.screeningAnswers.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                          <div className="font-medium text-slate-800">{item.question}</div>
                          <div className="text-slate-600">{item.answer || <span className="italic text-slate-400">Unanswered</span>}</div>
                          <div className="text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono ${
                                item.source === 'USER_PROVIDED'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-[#009a65] border border-emerald-200'
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
              <div className="p-6 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 space-y-2">
                <p>No frozen snapshot exists yet. The snapshot is finalized permanently upon marking <strong>APPLIED</strong>.</p>
                <Link
                  href={`/jobs/${detail.jobId}/apply`}
                  className="inline-flex items-center gap-1.5 text-[#009a65] hover:text-[#007a46] font-bold"
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
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Follow-Up Schedule
            </h2>

            <div className="text-xs">
              {detail.nextFollowUpAt ? (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-3 space-y-1">
                  <div className="text-slate-500">Scheduled for:</div>
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span><ClientDate date={detail.nextFollowUpAt} /></span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        healthChecklist.followUpStatus === 'TODAY'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : healthChecklist.followUpStatus === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-[#009a65] border border-emerald-200'
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
                <div className="text-xs text-slate-400 italic mb-3">No follow-up scheduled.</div>
              )}

              {/* Quick follow-up presets */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <button
                  type="button"
                  disabled={updatingFollowUp}
                  onClick={() => handleSetFollowUp(2)}
                  className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200"
                >
                  +2 Days
                </button>
                <button
                  type="button"
                  disabled={updatingFollowUp}
                  onClick={() => handleSetFollowUp(7)}
                  className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200"
                >
                  +7 Days
                </button>
                <button
                  type="button"
                  disabled={updatingFollowUp || !detail.nextFollowUpAt}
                  onClick={() => handleSetFollowUp(undefined, true)}
                  className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-rose-600 text-[11px] font-semibold border border-slate-200 disabled:opacity-40"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#00b074]"
                />
                <button
                  type="button"
                  disabled={updatingFollowUp || !customFollowUpDate}
                  onClick={() => handleSetFollowUp()}
                  className="px-3 py-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] text-xs font-bold text-white disabled:opacity-40 shadow-2xs"
                >
                  Set
                </button>
              </div>
            </div>
          </div>

          {/* User Notes */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              Private Notes ({detail.notesList?.length || 0})
            </h2>

            {/* Note form */}
            <form onSubmit={handleAddNote} className="space-y-2 text-xs">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="e.g. Recruiter contacted on LinkedIn, interview scheduled for Monday..."
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#00b074] focus:outline-none"
              />
              <button
                type="submit"
                disabled={savingNote || !noteContent.trim()}
                className="w-full py-2 rounded-lg bg-[#00b074] hover:bg-[#009a65] text-xs font-bold text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-1 shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Note
              </button>
            </form>

            {/* Notes List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {detail.notesList && detail.notesList.length > 0 ? (
                detail.notesList.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-slate-800">{note.content}</div>
                    <div className="text-[10px] text-slate-400">
                      <ClientDate date={note.createdAt} type="datetime" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-2">No notes added yet.</div>
              )}
            </div>
          </div>

          {/* Activity Timeline (Append-Only Event History) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Activity Timeline ({detail.events?.length || 0})
            </h2>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
              {detail.events && detail.events.length > 0 ? (
                detail.events.map((event) => (
                  <div key={event.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800">{event.type}</span>
                      <span className="text-[10px] text-slate-400">
                        <ClientDate date={event.timestamp} type="time" />
                      </span>
                    </div>
                    {event.note && <div className="text-slate-600 text-[11px]">{event.note}</div>}
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Source: {event.source || 'USER'}</span>
                      <span><ClientDate date={event.timestamp} type="date" /></span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-2">No timeline events recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
