import {
  DashboardStats,
  Job,
  AIMatchResult,
  CandidateProfile,
  ApplicationRecord,
  ApplicationStatus,
  JobFilterParams,
  ScreeningQuestionItem,
  ApplicationDetailRecord,
  ApplicationAnalytics,
  ApplicationTimelineItem,
  InterviewRecord,
  InterviewRoundRecord,
  InterviewQuestionItem,
  InterviewPrepKitData,
  STARAnswerItem,
  MockSessionRecord,
  InterviewDebriefRecord,
  InterviewStatsSummary,
  ParsedResumePreview,
  AutoApplyConfig,
  QualifiedOpportunity,
  AutoApplyEligibilityResult,
  SubmissionReceipt,
  SandboxTestResult,
} from '@ai-job-agent/shared';

const API_BASE = (() => {
  const env = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, ""); // strip trailing slash
  // If no env var, fall back to relative /api (works when frontend and backend share origin)
  if (!env) return '/api';
  // If the env value already ends with /api, use it as-is
  if (/\/api$/i.test(env)) return env;
  // If it already looks like a full URL (but no /api suffix), append /api
  if (/^https?:\/\//i.test(env)) return `${env}/api`;
  // Otherwise treat it as a host and prepend https://
  return `https://${env}/api`;
})();

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`API returned non‑JSON for [${endpoint}]: ${text.slice(0, 200)}`);
  }

  if (!res.ok || !data.success) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data.data as T;
}

