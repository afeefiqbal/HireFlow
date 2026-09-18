/**
 * AI Job Agent - Core Shared Types & Contracts
 * Single source of truth for Candidate, Jobs, Matching, and Applications
 */
export type VisaCompatibility = 'compatible' | 'unknown' | 'incompatible';
export type RecommendationType = 'APPLY' | 'REVIEW' | 'SKIP';
export type JobAgeStatus = 'FRESH' | 'OLDER' | 'UNKNOWN';
export type VisaStatus = 'OFFERED' | 'NOT_OFFERED' | 'NOT_STATED';
export type FactSource = 'JOB_DESCRIPTION' | 'ATS_METADATA' | 'COMPENSATION_FIELD' | 'TITLE' | 'FEED';
export type FactConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type FreshnessStatus = 'FRESH' | 'RECENT' | 'TODAY' | 'STALE' | 'UNKNOWN';
export type VisaSponsorship = 'AVAILABLE' | 'NOT_AVAILABLE' | 'NOT_MENTIONED';
export type Relocation = 'AVAILABLE' | 'NOT_AVAILABLE' | 'NOT_MENTIONED';
export type RemoteType = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNKNOWN';
export type Seniority = 'INTERN' | 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF' | 'PRINCIPAL' | 'LEAD' | 'MANAGER' | 'DIRECTOR' | 'UNKNOWN';
export type RoleFamily = 'SOFTWARE_ENGINEERING' | 'ENGINEERING_MANAGEMENT' | 'PRODUCT' | 'PROJECT_MANAGEMENT' | 'QA' | 'DEVOPS' | 'DATA' | 'DESIGN' | 'SALES' | 'MARKETING' | 'CUSTOMER_SUCCESS' | 'OTHER' | 'UNKNOWN';
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
export type ApplicationStatus = 'DISCOVERED' | 'MATCHED' | 'SAVED' | 'SHORTLISTED' | 'PREPARING' | 'CV_READY' | 'READY_TO_APPLY' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'OFFER' | 'WITHDRAWN' | 'EXPIRED';
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
export type ApplicationEventType = 'CREATED' | 'STATUS_CHANGED' | 'SHORTLISTED' | 'PREPARATION_STARTED' | 'RESUME_GENERATED' | 'COVER_LETTER_GENERATED' | 'SCREENING_COMPLETED' | 'READY_TO_APPLY' | 'APPLICATION_OPENED' | 'APPLIED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_COMPLETED' | 'OFFER_RECEIVED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED' | 'NOTE_ADDED' | 'FOLLOW_UP_SET';
export interface ApplicationEventItem {
    id: string;
    applicationId: string;
    type: ApplicationEventType | string;
    fromStatus?: ApplicationStatus | null;
    toStatus: ApplicationStatus;
    source?: string;
    note?: string | null;
    metadata?: any;
    timestamp: string;
    createdAt?: string;
}
export interface ApplicationNoteItem {
    id: string;
    applicationId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}
