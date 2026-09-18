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
            snapshotJson: (job.application.snapshotJson as any) || null,
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
      applicationSnapshot: (job.application?.snapshotJson as any) || null,
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
    const shortlisted: any[] = [];
    const preparing: any[] = [];
    const offer: any[] = [];
    const archived: any[] = [];

    for (const j of jobs) {
      const appStatus = j.application?.status;

      // Pipeline status overrides
      if (appStatus === 'OFFER') {
        offer.push(j);
        continue;
      }
      if (appStatus === 'REJECTED' || appStatus === 'WITHDRAWN' || appStatus === 'EXPIRED') {
        archived.push(j);
        rejected.push(j);
        continue;
      }
      if (appStatus === 'INTERVIEW') {
        interview.push(j);
        continue;
      }
      if (appStatus === 'APPLIED') {
        applied.push(j);
        continue;
      }
      if (appStatus === 'READY_TO_APPLY') {
        readyToApply.push(j);
        continue;
      }
      if (appStatus === 'PREPARING') {
        preparing.push(j);
        cvReady.push(j);
        continue;
      }
      if (appStatus === 'SHORTLISTED' || appStatus === 'SAVED') {
        shortlisted.push(j);
        continue;
      }
      if (appStatus === 'CV_READY') {
        preparing.push(j);
        cvReady.push(j);
        continue;
      }

      const hasCv = j.resumeVersions.length > 0;
      const hasCoverLetter = j.coverLetters.length > 0;
      const pendingScreening = j.screeningQuestions.filter((q) => q.requiresUserInput && !q.userAnswer).length;

      if (pendingScreening > 0) {
        needsInput.push(j);
        preparing.push(j);
      } else if (hasCv && hasCoverLetter) {
        readyToApply.push(j);
      } else if (hasCv) {
        cvReady.push(j);
        preparing.push(j);
      } else {
        shortlisted.push(j);
      }
    }

    return {
      readyToApply,
      needsInput,
      cvReady,
      applied,
      interview,
      rejected,
      shortlisted,
      preparing,
      offer,
      archived,
    };
  }

  /**
   * Orchestrates automatic preparation of all application materials for qualified opportunities:
   * 1. Tailored CV
   * 2. Tailored Cover Letter
   * 3. Screening Questions
   * 4. Updates Application status to PREPARING or READY_TO_APPLY
   */
  static async autoPrepareApplication(jobId: string): Promise<ApplicationPreparationSummary> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        resumeVersions: { take: 1, orderBy: { createdAt: 'desc' } },
        coverLetters: { take: 1, orderBy: { createdAt: 'desc' } },
        screeningQuestions: true,
        application: true,
      },
    });
    if (!job) throw new Error(`Job not found: ${jobId}`);

    // 1. Generate CV if not already generated
    const { ResumeService } = await import('./resume.service');
    if (job.resumeVersions.length === 0) {
      await ResumeService.generateTailoredCv(jobId);
    }

    // 2. Generate Cover Letter if not already generated
    const { CoverLetterService } = await import('./cover-letter.service');
    if (job.coverLetters.length === 0) {
      await CoverLetterService.generateCoverLetter(jobId);
    }

    // 3. Generate Screening Questions if not already generated
    const { ScreeningService } = await import('./screening.service');
    if (job.screeningQuestions.length === 0) {
      await ScreeningService.analyzeScreeningQuestions(jobId);
    }

    // 4. Check for pending user input
    const questions = await prisma.screeningQuestion.findMany({ where: { jobId } });
    const pendingUserInput = questions.filter((q) => q.requiresUserInput && !q.userAnswer).length;

    // 5. Update Application record status to PREPARING or READY_TO_APPLY if safe
    const application = await prisma.application.findUnique({ where: { jobId } });
    const targetStatus = pendingUserInput === 0 ? 'READY_TO_APPLY' : 'PREPARING';

    if (!application) {
      await prisma.application.create({
        data: {
          jobId,
          status: targetStatus,
          lastActivityAt: new Date(),
          events: {
            create: {
              type: 'STATUS_CHANGED',
              toStatus: targetStatus,
              source: 'AUTO_PREPARATION_ENGINE',
              note: `Application automatically prepared (${targetStatus})`,
            },
          },
        },
      });
    } else if (['DISCOVERED', 'SHORTLISTED', 'SAVED'].includes(application.status)) {
      await prisma.application.update({
        where: { jobId },
        data: {
          status: targetStatus,
          lastActivityAt: new Date(),
          events: {
            create: {
              type: 'STATUS_CHANGED',
              fromStatus: application.status,
              toStatus: targetStatus,
              source: 'AUTO_PREPARATION_ENGINE',
              note: `Application automatically prepared (${targetStatus})`,
            },
          },
        },
      });
    }

    return this.getApplicationPreparation(jobId);
  }
}
