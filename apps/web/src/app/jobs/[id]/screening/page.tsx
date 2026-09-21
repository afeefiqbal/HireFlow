'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ScreeningQuestionItem, Job } from '@ai-job-agent/shared';
import {
  ArrowLeft,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Plus,
  Save,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building2,
  UserCheck,
  ExternalLink,
} from 'lucide-react';

export default function ScreeningQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // jobId

  const [job, setJob] = useState<Job | null>(null);
  const [questions, setQuestions] = useState<ScreeningQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [adding, setAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchScreening = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await api.getApplicationPreparation(id);
      setJob(res.job);
      setQuestions(res.screeningQuestions || []);
    } catch (err: any) {
      console.error('Failed to load screening questions:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchScreening();
    }
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyAnswer = (qId: string, answer: string) => {
    navigator.clipboard.writeText(answer);
    setCopiedId(qId);
    showToast('Answer copied to clipboard!');
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleUpdateAnswer = async (qId: string, answer: string) => {
    setSaving(qId);
    try {
      await api.answerScreeningQuestion(qId, answer);
      setQuestions(
        questions.map((q) =>
          q.id === qId ? { ...q, userAnswer: answer, requiresUserInput: false } : q
        )
      );
      showToast('Answer saved successfully!');
    } catch (err: any) {
      alert(`Save answer failed: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleAddCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setAdding(true);
    try {
      await api.analyzeScreening(id, [newQuestionText.trim()]);
      setNewQuestionText('');
      showToast('Custom question evaluated against verified profile!');
      await fetchScreening(false);
    } catch (err: any) {
      alert(`Failed to add question: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleRegenerateAnswer = async (qId: string, questionText: string) => {
    setSaving(qId);
    try {
      await api.analyzeScreening(id, [questionText]);
      showToast('Answer regenerated based on current ground truth!');
      await fetchScreening(false);
    } catch (err: any) {
      alert(`Failed to regenerate answer: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-white rounded-xl animate-pulse border border-slate-200 shadow-xs" />
      </div>
    );
  }

  const userInputNeeded = questions.filter((q) => q.requiresUserInput && !q.userAnswer);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/jobs/${id}/apply`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Preparation Workspace
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-[#009a65] uppercase tracking-wider">
            Screening Questions Assistant
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={job?.applicationUrl || job?.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-3.5 py-1.5 text-xs font-bold text-white transition-colors shadow-xs"
          >
            <span>Open Application Portal</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Anti-Hallucination & Legal Disclaimer Bar */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Human-in-the-Loop Screening Safety Policy</span>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          Questions regarding <strong>legal authorization, visa sponsorship, salary expectations, and notice periods</strong> are strictly classified as <strong className="text-amber-800 underline">USER INPUT REQUIRED</strong>. The agent never guesses legal declarations or financial bounds on behalf of Afeef Iqbal.
        </p>
      </div>

      {/* Target Job Quick Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs">
        <div>
          <span className="text-slate-500 block uppercase tracking-wider text-[10px] font-bold">Target Position</span>
          <span className="text-slate-900 font-bold">{job?.title}</span>
          <span className="text-slate-500 ml-2">at {job?.company}</span>
        </div>
        <div className="text-slate-500">
          Total Questions: <strong className="text-slate-800">{questions.length}</strong> | Needs Input:{' '}
          <strong className={userInputNeeded.length > 0 ? 'text-amber-600' : 'text-[#009a65]'}>
            {userInputNeeded.length}
          </strong>
        </div>
      </div>

      {/* Add Custom Screening Question Form */}
      <form
        onSubmit={handleAddCustomQuestion}
        className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-[#00b074]" />
            Paste a Question from the Job Portal
          </span>
          <span className="text-[11px] text-slate-400">
            E.g. from Greenhouse, Lever, or Workday forms
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            placeholder="e.g., 'Do you require visa sponsorship to work in the European Union?' or 'Describe your Laravel experience.'"
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-[#00b074] focus:outline-none"
          />
          <button
            type="submit"
            disabled={adding || !newQuestionText.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50 shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {adding ? 'Analyzing...' : 'Generate Answer'}
          </button>
        </div>
      </form>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const isPendingInput = q.requiresUserInput && !q.userAnswer;
          const displayAnswer = q.userAnswer || q.suggestedAnswer || '';

          return (
            <div
              key={q.id || idx}
              className={`rounded-xl border p-5 space-y-3 transition-all ${
                isPendingInput
                  ? 'border-amber-300 bg-amber-50/50 shadow-xs'
                  : 'border-slate-200 bg-white shadow-xs'
              }`}
            >
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isPendingInput
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-emerald-50 text-[#009a65] border border-emerald-200'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{q.question}</h4>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {isPendingInput ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      USER INPUT REQUIRED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-[#009a65] border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Ground Truth Matched
                    </span>
                  )}
                </div>
              </div>

              {/* Source & Confidence Badge */}
              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pl-8">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#00b074] shrink-0" />
                  Source: <strong className="text-slate-700">{q.source}</strong>
                </span>
                <span>•</span>
                <span>
                  Confidence: <strong className="text-[#009a65] capitalize font-bold">{q.confidence}</strong>
                </span>
              </div>

              {/* Editable Answer Field */}
              <div className="pl-8 space-y-2">
                <textarea
                  rows={3}
                  value={displayAnswer}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setQuestions(
                      questions.map((item) =>
                        item.id === q.id ? { ...item, userAnswer: nextVal } : item
                      )
                    );
                  }}
                  placeholder={
                    isPendingInput
                      ? 'Please enter your specific answer (e.g. your salary expectation, work permit status, or notice period)...'
                      : 'Candidate answer...'
                  }
                  className={`w-full rounded-lg border p-3 text-xs leading-relaxed focus:outline-none ${
                    isPendingInput
                      ? 'border-amber-300 bg-white text-amber-950 focus:border-amber-500'
                      : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-[#00b074]'
                  }`}
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">
                    Edit text to customize, then click Save or Copy.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyAnswer(q.id, displayAnswer)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                    >
                      {copiedId === q.id ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#00b074]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      <span>{copiedId === q.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRegenerateAnswer(q.id, q.question)}
                      disabled={saving === q.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50 shadow-2xs"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${saving === q.id ? 'animate-spin' : ''}`} />
                      <span>{saving === q.id ? 'Regenerating...' : 'Regenerate'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateAnswer(q.id, displayAnswer)}
                      disabled={saving === q.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-3 py-1.5 text-xs font-bold text-white transition-colors shadow-2xs"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{saving === q.id ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