export const api = {
  async getDashboard(): Promise<{ stats: DashboardStats; strongestMatches: any[] }> {
    return fetchJson('/dashboard/stats');
  },

  async getJobs(params?: JobFilterParams): Promise<{ jobs: Job[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.freshOnly !== undefined) query.append('freshOnly', String(params.freshOnly));
    if (params?.roles?.length) query.append('role', params.roles[0]);
    if (params?.roleFamily && params.roleFamily !== 'ALL') query.append('roleFamily', params.roleFamily);
    if (params?.seniority && params.seniority !== 'ALL') query.append('seniority', params.seniority);
    if (params?.remoteType && params.remoteType !== 'ALL') query.append('remoteType', params.remoteType);
    if (params?.freshnessStatus && params.freshnessStatus !== 'ALL') query.append('freshnessStatus', params.freshnessStatus);
    if (params?.technologies?.length) query.append('technology', params.technologies[0]);
    if (params?.locations?.length) query.append('location', params.locations[0]);
    if (params?.remoteOnly) query.append('remoteOnly', 'true');
    if (params?.minMatchScore) query.append('minMatchScore', String(params.minMatchScore));
    if (params?.visaSponsorship && params.visaSponsorship !== 'ALL' as any) {
      query.append('visaStatus', params.visaSponsorship);
    }
    if (params?.source) query.append('source', params.source);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/jobs${qs}`);
    const json = await res.json();
    const jobsList = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json.data?.jobs)
      ? json.data.jobs
      : [];
    return {
      jobs: jobsList,
      meta: json.meta || json.data?.meta || {},
    };
  },

  async getJobById(id: string): Promise<Job> {
    return fetchJson<Job>(`/jobs/${id}`);
  },

  async getJobIntelligence(id: string): Promise<any> {
    return fetchJson(`/jobs/${id}/intelligence`);
  },

  async triggerDiscovery(): Promise<{
    totalScanned: number;
    relevantFound: number;
    newSaved: number;
    freshSaved: number;
    duplicatesSkipped: number;
    sources: Record<string, number>;
  }> {
    return fetchJson('/jobs/discover', { method: 'POST' });
  },

  async analyzeJob(id: string): Promise<AIMatchResult> {
    return fetchJson<AIMatchResult>(`/jobs/${id}/analyze`, {
      method: 'POST',
    });
  },

  // ==========================================
  // V2 API METHODS
  // ==========================================

  // Tailored CV & ATS Analysis
  async generateTailoredCv(jobId: string) {
    return fetchJson<{ resume: any; atsAnalysis: any }>(`/jobs/${jobId}/resume/generate`, {
      method: 'POST',
    });
  },

  async getResumesByJob(jobId: string) {
    return fetchJson<any[]>(`/jobs/${jobId}/resumes`);
  },

  async getResumeById(id: string) {
    return fetchJson<{ resume: any; atsAnalysis: any; job: any }>(`/resumes/${id}`);
  },

  async updateResume(id: string, data: any) {
    return fetchJson<any>(`/resumes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async regenerateResume(id: string) {
    return fetchJson<{ resume: any; atsAnalysis: any }>(`/resumes/${id}/regenerate`, {
      method: 'POST',
    });
  },

  async getAtsAnalysis(id: string) {
    return fetchJson<any>(`/resumes/${id}/ats-analysis`);
  },

  // Cover Letter
  async generateCoverLetter(jobId: string) {
    return fetchJson<any>(`/jobs/${jobId}/cover-letter/generate`, {
      method: 'POST',
    });
  },

  async getCoverLettersByJob(jobId: string) {
    return fetchJson<any[]>(`/jobs/${jobId}/cover-letters`);
  },

  async getCoverLetterById(id: string) {
    return fetchJson<{ coverLetter: any; job: any }>(`/cover-letters/${id}`);
  },

  async updateCoverLetter(id: string, bodyText: string) {
    return fetchJson<any>(`/cover-letters/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ bodyText }),
    });
  },

  // Screening Questions
  async analyzeScreening(jobId: string, questions?: string[] | string) {
    return fetchJson<any[]>(`/jobs/${jobId}/screening/analyze`, {
      method: 'POST',
      body: JSON.stringify({ questions }),
    });
  },

  async getScreeningQuestions(jobId: string) {
    return fetchJson<any[]>(`/jobs/${jobId}/screening`);
  },

  async answerScreeningQuestion(id: string, answer: string) {
    return fetchJson<any>(`/screening/${id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  },

  // Preparation Workspace & Queue
  async getApplicationPreparation(jobId: string) {
    return fetchJson<any>(`/jobs/${jobId}/application-preparation`);
  },

  async getApplicationQueue() {
    return fetchJson<any>('/application-queue');
  },

  async getProfile(): Promise<CandidateProfile & { primarySkills: string[]; additionalSkills: string[] }> {
    return fetchJson('/profile');
  },

  async getApplications(): Promise<ApplicationRecord[]> {
    return fetchJson('/applications');
  },

  async updateApplicationStatus(jobId: string, status: ApplicationStatus, note?: string, source: string = 'USER') {
    return fetchJson('/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId, status, note, source }),
    });
  },

  async getApplicationById(id: string): Promise<ApplicationDetailRecord> {
    return fetchJson<ApplicationDetailRecord>(`/applications/${id}`);
  },

  async addApplicationNote(id: string, content: string, source: string = 'USER') {
    return fetchJson<{ id: string; content: string; createdAt: string }>(`/applications/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content, source }),
    });
  },

  async setFollowUpDate(id: string, nextFollowUpAt: string | null, source: string = 'USER') {
    return fetchJson<any>(`/applications/${id}/follow-up`, {
      method: 'POST',
      body: JSON.stringify({ nextFollowUpAt, source }),
    });
  },

  async getApplicationAnalytics(
    range: 'today' | '7d' | '30d' | '90d' | 'all' | 'custom' = 'all',
    start?: string,
    end?: string
  ): Promise<ApplicationAnalytics> {
    const params = new URLSearchParams();
    if (range) params.append('range', range);
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<ApplicationAnalytics>(`/applications/analytics${queryString}`);
  },

  async getApplicationTimeline(limit: number = 50): Promise<ApplicationTimelineItem[]> {
    return fetchJson<ApplicationTimelineItem[]>(`/applications/timeline?limit=${limit}`);
  },

  async updateCommonAnswers(commonAnswers: any) {
    return fetchJson<any>('/profile/common-answers', {
      method: 'PUT',
      body: JSON.stringify({ commonAnswers }),
    });
  },

  async syncJobCommonAnswers(jobId: string) {
    return fetchJson<ScreeningQuestionItem[]>(`/jobs/${jobId}/screening/sync-common`, {
      method: 'POST',
    });
  },

  // ==========================================
  // V6 INTERVIEW INTELLIGENCE
  // ==========================================

  async getInterviews(filters?: { status?: string; company?: string; roundType?: string }): Promise<InterviewRecord[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.company) params.append('company', filters.company);
    if (filters?.roundType && filters.roundType !== 'ALL') params.append('roundType', filters.roundType);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<InterviewRecord[]>(`/interviews${qs}`);
  },

  async getInterviewStats(): Promise<InterviewStatsSummary> {
    return fetchJson<InterviewStatsSummary>('/interviews/stats');
  },

  async getOrCreateInterviewForApplication(applicationId: string): Promise<InterviewRecord> {
    return fetchJson<InterviewRecord>(`/applications/${applicationId}/interview`, {
      method: 'POST',
    });
  },

  async getInterviewById(id: string): Promise<InterviewRecord> {
    return fetchJson<InterviewRecord>(`/interviews/${id}`);
  },

  async updateInterview(id: string, data: any): Promise<InterviewRecord> {
    return fetchJson<InterviewRecord>(`/interviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async createInterviewRound(interviewId: string, data: any): Promise<InterviewRoundRecord> {
    return fetchJson<InterviewRoundRecord>(`/interviews/${interviewId}/rounds`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateInterviewRound(roundId: string, data: any): Promise<InterviewRoundRecord> {
    return fetchJson<InterviewRoundRecord>(`/interview-rounds/${roundId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteInterviewRound(roundId: string): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>(`/interview-rounds/${roundId}`, {
      method: 'DELETE',
    });
  },

  async generatePrepKit(interviewId: string, roundId?: string, forceRefresh = false): Promise<InterviewPrepKitData> {
    return fetchJson<InterviewPrepKitData>(`/interviews/${interviewId}/prep-kit/generate`, {
      method: 'POST',
      body: JSON.stringify({ roundId, forceRefresh }),
    });
  },

  async listInterviewQuestions(interviewId: string, roundId?: string): Promise<InterviewQuestionItem[]> {
    const qs = roundId ? `?roundId=${roundId}` : '';
    return fetchJson<InterviewQuestionItem[]>(`/interviews/${interviewId}/questions${qs}`);
  },

  async addInterviewQuestion(interviewId: string, data: any): Promise<InterviewQuestionItem> {
    return fetchJson<InterviewQuestionItem>(`/interviews/${interviewId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generatePredictedQuestions(interviewId: string, roundId?: string): Promise<InterviewQuestionItem[]> {
    return fetchJson<InterviewQuestionItem[]>(`/interviews/${interviewId}/questions/generate`, {
      method: 'POST',
      body: JSON.stringify({ roundId }),
    });
  },

  async generateSTARAnswer(question: string, targetProjectTitle?: string): Promise<STARAnswerItem> {
    return fetchJson<STARAnswerItem>('/interviews/star/generate', {
      method: 'POST',
      body: JSON.stringify({ question, targetProjectTitle }),
    });
  },

  async startMockSession(interviewId: string, roundType: string, roundId?: string): Promise<MockSessionRecord> {
    return fetchJson<MockSessionRecord>(`/interviews/${interviewId}/mock-sessions`, {
      method: 'POST',
      body: JSON.stringify({ roundType, roundId }),
    });
  },

  async submitMockAnswer(sessionId: string, questionIndex: number, answer: string): Promise<MockSessionRecord> {
    return fetchJson<MockSessionRecord>(`/mock-sessions/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionIndex, answer }),
    });
  },

  async completeMockSession(sessionId: string): Promise<MockSessionRecord> {
    return fetchJson<MockSessionRecord>(`/mock-sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  },

  async submitInterviewDebrief(interviewId: string, data: any): Promise<InterviewDebriefRecord> {
    return fetchJson<InterviewDebriefRecord>(`/interviews/${interviewId}/debrief`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Autonomous Workflow & Auto-Apply
  async uploadResume(text: string): Promise<ParsedResumePreview> {
    return fetchJson<ParsedResumePreview>('/profile/upload-resume', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async commitResume(preview: ParsedResumePreview, overwrite?: boolean): Promise<any> {
    return fetchJson('/profile/commit-resume', {
      method: 'POST',
      body: JSON.stringify({ preview, overwrite }),
    });
  },

  async getAutoApplyConfig(): Promise<AutoApplyConfig> {
    return fetchJson<AutoApplyConfig>('/profile/auto-apply-config');
  },

  async updateAutoApplyConfig(config: AutoApplyConfig): Promise<AutoApplyConfig> {
    return fetchJson<AutoApplyConfig>('/profile/auto-apply-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  async autoApply(jobId: string, dryRun?: boolean): Promise<{
    success: boolean;
    mode: 'LIVE' | 'SANDBOX';
    receipt?: SubmissionReceipt;
    sandboxResult?: SandboxTestResult;
    message?: string;
  }> {
    return fetchJson(`/jobs/${jobId}/auto-apply`, {
      method: 'POST',
      body: JSON.stringify({ dryRun }),
    });
  },

  async evaluateAutoApplyEligibility(jobId: string): Promise<AutoApplyEligibilityResult> {
    return fetchJson<AutoApplyEligibilityResult>(`/jobs/${jobId}/auto-apply/eligibility`);
  },

  async autoPrepare(jobId: string): Promise<any> {
    return fetchJson(`/jobs/${jobId}/auto-prepare`, {
      method: 'POST',
    });
  },

  async runContinuousDiscovery(): Promise<{
    scanned: number;
    newJobs: number;
    analyzed: number;
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    autoAppliedCount: number;
  }> {
    return fetchJson('/discovery/continuous/run', {
      method: 'POST',
    });
  },

  async getContinuousDiscoveryStatus(): Promise<{
    isRunningCycle: boolean;
    lastRunTimestamp: string | null;
    isWorkerActive: boolean;
  }> {
    return fetchJson('/discovery/continuous/status');
  },

  async getQualifiedOpportunities(): Promise<QualifiedOpportunity[]> {
    return fetchJson<QualifiedOpportunity[]>('/discovery/qualified-opportunities');
  },
};
