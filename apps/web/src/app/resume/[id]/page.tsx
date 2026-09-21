'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { TailoredCvData, AtsAnalysisResult, Job } from '@ai-job-agent/shared';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Download,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Edit3,
  ShieldCheck,
  Award,
  Layers,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

export default function ResumeEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // jobId

  const [job, setJob] = useState<Job | null>(null);
  const [cvData, setCvData] = useState<TailoredCvData | null>(null);
  const [atsAnalysis, setAtsAnalysis] = useState<AtsAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'split' | 'edit' | 'preview'>('split');

  const fetchResumeData = async () => {
    try {
      setLoading(true);
      const res = await api.getApplicationPreparation(id);
      setJob(res.job);
      if (res.latestResume) {
        setCvData(res.latestResume);
      }
      if (res.latestAtsAnalysis) {
        setAtsAnalysis(res.latestAtsAnalysis);
      }
    } catch (err: any) {
      console.error('Failed to load resume:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchResumeData();
    }
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = async () => {
    if (!cvData || !cvData.id) return;
    setSaving(true);
    try {
      const updated = await api.updateResume(cvData.id, cvData);
      setCvData(updated);
      showToast('Tailored CV changes saved successfully!');
      // Re-fetch ATS score
      const prep = await api.getApplicationPreparation(id);
      if (prep.latestAtsAnalysis) {
        setAtsAnalysis(prep.latestAtsAnalysis);
      }
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await api.generateTailoredCv(id);
      setCvData(res.resume);
      setAtsAnalysis(res.atsAnalysis);
      showToast('New ground-truth tailored CV synthesized!');
    } catch (err: any) {
      alert(`Regenerate failed: ${err.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  // Helper updates for form fields
  const handleSummaryChange = (summary: string) => {
    if (!cvData) return;
    setCvData({ ...cvData, summary });
  };

  const handlePrimarySkillsChange = (skillsStr: string) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      primarySkills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
    });
  };

  const handleAdditionalSkillsChange = (skillsStr: string) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      additionalSkills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
    });
  };

  const handleExperienceBulletChange = (expIndex: number, bulletIndex: number, value: string) => {
    if (!cvData) return;
    const nextExp = [...cvData.experiences];
    const nextBullets = [...nextExp[expIndex].bullets];
    const currentBullet = nextBullets[bulletIndex];
    if (typeof currentBullet === 'string') {
      nextBullets[bulletIndex] = value;
    } else {
      nextBullets[bulletIndex] = { ...currentBullet, text: value };
    }
    nextExp[expIndex] = { ...nextExp[expIndex], bullets: nextBullets as any };
    setCvData({ ...cvData, experiences: nextExp });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-white rounded-xl animate-pulse border border-slate-200 shadow-xs" />
      </div>
    );
  }

  if (!cvData) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 space-y-4 shadow-xs">
        <FileText className="mx-auto h-10 w-10 text-[#00b074]" />
        <h2 className="text-lg font-bold text-slate-900">No Tailored CV Found For This Job</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Generate an ATS-optimized, single-column CV matching this role strictly using Afeef's verified experience.
        </p>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-2 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2 text-xs font-bold text-white shadow-xs"
        >
          <Sparkles className="h-4 w-4" />
          {regenerating ? 'Generating...' : 'Generate Ground-Truth CV'}
        </button>
      </div>
    );
  }

  const atsScore = atsAnalysis?.overallCoverage || 85;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
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
            Tailored ATS CV Editor
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* ATS Score pill */}
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#009a65]">
            <Award className="h-4 w-4 text-[#00b074]" />
            <span>ATS Keyword Coverage: {atsScore}%</span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-3.5 py-1.5 text-xs font-bold text-white transition-colors shadow-2xs"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save CV'}
          </button>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            title="Standard Print / Save as PDF"
          >
            <Download className="h-3.5 w-3.5" />
            Export / Print PDF
          </button>
        </div>
      </div>

      {/* Target Role & Candidate Info Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs print:hidden shadow-xs">
        <div>
          <span className="text-slate-500 block uppercase tracking-wider text-[10px] font-bold">Target Position</span>
          <span className="text-slate-900 font-bold text-sm">{job?.title || cvData.targetRole}</span>
          <span className="text-slate-500 ml-2">at {job?.company}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <div>
            Candidate: <strong className="text-slate-800">{cvData.fullName}</strong>
          </div>
          <div className="hidden sm:block">|</div>
          <div className="text-[#009a65] font-semibold">✓ Verified Ground Truth</div>
        </div>
      </div>

      {/* View Mode Toggle (Mobile / Split) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab('split')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'split' ? 'bg-emerald-50 text-[#009a65] border border-emerald-200 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Split View
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'edit' ? 'bg-emerald-50 text-[#009a65] border border-emerald-200 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Editor Only
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'preview' ? 'bg-emerald-50 text-[#009a65] border border-emerald-200 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          ATS Preview Only
        </button>
      </div>

      {/* Split Workstation: Left (Editor) vs Right (Live Clean Single-Column ATS Resume) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form Editor */}
        {(activeTab === 'split' || activeTab === 'edit') && (
          <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 print:hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-[#00b074]" />
                Resume Content Fields
              </h3>
              <span className="text-[11px] text-slate-400">Live syncs with preview</span>
            </div>

            {/* Target Role & Headline */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Target Role Title</label>
              <input
                type="text"
                value={cvData.targetRole}
                onChange={(e) => setCvData({ ...cvData, targetRole: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#00b074] focus:outline-none"
              />
            </div>

            {/* Professional Summary */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Professional Summary</label>
              <textarea
                rows={4}
                value={cvData.summary}
                onChange={(e) => handleSummaryChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 leading-relaxed focus:border-[#00b074] focus:outline-none"
              />
            </div>

            {/* Primary Skills */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Primary Core Skills (Comma Separated)
              </label>
              <input
                type="text"
                value={cvData.primarySkills.join(', ')}
                onChange={(e) => handlePrimarySkillsChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#00b074] focus:outline-none"
              />
            </div>

            {/* Additional Skills */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Additional / Secondary Skills (Comma Separated)
              </label>
              <input
                type="text"
                value={cvData.additionalSkills.join(', ')}
                onChange={(e) => handleAdditionalSkillsChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#00b074] focus:outline-none"
              />
            </div>

            {/* Experience Highlights */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Work Experience Bullets (Tailored Emphasis)
              </label>
              {cvData.experiences.map((exp, eIdx) => (
                <div key={eIdx} className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{exp.role}</span>
                    <span className="text-slate-500 text-[11px]">{exp.period}</span>
                  </div>
                  <div className="text-[11px] text-[#009a65] font-semibold">
                    {exp.company}
                  </div>

                  <div className="space-y-2 pt-1">
                    {exp.bullets.map((bullet, bIdx) => (
                      <textarea
                        key={bIdx}
                        rows={2}
                        value={typeof bullet === 'string' ? bullet : bullet.text}
                        onChange={(e) => handleExperienceBulletChange(eIdx, bIdx, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-[#00b074] focus:outline-none"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Column: Live ATS Single-Column Document Preview */}
        {(activeTab === 'split' || activeTab === 'preview') && (
          <div className="space-y-4 print:space-y-0 print:col-span-full print:m-0 print:w-[8.5in]">
            <div className="flex items-center justify-between print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-[#00b074]" />
                Live Single-Column ATS Format
              </span>
              <span className="text-[11px] text-slate-400">Standard ATS readable fonts &amp; layout</span>
            </div>

            {/* Resume Document Paper */}
            <div className="rounded-xl border border-slate-200 bg-white text-slate-900 p-8 shadow-md space-y-5 font-sans print:border-none print:shadow-none print:p-0">
              {/* Header */}
              <div className="text-center border-b border-slate-300 pb-4 space-y-1">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {cvData.fullName}
                </h1>
                <div className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                  {cvData.targetRole}
                </div>
                <div className="text-[11px] text-slate-600 flex flex-wrap justify-center items-center gap-3 pt-1">
                  <span>Alappuzha, Kerala, India</span>
                  <span>•</span>
                  <span>afeef@example.com</span>
                  <span>•</span>
                  <span>linkedin.com/in/afeef-iqbal</span>
                  <span>•</span>
                  <span>github.com/afeefiqbal</span>
                </div>
              </div>

              {/* Section: Professional Summary */}
              <div className="space-y-1.5">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5">
                  Professional Summary
                </h2>
                <p className="text-xs text-slate-800 leading-relaxed text-justify">
                  {cvData.summary}
                </p>
              </div>

              {/* Section: Technical Competencies */}
              <div className="space-y-1.5">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5">
                  Technical Core Competencies
                </h2>
                <div className="space-y-1 text-xs text-slate-800">
                  <div className="flex">
                    <span className="font-bold w-36 shrink-0 text-slate-900">Primary Skills:</span>
                    <span className="text-slate-700">{cvData.primarySkills.join(', ')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-36 shrink-0 text-slate-900">Additional Tech:</span>
                    <span className="text-slate-700">{cvData.additionalSkills.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Section: Work Experience */}
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5">
                  Professional Experience
                </h2>

                {cvData.experiences.map((exp, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{exp.role}</span>
                        <span className="text-slate-700"> — {exp.company}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 text-right">
                        {exp.period}
                      </div>
                    </div>
                    <p className="text-[11.5px] text-slate-600 italic">{exp.summary}</p>
                    <ul className="list-disc list-outside pl-4 space-y-1 text-[11.5px] text-slate-700 leading-relaxed">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{typeof b === 'string' ? b : b.text}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Section: Projects */}
              {cvData.projects && cvData.projects.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5">
                    Selected Key Projects
                  </h2>
                  {cvData.projects.map((proj, pIdx) => (
                    <div key={pIdx} className="space-y-0.5 text-xs">
                      <div className="font-bold text-slate-900">
                        {proj.title}{' '}
                        <span className="font-normal text-slate-600">
                          ({proj.technologies.join(', ')})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700">{proj.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Section: Education */}
              <div className="space-y-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5">
                  Education
                </h2>
                <div className="flex justify-between text-xs text-slate-800">
                  <div>
                    <span className="font-bold">Bachelor of Science in Computer Science</span> — University of Kerala
                  </div>
                  <div className="text-[11px] text-slate-600">2017</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
