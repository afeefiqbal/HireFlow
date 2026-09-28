'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/lib/auth-context';
import { Navigation } from '@/components/Navigation';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();

  const isPublicStandalonePage =
    pathname === '/' || pathname === '/login' || pathname === '/register';

  return (
    <AuthProvider>
      {isPublicStandalonePage ? (
        <div className="min-h-screen flex flex-col">{children}</div>
      ) : (
        <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 antialiased print:bg-white print:text-black">
          <div className="print:hidden">
            <Navigation />
          </div>
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 print:max-w-none print:w-full">
            {children}
          </main>

          {/* Cockpit Corporate Footer - Clean Light Theme */}
          <footer className="border-t border-slate-200 bg-white text-slate-600 py-12 mt-12 print:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-200">
                {/* Col 1: Brand & Purpose */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-slate-900">
                      HIRE<span className="text-[#00b074]">flow</span>
                    </span>
                    <span className="bg-[#00b074]/10 border border-[#00b074]/30 text-[#00b074] text-[10px] font-bold px-1.5 py-0.5 rounded">
                      ENGINE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Candidate-First Autonomous Job Intelligence cockpit for senior engineers. High-signal discovery
                    with deterministic matching.
                  </p>
                </div>

                {/* Col 2: Quick Links */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Cockpit Modules</h4>
                  <ul className="space-y-2 text-xs text-slate-500">
                    <li>
                      <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">
                        Live Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link href="/jobs" className="hover:text-emerald-600 transition-colors">
                        Job Directory &amp; Matches
                      </Link>
                    </li>
                    <li>
                      <Link href="/application-queue" className="hover:text-emerald-600 transition-colors">
                        Kanban Pipeline Queue
                      </Link>
                    </li>
                    <li>
                      <Link href="/interviews" className="hover:text-emerald-600 transition-colors">
                        Interview Copilot
                      </Link>
                    </li>
                    <li>
                      <Link href="/legal" className="text-emerald-600 font-medium hover:underline flex items-center gap-1">
                        <span>Legal, Fair Use &amp; Takedowns</span>
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Col 3: Candidate Intelligence */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Ground Truth Profile</h4>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <p className="text-slate-800 font-medium">Candidate Profile Active</p>
                    <p>7+ Yrs Full Stack · Laravel, Node.js, React</p>
                    <p className="text-[11px] text-slate-400">Strict ATS Match · Anti-Hallucination</p>
                  </div>
                </div>

                {/* Col 4: Engine Status */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">System Verification</h4>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Database Engine:</span>
                      <span className="font-mono text-emerald-600 font-medium">Neon Postgres</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Matching Engine:</span>
                      <span className="font-mono text-emerald-600 font-medium">Anti-Hallucination v2</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Auth Status:</span>
                      <span className="font-mono text-emerald-600 font-medium">Google OAuth / Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nominative Fair Use & Copyright Precaution Banner */}
              <div className="mb-6 rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-[11px] text-slate-500 leading-relaxed space-y-1">
                <p>
                  <strong className="text-slate-800">Legal &amp; Trademark Fair Use Notice:</strong> HIREflow is an autonomous career copilot and job search indexing service. All company names, logos, trade names, and trademarks referenced on this platform remain the exclusive property of their respective trademark holders. Their presence is used solely for descriptive identification and direct referral under Nominative Fair Use principles. HIREflow does not claim affiliation with, sponsorship by, or endorsement from any listed company. All job links redirect candidates directly to the official employer recruitment portals.
                </p>
                <p className="text-slate-500">
                  <strong className="text-slate-700">Employer Notice:</strong> If you represent an employer and wish to update, verify, or remove a job listing from our index, email{' '}
                  <a href="mailto:legal@hireflow.app" className="text-emerald-600 hover:underline font-medium">legal@hireflow.app</a> or{' '}
                  <a href="mailto:afeefbinqbal@gmail.com" className="text-emerald-600 hover:underline font-medium">afeefbinqbal@gmail.com</a>. Removal requests are honored within 24 hours. Read our full{' '}
                  <Link href="/legal" className="text-emerald-600 hover:underline font-medium">Legal &amp; Takedown Policy</Link>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
                <p>© {new Date().getFullYear()} HireFlow AI Job Agent. Candidate cockpit.</p>
                <div className="flex items-center gap-4">
                  <Link href="/" className="hover:text-slate-800 transition-colors">
                    Public Home
                  </Link>
                  <Link href="/legal" className="hover:text-slate-800 transition-colors">
                    Fair Use Notice
                  </Link>
                  <Link href="/settings" className="hover:text-slate-800 transition-colors">
                    System Settings
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      )}
    </AuthProvider>
  );
};
