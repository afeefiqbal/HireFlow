'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import {
  Zap,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Briefcase,
  Search,
  Filter,
  FileText,
  Video,
  Layers,
  ChevronRight,
  Star,
  Users,
  Building2,
  Globe,
  Award,
  Check,
  Code2,
  Cpu,
  Flame,
  ArrowUpRight,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [remoteOnly, setRemoteOnly] = useState(true);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedRole !== 'All Roles') params.set('role', selectedRole);
    if (remoteOnly) params.set('remote', 'true');
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Announcement Banner - Clean Light Theme */}
      <div className="bg-emerald-50 border-b border-emerald-200/80 text-emerald-900 text-xs font-semibold py-2.5 px-4 text-center flex items-center justify-center gap-2">
        <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-2xs">
          New v2.0
        </span>
        <span>Candidate-First AI Matching Engine &amp; &lt;24h Fresh Job Radar is live!</span>
        <Link
          href={user ? '/dashboard' : '/register'}
          className="font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5 ml-1"
        >
          <span>Get Started Free</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Landing Navbar - Clean White Glass */}
      <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#00b074] flex items-center justify-center shadow-xs font-black">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  HIRE<span className="text-[#00b074]">flow</span>
                </span>
                <span className="rounded bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#009a65]">
                  AI Cockpit
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Autonomous Career Engine</p>
            </div>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">
              How It Works
            </a>
            <a href="#radar" className="hover:text-emerald-600 transition-colors">
              Fresh Jobs Radar
            </a>
            <a href="#testimonials" className="hover:text-emerald-600 transition-colors">
              Success Stories
            </a>
            <Link href="/jobs" className="hover:text-emerald-600 transition-colors">
              Browse Openings
            </Link>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                >
                  <span>Go to Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00b074] hover:bg-[#009a65] text-white font-bold text-sm shadow-sm transition-all transform hover:-translate-y-0.5"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Light Clean Theme with Soft Ambient Glow */}
      <section className="relative pt-16 pb-24 overflow-hidden bg-linear-to-b from-emerald-50/40 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-xs font-semibold mb-6 animate-fadeIn shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Candidate-First Ground Truth Intelligence</span>
            <span className="text-emerald-300">|</span>
            <span className="text-emerald-800 font-medium">Zero Hallucinations</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-5xl mx-auto">
            Land High-Impact Tech Roles{' '}
            <span className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
              10x Faster With AI.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Stop spraying hundreds of generic applications into corporate black holes. HireFlow scans fresh verified
            openings (&lt;24h), anti-hallucination AI matches your ground-truth skills, crafts customized ATS resumes, and
            auto-prepares your application dossier.
          </p>

          {/* CTA Group */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-xl">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#00b074] hover:bg-[#009a65] text-white font-black text-base shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <span>Create Candidate Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="w-full sm:w-auto">
              <GoogleAuthButton mode="signup" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs" />
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% Free for Job Seekers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Strict &lt;24h Freshness Guarantee</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified ATS Precision</span>
            </div>
          </div>

          {/* Search Radar Bar - Light Elevation */}
          <div id="radar" className="mt-14 max-w-4xl mx-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Role, tech stack (e.g. React, Node, Laravel)..."
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="All Roles">All Roles</option>
                  <option value="Full Stack">Full Stack</option>
                  <option value="Backend">Backend</option>
                  <option value="Frontend">Frontend</option>
                  <option value="DevOps & Cloud">DevOps &amp; Cloud</option>
                  <option value="AI / ML Engineer">AI / ML Engineer</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full h-full py-3 px-4 rounded-xl bg-[#00b074] hover:bg-[#009a65] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
                >
                  <span>Find Matches</span>
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between px-2 text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Trending Now:</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('Senior Full-Stack')}
                  className="hover:text-emerald-600 transition-colors"
                >
                  Senior Full-Stack
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('Node.js React')}
                  className="hover:text-emerald-600 transition-colors"
                >
                  Node.js + React
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('Laravel PHP')}
                  className="hover:text-emerald-600 transition-colors"
                >
                  Laravel
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('Remote Worldwide')}
                  className="hover:text-emerald-600 transition-colors"
                >
                  Remote
                </button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Remote / Visa Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Hero Product Mockup / Cockpit Preview - Light Clean Glass */}
        <div className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl p-1 bg-linear-to-b from-slate-200 via-slate-100 to-white border border-slate-200 shadow-2xl overflow-hidden">
            {/* Top Window Bar */}
            <div className="bg-slate-100 px-4 py-3 rounded-t-2xl flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-mono text-slate-500">hireflow.app/candidate/matches</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Stream Connected
                </span>
              </div>
            </div>

            {/* Inner Dashboard Simulation */}
            <div className="bg-white p-6 rounded-b-2xl grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Top Match Cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Today&apos;s Strongest Deterministic Matches
                  </h3>
                  <span className="text-xs text-slate-500">Verified &lt;24 hours</span>
                </div>

                {/* Simulated Job 1 */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all shadow-xs group">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                          Senior Full Stack Developer (React / Node / Cloud)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700">
                          98% MATCH
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" /> Automattic · <Globe className="w-3.5 h-3.5" /> 100% Remote ·{' '}
                        <Clock className="w-3.5 h-3.5 text-emerald-600" /> Posted 1.8h ago
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs shrink-0">
                      APPLY READY
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {['React 19', 'Node.js', 'PostgreSQL', 'TypeScript', 'Tailwind', 'Docker'].map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded-md bg-slate-50 text-[11px] font-medium text-slate-700 border border-slate-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      All 6 core requirements verified against candidate profile.
                    </span>
                    <span className="text-emerald-600 font-semibold group-hover:underline">View AI Breakdown →</span>
                  </div>
                </div>

                {/* Simulated Job 2 */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all shadow-xs group">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                          Staff Software Engineer - Application Infrastructure
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 border border-teal-200 text-teal-700">
                          94% MATCH
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" /> GitLab · <Globe className="w-3.5 h-3.5" /> Worldwide ·{' '}
                        <Clock className="w-3.5 h-3.5 text-emerald-600" /> Posted 3.4h ago
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs shrink-0 border border-slate-200">
                      PREPARED
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {['Go', 'TypeScript', 'Kubernetes', 'CI/CD Pipelines', 'REST APIs'].map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded-md bg-slate-50 text-[11px] font-medium text-slate-700 border border-slate-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Visa sponsorship offered · High technical alignment.
                    </span>
                    <span className="text-emerald-600 font-semibold group-hover:underline">View AI Breakdown →</span>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Co-pilot Widget */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">HireFlow Copilot</h4>
                    <p className="text-[10px] text-slate-500">Ground Truth Matcher</p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">ATS Keyword Coverage</span>
                    <span className="text-emerald-600 font-bold">96%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-linear-to-r from-emerald-500 to-teal-500 w-[96%] rounded-full" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    CV version tailored with 14 verified skills from master candidate profile.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-700">Generated Cover Letter</span>
                    <span className="text-emerald-600 font-semibold">Ready</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-700">Screening Answers</span>
                    <span className="text-emerald-600 font-semibold">100% Prepared</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-700">Interview STAR Prep Kit</span>
                    <span className="text-teal-600 font-semibold">Available</span>
                  </div>
                </div>

                <Link
                  href={user ? '/dashboard' : '/register'}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Launch Live Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section - Light Theme */}
      <section id="features" className="py-24 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full">
              Engineering Excellence
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-4">
              Everything Candidates Need to Dominate Their Search
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Built specifically for ambitious developers and tech specialists who value precision, freshness, and speed
              over spam.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50/70 p-8 rounded-3xl border border-slate-200 hover:border-emerald-400 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">&lt;24h Freshness Radar</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Aggregators flood you with 60-day-old ghost listings. HireFlow only surfaces jobs verified with raw source
                timestamps in the past 24 hours from Greenhouse, Lever, Ashby, and top tech boards.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50/70 p-8 rounded-3xl border border-slate-200 hover:border-emerald-400 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Zero-Hallucination Matching</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our AI operates strictly against your verified candidate profile. It never fabricates years of experience,
                languages, or claims you don&apos;t have, guaranteeing 100% integrity on every submission.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50/70 p-8 rounded-3xl border border-slate-200 hover:border-emerald-400 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 border border-cyan-200 text-cyan-700 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">1-Click Tailored ATS Resumes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate job-tailored resumes in seconds that maximize keyword alignment for ATS scanners while staying
                100% faithful to your genuine career accomplishments.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50/70 p-8 rounded-3xl border border-slate-200 hover:border-emerald-400 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Kanban Application Pipeline</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track your opportunities visually across every stage: Discovered → Matched → Preparing → Applied → Interview
                → Offer. Never miss a follow-up or lose context.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50/70 p-8 rounded-3xl border border-slate-200 hover:border-emerald-400 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mb-6">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Interview Intelligence Copilot</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Prepare for technical screens with predicted questions, STAR framework answer blueprints tailored to your
                specific projects, and company-specific architectures.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50/70 p-8 rounded-3xl border border-slate-200 hover:border-emerald-400 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Visa &amp; Relocation Transparency</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Instantly see if a role offers visa sponsorship, relocation assistance, or is strictly local before wasting
                time applying. Explicit compatibility flags on every card.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Light Theme */}
      <section id="how-it-works" className="py-24 border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full">
              Streamlined Process
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-4">
              From Discovery to Offer in 3 Clean Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-lg flex items-center justify-center mb-6 shadow-2xs">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Your Ground Truth</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sign in with Google or create an account, upload your CV or fill your verified history. This forms the
                unshakeable factual baseline for all AI operations.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 border border-teal-200 font-black text-lg flex items-center justify-center mb-6 shadow-2xs">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Daily Fresh Radar Matching</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                HireFlow continuously polls verified job endpoints, evaluates technical compatibility, and surfaces the top
                5% high-probability opportunities every morning.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 font-black text-lg flex items-center justify-center mb-6 shadow-2xs">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">One-Click Prepare &amp; Apply</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Review your customized resume version, generated cover letter, and pre-filled screening answers. Submit with
                total confidence and track everything in your Kanban.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof Section - Light Theme */}
      <section id="testimonials" className="py-24 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full">
              Candidate Feedback
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-4">
              Trusted by Senior Engineers Across the Globe
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic">
                &ldquo;HireFlow cut my job hunting hours by 80%. Instead of scrolling through old LinkedIn reposts, I got
                fresh 2-hour-old postings with high ATS alignment. Landed 3 interviews in week one.&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  AI
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Afeef Iqbal</div>
                  <div className="text-[10px] text-slate-500">Senior Full-Stack Engineer</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic">
                &ldquo;The anti-hallucination ground truth is revolutionary. Other AI tools invented fake accomplishments on my
                CV that embarrassed me in interviews. HireFlow uses only my actual work history.&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                  SK
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Siddharth Kumar</div>
                  <div className="text-[10px] text-slate-500">Backend Systems Architect</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic">
                &ldquo;The Interview Copilot with STAR blueprints gave me the exact architecture points the hiring manager
                probed. Got the offer at a tier-1 European startup!&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                  ER
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Elena Rostova</div>
                  <div className="text-[10px] text-slate-500">Lead Cloud Engineer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action - Light Theme */}
      <section className="py-24 border-t border-slate-200 bg-linear-to-b from-white to-emerald-50/60 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Ready to Take Control of Your Career?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Join thousands of senior software engineers landing offers with deterministic AI matching and verified fresh
            discoveries.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-lg">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00b074] hover:bg-[#009a65] text-white font-black text-base shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
            >
              Sign Up Free Today
            </Link>
            <div className="w-full sm:w-auto">
              <GoogleAuthButton mode="signup" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs" />
            </div>
          </div>
        </div>
      </section>

      {/* Public Footer - Light Theme */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 py-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  HIRE<span className="text-[#00b074]">flow</span>
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  ENGINE
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Autonomous candidate-first AI job matching engine. High-signal discovery with deterministic precision.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Product</h4>
              <ul className="space-y-2 text-slate-500">
                <li>
                  <Link href="/jobs" className="hover:text-emerald-600 transition-colors">
                    Job Directory
                  </Link>
                </li>
                <li>
                  <Link href="/matches" className="hover:text-emerald-600 transition-colors">
                    AI Match Engine
                  </Link>
                </li>
                <li>
                  <Link href="/application-queue" className="hover:text-emerald-600 transition-colors">
                    Application Queue
                  </Link>
                </li>
                <li>
                  <Link href="/interviews" className="hover:text-emerald-600 transition-colors">
                    Interview Copilot
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Authentication</h4>
              <ul className="space-y-2 text-slate-500">
                <li>
                  <Link href="/login" className="hover:text-emerald-600 transition-colors">
                    Candidate Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-emerald-600 transition-colors">
                    Candidate Registration
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">
                    Candidate Cockpit
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Trust &amp; Legal</h4>
              <ul className="space-y-2 text-slate-500">
                <li>
                  <Link href="/legal" className="hover:text-emerald-600 transition-colors">
                    Terms &amp; Fair Use
                  </Link>
                </li>
                <li>
                  <span>Anti-Hallucination Ground Truth Model</span>
                </li>
                <li>
                  <span>256-bit Encrypted Session</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-slate-400 gap-4">
            <p>© {new Date().getFullYear()} HireFlow AI. All rights reserved.</p>
            <p>Built for ambitious engineers and modern tech professionals.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
