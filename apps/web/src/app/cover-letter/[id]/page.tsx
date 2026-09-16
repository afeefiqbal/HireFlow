'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CoverLetterData, Job } from '@ai-job-agent/shared';
import {
  ArrowLeft,
  Mail,
  Copy,
  Save,
  RefreshCw,
  CheckCircle2,
  Download,
  Building2,
  Sparkles,
  ShieldCheck,
  Edit3,
  Eye,
} from 'lucide-react';

export default function CoverLetterEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // jobId

  const [job, setJob] = useState<Job | null>(null);
  const [coverLetterRecord, setCoverLetterRecord] = useState<CoverLetterData | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchLetterData = async () => {
    try {
      setLoading(true);
      const res = await api.getApplicationPreparation(id);
      setJob(res.job);
      if (res.latestCoverLetter) {
        setCoverLetterRecord(res.latestCoverLetter);
        setSubject(`Application for ${res.job.title} - Afeef Iqbal`);
        setContent(res.latestCoverLetter.fullText);
      }
    } catch (err: any) {
      console.error('Failed to load cover letter:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLetterData();
    }
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = async () => {
    if (!coverLetterRecord || !coverLetterRecord.id) return;
    setSaving(true);
    try {
      const updated = await api.updateCoverLetter(coverLetterRecord.id, content);
      setCoverLetterRecord(updated);
      showToast('Cover letter modifications saved!');
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await api.generateCoverLetter(id);
      setCoverLetterRecord(res);
      setSubject(`Application for ${job?.title || 'Engineer'} - Afeef Iqbal`);
      setContent(res.fullText || `${res.opening}\n\n${res.middle}\n\n${res.closing}`);
      showToast('Generated fresh custom cover letter!');
    } catch (err: any) {
      alert(`Regenerate failed: ${err.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${content}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    showToast('Cover letter copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="h-96 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
      </div>
    );
  }

  if (!coverLetterRecord) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-12 text-center text-slate-400 space-y-4">
        <Mail className="mx-auto h-10 w-10 text-teal-400" />
        <h2 className="text-lg font-bold text-white">No Cover Letter Drafted Yet</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Generate an authentic, professional cover letter emphasizing genuine achievements without clichés or hallucinations.
        </p>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-500"
        >
          <Sparkles className="h-4 w-4" />
          {regenerating ? 'Drafting...' : 'Generate Cover Letter'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/jobs/${id}/apply`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Preparation Workspace
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
            Cover Letter Studio
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3.5 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/20 transition-colors"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 px-3.5 py-1.5 text-xs font-bold text-white transition-colors shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Target Role & Candidate Info */}
      <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-slate-500 block uppercase tracking-wider text-[10px] font-bold">Target Position</span>
          <span className="text-white font-bold text-sm">{job?.title}</span>
          <span className="text-slate-400 ml-2">at {job?.company}</span>
        </div>
        <div className="text-slate-400 text-xs">
          Hiring Team: <span className="text-slate-200 font-medium">Hiring Manager at {job?.company}</span>
        </div>
      </div>

      {/* Two Column Workspace: Left (Editor) vs Right (Clean Formal Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Editor */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-teal-400" />
              Editable Letter Content
            </h3>
            <span className="text-[11px] text-slate-500">Live preview syncs on right</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Letter Body</label>
            <textarea
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200 leading-relaxed font-mono focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right: Formal Letter Paper Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-teal-400" />
              Document Preview
            </span>
            <span className="text-[11px] text-slate-500">A4 Document Standard</span>
          </div>

          <div className="rounded-xl border border-slate-700 bg-white text-slate-900 p-8 shadow-2xl space-y-5 font-serif text-xs leading-relaxed print:border-none print:shadow-none print:p-0">
            {/* Sender details */}
            <div className="border-b border-slate-300 pb-3 font-sans space-y-0.5">
              <div className="text-base font-bold text-slate-900">Afeef Iqbal</div>
              <div className="text-[11px] text-slate-600">Full-Stack Developer (7+ Years Experience)</div>
              <div className="text-[11px] text-slate-600">Alappuzha, Kerala, India • afeef@example.com</div>
            </div>

            {/* Date and Recipient */}
            <div className="font-sans text-[11px] text-slate-600 space-y-1">
              <div>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div className="font-bold text-slate-900 pt-1">Hiring Team</div>
              <div>{job?.company}</div>
              <div>{job?.location}</div>
            </div>

            {/* Subject */}
            <div className="font-sans font-bold text-xs text-slate-900 pt-2">
              RE: {subject}
            </div>

            {/* Body */}
            <div className="text-slate-800 whitespace-pre-line text-justify space-y-3 font-sans text-xs">
              {content}
            </div>

            {/* Sign off */}
            <div className="pt-4 font-sans text-xs space-y-1">
              <div>Sincerely,</div>
              <div className="font-bold text-slate-900 pt-2">Afeef Iqbal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
