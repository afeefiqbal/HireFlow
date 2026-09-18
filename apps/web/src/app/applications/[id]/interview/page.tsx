'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  InterviewRecord,
  InterviewRoundRecord,
  InterviewQuestionItem,
  InterviewPrepKitData,
  MockSessionRecord,
  MockQnAItem,
  InterviewDebriefRecord,
  ApplicationDetailRecord,
  STARAnswerItem,
  InterviewRoundType,
  InterviewRoundStatus,
  QuestionCategory,
  QuestionSource,
  EvidenceAttribution,
} from '@ai-job-agent/shared';
import { ClientDate } from '@/components/ClientDate';
import {
  Video,
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Play,
  RotateCcw,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Award,
  ExternalLink,
  ChevronRight,
  User,
  Copy,
  Check,
  Send,
  Trash2,
} from 'lucide-react';

export default function InterviewCockpitPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<ApplicationDetailRecord | null>(null);
  const [interview, setInterview] = useState<InterviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'ROUNDS' | 'PREP_KIT' | 'QUESTIONS' | 'STAR' | 'MOCK' | 'DEBRIEF'
  >('ROUNDS');

  // Round Creation State
  const [showAddRoundModal, setShowAddRoundModal] = useState(false);
  const [newRoundType, setNewRoundType] = useState<InterviewRoundType>('SCREENING_CALL');
  const [newRoundTitle, setNewRoundTitle] = useState('Screening Call');
  const [newScheduledAt, setNewScheduledAt] = useState('');
  const [newInterviewerName, setNewInterviewerName] = useState('');
  const [newInterviewerTitle, setNewInterviewerTitle] = useState('');
  const [newMeetingUrl, setNewMeetingUrl] = useState('');
  const [newRoundNotes, setNewRoundNotes] = useState('');
  const [savingRound, setSavingRound] = useState(false);

  // Prep Kit State
  const [generatingPrepKit, setGeneratingPrepKit] = useState(false);

  // Questions State
  const [questionSourceFilter, setQuestionSourceFilter] = useState<'ALL' | 'PREDICTED' | 'ACTUAL_INTERVIEW'>('ALL');
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState<QuestionCategory>('TECHNICAL');
  const [newQuestionNotes, setNewQuestionNotes] = useState('');

  // STAR Answer State
  const [selectedQuestionForSTAR, setSelectedQuestionForSTAR] = useState<string>('');
  const [targetProjectForSTAR, setTargetProjectForSTAR] = useState<string>('');
  const [generatingSTAR, setGeneratingSTAR] = useState(false);
  const [generatedSTAR, setGeneratedSTAR] = useState<STARAnswerItem | null>(null);
  const [copiedSTAR, setCopiedSTAR] = useState(false);

  // Mock Simulator State
  const [activeMockSession, setActiveMockSession] = useState<MockSessionRecord | null>(null);
  const [mockCandidateAnswer, setMockCandidateAnswer] = useState('');
  const [evaluatingMock, setEvaluatingMock] = useState(false);

  // Debrief State
  const [debriefWentWell, setDebriefWentWell] = useState('');
  const [debriefDifficult, setDebriefDifficult] = useState('');
  const [debriefQuestionsAsked, setDebriefQuestionsAsked] = useState('');
  const [debriefTopicsToStudy, setDebriefTopicsToStudy] = useState('');
  const [debriefNextSteps, setDebriefNextSteps] = useState('');
  const [debriefReflection, setDebriefReflection] = useState('');
  const [submittingDebrief, setSubmittingDebrief] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [appData, interviewData] = await Promise.all([
        api.getApplicationById(applicationId),
        api.getOrCreateInterviewForApplication(applicationId),
      ]);
      setApplication(appData);
      setInterview(interviewData);
      if (interviewData.mockSessions && interviewData.mockSessions.length > 0) {
        const active = interviewData.mockSessions.find((s: MockSessionRecord) => s.status === 'ACTIVE');
        if (active) setActiveMockSession(active);
      }
      setError(null);
    } catch (err: any) {
      console.error('Failed to load cockpit data:', err);
      setError(err.message || 'Failed to load interview cockpit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      loadData();
    }
  }, [applicationId]);

  // Handle Round Addition
  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview) return;
    try {
      setSavingRound(true);
      await api.createInterviewRound(interview.id, {
        roundType: newRoundType,
        title: newRoundTitle.trim() || newRoundType,
        sequence: (interview.rounds?.length || 0) + 1,
        scheduledAt: newScheduledAt ? new Date(newScheduledAt).toISOString() : undefined,
        interviewerName: newInterviewerName.trim() || undefined,
        interviewerTitle: newInterviewerTitle.trim() || undefined,
        meetingUrl: newMeetingUrl.trim() || undefined,
        notes: newRoundNotes.trim() || undefined,
      });
      setShowAddRoundModal(false);
      setNewScheduledAt('');
      setNewInterviewerName('');
      setNewInterviewerTitle('');
      setNewMeetingUrl('');
      setNewRoundNotes('');
      showToast('Interview round scheduled successfully');
      await loadData();
    } catch (err: any) {
      alert(`Failed to add round: ${err.message}`);
    } finally {
      setSavingRound(false);
    }
  };

  // Handle Prep Kit Generation
  const handleGeneratePrepKit = async () => {
    if (!interview) return;
    try {
      setGeneratingPrepKit(true);
      await api.generatePrepKit(interview.id, undefined, true);
      showToast('Prep kit synthesized with Ground Truth & V4 Tech revision');
      await loadData();
    } catch (err: any) {
      alert(`Failed to generate prep kit: ${err.message}`);
    } finally {
      setGeneratingPrepKit(false);
    }
  };

  // Handle Question Generation
  const handleGenerateQuestions = async () => {
    if (!interview) return;
    try {
      setGeneratingQuestions(true);
      await api.generatePredictedQuestions(interview.id);
      showToast('Predicted questions generated and categorized');
      await loadData();
    } catch (err: any) {
      alert(`Failed to generate questions: ${err.message}`);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // Handle Add Actual Question
  const handleAddActualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview || !newQuestionText.trim()) return;
    try {
      await api.addInterviewQuestion(interview.id, {
        questionText: newQuestionText.trim(),
        category: newQuestionCategory,
        source: 'ACTUAL_INTERVIEW',
        userNotes: newQuestionNotes.trim() || undefined,
        resultAttribution: 'USER_PROVIDED',
      });
      setShowAddQuestionModal(false);
      setNewQuestionText('');
      setNewQuestionNotes('');
      showToast('Actual interview question recorded in question bank');
      await loadData();
    } catch (err: any) {
      alert(`Failed to record question: ${err.message}`);
    }
  };

  // Handle STAR Answer Generation
  const handleGenerateSTAR = async () => {
    if (!selectedQuestionForSTAR.trim()) return;
    try {
      setGeneratingSTAR(true);
      const star = await api.generateSTARAnswer(
        selectedQuestionForSTAR.trim(),
        targetProjectForSTAR.trim() || undefined
      );
      setGeneratedSTAR(star);
      showToast('STAR answer generated with Ground Truth attribution');
    } catch (err: any) {
      alert(`Failed to generate STAR answer: ${err.message}`);
    } finally {
      setGeneratingSTAR(false);
    }
  };

  // Handle Copy STAR
  const handleCopySTAR = () => {
    if (!generatedSTAR) return;
    const text = `Question: ${generatedSTAR.question}\n\nSituation [${generatedSTAR.situation.attribution}]:\n${generatedSTAR.situation.text}\n\nTask [${generatedSTAR.task.attribution}]:\n${generatedSTAR.task.text}\n\nAction [${generatedSTAR.action.attribution}]:\n${generatedSTAR.action.text}\n\nResult [${generatedSTAR.result.attribution}]:\n${generatedSTAR.result.text}`;
    navigator.clipboard.writeText(text);
    setCopiedSTAR(true);
    setTimeout(() => setCopiedSTAR(false), 2000);
    showToast('STAR answer copied to clipboard');
  };

  // Handle Mock Session Start
  const handleStartMock = async (roundType: InterviewRoundType = 'TECHNICAL_ROUND', roundId?: string) => {
    if (!interview) return;
    try {
      const session = await api.startMockSession(interview.id, roundType, roundId);
      setActiveMockSession(session);
      setMockCandidateAnswer('');
      setActiveTab('MOCK');
      showToast('Mock session started. Formulate your answer below.');
    } catch (err: any) {
      alert(`Failed to start mock session: ${err.message}`);
    }
  };

  // Handle Mock Answer Submission
  const handleEvaluateMock = async (qIndex: number) => {
    if (!activeMockSession || !mockCandidateAnswer.trim()) return;
    try {
      setEvaluatingMock(true);
      const updated = await api.submitMockAnswer(
        activeMockSession.id,
        qIndex,
        mockCandidateAnswer.trim()
      );
      setActiveMockSession(updated);
      setMockCandidateAnswer('');
      showToast('Mock answer evaluated with Ground Truth compliance audit');
      await loadData();
    } catch (err: any) {
      alert(`Failed to evaluate answer: ${err.message}`);
    } finally {
      setEvaluatingMock(false);
    }
  };

  // Handle Debrief Submission
  const handleSubmitDebrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview) return;
    try {
      setSubmittingDebrief(true);
      const followUp = new Date();
      followUp.setDate(followUp.getDate() + 2); // 2 days follow up

      await api.submitInterviewDebrief(interview.id, {
        candidateReflection: debriefReflection.trim() || 'Interview completed and reviewed.',
        whatWentWell: debriefWentWell.trim() || undefined,
        whatWasDifficult: debriefDifficult.trim() || undefined,
        questionsAsked: debriefQuestionsAsked
          ? debriefQuestionsAsked.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        technicalTopics: [],
        behavioralTopics: [],
        topicsToStudy: debriefTopicsToStudy
          ? debriefTopicsToStudy.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        nextSteps: debriefNextSteps.trim() || undefined,
        followUpDate: followUp.toISOString(),
      });
      showToast('Post-round debrief saved. Follow-up reminder scheduled in 2 business days.');
      await loadData();
    } catch (err: any) {
      alert(`Failed to submit debrief: ${err.message}`);
    } finally {
      setSubmittingDebrief(false);
    }
  };

  if (loading && !interview) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium">Initializing Interview Intelligence Cockpit...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-6 text-center text-rose-300">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-400 mb-2" />
          <h3 className="text-base font-bold">Failed to load Interview Cockpit</h3>
          <p className="mt-1 text-sm">{error || 'Interview session could not be retrieved.'}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/interviews"
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Back to Command Center
            </Link>
            <button
              onClick={loadData}
              className="rounded-lg bg-rose-800 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const job = interview.application?.job;
  const prepKit = interview.prepKits?.[0];
  const questions = interview.questions || [];
  const latestDebrief = interview.debriefs?.[0];
  const filteredQuestions = questions.filter((q) => {
    if (questionSourceFilter === 'ALL') return true;
    return q.source === questionSourceFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <ShieldCheck className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/interviews"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-purple-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Interviews Command Center
          </Link>
          <span className="text-slate-600">/</span>
          <Link
            href={`/applications/${applicationId}`}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Application Detail
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">App Status:</span>
          <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-bold text-slate-300 uppercase">
            {application?.status || 'TRACKED'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-purple-400 font-semibold">Interview Status:</span>
          <span className="rounded bg-purple-950/60 border border-purple-800 px-2 py-0.5 font-bold text-purple-300 uppercase">
            {interview.status}
          </span>
        </div>
      </div>

      {/* Hero Opportunity Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 bg-purple-950/40 border border-purple-800/60 px-2 py-0.5 rounded">
                <Video className="h-3 w-3" /> V6 Interview Intelligence Cockpit
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                <ShieldCheck className="h-3 w-3" /> Ground Truth Bound
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {job?.title || 'Target Role'}
            </h1>
            <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-slate-200">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                {job?.company}
              </span>
              {job?.location && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    {job.location}
                  </span>
                </>
              )}
              <span>•</span>
              <span className="text-slate-400">
                {interview.rounds?.length || 0} Total Rounds Configured
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddRoundModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-600/20 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-600/30 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule Round
            </button>
            <button
              onClick={handleGeneratePrepKit}
              disabled={generatingPrepKit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors shadow-md"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generatingPrepKit ? 'Synthesizing...' : prepKit ? 'Regenerate Prep Kit' : 'Generate Prep Kit'}
            </button>
          </div>
        </div>
      </div>

      {/* Cockpit Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'ROUNDS', label: '1. Rounds & Schedule', icon: Calendar, badge: interview.rounds?.length },
          { id: 'PREP_KIT', label: '2. Prep Kit & V4 Tech', icon: BookOpen, badge: prepKit ? 'Ready' : undefined },
          { id: 'QUESTIONS', label: '3. Question Predictor', icon: HelpCircle, badge: questions.length },
          { id: 'STAR', label: '4. STAR Answers', icon: Award },
          { id: 'MOCK', label: '5. Mock Simulator', icon: Play },
          { id: 'DEBRIEF', label: '6. Post-Round Debrief', icon: MessageSquare, badge: latestDebrief ? 'Done' : undefined },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? 'bg-purple-800 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROUNDS & SCHEDULE */}
      {/* ========================================================================= */}
      {activeTab === 'ROUNDS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Interview Stage Sequence</h2>
              <p className="text-xs text-slate-400">
                Track sequential stages (Screening, Technical, System Design, Behavioral, Final) with interviewers and meeting links.
              </p>
            </div>
            <button
              onClick={() => setShowAddRoundModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 shadow"
            >
              <Plus className="h-3.5 w-3.5" /> Add Round
            </button>
          </div>

          {interview.rounds?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-[#0c1222] p-8 text-center">
              <Calendar className="mx-auto h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No interview rounds defined yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add your upcoming screening or technical round to begin customized question predictions and prep kits.
              </p>
              <button
                onClick={() => setShowAddRoundModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-500"
              >
                <Plus className="h-3.5 w-3.5" /> Add First Round
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interview.rounds.map((round) => (
                <div
                  key={round.id}
                  className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-purple-950 border border-purple-800 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                          Round {round.sequence}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            round.status === 'COMPLETED'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                              : round.status === 'SCHEDULED'
                              ? 'bg-purple-950/60 text-purple-300 border border-purple-800'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {round.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{round.title || round.roundType}</h3>
                    </div>

                    {round.meetingUrl && (
                      <a
                        href={round.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                      >
                        <span>Join Call</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
                      <span>
                        {round.scheduledAt ? (
                          <ClientDate date={round.scheduledAt} type="datetime" />
                        ) : (
                          <span className="text-slate-500 italic">Not scheduled yet</span>
                        )}
                      </span>
                    </div>

                    {(round.interviewerName || round.interviewerTitle) && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <User className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                        <span>
                          {round.interviewerName || 'Interviewer'}
                          {round.interviewerTitle ? ` (${round.interviewerTitle})` : ''}
                        </span>
                      </div>
                    )}

                    {round.notes && (
                      <p className="text-slate-400 mt-2 rounded bg-slate-900/60 p-2 text-[11px] border border-slate-800">
                        {round.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions on round */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleStartMock(round.roundType, round.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300"
                    >
                      <Play className="h-3 w-3" /> Drill This Round
                    </button>
                    {round.status !== 'COMPLETED' && (
                      <button
                        onClick={async () => {
                          try {
                            await api.updateInterviewRound(round.id, { status: 'COMPLETED' });
                            showToast(`Round ${round.sequence} marked completed`);
                            await loadData();
                          } catch (err: any) {
                            alert(err.message);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900/80"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PREP KIT & V4 TECH REVISION */}
      {/* ========================================================================= */}
      {activeTab === 'PREP_KIT' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Interview Prep Kit & Tech Revision</h2>
              <p className="text-xs text-slate-400">
                Company intelligence, architectural talking points, candidate match strengths, and targeted questions.
              </p>
            </div>
            <button
              onClick={handleGeneratePrepKit}
              disabled={generatingPrepKit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 shadow"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generatingPrepKit ? 'Synthesizing...' : prepKit ? 'Regenerate' : 'Generate Prep Kit'}
            </button>
          </div>

          {!prepKit ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-[#0c1222] p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No Prep Kit synthesized yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Generate an intelligent briefing document tailored to this job description and candidate Ground Truth.
              </p>
              <button
                onClick={handleGeneratePrepKit}
                disabled={generatingPrepKit}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {generatingPrepKit ? 'Synthesizing...' : 'Generate Prep Kit Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Company & Role Overview */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> {prepKit.companyBrief?.companyName} Strategic Context
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  {prepKit.companyBrief?.knownTechStack?.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-400">Known Tech Stack: </span>
                      <span className="text-teal-300">{prepKit.companyBrief.knownTechStack.join(', ')}</span>
                    </div>
                  )}
                  {prepKit.companyBrief?.engineeringSignals?.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-400">Engineering Signals: </span>
                      <span>{prepKit.companyBrief.engineeringSignals.join(' · ')}</span>
                    </div>
                  )}
                </div>
                {prepKit.roleBrief?.coreExpectations?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-xs font-semibold text-slate-400 block mb-1">Role Core Expectations:</span>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                      {prepKit.roleBrief.coreExpectations.map((exp: string, idx: number) => (
                        <li key={idx}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Technical Revision Topics */}
              {prepKit.techTopics?.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Technical Revision Areas & Core Concepts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {prepKit.techTopics.map((topic, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-800 bg-[#090d16] p-3 text-xs text-slate-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-300">{topic.technology}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              topic.status === 'DIRECT'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {topic.status}
                          </span>
                        </div>
                        <p className="text-slate-400">{topic.relevanceToRole}</p>
                        {topic.revisionTopics?.length > 0 && (
                          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                            Drill: {topic.revisionTopics.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Deep Dives */}
              {prepKit.projectDeepDives?.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Verified Project Deep Dives
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {prepKit.projectDeepDives.map((proj, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-800 bg-[#090d16] p-3 text-xs space-y-2"
                      >
                        <span className="font-bold text-white text-sm block">{proj.projectName}</span>
                        <div className="flex flex-wrap gap-1">
                          {proj.technologies?.map((t, ti) => (
                            <span key={ti} className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
                              {t}
                            </span>
                          ))}
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[11px]">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions to Ask Interviewer */}
              {prepKit.questionsToAsk?.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" /> Strategic Questions to Ask the Interviewer
                  </h3>
                  <div className="space-y-2">
                    {prepKit.questionsToAsk.map((q: string, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-800/80 bg-[#090d16] p-3 text-xs text-slate-200 flex items-start gap-2.5"
                      >
                        <span className="font-semibold text-blue-400">{idx + 1}.</span>
                        <span className="leading-relaxed">{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QUESTION PREDICTOR & BANK */}
      {/* ========================================================================= */}
      {activeTab === 'QUESTIONS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Interview Question Bank</h2>
              <p className="text-xs text-slate-400">
                Predict questions tailored to the JD or capture actual questions asked in live interviews.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                <Plus className="h-3.5 w-3.5" /> Add Actual Question
              </button>
              <button
                onClick={handleGenerateQuestions}
                disabled={generatingQuestions}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 shadow"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {generatingQuestions ? 'Predicting...' : 'Predict Questions'}
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-xs">
            <span className="text-slate-500">Source:</span>
            {[
              { id: 'ALL', label: 'All Questions' },
              { id: 'PREDICTED', label: 'AI Predicted' },
              { id: 'ACTUAL_INTERVIEW', label: 'Actual Interview' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setQuestionSourceFilter(f.id as any)}
                className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                  questionSourceFilter === f.id
                    ? 'bg-slate-800 text-purple-300 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-[#0c1222] p-8 text-center">
              <HelpCircle className="mx-auto h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No questions found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Generate predicted questions tailored to the job description and candidate background.
              </p>
              <button
                onClick={handleGenerateQuestions}
                disabled={generatingQuestions}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" /> Predict Questions Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 shadow space-y-3 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            q.source === 'ACTUAL_INTERVIEW'
                              ? 'bg-teal-950/60 text-teal-300 border border-teal-800'
                              : 'bg-purple-950/60 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {q.source === 'ACTUAL_INTERVIEW' ? 'ACTUAL INTERVIEW' : 'PREDICTED'}
                        </span>
                        <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-300 uppercase">
                          {q.category}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            q.resultAttribution === 'AI_VERIFIED'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {q.resultAttribution}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white leading-snug">{q.questionText}</h4>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedQuestionForSTAR(q.questionText);
                          setActiveTab('STAR');
                        }}
                        className="inline-flex items-center gap-1 rounded bg-purple-600/20 border border-purple-500/40 px-2.5 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-600/30"
                      >
                        <Award className="h-3 w-3" /> STAR Answer
                      </button>
                    </div>
                  </div>

                  {/* Talking points & Tips */}
                  {q.suggestedAnswer && (
                    <div className="rounded-lg bg-[#090d16] p-3 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                      <span className="font-semibold text-purple-400 text-[11px] block">
                        Suggested Talking Points:
                      </span>
                      <p className="text-slate-400 leading-relaxed">{q.suggestedAnswer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STAR ANSWER BUILDER */}
      {/* ========================================================================= */}
      {activeTab === 'STAR' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">STAR Answer Builder (Strict Ground Truth Attribution)</h2>
            <p className="text-xs text-slate-400">
              Formulate structured behavioral and technical answers rooted in verified candidate experience. AI will flag any unverified metric as <span className="text-amber-400 font-semibold">[USER INPUT REQUIRED]</span>.
            </p>
          </div>

          {/* Question Input / Selector */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 shadow space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Interview Question:
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Tell me about a time you solved a complex system architecture bottleneck..."
                value={selectedQuestionForSTAR}
                onChange={(e) => setSelectedQuestionForSTAR(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 bg-[#0b101c] px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none w-full"
              />
              <input
                type="text"
                placeholder="Project (e.g. DealCode, Artemyst)"
                value={targetProjectForSTAR}
                onChange={(e) => setTargetProjectForSTAR(e.target.value)}
                className="w-full sm:w-48 rounded-lg border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={handleGenerateSTAR}
                disabled={generatingSTAR || !selectedQuestionForSTAR.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 shadow"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {generatingSTAR ? 'Crafting STAR...' : 'Generate STAR'}
              </button>
            </div>
          </div>

          {/* Render STAR Answer */}
          {generatedSTAR && (
            <div className="rounded-xl border border-purple-900/60 bg-[#0f172a] p-5 shadow space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Synthesized STAR Framework</h3>
                </div>
                <button
                  onClick={handleCopySTAR}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  {copiedSTAR ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSTAR ? 'Copied' : 'Copy All'}</span>
                </button>
              </div>

              {/* S - Situation */}
              <div className="rounded-lg border border-slate-800 bg-[#090d16] p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    S — Situation
                  </span>
                  <span className="rounded bg-teal-950/60 border border-teal-800 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                    {generatedSTAR.situation.attribution}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{generatedSTAR.situation.text}</p>
              </div>

              {/* T - Task */}
              <div className="rounded-lg border border-slate-800 bg-[#090d16] p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    T — Task
                  </span>
                  <span className="rounded bg-teal-950/60 border border-teal-800 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                    {generatedSTAR.task.attribution}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{generatedSTAR.task.text}</p>
              </div>

              {/* A - Action */}
              <div className="rounded-lg border border-slate-800 bg-[#090d16] p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    A — Action
                  </span>
                  <span className="rounded bg-teal-950/60 border border-teal-800 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                    {generatedSTAR.action.attribution}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{generatedSTAR.action.text}</p>
              </div>

              {/* R - Result */}
              <div className="rounded-lg border border-slate-800 bg-[#090d16] p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    R — Result
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      generatedSTAR.result.attribution === 'USER_INPUT_REQUIRED'
                        ? 'bg-amber-950/60 border border-amber-800 text-amber-300'
                        : 'bg-teal-950/60 border border-teal-800 text-teal-300'
                    }`}
                  >
                    {generatedSTAR.result.attribution}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{generatedSTAR.result.text}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MOCK INTERVIEW SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'MOCK' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Mock Interview Simulator & Compliance Auditor</h2>
            <p className="text-xs text-slate-400">
              Drill real interview questions. AI evaluates answers for clarity, technical depth, and flags any unverified technologies or metrics.
            </p>
          </div>

          {!activeMockSession ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-[#0c1222] p-8 text-center">
              <Play className="mx-auto h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No active mock simulation</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Pick a round type to start a structured multi-question mock interview session.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => handleStartMock('TECHNICAL_ROUND')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                >
                  <Play className="h-3.5 w-3.5" /> Start Technical Mock
                </button>
                <button
                  onClick={() => handleStartMock('SYSTEM_DESIGN')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-500"
                >
                  <Play className="h-3.5 w-3.5" /> Start System Design Mock
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Live Simulation ({activeMockSession.roundType})
                  </span>
                </div>
                <button
                  onClick={() => setActiveMockSession(null)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  End Session
                </button>
              </div>

              {/* Render Q&A pairs */}
              <div className="space-y-4">
                {activeMockSession.qna?.map((qItem: MockQnAItem, qIdx: number) => (
                  <div key={qIdx} className="rounded-lg bg-[#090d16] p-4 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-purple-400">
                        Question {qIdx + 1}: {qItem.question}
                      </span>
                    </div>

                    {qItem.answer ? (
                      <div className="space-y-2 text-xs">
                        <div className="rounded bg-slate-900 p-2.5 text-slate-300 border border-slate-800">
                          <span className="font-semibold text-slate-400 block mb-1">Your Answer:</span>
                          <p>{qItem.answer}</p>
                        </div>

                        {qItem.feedback && (
                          <div className="rounded bg-purple-950/30 border border-purple-800/50 p-3 space-y-1.5">
                            <span className="font-bold text-purple-300 block">AI Evaluation Feedback:</span>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                              <div>Accuracy: <span className="text-slate-200">{qItem.feedback.technicalAccuracy}</span></div>
                              <div>Clarity: <span className="text-slate-200">{qItem.feedback.clarity}</span></div>
                            </div>
                            {qItem.feedback.unverifiedClaims && qItem.feedback.unverifiedClaims.length > 0 && (
                              <div className="text-amber-300 text-[11px] pt-1 border-t border-purple-900/60">
                                ⚠️ Unverified Claims: {qItem.feedback.unverifiedClaims.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          rows={4}
                          placeholder="Type your structured answer (STAR approach recommended)..."
                          value={mockCandidateAnswer}
                          onChange={(e) => setMockCandidateAnswer(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-[#0b101c] p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleEvaluateMock(qIdx)}
                          disabled={evaluatingMock || !mockCandidateAnswer.trim()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {evaluatingMock ? 'Evaluating Answer...' : 'Submit Answer'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: POST-ROUND DEBRIEF */}
      {/* ========================================================================= */}
      {activeTab === 'DEBRIEF' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Post-Round Interview Debrief</h2>
            <p className="text-xs text-slate-400">
              Record interview insights, performance reflections, and automatically set follow-up reminders.
            </p>
          </div>

          <form
            onSubmit={handleSubmitDebrief}
            className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow space-y-4"
          >
            {/* Candidate Reflection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Executive Reflection / Overview:
              </label>
              <textarea
                rows={2}
                placeholder="Overall feeling, mutual excitement, team dynamics..."
                value={debriefReflection}
                onChange={(e) => setDebriefReflection(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0b101c] p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* What Went Well */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                What went well?
              </label>
              <textarea
                rows={2}
                placeholder="Specific technical topics, confident explanations, rapport with the team..."
                value={debriefWentWell}
                onChange={(e) => setDebriefWentWell(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0b101c] p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Difficulties */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                What was difficult or unexpected?
              </label>
              <textarea
                rows={2}
                placeholder="Tough questions, system design scale assumptions, live coding hiccups..."
                value={debriefDifficult}
                onChange={(e) => setDebriefDifficult(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0b101c] p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Questions Asked */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Questions asked by the interviewer (one per line):
              </label>
              <textarea
                rows={3}
                placeholder="How do you structure database migrations?&#10;How does your team handle code review SLAs?"
                value={debriefQuestionsAsked}
                onChange={(e) => setDebriefQuestionsAsked(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0b101c] p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Topics to Study */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Topics to study before next round (one per line):
              </label>
              <textarea
                rows={2}
                placeholder="PostgreSQL indexing strategies&#10;Distributed caching patterns"
                value={debriefTopicsToStudy}
                onChange={(e) => setDebriefTopicsToStudy(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0b101c] p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Next Steps */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Next steps discussed:
              </label>
              <input
                type="text"
                placeholder="e.g. Recruiter to reach out in 2 business days regarding final round..."
                value={debriefNextSteps}
                onChange={(e) => setDebriefNextSteps(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-[11px] text-slate-500">
                Saving debrief will automatically schedule a suggested follow-up in 2 business days.
              </span>
              <button
                type="submit"
                disabled={submittingDebrief}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 shadow"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {submittingDebrief ? 'Saving...' : 'Save Debrief'}
              </button>
            </div>
          </form>

          {/* Render Existing Debrief */}
          {latestDebrief && (
            <div className="rounded-xl border border-purple-900/60 bg-[#090d16] p-5 shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Recorded Debrief
                </span>
                <span className="text-xs text-slate-400">
                  Recorded on: <ClientDate date={latestDebrief.createdAt} />
                </span>
              </div>
              {latestDebrief.whatWentWell && (
                <div className="text-xs text-slate-300">
                  <span className="text-slate-400 font-semibold block mb-0.5">What went well:</span>
                  <p>{latestDebrief.whatWentWell}</p>
                </div>
              )}
              {latestDebrief.whatWasDifficult && (
                <div className="text-xs text-slate-300">
                  <span className="text-slate-400 font-semibold block mb-0.5">Challenges:</span>
                  <p>{latestDebrief.whatWasDifficult}</p>
                </div>
              )}
              {latestDebrief.followUpDate && (
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs text-teal-300">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Suggested follow-up date:</span>
                  <span className="font-bold">
                    <ClientDate date={latestDebrief.followUpDate} />
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD INTERVIEW ROUND */}
      {/* ========================================================================= */}
      {showAddRoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              Schedule Interview Round
            </h3>

            <form onSubmit={handleAddRound} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Round Type:
                </label>
                <select
                  value={newRoundType}
                  onChange={(e) => {
                    const rt = e.target.value as InterviewRoundType;
                    setNewRoundType(rt);
                    setNewRoundTitle(rt.replace(/_/g, ' '));
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                >
                  <option value="SCREENING_CALL">Screening Call (Recruiter / HR)</option>
                  <option value="TECHNICAL_SCREEN">Technical Screen (Phone / Quiz)</option>
                  <option value="TECHNICAL_ROUND">Technical Round (Coding / Frameworks)</option>
                  <option value="SYSTEM_DESIGN">System Design & Architecture</option>
                  <option value="BEHAVIORAL_CULTURE">Behavioral & Cultural Fit</option>
                  <option value="EXECUTIVE_FINAL">Executive Final Round</option>
                  <option value="CUSTOM">Custom Round</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Round Title:
                </label>
                <input
                  type="text"
                  value={newRoundTitle}
                  onChange={(e) => setNewRoundTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Scheduled Date & Time:
                </label>
                <input
                  type="datetime-local"
                  value={newScheduledAt}
                  onChange={(e) => setNewScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Interviewer Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    value={newInterviewerName}
                    onChange={(e) => setNewInterviewerName(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Interviewer Title:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VP Engineering"
                    value={newInterviewerTitle}
                    onChange={(e) => setNewInterviewerTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Meeting URL:
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={newMeetingUrl}
                  onChange={(e) => setNewMeetingUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notes / Focus:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on Laravel queue workers and database replication..."
                  value={newRoundNotes}
                  onChange={(e) => setNewRoundNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRoundModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRound}
                  className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  {savingRound ? 'Saving...' : 'Save Round'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD ACTUAL INTERVIEW QUESTION */}
      {/* ========================================================================= */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-teal-400" />
              Record Actual Question Asked
            </h3>

            <form onSubmit={handleAddActualQuestion} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Question:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. How do you handle database migrations with zero downtime in production?"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#0b101c] p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Category:
                </label>
                <select
                  value={newQuestionCategory}
                  onChange={(e) => setNewQuestionCategory(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
                >
                  <option value="TECHNICAL">TECHNICAL</option>
                  <option value="BEHAVIORAL">BEHAVIORAL</option>
                  <option value="SYSTEM_DESIGN">SYSTEM DESIGN</option>
                  <option value="PROJECT_DEEP_DIVE">PROJECT DEEP DIVE</option>
                  <option value="ROLE_SPECIFIC">ROLE SPECIFIC</option>
                  <option value="COMPANY_SPECIFIC">COMPANY SPECIFIC</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notes / Context (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asked during round 2 by senior architect..."
                  value={newQuestionNotes}
                  onChange={(e) => setNewQuestionNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-500"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
