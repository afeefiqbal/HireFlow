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
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
        <Navigation />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-[#060910] py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-slate-400">AI JOB AGENT V1</span> · Single-User Private Platform
            </div>
            <div>
              Candidate Ground Truth: <span className="text-teal-400 font-medium">Afeef Iqbal</span> (7+ Years Full-Stack)
            </div>
            <div className="text-[11px] text-slate-600">
              Strict 24h Filter · Anti-Hallucination AI Guardrails
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
