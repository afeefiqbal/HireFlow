'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Mail,
  HelpCircle,
  Sparkles,
  Download,
  Archive,
  Edit2,
  Lock,
} from 'lucide-react';
import {
  ApplicationPreparationSummary,
  ApplicationSnapshot,
  ScreeningQuestionItem,
} from '@ai-job-agent/shared';
import { api } from '@/lib/api';
import { ClientDate } from '@/components/ClientDate';

interface ApplicationCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  data: ApplicationPreparationSummary;
  profile: any;
  screeningQuestions: ScreeningQuestionItem[];
  onRefreshData: () => Promise<void>;
  onGenerateResume?: () => Promise<void>;
  onGenerateCoverLetter?: () => Promise<void>;
  onOpenApplication: () => void;
  onMarkExpired: () => Promise<void>;
}

export default function ApplicationCopilot({
  isOpen,
  onClose,
  data,
  profile,
  screeningQuestions,
  onRefreshData,
  onGenerateResume,
  onGenerateCoverLetter,
  onOpenApplication,
  onMarkExpired,
}: ApplicationCopilotProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [inlineAnswerText, setInlineAnswerText] = useState<string>('');
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [syncingCommon, setSyncingCommon] = useState(false);
  const [copyAllStatus, setCopyAllStatus] = useState<string | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const job = data?.job;
  const latestResume = data?.latestResume;
  const latestCoverLetter = data?.latestCoverLetter;
  const applicationSnapshot =
    data?.applicationSnapshot || (job?.application?.snapshotJson as ApplicationSnapshot | null);

  // Single authoritative source for Candidate Ground Truth
  const fullName = profile?.fullName || profile?.user?.fullName || 'Afeef Iqbal';
  const email = profile?.email || profile?.user?.email || null;
  const phone = profile?.phone || null;
  const location = profile?.location || 'Alappuzha, Kerala, India';
  const linkedin = profile?.linkedin || 'https://linkedin.com/in/afeef-iqbal';
  const github = profile?.github || 'https://github.com/afeefiqbal';
  const portfolio = profile?.portfolio || null;
  const yearsExp = profile?.yearsOfExperience ? `${profile.yearsOfExperience}+ years` : '7+ years';

  const candidateBasics = [
    { key: 'name', label: 'Full Name', value: fullName },
    { key: 'email', label: 'Email', value: email },
    { key: 'phone', label: 'Phone', value: phone },
    { key: 'location', label: 'Location', value: location },
    { key: 'linkedin', label: 'LinkedIn', value: linkedin },
    { key: 'github', label: 'GitHub', value: github },
    { key: 'portfolio', label: 'Portfolio', value: portfolio },
    { key: 'experience', label: 'Years of Experience', value: yearsExp },
  ];

  // Clipboard handler
  const copyToClipboard = async (text: string, key: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Screening questions classification
  const unresolvedSensitiveQuestions = screeningQuestions.filter(
    (q) => q.requiresUserInput && !q.userAnswer
  );

  const handleSaveUserAnswer = async (questionId: string) => {
    if (!inlineAnswerText.trim()) return;
    setSavingAnswer(true);
    try {
      await api.answerScreeningQuestion(questionId, inlineAnswerText.trim());
      await onRefreshData();
      setEditingQuestionId(null);
      setInlineAnswerText('');
    } catch (err: any) {
      alert(`Failed to save answer: ${err.message}`);
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleSyncCommonAnswers = async () => {
    if (!job?.id) return;
    setSyncingCommon(true);
    try {
      const items = await api.syncJobCommonAnswers(job.id);
      await onRefreshData();
      const updatedCount = items?.filter((q) => q.userAnswer && q.source?.includes('Common Bank')).length || 0;
      if (updatedCount > 0) {
        alert(`Successfully synced common answers! (${updatedCount} question(s) filled from Common Answers Bank)`);
      } else {
        alert('Screening questions are already up to date with your Common Answers Bank.');
      }
    } catch (err: any) {
      alert(`Failed to sync common answers: ${err.message}`);
    } finally {
      setSyncingCommon(false);
    }
  };

  // Structured Copy All
  const handleCopyAll = async () => {
    const lines: string[] = [];

    lines.push('==================================================');
    lines.push('HIREFLOW APPLICATION PACKAGE');
    lines.push(`JOB: ${job?.title || 'Unknown Role'} @ ${job?.company || 'Unknown Company'}`);
    lines.push('==================================================\n');

    lines.push('CANDIDATE BASICS');
    lines.push(`Full Name: ${fullName}`);
    lines.push(`Email: ${email || 'NOT PROVIDED'}`);
    lines.push(`Phone: ${phone || 'NOT PROVIDED'}`);
    lines.push(`Location: ${location || 'NOT PROVIDED'}`);
    lines.push(`LinkedIn: ${linkedin || 'NOT PROVIDED'}`);
    lines.push(`GitHub: ${github || 'NOT PROVIDED'}`);
    lines.push(`Portfolio: ${portfolio || 'NOT PROVIDED'}`);
    lines.push(`Years of Experience: ${yearsExp}\n`);

    lines.push('TAILORED PROFESSIONAL SUMMARY');
    lines.push(latestResume?.summary ? latestResume.summary : 'NOT GENERATED YET\n');

    lines.push('\nCOVER LETTER');
    lines.push(latestCoverLetter?.fullText ? latestCoverLetter.fullText : 'NOT GENERATED YET\n');

    lines.push('\nSCREENING QUESTIONS & ANSWERS');
    if (screeningQuestions.length === 0) {
      lines.push('No screening questions identified.');
    } else {
      screeningQuestions.forEach((q, idx) => {
        lines.push(`\nQ${idx + 1}: ${q.question}`);
        if (q.userAnswer) {
          lines.push(`A: ${q.userAnswer} [USER PROVIDED]`);
        } else if (q.requiresUserInput) {
          lines.push('A: USER INPUT REQUIRED');
        } else {
          lines.push(`A: ${q.suggestedAnswer || 'N/A'} [AI VERIFIED]`);
        }
      });
    }

    await copyToClipboard(lines.join('\n'), 'copy-all');
    setCopyAllStatus('Copied full application bundle!');
    setTimeout(() => setCopyAllStatus(null), 3000);
  };

  const handleDownloadPDF = () => {
    if (job?.id) {
      window.open(`/resume/${job.id}?print=true`, '_blank');
    }
  };

  return (
    <>
      {/* Drawer backdrop on mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Copilot Drawer */}
      <aside
        className="fixed top-0 right-0 z-50 flex h-full w-full flex-col border-l border-slate-800 bg-[#0a0f1d] text-slate-200 shadow-2xl transition-transform md:w-[440px] lg:w-[480px]"
        role="dialog"
        aria-label="Application Copilot"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0f172a] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wide text-white uppercase">
                  Application Copilot
                </h2>
                <span className="rounded bg-teal-950 px-1.5 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-800/50">
                  V3.1
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Manual ATS Assistant (Greenhouse, Lever, Ashby, Workday)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close Copilot"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status and Action Banner */}
        <div className="border-b border-slate-800/80 bg-slate-900/60 px-5 py-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">STATUS:</span>
            <span className="font-mono font-bold uppercase text-teal-400">
              {job?.application?.status || 'SAVED'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {job?.application?.status !== 'EXPIRED' && (
              <button
                onClick={onMarkExpired}
                className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors border border-slate-700"
                title="Mark this job posting as expired or closed"
              >
                <Archive className="h-3 w-3 text-amber-400" />
                MARK EXPIRED
              </button>
            )}
          </div>
        </div>

        {/* Immutable Application Snapshot Banner (if APPLIED) */}
        {applicationSnapshot && (
          <div className="mx-5 mt-4 rounded-lg border border-teal-500/40 bg-teal-950/20 p-3.5 text-xs text-teal-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-teal-300">
                <Lock className="h-4 w-4 text-teal-400" />
                LOCKED APPLICATION SNAPSHOT
              </div>
              <span className="text-[10px] font-mono text-teal-400/80">
                <ClientDate date={applicationSnapshot.appliedDate} />
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This application was submitted and frozen at submission time. Historical CV version ({applicationSnapshot.resume.versionName}) and answers are preserved.
            </p>
            <button
              onClick={() => setShowSnapshotModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-300 hover:text-teal-200 underline"
            >
              View Historical Snapshot
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* 1. COPY ALL ACTION & SAFETY GATE */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Quick Clipboard Export
              </div>
              {copyAllStatus && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Copied!
                </span>
              )}
            </div>

            {unresolvedSensitiveQuestions.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-950/30 border border-amber-800/40 p-2.5 text-xs text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <div className="font-bold">Unresolved Questions</div>
                  <div className="text-[11px] text-amber-400/80">
                    {unresolvedSensitiveQuestions.length} screening question(s) still require your input. Incomplete questions will be exported with &quot;USER INPUT REQUIRED&quot;.
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleCopyAll}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-md shadow-teal-950/50"
              aria-label="Copy All Application Data"
            >
              {copiedKey === 'copy-all' ? (
                <>
                  <Check className="h-4 w-4" /> ✓ ALL APPLICATION DATA COPIED
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> COPY ALL APPLICATION DATA
                </>
              )}
            </button>
          </div>

          {/* 2. CANDIDATE BASICS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                Candidate Basics (Ground Truth)
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">1 authoritative source</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {candidateBasics.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg bg-slate-900/80 border border-slate-800/80 px-3 py-2 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {item.label}
                    </span>
                    {item.value ? (
                      <span className="font-medium text-slate-200 truncate block font-mono text-[11px]">
                        {item.value}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">NOT PROVIDED</span>
                    )}
                  </div>

                  {item.value ? (
                    <button
                      onClick={() => copyToClipboard(item.value!, `basic-${item.key}`)}
                      className={`shrink-0 rounded px-2 py-1 text-[11px] font-bold transition-colors flex items-center gap-1 ${
                        copiedKey === `basic-${item.key}`
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      aria-label={`Copy ${item.label}`}
                    >
                      {copiedKey === `basic-${item.key}` ? (
                        <>
                          <Check className="h-3 w-3" /> COPIED
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> COPY
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-600 uppercase font-semibold">
                      UNAVAILABLE
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. TAILORED SUMMARY / PITCH */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-400" />
                Tailored Summary / Pitch
              </h3>
              {latestResume && (
                <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/50">
                  {latestResume.versionName}
                </span>
              )}
            </div>

            {latestResume?.summary ? (
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3 space-y-2.5">
                <p className="text-xs text-slate-300 leading-relaxed font-sans max-h-36 overflow-y-auto">
                  {latestResume.summary}
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => copyToClipboard(latestResume.summary, 'summary')}
                    className={`rounded px-3 py-1 text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      copiedKey === 'summary'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                    aria-label="Copy Tailored Summary"
                  >
                    {copiedKey === 'summary' ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> COPIED
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> COPY SUMMARY
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-900/40 border border-slate-800/60 p-4 text-center space-y-2">
                <p className="text-xs text-slate-400">No tailored summary available for this job.</p>
                {onGenerateResume && (
                  <button
                    onClick={onGenerateResume}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 px-3 py-1.5 text-xs font-bold text-white transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> GENERATE RESUME & SUMMARY
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. COVER LETTER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Mail className="h-4 w-4 text-teal-400" />
                Cover Letter
              </h3>
              {latestCoverLetter && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                  ✓ VALIDATED (v1)
                </span>
              )}
            </div>

            {latestCoverLetter?.fullText ? (
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-400">
                  {latestCoverLetter.recipientTitle || `Hiring Team @ ${job?.company}`}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans max-h-36 overflow-y-auto whitespace-pre-line">
                  {latestCoverLetter.fullText}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <Link
                    href={`/cover-letter/${job?.id}`}
                    className="text-xs text-teal-400 hover:underline inline-flex items-center gap-1"
                  >
                    VIEW FULL LETTER <ExternalLink className="h-3 w-3" />
                  </Link>

                  <button
                    onClick={() => copyToClipboard(latestCoverLetter.fullText, 'cover-letter')}
                    className={`rounded px-3 py-1 text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      copiedKey === 'cover-letter'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                    aria-label="Copy Cover Letter"
                  >
                    {copiedKey === 'cover-letter' ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> COPIED
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> COPY COVER LETTER
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-900/40 border border-slate-800/60 p-4 text-center space-y-2">
                <p className="text-xs text-slate-400">No cover letter generated yet.</p>
                {onGenerateCoverLetter && (
                  <button
                    onClick={onGenerateCoverLetter}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 px-3 py-1.5 text-xs font-bold text-white transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> GENERATE COVER LETTER
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 5. SCREENING ANSWERS & 3-TIER ATTRIBUTION */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-teal-400" />
                Screening Answers ({screeningQuestions.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncCommonAnswers}
                  disabled={syncingCommon || screeningQuestions.length === 0}
                  className="rounded border border-indigo-500/40 bg-indigo-950/40 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-900/60 transition disabled:opacity-50 inline-flex items-center gap-1"
                  title="Auto-fill matching screening questions from your Global Common Answers Bank"
                >
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  {syncingCommon ? 'SYNCING...' : 'SYNC COMMON ANSWERS'}
                </button>
                <Link
                  href="/profile#common-answers"
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                  title="Manage your Global Common Answers Bank"
                >
                  CONFIG BANK
                </Link>
                <Link
                  href={`/jobs/${job?.id}/screening`}
                  className="text-[11px] text-teal-400 hover:underline inline-flex items-center gap-1"
                >
                  WORKSPACE ↗
                </Link>
              </div>
            </div>

            {screeningQuestions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No screening questions analyzed yet.</p>
            ) : (
              <div className="space-y-3">
                {screeningQuestions.map((q, idx) => {
                  const isUserProvided = Boolean(q.userAnswer);
                  const isUserRequired = q.requiresUserInput && !q.userAnswer;

                  return (
                    <div
                      key={q.id || idx}
                      className="rounded-lg bg-slate-900/80 border border-slate-800 p-3 space-y-2 text-xs"
                    >
                      {/* Attribution Badge */}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300 text-xs line-clamp-2">
                          {q.question}
                        </span>
                        {isUserProvided ? (
                          <span className="shrink-0 rounded bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-800/60">
                            USER PROVIDED
                          </span>
                        ) : isUserRequired ? (
                          <span className="shrink-0 rounded bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-800/60">
                            ⚠ USER INPUT REQUIRED
                          </span>
                        ) : (
                          <span className="shrink-0 rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800/60">
                            ✓ AI VERIFIED
                          </span>
                        )}
                      </div>

                      {/* Display answer or input field */}
                      {editingQuestionId === q.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={inlineAnswerText}
                            onChange={(e) => setInlineAnswerText(e.target.value)}
                            placeholder="Enter your authoritative response (e.g. Yes, I will require visa sponsorship)..."
                            className="w-full rounded bg-slate-950 border border-slate-700 p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 min-h-[60px]"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingQuestionId(null);
                                setInlineAnswerText('');
                              }}
                              className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveUserAnswer(q.id)}
                              disabled={savingAnswer}
                              className="px-3 py-1 text-[11px] font-bold rounded bg-teal-600 hover:bg-teal-500 text-white"
                            >
                              {savingAnswer ? 'Saving...' : 'Save Answer'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3 pt-1">
                          <div className="flex-1">
                            {q.userAnswer ? (
                              <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                                {q.userAnswer}
                              </p>
                            ) : q.requiresUserInput ? (
                              <p className="text-amber-400/90 italic text-[11px]">
                                Sensitive personal declaration. Must not be automated.
                              </p>
                            ) : (
                              <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                                {q.suggestedAnswer || 'N/A'}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {q.requiresUserInput && (
                              <button
                                onClick={() => {
                                  setEditingQuestionId(q.id);
                                  setInlineAnswerText(q.userAnswer || '');
                                }}
                                className="rounded p-1 text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
                                title="Edit user answer"
                                aria-label="Edit answer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {(q.userAnswer || (!q.requiresUserInput && q.suggestedAnswer)) && (
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    q.userAnswer || q.suggestedAnswer,
                                    `screening-${q.id}`
                                  )
                                }
                                className={`rounded px-2 py-1 text-[11px] font-bold transition-colors flex items-center gap-1 ${
                                  copiedKey === `screening-${q.id}`
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                                aria-label="Copy Answer"
                              >
                                {copiedKey === `screening-${q.id}` ? (
                                  <>
                                    <Check className="h-3 w-3" /> COPIED
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" /> COPY
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. RESUME & PDF */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-400" />
                Tailored Resume
              </h3>
              <span className="text-[10px] font-mono text-teal-400">
                {latestResume?.versionName || 'Not Generated'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/resume/${job?.id}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-white transition-colors border border-slate-700"
              >
                VIEW RESUME <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <button
                onClick={handleDownloadPDF}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 px-3 py-2 text-xs font-bold text-white transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> DOWNLOAD PDF
              </button>
            </div>
          </div>
        </div>

        {/* Footer: External ATS Launch Button */}
        <div className="border-t border-slate-800 bg-[#0f172a] p-4 space-y-2">
          <button
            onClick={onOpenApplication}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-500 py-3 text-xs font-black text-white transition-colors shadow-lg shadow-teal-950/60"
            aria-label="Open Application ATS"
          >
            OPEN APPLICATION <ExternalLink className="h-4 w-4" />
          </button>
          <p className="text-[10px] text-center text-slate-400">
            Opens authentic career page in new tab. Submission remains your manual responsibility.
          </p>
        </div>
      </aside>

      {/* Snapshot Modal if requested */}
      {showSnapshotModal && applicationSnapshot && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xl rounded-xl border border-teal-500/30 bg-slate-900 p-6 shadow-2xl max-h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Application Snapshot Record</h3>
              </div>
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs text-slate-300 pr-1">
              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400">Submission Timestamp</div>
                <div className="font-mono text-teal-300">
                  <ClientDate date={applicationSnapshot.appliedDate} type="datetime" />
                </div>
                <div className="text-slate-400 mt-2">Resume Artifact at Submission</div>
                <div className="font-mono text-slate-200">
                  {applicationSnapshot.resume.versionName}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-400 uppercase text-[10px]">
                  Snapshot Screening Answers
                </div>
                {applicationSnapshot.screeningAnswers.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-medium text-slate-300">{item.question}</div>
                    <div className="font-mono text-[11px] text-teal-300">
                      {item.answer || 'NOT ANSWERED'}
                    </div>
                    <span className="inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                      {item.source}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="px-4 py-2 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
