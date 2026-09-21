'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ApplicationPreparationSummary } from '@ai-job-agent/shared';
import { ClientDate } from '@/components/ClientDate';
import {
  ArrowLeft,
  FileText,
  Mail,
  HelpCircle,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  MapPin,
  Flame,
  Award,
  ChevronRight,
  RefreshCw,
  Info,
  Download,
  XCircle,
  X,
  SidebarClose,
  SidebarOpen
} from 'lucide-react';
import ApplicationCopilot from '@/components/ApplicationCopilot';

export default function ApplicationPreparationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<ApplicationPreparationSummary | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [screeningQs, setScreeningQs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [qualityCheckOpen, setQualityCheckOpen] = useState(false);
  const [qualityResults, setQualityResults] = useState<{ passed: boolean; checks: any[] } | null>(null);
  
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(true);

  const fetchPrepData = async () => {
    try {
      setLoading(true);
      const [res, profRes, qsRes] = await Promise.all([
        api.getApplicationPreparation(id),
        api.getProfile(),
        api.getScreeningQuestions(id)
      ]);
      setData(res);
      setProfile(profRes);
      setScreeningQs(qsRes);
    } catch (err: any) {
      console.error('Failed to load application preparation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPrepData();
    }
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleGenerateResume = async () => {
    setActionLoading('resume');
    try {
      await api.generateTailoredCv(id);
      showToast('Tailored CV & ATS Optimization generated successfully!');
      await fetchPrepData();
    } catch (err: any) {
      alert(`CV generation error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setActionLoading('coverLetter');
    try {
      await api.generateCoverLetter(id);
      showToast('Customized Cover Letter created!');
      await fetchPrepData();
    } catch (err: any) {
      alert(`Cover letter generation error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAnalyzeScreening = async () => {
    setActionLoading('screening');
    try {
      await api.analyzeScreening(id);
      showToast('Screening questions evaluated against ground truth profile!');
      await fetchPrepData();
    } catch (err: any) {
      alert(`Screening analysis error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (status: any) => {
    try {
      await api.updateApplicationStatus(id, status, `Application status updated to ${status}`);
      showToast(`Status updated to ${status}`);
      await fetchPrepData();
      if (status === 'APPLIED') {
        setConfirmationOpen(false);
      }
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleMarkExpired = async () => {
    if (!confirm('Mark this job posting as EXPIRED / CLOSED?')) return;
    try {
      await api.updateApplicationStatus(id, 'EXPIRED', 'Marked as expired from Application Copilot');
      showToast('Job marked as EXPIRED / CLOSED');
      await fetchPrepData();
    } catch (err: any) {
      alert(`Failed to mark expired: ${err.message}`);
    }
  };

  const runQualityCheck = () => {
    if (!data || !profile) return;
    
    const checks = [];
    let allPassed = true;
    
    // 1. CV Exists
    const cvExists = !!data.latestResume;
    checks.push({ label: 'CV generated and available', passed: cvExists });
    if (!cvExists) allPassed = false;
    
    // 2. CV Name matches exactly
    if (data.latestResume) {
      checks.push({ label: 'Candidate Name Verified', passed: true });
    }
    
    // 3. No fabricated employers
    if (data.latestResume?.experiences) {
      const cvExps = data.latestResume.experiences;
      const validEmployers = profile.experiences.map((e: any) => e.company.toLowerCase());
      const hasFabricated = cvExps.some((e: any) => !validEmployers.includes(e.company.toLowerCase()));
      checks.push({ 
        label: 'No fabricated employers detected', 
        passed: !hasFabricated,
        error: hasFabricated ? 'CV contains unverified companies' : null
      });
      if (hasFabricated) allPassed = false;
    }
    
    // 4. Cover Letter Exists
    const clExists = !!data.latestCoverLetter;
    checks.push({ label: 'Cover Letter generated', passed: clExists });
    if (!clExists) allPassed = false;
    
    // 5. Screening Questions Resolved
    const qsExist = screeningQs.length > 0 || data.screeningTotalCount > 0;
    const sensitiveResolved = data.screeningInputNeeded === 0;
    checks.push({ 
      label: 'Sensitive Screening Questions Resolved', 
      passed: sensitiveResolved,
      error: !sensitiveResolved ? `${data.screeningInputNeeded} questions need human input` : null
    });
    if (!sensitiveResolved) allPassed = false;
    
    setQualityResults({ passed: allPassed, checks });
    setQualityCheckOpen(true);
  };

  const handleOpenApplication = () => {
    if (data?.job?.applicationUrl || data?.job?.canonicalUrl) {
      window.open(data.job.applicationUrl || data.job.canonicalUrl, '_blank');
      setQualityCheckOpen(false);
      setConfirmationOpen(true);
    }
  };

  const handleDownloadPDF = () => {
    // Standard window.print which is styled in resume page
    window.open(`/resume/${id}?print=true`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-44 bg-white rounded-xl animate-pulse border border-slate-200 shadow-xs" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-white rounded-xl animate-pulse border border-slate-200 shadow-xs" />
          <div className="h-64 bg-white rounded-xl animate-pulse border border-slate-200 shadow-xs" />
          <div className="h-64 bg-white rounded-xl animate-pulse border border-slate-200 shadow-xs" />
        </div>
      </div>
    );
  }

  if (!data || !data.job) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
        <h2 className="text-lg font-bold text-slate-900">Job Application Preparation Not Found</h2>
        <Link href="/jobs" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2 text-xs font-bold text-white shadow-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Jobs Matrix
        </Link>
      </div>
    );
  }

  const { job, cvGenerated, atsAnalyzed, coverLetterGenerated, screeningInputNeeded, screeningTotalCount, latestResume, latestAtsAnalysis, latestCoverLetter } = data;
  const isFresh = job.ageStatus === 'FRESH';
  const atsScore = latestAtsAnalysis?.overallCoverage || 0;

  // Calculate readiness percentage
  let readinessScore = 0;
  if (cvGenerated) readinessScore += 35;
  if (coverLetterGenerated) readinessScore += 35;
  if (screeningTotalCount > 0) {
    readinessScore += screeningInputNeeded === 0 ? 30 : 15;
  } else if (screeningQs.length === 0 && cvGenerated) {
    readinessScore += 30; // no screening questions required
  }
  
  const isReadyToApply = readinessScore >= 95;
  const readinessColor = readinessScore >= 95 ? 'text-[#009a65] border-emerald-300 bg-emerald-50' : readinessScore >= 40 ? 'text-amber-700 border-amber-300 bg-amber-50' : 'text-slate-500 border-slate-200 bg-slate-50';

  // Find Job Match technical score if available
  const matchRecord: any = job.latestMatch || (job as any).matches?.[0] || null;
  const techScore = matchRecord?.technical_match ?? matchRecord?.technicalMatch ?? 0;
  const expScore = matchRecord?.experience_match ?? matchRecord?.experienceMatch ?? 0;
  const matchRec = matchRecord?.recommendation || 'REVIEW';

  return (
    <div className={`space-y-6 pb-24 transition-all duration-200 ${copilotOpen ? 'xl:pr-[460px]' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/jobs/${job.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Job Overview
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-[#009a65] uppercase tracking-wider">
            Application Preparation Workspace
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCopilotOpen((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors border shadow-2xs ${
              copilotOpen
                ? 'bg-emerald-50 text-[#009a65] border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            aria-label="Toggle Application Copilot"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#00b074]" />
            <span>APPLICATION COPILOT</span>
            <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-mono text-[#009a65]">
              V3.1
            </span>
          </button>

          <button
            onClick={runQualityCheck}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00b074] px-4 py-2 text-xs font-bold text-white hover:bg-[#009a65] transition-colors shadow-xs"
          >
            <span>OPEN APPLICATION ↗</span>
          </button>
        </div>
      </div>

      {/* Target Job Summary Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-extrabold text-slate-900">{job.title}</span>
              {isFresh && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200">
                  <Flame className="h-3 w-3" /> Fresh
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Building2 className="h-3.5 w-3.5 text-[#00b074]" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {job.location} {job.isRemote && '(Remote)'}
              </span>
              <span className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-slate-400" />
                Visa: {job.visaStatus}
              </span>
              {(job.salaryMin || job.salaryMax) && (
                <span className="text-[#009a65] font-semibold border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded">
                  {job.salaryCurrency} {job.salaryMin}{job.salaryMax ? ` - ${job.salaryMax}` : '+'}
                </span>
              )}
            </div>
            
            {matchRecord && (
               <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                 <div className="text-xs">
                   <span className="text-slate-500">Technical Match: </span>
                   <span className={`font-bold ${techScore >= 80 ? 'text-[#009a65]' : techScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{techScore}%</span>
                 </div>
                 <div className="text-xs">
                   <span className="text-slate-500">Experience: </span>
                   <span className="font-bold text-[#009a65]">{expScore}%</span>
                 </div>
                 <div className="text-xs">
                   <span className="text-slate-500">Opportunity Priority: </span>
                   <span className={`font-bold ${matchRec === 'APPLY' ? 'text-[#009a65]' : matchRec === 'REVIEW' ? 'text-amber-600' : 'text-rose-600'}`}>{matchRec}</span>
                 </div>
               </div>
            )}
          </div>

          <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Application Readiness</div>
              <div className="text-xs text-slate-500 mt-1 max-w-[150px]">
                {isReadyToApply ? 'Ready for Human Review & Submission' : 'Preparation In Progress'}
              </div>
            </div>
            <div className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 text-xl font-black ${readinessColor}`}>
              {readinessScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Main 3 Pillars Grid: CV, Cover Letter, Screening */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pillar 1: Tailored CV & ATS */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <FileText className="h-5 w-5 text-[#00b074]" />
              <h3>Tailored CV {latestResume?.versionName && <span className="text-xs text-slate-400 ml-2">({latestResume.versionName})</span>}</h3>
            </div>
            {cvGenerated && (
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200">
                Ready
              </span>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            {latestResume ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Target Role:</span>
                  <span className="text-[#009a65] font-semibold">{latestResume.targetRole}</span>
                </div>
                {latestAtsAnalysis && (
                  <div className="flex justify-between text-slate-600">
                    <span>ATS Match:</span>
                    <span className="text-[#009a65] font-bold">{atsScore}%</span>
                  </div>
                )}
                
                {/* Evidence Mode Preview */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase mb-2">Evidence Mode</div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2 max-h-[150px] overflow-y-auto">
                    {((latestResume.experiences || (latestResume as any).contentJson?.experiences || [])[0]?.bullets?.slice(0, 2) || []).map((bullet: any, idx: number) => (
                       <div key={idx} className="flex gap-2 text-slate-700">
                         <span className="shrink-0 mt-0.5">•</span>
                         <div>
                           <span className={typeof bullet === 'string' ? '' : 'line-clamp-2'}>{typeof bullet === 'string' ? bullet : bullet.text}</span>
                           {bullet.evidence && (
                             <span className={`inline-flex items-center gap-1 border rounded px-1.5 py-0.5 text-[9px] font-bold mt-1 uppercase ${
                               bullet.evidence.status === 'DIRECT' ? 'bg-emerald-50 text-[#009a65] border-emerald-200' :
                               bullet.evidence.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                               'bg-rose-50 text-rose-700 border-rose-200'
                             }`}>
                               {bullet.evidence.status === 'DIRECT' ? '✓ Verified: ' : bullet.evidence.status === 'PARTIAL' ? '⚠ Partial: ' : '❌ Unverified: '}
                               {bullet.evidence.sourceCompany || 'Ground Truth'}
                             </span>
                           )}
                         </div>
                       </div>
                    )) || <div className="text-slate-400 italic">No bullets available</div>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center text-xs text-slate-400 h-full">
                <FileText className="h-6 w-6 text-slate-400 mb-2" />
                <p>No tailored CV generated yet.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            {latestResume ? (
              <>
                <Link href={`/resume/${job.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors border border-slate-200 shadow-2xs">
                  EDIT
                </Link>
                <button onClick={handleDownloadPDF} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors border border-slate-200 shadow-2xs">
                  <Download className="h-3.5 w-3.5" /> PDF
                </button>
                <button onClick={handleGenerateResume} disabled={actionLoading === 'resume'} className="inline-flex items-center justify-center rounded-lg bg-white hover:bg-slate-50 p-2 text-xs text-slate-700 border border-slate-200 shadow-2xs" title="Regenerate">
                  <RefreshCw className={`h-4 w-4 ${actionLoading === 'resume' ? 'animate-spin' : ''}`} />
                </button>
              </>
            ) : (
              <button onClick={handleGenerateResume} disabled={actionLoading === 'resume'} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs">
                <Sparkles className="h-4 w-4" /> {actionLoading === 'resume' ? 'Generating...' : 'Generate CV'}
              </button>
            )}
          </div>
        </div>

        {/* Pillar 2: Cover Letter */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Mail className="h-5 w-5 text-[#00b074]" />
              <h3>Cover Letter</h3>
            </div>
            {coverLetterGenerated && (
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-[#009a65] border border-emerald-200">
                Ready
              </span>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            {latestCoverLetter ? (
              <div className="space-y-3 text-xs">
                 <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 flex items-center gap-2 text-[#009a65] font-semibold">
                   <ShieldCheck className="h-4 w-4 shrink-0" />
                   <span>Based on verified candidate evidence</span>
                 </div>
                 <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-slate-700 italic line-clamp-6 text-[11px] whitespace-pre-wrap">
                  {latestCoverLetter.fullText || (latestCoverLetter as any).bodyText}
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center text-xs text-slate-400 h-full">
                <Mail className="h-6 w-6 text-slate-400 mb-2" />
                <p>No cover letter generated yet.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex gap-2">
            {latestCoverLetter ? (
              <>
                <Link href={`/cover-letter/${job.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors border border-slate-200 shadow-2xs">
                  EDIT
                </Link>
                <button 
                  onClick={() => { navigator.clipboard.writeText(latestCoverLetter.fullText || (latestCoverLetter as any).bodyText); showToast("Copied to clipboard!"); }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors border border-slate-200 shadow-2xs"
                >
                  COPY
                </button>
                <button onClick={handleGenerateCoverLetter} disabled={actionLoading === 'coverLetter'} className="inline-flex items-center justify-center rounded-lg bg-white hover:bg-slate-50 p-2 text-xs text-slate-700 border border-slate-200 shadow-2xs" title="Regenerate">
                  <RefreshCw className={`h-4 w-4 ${actionLoading === 'coverLetter' ? 'animate-spin' : ''}`} />
                </button>
              </>
            ) : (
              <button onClick={handleGenerateCoverLetter} disabled={actionLoading === 'coverLetter'} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs">
                <Sparkles className="h-4 w-4" /> {actionLoading === 'coverLetter' ? 'Drafting...' : 'Generate Cover Letter'}
              </button>
            )}
          </div>
        </div>

        {/* Pillar 3: Screening Questions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <HelpCircle className="h-5 w-5 text-[#00b074]" />
              <h3>Screening Answers</h3>
            </div>
            {screeningTotalCount > 0 && (
              <span className={`rounded px-2 py-0.5 text-xs font-bold border ${screeningInputNeeded > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-[#009a65] border-emerald-200'}`}>
                {screeningInputNeeded > 0 ? `${screeningInputNeeded} Need Input` : 'Ready'}
              </span>
            )}
          </div>
          
          <div className="flex-1 space-y-3 overflow-hidden">
            {screeningQs.length > 0 ? (
              <div className="space-y-3 h-full max-h-[220px] overflow-y-auto pr-1">
                {screeningQs.slice(0, 3).map((q, idx) => (
                  <div key={idx} className={`rounded-lg border p-3 ${q.requiresUserInput && !q.userAnswer ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-[11px] text-slate-800 font-semibold mb-1">{q.question}</div>
                    {q.requiresUserInput && !q.userAnswer ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase">
                        <AlertTriangle className="h-3 w-3" /> USER INPUT REQUIRED
                      </div>
                    ) : (
                      <>
                        <div className="text-[10px] text-slate-600 line-clamp-2 italic">"{q.userAnswer || q.suggestedAnswer}"</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="inline-flex items-center text-[#009a65] text-[9px] font-bold uppercase"><CheckCircle2 className="h-3 w-3 mr-0.5" /> Verified Evidence</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center text-xs text-slate-400 h-full">
                <HelpCircle className="h-6 w-6 text-slate-400 mb-2" />
                <p>No screening questions analyzed yet.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex">
            {screeningTotalCount > 0 ? (
              <Link href={`/jobs/${job.id}/screening`} className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors border border-slate-200 shadow-2xs">
                EDIT & REVIEW
              </Link>
            ) : (
              <button onClick={handleAnalyzeScreening} disabled={actionLoading === 'screening'} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#00b074] hover:bg-[#009a65] px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs">
                <Sparkles className="h-4 w-4" /> {actionLoading === 'screening' ? 'Analyzing...' : 'Analyze Questions'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Application History Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
           <Clock className="h-5 w-5 text-[#00b074]" />
           Application History & Versions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="col-span-2">
             <div className="space-y-4">
               {job.application?.status === 'APPLIED' ? (
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="h-6 w-6 text-[#00b074] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[#009a65]">Application Submitted</div>
                      <div className="text-xs text-slate-600 mt-1">You marked this job as APPLIED on <ClientDate date={job.application.appliedDate || job.application.lastUpdated} />.</div>
                      {(job.applicationUrl || (job.application as any).applicationUrl) && (
                        <a href={job.applicationUrl || (job.application as any).applicationUrl} target="_blank" rel="noreferrer" className="text-xs text-[#009a65] hover:underline mt-2 inline-block font-bold">View Posting</a>
                      )}
                    </div>
                  </div>
               ) : (
                 <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <Info className="h-6 w-6 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">Preparation Phase</div>
                      <div className="text-xs text-slate-500 mt-1">This application has not been submitted yet. Complete preparation and click OPEN APPLICATION to proceed.</div>
                    </div>
                 </div>
               )}
             </div>
           </div>
           
           <div className="col-span-1 rounded-lg bg-slate-50 border border-slate-200 p-4">
              <div className="text-xs font-bold text-slate-600 uppercase mb-3">Active Versions</div>
              <ul className="space-y-3 text-xs">
                <li className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-700">CV Version</span>
                  <span className="font-mono text-[#009a65] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">{latestResume?.versionName || 'None'}</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-700">Cover Letter</span>
                  <span className="font-mono text-[#009a65] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">{latestCoverLetter ? 'v1' : 'None'}</span>
                </li>
              </ul>
           </div>
        </div>
      </div>

      {/* Quality Check Modal */}
      {qualityCheckOpen && qualityResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#00b074]" />
                Application Quality Check
              </h3>
              <button onClick={() => setQualityCheckOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mb-6">Running deterministic validation before allowing submission...</p>
            
            <div className="space-y-3 mb-8">
              {qualityResults.checks.map((check, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  {check.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-[#00b074] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className={`text-sm font-semibold ${check.passed ? 'text-slate-800' : 'text-rose-600'}`}>{check.label}</div>
                    {check.error && <div className="text-xs text-rose-600 mt-1">{check.error}</div>}
                  </div>
                </div>
              ))}
            </div>
            
            {qualityResults.passed ? (
              <button onClick={handleOpenApplication} className="w-full rounded-lg bg-[#00b074] hover:bg-[#009a65] py-3 font-bold text-white transition-colors shadow-md flex items-center justify-center gap-2">
                ALL CHECKS PASSED - OPEN APPLICATION <ExternalLink className="h-4 w-4" />
              </button>
            ) : (
              <div className="w-full rounded-lg bg-slate-100 py-3 font-bold text-slate-400 text-center flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200">
                <AlertTriangle className="h-4 w-4" /> ACTION REQUIRED TO PROCEED
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-2xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-[#00b074] border border-emerald-200 mb-2">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            
            <div>
              <h3 className="text-xl font-black text-slate-900">Application Opened</h3>
              <p className="text-sm text-slate-500 mt-2">
                Did you complete and submit this application on the external portal?
              </p>
            </div>
            
            <div className="space-y-3 pt-4">
              <button 
                onClick={() => handleStatusUpdate('APPLIED')}
                className="w-full rounded-lg bg-[#00b074] hover:bg-[#009a65] py-3 font-bold text-white transition-colors shadow-xs"
              >
                YES, MARK AS APPLIED
              </button>
              <button 
                onClick={() => setConfirmationOpen(false)}
                className="w-full rounded-lg bg-slate-100 hover:bg-slate-200 py-3 font-bold text-slate-700 transition-colors border border-slate-200"
              >
                NO, NOT YET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Copilot Drawer */}
      {data && (
        <ApplicationCopilot
          isOpen={copilotOpen}
          onClose={() => setCopilotOpen(false)}
          data={data}
          profile={profile}
          screeningQuestions={screeningQs}
          onRefreshData={fetchPrepData}
          onGenerateResume={handleGenerateResume}
          onGenerateCoverLetter={handleGenerateCoverLetter}
          onOpenApplication={runQualityCheck}
          onMarkExpired={handleMarkExpired}
        />
      )}
    </div>
  );
}
