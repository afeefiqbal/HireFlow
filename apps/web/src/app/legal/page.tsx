import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Scale,
  ExternalLink,
  Mail,
  Building2,
  FileText,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: 'Legal, Trademark & Takedown Policy | HIREflow',
  description:
    'Nominative Fair Use disclaimer, public job aggregation notice, and 24-hour employer takedown request policy for HIREflow.',
};

export default function LegalPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#009a65] border border-emerald-200 text-xs font-bold">
          <Scale className="h-3.5 w-3.5" />
          <span>Legal, Copyright &amp; Fair Use Policy</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Legal Disclaimers &amp; Employer Safeguards
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
          HIREflow operates as an autonomous career copilot and search indexing platform.
          Review our policies regarding nominative fair use, public ATS aggregation, and our 24-hour employer takedown process.
        </p>
      </div>

      {/* Policy Pillars */}
      <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
        {/* Pillar 1: Nominative Fair Use */}
        <section className="bg-white rounded-xl border border-slate-200/90 p-6 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
            <Building2 className="h-5 w-5 text-[#00b074]" />
            <h2>1. Trademark &amp; Nominative Fair Use Notice</h2>
          </div>
          <p>
            All company names, logos, trade names, and trademarks referenced or displayed across HIREflow remain the exclusive intellectual property of their respective trademark holders.
          </p>
          <p>
            The use of company names and identifiers on HIREflow is conducted strictly under the principles of <strong>Nominative Fair Use</strong> (under 15 U.S.C. § 1115(b)(4) and equivalent EU/international jurisprudence). These names are utilized solely to accurately designate and identify the hiring organization offering the employment opportunity.
          </p>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#00b074] shrink-0 mt-0.5" />
            <span>
              <strong>No Implied Endorsement:</strong> The display of any company name, brand, or job posting does not imply affiliation with, sponsorship of, endorsement by, or contractual partnership between HIREflow and the hiring entity.
            </span>
          </div>
        </section>

        {/* Pillar 2: Public Job Aggregation */}
        <section className="bg-white rounded-xl border border-slate-200/90 p-6 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
            <FileText className="h-5 w-5 text-[#00b074]" />
            <h2>2. Public ATS Aggregation &amp; Factual Information</h2>
          </div>
          <p>
            Job vacancies, titles, salary brackets, tech stacks, and role descriptions indexed by HIREflow are sourced from publicly accessible career portals and Applicant Tracking System (ATS) endpoints (including Greenhouse, Lever, Ashby, and Arbeitnow).
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm text-slate-600">
            <li>
              <strong>Factual Non-Copyrightable Data:</strong> Under standard copyright law, raw job facts (titles, skills, compensation, and qualifications) are non-copyrightable factual data indexed for search and retrieval.
            </li>
            <li>
              <strong>Canonical Deep-Linking:</strong> All job cards maintain authoritative canonical links (`canonicalUrl` and `applicationUrl`) directing prospective applicants directly to the employer’s official application portal.
            </li>
            <li>
              <strong>No Paywalls or Application Fees:</strong> HIREflow never charges candidates to apply to jobs or intercepts candidate submissions intended for official employer channels.
            </li>
          </ul>
        </section>

        {/* Pillar 3: 24-Hour Employer Takedown Procedure */}
        <section className="bg-white rounded-xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <h2>3. 24-Hour Employer Takedown &amp; Delisting Policy</h2>
          </div>
          <p>
            If you are an authorized representative, recruiter, or legal counsel of a company listed on HIREflow, and you wish to update an expired role, correct details, or request that your listings be completely delisted from our engine:
          </p>
          
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#00b074]" />
              How to Submit a Removal Request
            </h3>
            <p className="text-xs text-slate-600">
              Send an email to our dedicated delisting inbox with the subject line <strong>&quot;Listing Delisting Request - [Company Name]&quot;</strong>:
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-800">
              <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-emerald-300">
                <Mail className="h-3.5 w-3.5 text-[#00b074]" />
                <a href="mailto:legal@hireflow.app" className="hover:underline">legal@hireflow.app</a>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-300">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <a href="mailto:afeefbinqbal@gmail.com" className="hover:underline">afeefbinqbal@gmail.com</a>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Please include the URL of the job posting on HIREflow and proof of authorization. All verified requests are executed promptly within <strong>24 business hours</strong>.
            </p>
          </div>
        </section>

        {/* Pillar 4: Candidate Privacy */}
        <section className="bg-white rounded-xl border border-slate-200/90 p-6 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
            <ShieldCheck className="h-5 w-5 text-[#00b074]" />
            <h2>4. Privacy &amp; Data Security</h2>
          </div>
          <p>
            HIREflow is a private intelligence dashboard operated under strict candidate-first data policies. Candidate resumes, tailoring copilot drafts, and interview intelligence notes are encrypted and never sold to third-party data brokers or recruitment agencies.
          </p>
        </section>
      </div>

      {/* Footer Return */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Last revised: September 2026 · HIREflow Autonomous Career Platform
        </p>
        <Link
          href="/"
          className="text-xs font-bold text-[#009a65] hover:underline"
        >
          Return to Cockpit →
        </Link>
      </div>
    </div>
  );
}
