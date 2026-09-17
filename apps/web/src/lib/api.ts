import {
  DashboardStats,
  Job,
  AIMatchResult,
  CandidateProfile,
  ApplicationRecord,
  ApplicationStatus,
  JobFilterParams,
  ScreeningQuestionItem,
} from '@ai-job-agent/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data.data;
  } catch (err: any) {
    console.error(`API Error on [${endpoint}]:`, err.message);
    throw err;
  }
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
    return {
      jobs: json.data || [],
      meta: json.meta || {},
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

  async updateApplicationStatus(jobId: string, status: ApplicationStatus, note?: string) {
    return fetchJson('/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId, status, note }),
    });
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
};
