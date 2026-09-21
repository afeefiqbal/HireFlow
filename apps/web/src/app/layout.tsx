import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'AI Job Agent | Private Intelligence Dashboard for Afeef Iqbal',
  description:
    'Automated fresh job discovery (<24h), anti-hallucination AI matching, and application tracking for Afeef Iqbal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 antialiased" suppressHydrationWarning>
        <Navigation />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        
        {/* JobEntry Inspired Dark Corporate Footer */}
        <footer className="border-t border-slate-800 bg-[#1e293b] text-slate-300 py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-700/80">
              {/* Col 1: Brand & Purpose */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white">
                    HIRE<span className="text-[#00b074]">flow</span>
                  </span>
                  <span className="bg-[#00b074]/20 border border-[#00b074]/40 text-[#00b074] text-[10px] font-bold px-1.5 py-0.5 rounded">
                    ENGINE
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Candidate-First Autonomous Job Intelligence cockpit for senior engineers. High-signal discovery with deterministic matching.
                </p>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Verified 24h Pipeline Active</span>
                </div>
              </div>

              {/* Col 2: Quick Links */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Cockpit Modules</h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li><a href="/jobs" className="hover:text-white transition-colors">Jobs Matrix (&lt;24h)</a></li>
                  <li><a href="/matches" className="hover:text-white transition-colors">Ground Truth Matches</a></li>
                  <li><a href="/application-queue" className="hover:text-white transition-colors">Application Queue</a></li>
                  <li><a href="/interviews" className="hover:text-white transition-colors">Interview Cockpit</a></li>
                </ul>
              </div>

              {/* Col 3: Candidate Intelligence */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Ground Truth Profile</h4>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <p className="text-slate-200 font-medium">Afeef Iqbal</p>
                  <p>7+ Yrs Full Stack · Laravel, Node.js, React</p>
                  <p className="text-[11px] text-slate-400">Strict ATS Match · Anti-Hallucination</p>
                </div>
              </div>

              {/* Col 4: Engine Status */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">System Verification</h4>
                <div className="rounded-lg bg-slate-800/80 border border-slate-700 p-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>ATS Ingestion:</span>
                    <span className="text-emerald-400 font-medium">Greenhouse · Ashby · Lever</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Target Speed:</span>
                    <span className="text-white font-medium">&lt; 15 min from post</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
              <div>
                © 2026 <strong className="text-slate-200 font-semibold">HIREflow</strong>. Autonomous Career Cockpit. All rights reserved.
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Privacy First</span>
                <span>•</span>
                <span>Deterministic ATS Guardrails</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
