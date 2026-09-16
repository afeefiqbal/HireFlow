'use client';

import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Layers,
  FileCheck2,
} from 'lucide-react';

export default function ResumePage() {
  const [selectedTrack, setSelectedTrack] = useState<'laravel' | 'node' | 'fullstack'>('laravel');

  const tracks = {
    laravel: {
      title: 'Senior Laravel & PHP Developer',
      emphasis: 'Laravel 11, Eloquent ORM, MySQL optimization, RESTful API architecture, Artemyst & Samasta projects.',
      summary:
        'Senior Full-Stack Engineer with 7+ years specializing in high-performance Laravel backends, database schema architecture, and secure REST APIs. Lead developer at Pixbit Solutions with proven delivery across enterprise commerce and SaaS portals.',
      primarySkills: ['PHP', 'Laravel', 'MySQL', 'REST APIs', 'Vue.js', 'Docker'],
    },
    node: {
      title: 'Senior Backend Developer (Node.js)',
      emphasis: 'Node.js, Express.js, PostgreSQL schema design, AWS infrastructure, DealCode enterprise project.',
      summary:
        'Backend Engineer with 7+ years of experience engineering asynchronous microservices, PostgreSQL databases, and cloud infrastructure on AWS. Creator of DealCode deal-tracking platform and experienced in containerized Docker deployments.',
      primarySkills: ['Node.js', 'Express.js', 'PostgreSQL', 'AWS', 'Docker', 'REST APIs'],
    },
    fullstack: {
      title: 'Full-Stack Developer (Laravel + Vue / React)',
      emphasis: 'Balanced architecture bridging modern Laravel APIs with dynamic Vue.js & React interfaces.',
      summary:
        'Full-Stack Developer with 7+ years of end-to-end web engineering mastery. Direct production track record pairing robust Laravel/PHP backends with Vue.js single page applications, payment gateways, and scalable cloud systems.',
      primarySkills: ['Laravel', 'Vue.js', 'Node.js', 'React', 'MySQL', 'PostgreSQL', 'AWS'],
    },
  };

  const current = tracks[selectedTrack];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-teal-400" />
            AI Resume &amp; ATS Tailoring Engine
            <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-300 border border-teal-500/30">
              V2 Architecture Preview
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated resume tailoring based strictly on verified ground truth without qualification invention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF (Coming Soon)
          </button>
        </div>
      </div>

      {/* Architecture Workflow Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { step: '1', title: 'Master Profile', desc: 'Afeef verified facts' },
          { step: '2', title: 'Job Spec', desc: 'Target requirements' },
          { step: '3', title: 'AI Matching', desc: 'Vector comparison' },
          { step: '4', title: 'Tailored CV', desc: 'Contextual emphasis' },
          { step: '5', title: 'ATS Analysis', desc: 'Strict parser check' },
          { step: '6', title: 'User Review', desc: 'Human verification' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-800 bg-[#0f172a] p-3 text-center space-y-1 relative"
          >
            <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-400">
              {item.step}
            </div>
            <div className="text-xs font-bold text-white">{item.title}</div>
            <div className="text-[11px] text-slate-400">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Emphasis Selector */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Select Tailoring Emphasis:
        </span>
        <div className="flex flex-wrap gap-2">
          {(['laravel', 'node', 'fullstack'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTrack(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                selectedTrack === t
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t === 'fullstack' ? 'Full Stack Focus' : `${t} Focus`}
            </button>
          ))}
        </div>
      </div>

      {/* Tailored CV Live Preview Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#0b101c] p-8 shadow-2xl space-y-6 max-w-4xl mx-auto">
        {/* CV Header */}
        <div className="border-b border-slate-800 pb-5 text-center space-y-1.5">
          <h2 className="text-2xl font-black text-white">AFEEF IQBAL</h2>
          <p className="text-sm font-semibold text-teal-400">{current.title}</p>
          <p className="text-xs text-slate-400">
            Germany / Netherlands Relocation · Remote Preferred · 7+ Years Experience
          </p>
        </div>

        {/* Tailored Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-1">
            Professional Profile
          </h3>
          <p className="text-xs leading-relaxed text-slate-200">{current.summary}</p>
        </div>

        {/* Emphasized Technologies */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-1">
            Core Competencies &amp; Technologies
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {current.primarySkills.map((s) => (
              <span
                key={s}
                className="rounded bg-teal-950/60 border border-teal-500/40 px-2.5 py-1 text-xs font-semibold text-teal-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* ATS Score Simulation */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-black">
              98
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">ATS Readability &amp; Keyword Score</h4>
              <p className="text-[11px] text-slate-400">
                Single-column standard structure · Zero tables/icons in parse tree · High keyword density
              </p>
            </div>
          </div>
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/40">
            Passed ATS Audit
          </span>
        </div>
      </div>
    </div>
  );
}
