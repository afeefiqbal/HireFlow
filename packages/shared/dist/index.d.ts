/**
 * AI Job Agent - Core Shared Types & Contracts
 * Single source of truth for Candidate, Jobs, Matching, and Applications
 */
export type VisaCompatibility = 'compatible' | 'unknown' | 'incompatible';
export type RecommendationType = 'APPLY' | 'REVIEW' | 'SKIP';
export type JobAgeStatus = 'FRESH' | 'OLDER' | 'UNKNOWN';
export type VisaStatus = 'OFFERED' | 'NOT_OFFERED' | 'NOT_STATED';
export type ApplicationStatus = 'DISCOVERED' | 'MATCHED' | 'SAVED' | 'CV_READY' | 'READY_TO_APPLY' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'OFFER' | 'WITHDRAWN';
export interface VerifiedExperience {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description?: string;
    technologies: string[];
}
export interface VerifiedProject {
    id: string;
    title: string;
    description?: string;
    technologies: string[];
    url?: string;
    verified: boolean;
}
export interface CandidateProfile {
    id: string;
    fullName: string;
    headline: string;
    yearsOfExperience: number;
    primaryTechnologies: string[];
    additionalTechnologies: string[];
    targetRoles: string[];
    targetLocations: string[];
    remotePreference: 'preferred' | 'required' | 'open';
    relocationPreference: 'preferred' | 'open' | 'no';
    visaSponsorshipRequired: boolean;
    experiences: VerifiedExperience[];
    projects: VerifiedProject[];
    hasKnownCareerGap: boolean;
    careerGapDescription: string;
}
export interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    isRemote: boolean;
    employmentType: string;
    postedAt: string | null;
    discoveredAt: string;
    jobAgeHours: number | null;
    ageStatus: JobAgeStatus;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string | null;
    visaStatus: VisaStatus;
    experienceRequired?: string | null;
    techStack: string[];
    description: string;
    requirements: string[];
    preferredSkills?: string[];
    applicationUrl: string;
    canonicalUrl: string;
    source: string;
    sourceUrl?: string;
    createdAt: string;
    updatedAt: string;
    latestMatch?: AIMatchResult | null;
    application?: ApplicationSummary | null;
}
export interface AIMatchResult {
    id?: string;
    jobId: string;
    overall_match: number;
    technical_match: number;
    experience_match: number;
    location_match: number;
    visa_compatibility: VisaCompatibility;
    strong_matches: string[];
    missing_requirements: string[];
    concerns: string[];
    reasoning: string[];
    recommendation: RecommendationType;
    createdAt?: string;
}
export interface ApplicationSummary {
    id: string;
    jobId: string;
    status: ApplicationStatus;
    appliedDate?: string | null;
    notes?: string | null;
    cvVersion?: string | null;
    interviewDates?: string[];
    lastUpdated: string;
}
export interface ApplicationRecord extends ApplicationSummary {
    job: Job;
    events: ApplicationEventItem[];
}
export interface ApplicationEventItem {
    id: string;
    applicationId: string;
    fromStatus?: ApplicationStatus | null;
    toStatus: ApplicationStatus;
    note?: string | null;
    timestamp: string;
}
export interface DashboardStats {
    jobsDiscoveredToday: number;
    freshJobs24h: number;
    strongMatchesCount: number;
    applicationsReady: number;
    applicationsSubmitted: number;
    interviewsCount: number;
    rejectedCount: number;
    totalActiveApplications: number;
}
export interface JobFilterParams {
    search?: string;
    freshOnly?: boolean;
    roles?: string[];
    technologies?: string[];
    locations?: string[];
    remoteOnly?: boolean;
    minMatchScore?: number;
    visaSponsorship?: VisaStatus;
    salaryMin?: number;
    source?: string;
    page?: number;
    limit?: number;
    sortBy?: 'postedAt' | 'matchScore' | 'discoveredAt';
    sortOrder?: 'asc' | 'desc';
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
        hasMore?: boolean;
    };
}
export interface CvExperienceItem {
    company: string;
    role: string;
    period: string;
    isCurrent: boolean;
    summary: string;
    bullets: string[];
    technologies: string[];
}
export interface CvProjectItem {
    title: string;
    description: string;
    technologies: string[];
}
export interface TailoredCvData {
    id?: string;
    jobId: string;
    versionName: string;
    fullName: string;
    targetRole: string;
    summary: string;
    primarySkills: string[];
    additionalSkills: string[];
    experiences: CvExperienceItem[];
    projects: CvProjectItem[];
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface AtsSkillMatchItem {
    skill: string;
    isMatched: boolean;
    isRequired: boolean;
}
export interface AtsAnalysisResult {
    id?: string;
    resumeVersionId?: string;
    overallCoverage: number;
    requiredCoverage: number;
    preferredCoverage: number;
    experienceAlignment: number;
    titleAlignment: number;
    requiredSkills: AtsSkillMatchItem[];
    preferredSkills: AtsSkillMatchItem[];
    recommendations: string[];
    createdAt?: string;
}
export interface CoverLetterData {
    id?: string;
    jobId: string;
    company: string;
    role: string;
    recipientTitle?: string;
    opening: string;
    middle: string;
    closing: string;
    fullText: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface ScreeningQuestionItem {
    id: string;
    jobId: string;
    question: string;
    suggestedAnswer: string;
    confidence: 'high' | 'medium' | 'low';
    source: string;
    requiresUserInput: boolean;
    userAnswer?: string | null;
    createdAt?: string;
}
export interface ApplicationPreparationSummary {
    jobId: string;
    job: Job;
    jobAnalyzed: boolean;
    cvGenerated: boolean;
    atsAnalyzed: boolean;
    coverLetterGenerated: boolean;
    screeningInputNeeded: number;
    screeningTotalCount: number;
    latestResume?: TailoredCvData | null;
    latestAtsAnalysis?: AtsAnalysisResult | null;
    latestCoverLetter?: CoverLetterData | null;
    screeningQuestions?: ScreeningQuestionItem[];
}
export interface ApplicationQueueGroup {
    readyToApply: Job[];
    needsInput: Job[];
    cvReady: Job[];
    applied: Job[];
    interview: Job[];
    rejected: Job[];
}
