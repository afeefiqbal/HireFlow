'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
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
} from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-xl bg-slate-900 animate-pulse border border-slate-800" />
        <div className="h-64 rounded-xl bg-slate-900 animate-pulse border border-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Source of Truth Governance */}
      <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-[#0e1a2b] via-[#0f1d32] to-[#0e1a2b] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-2xl font-black">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{profile?.fullName}</h1>
                <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-300 border border-teal-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Truth
                </span>
              </div>
              <p className="text-sm font-semibold text-teal-400 mt-0.5">
                {profile?.headline}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                7+ years professional software development experience
              </p>
            </div>
          </div>

          {/* Quick Preferences */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-slate-300">
              Remote: <strong className="text-teal-300 capitalize">{profile?.remotePreference}</strong>
            </span>
            <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-slate-300">
              Relocation: <strong className="text-teal-300 capitalize">{profile?.relocationPreference}</strong>
            </span>
            <span className="rounded-lg border border-teal-500/30 bg-teal-950/40 px-3 py-1.5 text-teal-300">
              Visa Sponsorship: <strong className="text-white font-bold">Required</strong>
            </span>
          </div>
        </div>

        {/* Anti-hallucination constraint alert */}
        <div className="mt-6 rounded-lg border border-teal-500/20 bg-[#09111c] p-3 text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-teal-300">AI Integrity Enforcement:</strong> This verified profile serves as the absolute ground truth. The AI matching engine and tailoring pipelines are strictly forbidden from inventing employers, modifying dates, assuming unverified technologies, or fabricating history to bridge career gaps.
          </p>
        </div>
      </div>

      {/* Target Roles & Target Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-teal-400" />
            Target Positions
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile?.targetRoles?.map((role: string) => (
              <span
                key={role}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-purple-400" />
            Target Locations
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile?.targetLocations?.map((loc: string) => (
              <span
                key={loc}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
              >
                {loc}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Verified Skills Taxonomy */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-teal-400" />
          Verified Skills Taxonomy
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Technologies */}
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">
              Primary Technologies (Core 7+ Yrs Mastery)
            </span>
            <div className="flex flex-wrap gap-2">
              {profile?.primarySkills?.map((skill: string) => (
                <span
                  key={skill}
                  className="rounded-md border border-teal-500/40 bg-teal-950/40 px-3 py-1 text-xs font-bold text-teal-300 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Additional Technologies */}
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">
              Additional Verified Production Technologies
            </span>
            <div className="flex flex-wrap gap-2">
              {profile?.additionalSkills?.map((skill: string) => (
                <span
                  key={skill}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Verified Employment Timeline */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-400" />
            Verified Career Progression (Chronological)
          </h2>
          <span className="text-xs text-slate-500">5 Verified Employers · 1 Explicit Break</span>
        </div>

        <div className="space-y-6">
          {/* Pixbit Solutions (Current) */}
          <div className="relative pl-6 border-l-2 border-teal-500 space-y-1">
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-teal-500 ring-4 ring-[#0f172a]" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">Senior Software Developer · Pixbit Solutions</h3>
              <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[11px] font-semibold text-teal-300 border border-teal-500/30">
                Jul 2025 – Present (Current)
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Overseeing full-stack architectural design, code reviews, and high-performance system delivery across modern Laravel and Node.js ecosystems.
            </p>
            <div className="pt-1 flex flex-wrap gap-1">
              {['Laravel', 'PHP', 'Node.js', 'Vue.js', 'React', 'Docker', 'PostgreSQL', 'AWS'].map((t) => (
                <span key={t} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* GAP TRANSPARENCY BANNER */}
          <div className="relative pl-6 border-l-2 border-dashed border-amber-500/50 my-4">
            <div className="absolute -left-[7px] top-2 h-3 w-3 rounded-full bg-amber-500 ring-4 ring-[#0f172a]" />
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                <span>Verified Career Break / Independent Learning Period: Aug 2024 – Jul 2025</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Strict Anti-Hallucination Policy: This period is deliberately un-invented. The AI will never fabricate a stealth role or fictional freelance entity.
              </p>
            </div>
          </div>

          {/* Lilac Infotech */}
          <div className="relative pl-6 border-l-2 border-slate-700 space-y-1">
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-slate-700 ring-4 ring-[#0f172a]" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">Software Engineer · Lilac Infotech Pvt. Ltd.</h3>
              <span className="text-xs text-slate-400">Jul 2023 – Aug 2024</span>
            </div>
            <p className="text-xs text-slate-300">
              Designed scalable microservices and modular monolithic applications. Handled complex business logic, database migrations, and AWS deployment automation.
            </p>
          </div>

          {/* Pentacodes */}
          <div className="relative pl-6 border-l-2 border-slate-700 space-y-1">
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-slate-700 ring-4 ring-[#0f172a]" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">Software Developer · Pentacodes</h3>
              <span className="text-xs text-slate-400">Jul 2022 – Jun 2023</span>
            </div>
            <p className="text-xs text-slate-300">
              Architected high-throughput REST APIs and webhook ingestion pipelines. Dockerized services and contributed to backend reliability improvements.
            </p>
          </div>

          {/* D5N Digital */}
          <div className="relative pl-6 border-l-2 border-slate-700 space-y-1">
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-slate-700 ring-4 ring-[#0f172a]" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">Software Developer · D5N Digital</h3>
              <span className="text-xs text-slate-400">Dec 2020 – Jul 2022</span>
            </div>
            <p className="text-xs text-slate-300">
              Built full-stack applications with Laravel backend and Vue.js frontends. Integrated third-party payment gateways and CRM endpoints.
            </p>
          </div>

          {/* Crabviz */}
          <div className="relative pl-6 border-l-2 border-slate-700 space-y-1">
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-slate-700 ring-4 ring-[#0f172a]" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">Software Engineer · Crabviz Private Limited</h3>
              <span className="text-xs text-slate-400">Dec 2018 – Sep 2020</span>
            </div>
            <p className="text-xs text-slate-300">
              Engineered backend services and RESTful APIs with Laravel and MySQL. Optimized database schema queries.
            </p>
          </div>
        </div>
      </div>

      {/* Verified Projects Showcase */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="h-5 w-5 text-teal-400" />
            Verified Projects
          </h2>
          <span className="text-xs text-slate-500">Database Extensible</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profile?.projects?.map((proj: any) => (
            <div
              key={proj.id}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{proj.title}</h3>
                <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-500/30">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
              <div className="pt-2 flex flex-wrap gap-1 border-t border-slate-800/80">
                {proj.technologies.map((t: string) => (
                  <span
                    key={t}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                  >
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
