import { PrismaClient } from '@prisma/client';
import {
  ApplicationPreparationSummary,
  ApplicationQueueGroup,
  TailoredCvData,
  CoverLetterData,
  ScreeningQuestionItem,
  AtsAnalysisResult,
  Job,
} from '@ai-job-agent/shared';

const prisma = new PrismaClient();

export class PreparationService {
  /**
   * Aggregates preparation readiness for a specific job:
   * CV generated, ATS analyzed, Cover letter generated, Screening questions status.
   */
  static async getApplicationPreparation(jobId: string): Promise<ApplicationPreparationSummary> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        matches: { orderBy: { createdAt: 'desc' }, take: 1 },
        resumeVersions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { atsAnalysis: true },
        },
        coverLetters: { orderBy: { createdAt: 'desc' }, take: 1 },
        screeningQuestions: { orderBy: [{ requiresUserInput: 'desc' }, { createdAt: 'asc' }] },
        application: true,
      },
    });

    if (!job) throw new Error(`Job not found: ${jobId}`);

    const latestResumeVer = job.resumeVersions[0];
    let latestResume: TailoredCvData | null = null;
    let latestAtsAnalysis: AtsAnalysisResult | null = null;

    if (latestResumeVer) {
      const data = latestResumeVer.contentJson as unknown as TailoredCvData;
      latestResume = {
        ...data,
        id: latestResumeVer.id,
        versionName: latestResumeVer.versionName,
        targetRole: latestResumeVer.targetRole || data.targetRole,
        status: latestResumeVer.status,
        createdAt: latestResumeVer.createdAt.toISOString(),
        updatedAt: latestResumeVer.updatedAt.toISOString(),
      };

      if (latestResumeVer.atsAnalysis) {
        const ats = latestResumeVer.atsAnalysis;
        latestAtsAnalysis = {
          id: ats.id,
          resumeVersionId: ats.resumeVersionId,
          overallCoverage: ats.overallCoverage,
          requiredCoverage: ats.requiredCoverage,
          preferredCoverage: ats.preferredCoverage,
          experienceAlignment: ats.experienceAlignment,
          titleAlignment: ats.titleAlignment,
          requiredSkills: ats.requiredSkills as any,
          preferredSkills: ats.preferredSkills as any,
          recommendations: ats.recommendations,
          createdAt: ats.createdAt.toISOString(),
        };
      }
    }

    const latestCl = job.coverLetters[0];
    let latestCoverLetter: CoverLetterData | null = null;
    if (latestCl) {
      latestCoverLetter = {
        id: latestCl.id,
        jobId,
        company: job.company,
        role: job.title,
        recipientTitle: latestCl.recipientTitle || undefined,
        opening: latestCl.opening || '',
        middle: latestCl.middle || '',
        closing: latestCl.closing || '',
        fullText: latestCl.bodyText,
        createdAt: latestCl.createdAt.toISOString(),
        updatedAt: latestCl.updatedAt.toISOString(),
      };
    }

    const screeningQuestions: ScreeningQuestionItem[] = job.screeningQuestions.map((q) => ({
      id: q.id,
      jobId: q.jobId,
      question: q.question,
      suggestedAnswer: q.suggestedAnswer,
      confidence: q.confidence as 'high' | 'medium' | 'low',
      source: q.source,
      requiresUserInput: q.requiresUserInput,
      userAnswer: q.userAnswer,
      createdAt: q.createdAt.toISOString(),
    }));

    const screeningInputNeeded = screeningQuestions.filter((q) => q.requiresUserInput && !q.userAnswer).length;

    const formattedJob: Job = {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      isRemote: job.isRemote,
      employmentType: job.employmentType,
      postedAt: job.postedAt ? job.postedAt.toISOString() : null,
      discoveredAt: job.discoveredAt.toISOString(),
      jobAgeHours: job.jobAgeHours,
      ageStatus: job.ageStatus as any,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      visaStatus: job.visaStatus as any,
      experienceRequired: job.experienceRequired,
      techStack: job.techStack,
      description: job.description,
      requirements: job.requirements,
      preferredSkills: job.preferredSkills,
      applicationUrl: job.applicationUrl,
      canonicalUrl: job.canonicalUrl,
      source: job.source,
      sourceUrl: job.sourceUrl || undefined,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      latestMatch: job.matches[0]
        ? {
            id: job.matches[0].id,
            jobId: job.id,
            overall_match: job.matches[0].overallMatch,
            technical_match: job.matches[0].technicalMatch,
            experience_match: job.matches[0].experienceMatch,
            location_match: job.matches[0].locationMatch,
            visa_compatibility: job.matches[0].visaCompatibility,
            strong_matches: job.matches[0].strongMatches,
            missing_requirements: job.matches[0].missingRequirements,
            concerns: job.matches[0].concerns,
            reasoning: job.matches[0].reasoning,
            recommendation: job.matches[0].recommendation,
          }
        : null,
      application: job.application
        ? {
            id: job.application.id,
            jobId: job.application.jobId,
            status: job.application.status,
            appliedDate: job.application.appliedDate ? job.application.appliedDate.toISOString() : null,
            notes: job.application.notes,
            cvVersion: job.application.cvVersion,
            interviewDates: job.application.interviewDates,
            lastUpdated: job.application.updatedAt.toISOString(),
          }
        : null,
    };

    return {
      jobId,
      job: formattedJob,
      jobAnalyzed: Boolean(job.matches.length > 0),
      cvGenerated: Boolean(latestResume),
      atsAnalyzed: Boolean(latestAtsAnalysis),
      coverLetterGenerated: Boolean(latestCoverLetter),
      screeningInputNeeded,
      screeningTotalCount: screeningQuestions.length,
      latestResume,
      latestAtsAnalysis,
      latestCoverLetter,
      screeningQuestions,
    };
  }

  /**
   * Application Queue: Grouping opportunities by operational state:
   * READY TO APPLY, NEEDS YOUR INPUT, CV READY, APPLIED, INTERVIEW, REJECTED.
   */
  static async getApplicationQueue(): Promise<ApplicationQueueGroup> {
    const jobs = await prisma.job.findMany({
      include: {
        matches: { orderBy: { createdAt: 'desc' }, take: 1 },
        resumeVersions: { orderBy: { createdAt: 'desc' }, take: 1 },
        coverLetters: { orderBy: { createdAt: 'desc' }, take: 1 },
        screeningQuestions: true,
        application: true,
      },
      orderBy: { postedAt: 'desc' },
      take: 100,
    });

    const readyToApply: any[] = [];
    const needsInput: any[] = [];
    const cvReady: any[] = [];
    const applied: any[] = [];
    const interview: any[] = [];
    const rejected: any[] = [];

    for (const j of jobs) {
      const appStatus = j.application?.status;

      // Pipeline status overrides
      if (appStatus === 'APPLIED') {
        applied.push(j);
        continue;
      }
      if (appStatus === 'INTERVIEW') {
        interview.push(j);
        continue;
      }
      if (appStatus === 'REJECTED') {
        rejected.push(j);
        continue;
      }

      const hasCv = j.resumeVersions.length > 0;
      const hasCoverLetter = j.coverLetters.length > 0;
      const pendingScreening = j.screeningQuestions.filter((q) => q.requiresUserInput && !q.userAnswer).length;

      if (pendingScreening > 0) {
        needsInput.push(j);
      } else if (hasCv && hasCoverLetter) {
        readyToApply.push(j);
      } else if (hasCv) {
        cvReady.push(j);
      }
    }

    return {
      readyToApply,
      needsInput,
      cvReady,
      applied,
      interview,
      rejected,
    };
  }
}
