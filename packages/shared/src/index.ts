/**
 * AI Job Agent - Core Shared Types & Contracts
 * Single source of truth for Candidate, Jobs, Matching, and Applications
 */

export type VisaCompatibility = 'compatible' | 'unknown' | 'incompatible';
export type RecommendationType = 'APPLY' | 'REVIEW' | 'SKIP';
export type JobAgeStatus = 'FRESH' | 'OLDER' | 'UNKNOWN';
export type VisaStatus = 'OFFERED' | 'NOT_OFFERED' | 'NOT_STATED';

// ==========================================
// V4 JOB INTELLIGENCE TYPES & CONTRACTS
// ==========================================

export type FactSource = 'JOB_DESCRIPTION' | 'ATS_METADATA' | 'COMPENSATION_FIELD' | 'TITLE' | 'FEED';
export type FactConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type FreshnessStatus = 'FRESH' | 'RECENT' | 'TODAY' | 'STALE' | 'UNKNOWN';
export type VisaSponsorship = 'AVAILABLE' | 'NOT_AVAILABLE' | 'NOT_MENTIONED';
export type Relocation = 'AVAILABLE' | 'NOT_AVAILABLE' | 'NOT_MENTIONED';
export type RemoteType = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNKNOWN';
export type Seniority =
  | 'INTERN'
  | 'JUNIOR'
  | 'MID'
  | 'SENIOR'
  | 'STAFF'
  | 'PRINCIPAL'
  | 'LEAD'
  | 'MANAGER'
  | 'DIRECTOR'
  | 'UNKNOWN';

export type RoleFamily =
  | 'SOFTWARE_ENGINEERING'
  | 'ENGINEERING_MANAGEMENT'
  | 'PRODUCT'
  | 'PROJECT_MANAGEMENT'
  | 'QA'
  | 'DEVOPS'
  | 'DATA'
  | 'DESIGN'
  | 'SALES'
  | 'MARKETING'
  | 'CUSTOMER_SUCCESS'
  | 'OTHER'
  | 'UNKNOWN';

export interface ExtractedFact<T> {
  value: T;
  evidence?: string | null;
  source: FactSource;
  confidence: FactConfidence;
}

export interface TechnologyEvidenceItem {
  technology: string;
  status: 'REQUIRED' | 'OPTIONAL';
  evidence: string;
  source: FactSource;
  confidence: FactConfidence;
}

export interface WhyThisJobBreakdown {
  roleFamily: {
    status: 'MATCH' | 'MISMATCH';
    value: RoleFamily;
    candidateFamily: string;
    isGatePass: boolean;
  };
  seniority: {
    status: 'MATCH' | 'GAP';
    value: Seniority;
    candidateSeniority: string;
  };
  technologies: Array<{
    technology: string;
    status: 'DIRECT' | 'PARTIAL' | 'NOT_VERIFIED';
    evidence?: string;
  }>;
  workSetup: {
    remoteType: RemoteType;
    location: string;
    isCompatible: boolean;
  };
  visa: {
    status: VisaSponsorship;
    evidence?: string | null;
  };
  relocation: {
    status: Relocation;
    evidence?: string | null;
  };
  freshness: {
    status: FreshnessStatus;
    ageHours: number | null;
    label: string;
  };
  applicationUrlQuality: {
    isAuthenticAts: boolean;
    domain: string;
  };
  priorityScore: number;
  priorityReasons: string[];
}

export type ApplicationStatus =
  | 'DISCOVERED'
  | 'MATCHED'
  | 'SAVED'
  | 'CV_READY'
  | 'READY_TO_APPLY'
  | 'APPLIED'
  | 'INTERVIEW'
  | 'REJECTED'
  | 'OFFER'
  | 'WITHDRAWN'
  | 'EXPIRED';

export interface VerifiedExperience {
  id: string;
  company: string;
  role: string;
  startDate: string; // e.g., '2018-12'
  endDate: string | null; // null for 'Present'
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
  headline: string; // e.g., 'Full-Stack Developer | Laravel, PHP, Node.js, Vue.js'
  yearsOfExperience: number; // 7
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
  email?: string;
  phone?: string | null;
  location?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  commonAnswers?: CommonAnswersBank | null;
}