export interface ApplicationSummary {
    id: string;
    jobId: string;
    status: ApplicationStatus;
    appliedDate?: string | null;
    notes?: string | null;
    cvVersion?: string | null;
    interviewDates?: string[];
    nextFollowUpAt?: string | null;
    lastActivityAt?: string | null;
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
    notesList?: ApplicationNoteItem[];
}
export interface ApplicationHealthChecklist {
    resumeReady: boolean;
    resumeVersionName?: string;
    coverLetterReady: boolean;
    screeningReady: boolean;
    screeningPendingCount: number;
    applicationUrlAvailable: boolean;
    applicationUrl?: string;
    isApplied: boolean;
    appliedDate?: string | null;
    followUpStatus: 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'NOT_SET';
    followUpDaysRemaining?: number | null;
    nextFollowUpAt?: string | null;
}
export interface ApplicationDetailRecord extends ApplicationSummary {
    job: Job;
    events: ApplicationEventItem[];
    notesList: ApplicationNoteItem[];
    healthChecklist: ApplicationHealthChecklist;
}
export interface ApplicationTimelineItem {
    id: string;
    applicationId: string;
    jobId: string;
    jobTitle: string;
    company: string;
    type: ApplicationEventType | string;
    fromStatus?: ApplicationStatus | null;
    toStatus: ApplicationStatus;
    source: string;
    note?: string | null;
    metadata?: any;
    timestamp: string;
}
export interface FunnelCounts {
    discovered: number;
    shortlisted: number;
    preparing: number;
    readyToApply: number;
    applied: number;
    interview: number;
    offer: number;
}
export interface ConversionMetricItem {
    numerator: number;
    denominator: number;
    rate: number | null;
    percentage?: number | null;
    formatted: string;
    insufficientData: boolean;
}
export interface ApplicationConversionMetrics {
    applicationRate: ConversionMetricItem;
    interviewRate: ConversionMetricItem;
    offerRate: ConversionMetricItem;
}
export interface ApplicationTimeMetrics {
    discoveryToApply: {
        avgDays: number | null;
        medianDays: number | null;
        sampleCount: number;
        insufficientData: boolean;
        label: string;
    };
    applyToInterview: {
        avgDays: number | null;
        medianDays: number | null;
        sampleCount: number;
        insufficientData: boolean;
        label: string;
    };
    interviewToOffer: {
        avgDays: number | null;
        medianDays: number | null;
        sampleCount: number;
        insufficientData: boolean;
        label: string;
    };
    avgDaysToApply?: number | null;
    medianDaysToApply?: number | null;
    avgDaysToInterview?: number | null;
    medianDaysToInterview?: number | null;
    avgDaysToOffer?: number | null;
    medianDaysToOffer?: number | null;
    insufficientData?: boolean;
}
export interface BreakdownItem {
    key: string;
    label: string;
    count: number;
    percentage?: number;
    interviewCount?: number;
    offerCount?: number;
}
export interface ApplicationAnalytics {
    dateRange: 'today' | '7d' | '30d' | '90d' | 'all' | 'custom';
    startDate: string | null;
    endDate: string | null;
    summary: {
        totalApplications: number;
        appliedCount: number;
        interviewCount: number;
        offerCount: number;
        rejectedCount: number;
        pendingCount: number;
        followUpsDueCount: number;
    };
    funnel: FunnelCounts;
    conversions: ApplicationConversionMetrics;
    conversionMetrics?: ApplicationConversionMetrics;
    timeMetrics: ApplicationTimeMetrics;
    breakdowns: {
        source: BreakdownItem[];
        roleFamily: BreakdownItem[];
        technologies: BreakdownItem[];
        technology?: BreakdownItem[];
        remote: BreakdownItem[];
        visa: BreakdownItem[];
        freshness: BreakdownItem[];
    };
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
    freshOnly?: boolean;
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
export interface CvExperienceItem {
    company: string;
    role: string;
    period: string;
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
    applicationSnapshot?: ApplicationSnapshot | null;
}
export interface ApplicationQueueGroup {
    readyToApply: Job[];
    needsInput: Job[];
    cvReady: Job[];
    applied: Job[];
    interview: Job[];
    rejected: Job[];
    shortlisted?: Job[];
    preparing?: Job[];
    offer?: Job[];
    archived?: Job[];
}
export type InterviewStatus = 'PLANNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type InterviewRoundType = 'SCREENING_CALL' | 'TECHNICAL_SCREEN' | 'TECHNICAL_ROUND' | 'SYSTEM_DESIGN' | 'BEHAVIORAL_CULTURE' | 'EXECUTIVE_FINAL' | 'CUSTOM';
export type InterviewRoundStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type QuestionCategory = 'BEHAVIORAL' | 'TECHNICAL' | 'SYSTEM_DESIGN' | 'PROJECT_DEEP_DIVE' | 'ROLE_SPECIFIC' | 'COMPANY_SPECIFIC' | 'SCREENING' | 'FOLLOW_UP';
export type QuestionSource = 'PREDICTED' | 'AI_GENERATED' | 'USER_PROVIDED' | 'ACTUAL_INTERVIEW';
export type EvidenceAttribution = 'AI_VERIFIED' | 'USER_PROVIDED' | 'USER_INPUT_REQUIRED' | 'USER_REVIEW_REQUIRED';
export interface InterviewRoundRecord {
    id: string;
    interviewId: string;
    roundType: InterviewRoundType;
    title: string;
    sequence: number;
    status: InterviewRoundStatus;
    scheduledAt?: string | null;
    completedAt?: string | null;
    interviewerName?: string | null;
    interviewerTitle?: string | null;
    meetingUrl?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface InterviewQuestionItem {
    id: string;
    interviewId: string;
    roundId?: string | null;
    category: QuestionCategory;
    source: QuestionSource;
    questionText: string;
    suggestedAnswer?: string | null;
    starSituation?: string | null;
    starTask?: string | null;
    starAction?: string | null;
    starResult?: string | null;
    resultAttribution: EvidenceAttribution;
    unverifiedClaims?: string[];
    relevanceReason?: string | null;
    userNotes?: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface STARAnswerItem {
    question: string;
    situation: {
        text: string;
        attribution: EvidenceAttribution;
    };
    task: {
        text: string;
        attribution: EvidenceAttribution;
    };
    action: {
        text: string;
        attribution: EvidenceAttribution;
    };
    result: {
        text: string;
        attribution: EvidenceAttribution;
    };
    targetProjectOrCompany?: string;
    unverifiedClaims?: string[];
}
export interface CompanyIntelligenceBrief {
    companyName: string;
    industry?: string;
    knownTechStack: string[];
    engineeringSignals: string[];
    roleExpectations: string[];
    evidenceNotes: string[];
}
export interface TechnologyRevisionTopic {
    technology: string;
    status: 'DIRECT' | 'PARTIAL' | 'NOT_VERIFIED' | 'NOT_RETRIEVED';
    relevanceToRole: string;
    revisionTopics: string[];
    candidateEvidence?: string | null;
}
export interface InterviewPrepKitData {
    id: string;
    interviewId: string;
    roundId?: string | null;
    versionNum: number;
    modelUsed?: string;
    promptVersion?: string;
    companyBrief: CompanyIntelligenceBrief;
    roleBrief: {
        title: string;
        seniority: string;
        roleFamily: string;
        coreExpectations: string[];
    };
    techTopics: TechnologyRevisionTopic[];
    projectDeepDives: Array<{
        projectName: string;
        technologies: string[];
        description: string;
        likelyQuestions: string[];
    }>;
    starBlueprints: STARAnswerItem[];
    systemDesignTopics?: string[];
    questionsToAsk: string[];
    createdAt: string;
}
export interface MockQnAItem {
    questionId?: string;
    question: string;
    answer?: string;
    feedback?: {
        relevance: string;
        completeness: string;
        technicalAccuracy: string;
        clarity: string;
        unverifiedClaims?: string[];
        suggestions: string[];
    };
}
export interface MockSessionRecord {
    id: string;
    interviewId: string;
    roundId?: string | null;
    roundType: InterviewRoundType;
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    qna: MockQnAItem[];
    feedbackSummary?: {
        overallStrengths: string[];
        keyAreasToImprove: string[];
        unverifiedClaimsFound: string[];
    } | null;
    createdAt: string;
    completedAt?: string | null;
}
export interface InterviewDebriefRecord {
    id: string;
    interviewId: string;
    roundId?: string | null;
    candidateReflection: string;
    questionsAsked: string[];
    technicalTopics: string[];
    behavioralTopics: string[];
    whatWentWell?: string | null;
    whatWasDifficult?: string | null;
    topicsToStudy: string[];
    interviewerFeedback?: string | null;
    aiObservedSummary?: string | null;
    aiSuggestions: string[];
    nextSteps?: string | null;
    followUpDate?: string | null;
    outcome?: string | null;
    createdAt: string;
}
export interface InterviewRecord {
    id: string;
    applicationId: string;
    status: InterviewStatus;
    overallOutcome?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    application?: {
        id: string;
        jobId: string;
        status: ApplicationStatus;
        job: Job;
        snapshotJson?: ApplicationSnapshot | null;
    };
    rounds: InterviewRoundRecord[];
    prepKits?: InterviewPrepKitData[];
    questions?: InterviewQuestionItem[];
    mockSessions?: MockSessionRecord[];
    debriefs?: InterviewDebriefRecord[];
}
export interface InterviewStatsSummary {
    totalInterviews: number;
    activeInterviews: number;
    completedRounds: number;
    upcomingRounds: number;
    mockSessionsPracticed: number;
    questionsRecorded: number;
    debriefsCompleted: number;
}
export type OpportunityTier = 'DISCOVERED' | 'DASHBOARD_QUALIFIED' | 'AUTO_PREPARED' | 'AUTO_APPLY_ELIGIBLE' | 'APPLIED';
export type SubmissionMechanism = 'GREENHOUSE_DIRECT' | 'LEVER_DIRECT' | 'MANUAL_EXTERNAL';
export interface SubmissionReceipt {
    receiptId: string;
    submittedAt: string;
    mechanism: SubmissionMechanism;
    confirmationData?: unknown;
}
export interface SandboxTestResult {
    testedAt: string;
    isValid: boolean;
    targetMechanism: string;
    validationErrors: string[];
    diagnosticInfo?: Record<string, unknown>;
}
export interface AutoApplyConfig {
    enabled: boolean;
    autonomousThreshold: number;
    dailyLimit: number;
}
export interface QualifiedOpportunity {
    job: Job;
    matchScore: number;
    roleFamilyPass: boolean;
    tier: OpportunityTier;
    tierReason: string;
    atsMechanism: SubmissionMechanism;
    autoApplyEligible: boolean;
    autoApplyIneligibleReason?: string;
    preparationStatus: {
        cvReady: boolean;
        coverLetterReady: boolean;
        screeningReady: boolean;
        pendingQuestionsCount: number;
    };
    applicationStatus?: ApplicationStatus | null;
    applicationId?: string | null;
    submissionReceipt?: SubmissionReceipt | null;
}
export interface ParsedResumePreview {
    fullName: string;
    headline: string;
    yearsOfExperience: number;
    targetRoles: string[];
    targetLocations: string[];
    phone?: string | null;
    location?: string | null;
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
    skills: Array<{
        name: string;
        category: string;
        level: string;
    }>;
    experiences: Array<{
        company: string;
        role: string;
        startDate: string;
        endDate?: string | null;
        isCurrent: boolean;
        description?: string | null;
        technologies: string[];
    }>;
    projects: Array<{
        title: string;
        description?: string | null;
        technologies: string[];
        url?: string | null;
    }>;
    commonAnswers?: {
        visaSponsorship?: string;
        workAuthorization?: string;
        noticePeriod?: string;
        expectedSalary?: string;
        relocation?: string;
    };
}
export interface AutoApplyEligibilityResult {
    isEligible: boolean;
    reason: string;
    adapterType: SubmissionMechanism;
    requiresUserInputCount: number;
}
