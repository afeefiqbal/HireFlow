'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ParsedResumePreview, AutoApplyConfig } from '@ai-job-agent/shared';
import {
  User,
  ShieldCheck,
  Briefcase,
  Layers,
  MapPin,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Code2,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Save,
  Sparkles,
  UploadCloud,
  FileText,
  RefreshCw,
  Sliders,
  Zap,
  Check,
  AlertTriangle,
} from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Common Answers state
  const [commonAnswers, setCommonAnswers] = useState<any>({
    visaSponsorship: '',
    workAuthorization: '',
    noticePeriod: '',
    expectedSalary: '',
    relocation: '',
  });
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Resume Ingestion state
  const [resumeText, setResumeText] = useState('');
  const [parsingResume, setParsingResume] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ParsedResumePreview | null>(null);
  const [committingResume, setCommittingResume] = useState(false);
  const [overwriteMaster, setOverwriteMaster] = useState(false);
  const [resumeSuccessMsg, setResumeSuccessMsg] = useState<string | null>(null);
  const [resumeErrorMsg, setResumeErrorMsg] = useState<string | null>(null);

  // Auto-Apply Settings state
  const [autoApplyConfig, setAutoApplyConfig] = useState<AutoApplyConfig>({
    enabled: false,
    autonomousThreshold: 85,
    dailyLimit: 5,
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  const loadData = async () => {
    try {
      const [data, config] = await Promise.all([
        api.getProfile(),
        api.getAutoApplyConfig().catch(() => ({ enabled: false, autonomousThreshold: 85, dailyLimit: 5 })),
      ]);
      setProfile(data);
      if (data.commonAnswers) {
        setCommonAnswers(data.commonAnswers);
      }
      setAutoApplyConfig(config);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCommonAnswers = async () => {
    setSavingAnswers(true);
    try {
      await api.updateCommonAnswers(commonAnswers);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      alert(`Failed to save common answers: ${err.message}`);
    } finally {
      setSavingAnswers(false);
    }
  };

  const handleParseResume = async () => {
    if (!resumeText.trim()) {
      setResumeErrorMsg('Please paste resume text or upload a file first.');
      return;
    }
    setParsingResume(true);
    setResumeErrorMsg(null);
    try {
      const preview = await api.uploadResume(resumeText);
      setParsedPreview(preview);
    } catch (err: any) {
      setResumeErrorMsg(err.message || 'Failed to parse resume');
    } finally {
      setParsingResume(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setResumeText(text);
    };
    reader.readAsText(file);
  };

  const handleCommitResume = async () => {
    if (!parsedPreview) return;
    setCommittingResume(true);
    setResumeErrorMsg(null);
    try {
      await api.commitResume(parsedPreview, overwriteMaster);
      setResumeSuccessMsg('Master Ground Truth successfully synchronized from resume!');
      setTimeout(() => setResumeSuccessMsg(null), 5000);
      setParsedPreview(null);
      setResumeText('');
      await loadData();
    } catch (err: any) {
      setResumeErrorMsg(err.message || 'Failed to commit resume to profile');
    } finally {
      setCommittingResume(false);
    }
  };

  const handleSaveAutoApplyConfig = async () => {
    setSavingConfig(true);
    try {
      const updated = await api.updateAutoApplyConfig(autoApplyConfig);
      setAutoApplyConfig(updated);
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3500);
    } catch (err: any) {
      alert(`Failed to save auto-apply settings: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-xl bg-slate-200 animate-pulse border border-slate-200" />
        <div className="h-64 rounded-xl bg-slate-200 animate-pulse border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Source of Truth Governance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-[#00b074] text-2xl font-black">
              {profile?.fullName?.slice(0, 2)?.toUpperCase() || 'AI'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">{profile?.fullName}</h1>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Ground Truth
                </span>
              </div>
              <p className="text-sm font-semibold text-[#009a65] mt-0.5">
                {profile?.headline}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {profile?.yearsOfExperience}+ years professional experience · {profile?.location}
              </p>
            </div>
          </div>

          {/* Quick Preferences */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 font-medium">
              Remote: <strong className="text-slate-900 capitalize">{profile?.remotePreference}</strong>
            </span>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 font-medium">
              Relocation: <strong className="text-slate-900 capitalize">{profile?.relocationPreference}</strong>
            </span>
            <span className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-[#009a65]">
              Visa Sponsorship: <strong className="text-slate-900 font-bold">Required</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: RESUME & PROFILE SYNC (Ingestion & Ground Truth) */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-[#00b074]" />
              Resume &amp; Profile Sync
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload or update your resume once. HIREflow extracts candidate ground truth for autonomous matching and preparation.
            </p>
          </div>
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs">
            <FileText className="h-4 w-4 text-[#00b074]" />
            <span>Upload File (.txt / .json)</span>
            <input type="file" accept=".txt,.json,.md,.pdf" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {resumeSuccessMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-[#009a65] font-semibold shadow-xs">
            <Check className="h-4 w-4 text-[#00b074]" />
            <span>{resumeSuccessMsg}</span>
          </div>
        )}

        {resumeErrorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-700 font-semibold shadow-xs">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <span>{resumeErrorMsg}</span>
          </div>
        )}

        {/* Input Text Area */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">
            Paste Resume Content or Uploaded Document Text
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your updated resume text here (experience, skills, projects, contact details)..."
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#00b074] focus:outline-none"
          />
          <div className="flex justify-end">
            <button
              onClick={handleParseResume}
              disabled={parsingResume || !resumeText.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-2 text-xs font-bold text-white hover:bg-[#009a65] disabled:opacity-50 transition-colors shadow-2xs"
            >
              {parsingResume ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Extracting Ground Truth...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Extract &amp; Preview Ground Truth
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extracted Preview & Diff Card */}
        {parsedPreview && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#009a65]">Extracted Ground Truth Preview</span>
                <h3 className="text-sm font-bold text-slate-900">{parsedPreview.fullName} — {parsedPreview.headline}</h3>
                <p className="text-xs text-slate-500">{parsedPreview.yearsOfExperience} yrs experience · {parsedPreview.skills.length} skills identified</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={overwriteMaster}
                    onChange={(e) => setOverwriteMaster(e.target.checked)}
                    className="rounded border-slate-300 text-[#00b074] focus:ring-[#00b074]"
                  />
                  <span>Replace existing history</span>
                </label>
                <button
                  onClick={handleCommitResume}
                  disabled={committingResume}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-2 text-xs font-bold text-white hover:bg-[#009a65] transition-colors"
                >
                  {committingResume ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Commit to Master Profile
                </button>
              </div>
            </div>

            {/* Preview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <span className="font-bold text-slate-700">Identified Skills ({parsedPreview.skills.length}):</span>
                <div className="flex flex-wrap gap-1">
                  {parsedPreview.skills.map((s) => (
                    <span key={s.name} className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-[#009a65]">
                      {s.name} ({s.level})
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700">Experience Timeline ({parsedPreview.experiences.length}):</span>
                <ul className="space-y-1 text-slate-600">
                  {parsedPreview.experiences.slice(0, 4).map((e, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="text-slate-800 font-medium">{e.role} @ {e.company}</span>
                      <span className="text-slate-400 text-[11px]">{e.startDate} – {e.endDate || 'Present'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: AUTO-APPLY SAFETY & GOVERNANCE SETTINGS */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-[#00b074]" />
              Autonomous Auto-Apply Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure safety guardrails for autonomous background applications.
            </p>
          </div>
          {configSuccess && (
            <span className="text-xs font-bold text-[#009a65] flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Toggle Enabled */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Autonomous Submission</label>
              <input
                type="checkbox"
                checked={autoApplyConfig.enabled}
                onChange={(e) => setAutoApplyConfig({ ...autoApplyConfig, enabled: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-[#00b074] focus:ring-[#00b074]"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When enabled, HIREflow automatically submits eligible applications through supported ATS systems without asking for confirmation.
            </p>
          </div>

          {/* Autonomous Threshold */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Autonomous Threshold</label>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200">
                {autoApplyConfig.autonomousThreshold}%
              </span>
            </div>
            <input
              type="range"
              min={80}
              max={95}
              step={1}
              value={autoApplyConfig.autonomousThreshold}
              onChange={(e) => setAutoApplyConfig({ ...autoApplyConfig, autonomousThreshold: Number(e.target.value) })}
              className="w-full accent-[#00b074]"
            />
            <p className="text-[11px] text-slate-500">
              Only opportunities with a match score &ge; {autoApplyConfig.autonomousThreshold}% will be autonomously submitted.
            </p>
          </div>

          {/* Daily Limit */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Daily Application Limit</label>
              <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
                {autoApplyConfig.dailyLimit} / day
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={20}
              value={autoApplyConfig.dailyLimit}
              onChange={(e) => setAutoApplyConfig({ ...autoApplyConfig, dailyLimit: Math.max(1, Number(e.target.value)) })}
              className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-800 focus:border-[#00b074] focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Maximum number of real applications submitted per 24 hours.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveAutoApplyConfig}
            disabled={savingConfig}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-2 text-xs font-bold text-white hover:bg-[#009a65] disabled:opacity-50 transition-colors shadow-2xs"
          >
            {savingConfig ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Auto-Apply Configuration
          </button>
        </div>
      </div>

      {/* Common Answers Bank */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#00b074]" />
              Common Answers Bank
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative answers used to pre-fill application screening questions without hallucination.
            </p>
          </div>
          {savedSuccess && (
            <span className="text-xs font-bold text-[#009a65] flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Visa Sponsorship Requirement</label>
            <input
              type="text"
              value={commonAnswers.visaSponsorship || ''}
              onChange={(e) => setCommonAnswers({ ...commonAnswers, visaSponsorship: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-[#00b074] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Work Authorization Status</label>
            <input
              type="text"
              value={commonAnswers.workAuthorization || ''}
              onChange={(e) => setCommonAnswers({ ...commonAnswers, workAuthorization: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-[#00b074] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Notice Period / Earliest Start Date</label>
            <input
              type="text"
              value={commonAnswers.noticePeriod || ''}
              onChange={(e) => setCommonAnswers({ ...commonAnswers, noticePeriod: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-[#00b074] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Expected Annual Gross Compensation</label>
            <input
              type="text"
              value={commonAnswers.expectedSalary || ''}
              onChange={(e) => setCommonAnswers({ ...commonAnswers, expectedSalary: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-[#00b074] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveCommonAnswers}
            disabled={savingAnswers}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-2 text-xs font-bold text-white hover:bg-[#009a65] disabled:opacity-50 transition-colors shadow-2xs"
          >
            {savingAnswers ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Common Answers
          </button>
        </div>
      </div>

      {/* Verified Skills Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#00b074]" />
            Verified Skills Ground Truth ({profile?.skills?.length || 0})
          </h2>
          <span className="text-xs text-slate-400 font-medium">Database Synchronized</span>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Skills</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile?.skills
                ?.filter((s: any) => s.category === 'primary')
                .map((skill: any) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#009a65]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#00b074]" />
                    {skill.name}
                  </span>
                ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Additional Technologies &amp; Tools</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile?.skills
                ?.filter((s: any) => s.category !== 'primary')
                .map((skill: any) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {skill.name}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chronological Experience Timeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#00b074]" />
            Verified Career Timeline
          </h2>
          <span className="text-xs text-slate-400 font-medium">Chronological Strict Order</span>
        </div>

        <div className="space-y-4 pt-2">
          {profile?.experiences?.map((exp: any) => (
            <div key={exp.id} className="relative pl-6 border-l-2 border-[#00b074]/40 space-y-1">
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-[#00b074] ring-4 ring-white" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">{exp.role} · {exp.company}</h3>
                <span className="text-xs font-semibold text-[#009a65]">
                  {exp.startDate} – {exp.endDate || (exp.isCurrent ? 'Present' : 'Ended')}
                </span>
              </div>
              {exp.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>
              )}
              {exp.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {exp.technologies.map((t: string) => (
                    <span key={t} className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Verified Projects Showcase */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="h-5 w-5 text-[#00b074]" />
            Verified Projects ({profile?.projects?.length || 0})
          </h2>
          <span className="text-xs text-slate-400 font-medium">Database Extensible</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profile?.projects?.map((proj: any) => (
            <div
              key={proj.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 hover:border-[#00b074] transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{proj.title}</h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#009a65] border border-emerald-200">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
              <div className="pt-2 flex flex-wrap gap-1 border-t border-slate-200">
                {proj.technologies?.map((t: string) => (
                  <span key={t} className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