export interface CommonAnswersBank {
  visaSponsorship: string;
  workAuthorization: string;
  noticePeriod: string;
  expectedSalary: string;
  relocation: string;
  [key: string]: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  employmentType: string;
  postedAt: string | null; // ISO string
  discoveredAt: string; // ISO string
  jobAgeHours: number | null;
  ageStatus: JobAgeStatus; // FRESH if <= 24h
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

  // V4 Job Intelligence & Ground Truth Fields
  sourceJobId?: string | null;
  sourceIdentity?: string | null;
  canonicalIdentity?: string | null;
  descriptionFingerprint?: string | null;
  locations?: string[];
  remoteType?: RemoteType;
  remoteEvidence?: ExtractedFact<RemoteType> | null;
  postedAtSource?: string;
  freshnessStatus?: FreshnessStatus;
  seniority?: Seniority;
  roleFamily?: RoleFamily;
  visaSponsorship?: VisaSponsorship;
  visaEvidence?: ExtractedFact<VisaSponsorship> | null;
  relocation?: Relocation;
  relocationEvidence?: ExtractedFact<Relocation> | null;
  responsibilities?: string[];
  technologyEvidence?: TechnologyEvidenceItem[] | null;
  normalizedCompany?: string | null;
  normalizedTitle?: string | null;
  whyThisJob?: WhyThisJobBreakdown | null;
  applicationPriority?: number | null;
  priorityReasons?: string[];

  // Populated relation or latest match
  latestMatch?: AIMatchResult | null;
  application?: ApplicationSummary | null;
}

export interface AIMatchResult {
  id?: string;
  jobId: string;
  overall_match: number; // 0-100
  technical_match: number; // 0-100
  experience_match: number; // 0-100
  location_match: number; // 0-100
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
  snapshotJson?: ApplicationSnapshot | null;
}

export interface ApplicationSnapshot {
  jobTitle: string;
  company: string;
  appliedDate: string;
  resume: {
    versionId?: string;
    versionName: string;
    targetRole?: string;
    summary?: string;
  };
  coverLetter: {
    id?: string;
    version: string;
    fullText: string;
  } | null;
  screeningAnswers: Array<{
    question: string;
    answer: string;
    source: 'AI_VERIFIED' | 'USER_PROVIDED' | 'USER_INPUT_REQUIRED';
    requiresUserInput: boolean;
  }>;
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
  strongMatchesCount: number; // >= 85%
  applicationsReady: number;
  applicationsSubmitted: number;
  interviewsCount: number;
  rejectedCount: number;
  totalActiveApplications: number;
  ai?: {
    provider: string;
    model: string;
    status: string;
    callsToday: number;
    tokensUsedToday: number;
  };
}

export interface JobFilterParams {
  search?: string;
  freshOnly?: boolean; // <= 24 hours
  roles?: string[];
  technologies?: string[];
  locations?: string[];
  remoteOnly?: boolean;
  minMatchScore?: number;
  visaSponsorship?: VisaStatus;
  roleFamily?: RoleFamily | string;
  seniority?: Seniority | string;
  remoteType?: RemoteType | string;
  freshnessStatus?: FreshnessStatus | string;
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

// ==========================================
// V2 TYPES: CV, ATS, COVER LETTER, SCREENING
// ==========================================

export interface CvExperienceItem {
  company: string;
  role: string;
  period: string; // e.g., "Jul 2025 – Present" or "Jul 2023 – Aug 2024"
  isCurrent: boolean;
  summary: string;
  bullets: Array<string | {
    text: string;
    evidence?: {
      status: 'DIRECT' | 'PARTIAL' | 'NOT_VERIFIED';
      sourceCompany: string | null;
      matchedTech: string[];
    };
  }>;
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
  overallCoverage: number; // 0-100%
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
  source: string; // "Candidate Ground Truth" or "User Input"
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
  applicationSnapshot?: ApplicationSnapshot | null;
}

export interface ApplicationQueueGroup {
  readyToApply: Job[];
  needsInput: Job[];
  cvReady: Job[];
  applied: Job[];
  interview: Job[];
  rejected: Job[];
}

