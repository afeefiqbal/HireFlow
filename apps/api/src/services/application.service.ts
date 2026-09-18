/**
 * HIREflow V5 — Application Service
 * 
 * Manages:
 * 1. Deterministic Status Transition Gate (isValidTransition)
 * 2. Immutable Application Snapshot (Phase 5 & 6)
 * 3. Append-Only Application Events (Phase 7)
 * 4. Explicit Last Activity Tracking (Phase 8 & 9)
 * 5. User Notes Persistence (Phase 9 & 10)
 * 6. Follow-up Management (Phase 10 & 11)
 * 7. Factual Application Health Checklist (Phase 11 & 14)
 * 8. Chronological Activity Timeline (Phase 12 & 26)
 */

import { PrismaClient, ApplicationStatus } from '@prisma/client';
import {
  ApplicationDetailRecord,
  ApplicationHealthChecklist,
  ApplicationTimelineItem,
  ApplicationEventItem,
} from '@ai-job-agent/shared';

const prisma = new PrismaClient();

export class ApplicationService {
  /**
   * Deterministic status transition gate.
   * Prevents invalid or impossible state jumps.
   */
  static isValidTransition(
    fromStatus: ApplicationStatus | null | undefined,
    toStatus: ApplicationStatus
  ): boolean {
    if (!fromStatus) {
      // Creation transitions
      return ['DISCOVERED', 'SHORTLISTED', 'SAVED', 'PREPARING', 'CV_READY', 'READY_TO_APPLY'].includes(toStatus);
    }

    if (fromStatus === toStatus) return true;

    // Normalize legacy equivalents for graph traversal
    const normFrom = fromStatus === 'SAVED' ? 'SHORTLISTED' : fromStatus === 'CV_READY' ? 'PREPARING' : fromStatus;
    const normTo = toStatus === 'SAVED' ? 'SHORTLISTED' : toStatus === 'CV_READY' ? 'PREPARING' : toStatus;

    if (normFrom === normTo) return true;

    const ALLOWED: Record<string, string[]> = {
      DISCOVERED: ['SHORTLISTED', 'SAVED', 'PREPARING', 'READY_TO_APPLY', 'EXPIRED'],
      SHORTLISTED: ['PREPARING', 'READY_TO_APPLY', 'WITHDRAWN', 'EXPIRED'],
      PREPARING: ['READY_TO_APPLY', 'SHORTLISTED', 'WITHDRAWN', 'EXPIRED'],
      READY_TO_APPLY: ['APPLIED', 'PREPARING', 'WITHDRAWN', 'EXPIRED'],
      APPLIED: ['INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN', 'EXPIRED'],
      INTERVIEW: ['OFFER', 'REJECTED', 'WITHDRAWN', 'EXPIRED'],
      OFFER: ['WITHDRAWN'],
      REJECTED: [],
      WITHDRAWN: [],
      EXPIRED: ['SHORTLISTED', 'PREPARING'],
    };

    const allowedNext = ALLOWED[normFrom] || [];
    return allowedNext.includes(normTo);
  }

  static async listApplications() {
    return prisma.application.findMany({
      include: {
        job: {
          include: {
            matches: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
        notesList: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  static async getApplicationByJobId(jobId: string) {
    return prisma.application.findUnique({
      where: { jobId },
      include: {
        job: true,
        events: { orderBy: { createdAt: 'desc' } },
        notesList: { orderBy: { createdAt: 'desc' } },
        answers: true,
      },
    });
  }

  /**
   * Updates status with deterministic transition gate and immutable snapshot logic.
   */
  static async updateStatus(
    jobId: string,
    toStatus: ApplicationStatus,
    note?: string,
    source: string = 'USER'
  ) {
    const existing = await prisma.application.findUnique({
      where: { jobId },
      include: { events: true },
    });

    // 1. Enforce deterministic transition gate
    const currentStatus = existing?.status || null;
    if (!this.isValidTransition(currentStatus, toStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus || 'NONE'} to ${toStatus}. Transition rejected by HIREflow lifecycle gate.`
      );
    }

    let cvVersion = existing?.cvVersion || null;
    let coverLetterId = existing?.coverLetterId || null;
    let snapshotData: any = null;
    let screeningQs: any[] = [];
    const now = new Date();

    // 2. Snapshot Finalization & Immutability (Phase 5 & 6)
    if (toStatus === 'APPLIED') {
      if (existing?.snapshotJson) {
        // IMMUTABILITY: Never overwrite an existing finalized snapshot
        snapshotData = existing.snapshotJson;
      } else {
        // First time APPLIED: freeze exact artifacts, candidate ground truth, and questions
        const [job, prep, latestResumeVer, latestCl, questions, profile] = await Promise.all([
          prisma.job.findUnique({ where: { id: jobId } }),
          prisma.applicationPreparation.findUnique({ where: { jobId } }),
          prisma.resumeVersion.findFirst({
            where: { jobId },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.coverLetter.findFirst({
            where: { jobId },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.screeningQuestion.findMany({
            where: { jobId },
            orderBy: { createdAt: 'asc' },
          }),
          prisma.candidateProfile.findFirst(),
        ]);

        screeningQs = questions;
        cvVersion = prep?.latestResumeVersionId || latestResumeVer?.id || null;
        coverLetterId = prep?.latestCoverLetterId || latestCl?.id || null;

        if (job) {
          const resumeContent = latestResumeVer ? (latestResumeVer.contentJson as any) : null;
          const commonAnswers = (profile?.commonAnswers as any) || {};

          snapshotData = {
            jobTitle: job.title,
            company: job.company,
            applicationUrl: job.applicationUrl,
            source: job.source,
            appliedDate: now.toISOString(),
            candidate: {
              fullName: profile?.fullName || 'Afeef Iqbal',
              headline: profile?.headline || '',
              location: profile?.location || '',
              noticePeriod: commonAnswers.noticePeriod || '30 days',
              visaSponsorship: commonAnswers.visaSponsorship || 'Required',
              workAuthorization: commonAnswers.workAuthorization || '',
            },
            resume: {
              versionId: latestResumeVer?.id,
              versionName: latestResumeVer?.versionName || 'v1',
              targetRole: latestResumeVer?.targetRole || resumeContent?.targetRole,
              summary: resumeContent?.summary,
            },
            coverLetter: latestCl
              ? {
                  id: latestCl.id,
                  version: 'v1',
                  fullText: latestCl.bodyText,
                  content: latestCl.bodyText,
                }
              : null,
            screeningAnswers: screeningQs.map((q) => ({
              question: q.question,
              answer: q.userAnswer || q.suggestedAnswer || '',
              source: q.userAnswer
                ? 'USER_PROVIDED'
                : q.requiresUserInput
                ? 'USER_INPUT_REQUIRED'
                : 'AI_VERIFIED',
              requiresUserInput: q.requiresUserInput,
            })),
          };
        }
      }
    }

    let applicationRecord;

    if (!existing) {
      // Create new application record
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job) throw new Error('Job not found');

      applicationRecord = await prisma.application.create({
        data: {
          jobId,
          status: toStatus,
          applicationUrl: job.applicationUrl,
          notes: note || `Application initialized to ${toStatus}`,
          appliedDate: toStatus === 'APPLIED' ? now : null,
          cvVersion,
          coverLetterId,
          snapshotJson: snapshotData || undefined,
          lastActivityAt: now,
          events: {
            create: {
              type: toStatus === 'APPLIED' ? 'APPLIED' : 'CREATED',
              fromStatus: null,
              toStatus,
              source,
              note: note || `Created in ${toStatus}`,
              createdAt: now,
            },
          },
        },
        include: { events: true, notesList: true },
      });
    } else {
      applicationRecord = await prisma.application.update({
        where: { jobId },
        data: {
          status: toStatus,
          notes: note ? `${existing.notes ? existing.notes + '\n' : ''}${note}` : existing.notes,
          appliedDate: toStatus === 'APPLIED' && !existing.appliedDate ? now : existing.appliedDate,
          cvVersion: toStatus === 'APPLIED' && !existing.cvVersion ? cvVersion : existing.cvVersion,
          coverLetterId: toStatus === 'APPLIED' && !existing.coverLetterId ? coverLetterId : existing.coverLetterId,
          snapshotJson: existing.snapshotJson || snapshotData || undefined, // Freeze existing snapshot
          lastActivityAt: now,
          events: {
            create: {
              type: toStatus === 'APPLIED' ? 'APPLIED' : 'STATUS_CHANGED',
              fromStatus: existing.status,
              toStatus,
              source,
              note: note || `Status updated to ${toStatus}`,
              createdAt: now,
            },
          },
        },
        include: { events: true, notesList: true },
      });
    }

    // Persist relational answers on initial APPLIED transition
    if (toStatus === 'APPLIED' && screeningQs.length > 0 && !existing?.snapshotJson) {
      try {
        await prisma.applicationAnswer.deleteMany({ where: { applicationId: applicationRecord.id } });
        await prisma.applicationAnswer.createMany({
          data: screeningQs.map((q) => ({
            applicationId: applicationRecord.id,
            question: q.question,
            answer: q.userAnswer || q.suggestedAnswer || '',
            isAiGenerated: !q.userAnswer,
          })),
        });
      } catch (err) {
        console.warn('[ApplicationService] Failed to sync application answers:', err);
      }
    }

    return applicationRecord;
  }

  /**
   * Adds user-provided note and records append-only NOTE_ADDED event.
   */
  static async addNote(applicationId: string, content: string, source: string = 'USER') {
    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) throw new Error(`Application not found: ${applicationId}`);

    const now = new Date();
    const note = await prisma.applicationNote.create({
      data: {
        applicationId,
        content,
        createdAt: now,
        updatedAt: now,
      },
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: { lastActivityAt: now },
    });

    await prisma.applicationEvent.create({
      data: {
        applicationId,
        type: 'NOTE_ADDED',
        fromStatus: application.status,
        toStatus: application.status,
        source,
        note: content.length > 80 ? `${content.slice(0, 77)}...` : content,
        metadata: { noteId: note.id },
        createdAt: now,
      },
    });

    return note;
  }

  /**
   * Sets, edits, or clears nextFollowUpAt date and records append-only FOLLOW_UP_SET event.
   */
  static async setFollowUp(applicationId: string, nextFollowUpAt: Date | string | null, source: string = 'USER') {
    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) throw new Error(`Application not found: ${applicationId}`);

    const dateVal = nextFollowUpAt ? new Date(nextFollowUpAt) : null;
    const now = new Date();

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        nextFollowUpAt: dateVal,
        lastActivityAt: now,
      },
    });

    await prisma.applicationEvent.create({
      data: {
        applicationId,
        type: 'FOLLOW_UP_SET',
        fromStatus: application.status,
        toStatus: application.status,
        source,
        note: dateVal ? `Follow-up scheduled for ${dateVal.toISOString().split('T')[0]}` : 'Follow-up cleared',
        metadata: { nextFollowUpAt: dateVal ? dateVal.toISOString() : null },
        createdAt: now,
      },
    });

    return updated;
  }

  /**
   * Fetches full application details, active snapshot, notes, and factual health checklist.
   */
  static async getApplicationDetail(idOrJobId: string): Promise<ApplicationDetailRecord> {
    const application = await prisma.application.findFirst({
      where: {
        OR: [{ id: idOrJobId }, { jobId: idOrJobId }],
      },
      include: {
        job: {
          include: {
            matches: { orderBy: { createdAt: 'desc' }, take: 1 },
            resumeVersions: { orderBy: { createdAt: 'desc' }, take: 1 },
            coverLetters: { orderBy: { createdAt: 'desc' }, take: 1 },
            screeningQuestions: true,
          },
        },
        events: { orderBy: { createdAt: 'desc' } },
        notesList: { orderBy: { createdAt: 'desc' } },
        answers: true,
      },
    });

    if (!application) {
      // Check if this is a valid jobId without an Application record yet.
      // Auto-bootstrap a SHORTLISTED application so the workspace can load.
      const jobExists = await prisma.job.findUnique({ where: { id: idOrJobId } });
      if (!jobExists) {
        throw new Error(`Application not found for id/jobId: ${idOrJobId}`);
      }

      // Create the Application record with an initial SHORTLISTED event
      await prisma.application.create({
        data: {
          jobId: idOrJobId,
          status: 'SHORTLISTED',
          lastActivityAt: new Date(),
          events: {
            create: {
              type: 'STATUS_CHANGED',
              toStatus: 'SHORTLISTED',
              source: 'SYSTEM',
              note: 'Application workspace opened — auto-tracked as SHORTLISTED',
            },
          },
        },
      });

      // Re-fetch with full includes
      return this.getApplicationDetail(idOrJobId);
    }

    const job = application.job;
    const latestResume = job.resumeVersions[0];
    const latestCoverLetter = job.coverLetters[0];
    const screeningQuestions = job.screeningQuestions || [];
    const pendingScreening = screeningQuestions.filter((q) => q.requiresUserInput && !q.userAnswer).length;

    // Follow-up status calculation
    let followUpStatus: 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'NOT_SET' = 'NOT_SET';
    let followUpDaysRemaining: number | null = null;

    if (application.nextFollowUpAt) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const targetDay = new Date(
        application.nextFollowUpAt.getFullYear(),
        application.nextFollowUpAt.getMonth(),
        application.nextFollowUpAt.getDate()
      ).getTime();

      const diffDays = Math.round((targetDay - todayStart) / (1000 * 60 * 60 * 24));
      followUpDaysRemaining = diffDays;

      if (diffDays === 0) {
        followUpStatus = 'TODAY';
      } else if (diffDays > 0) {
        followUpStatus = 'UPCOMING';
      } else {
        followUpStatus = 'OVERDUE';
      }
    }

    const healthChecklist: ApplicationHealthChecklist = {
      resumeReady: Boolean(latestResume),
      resumeVersionName: latestResume?.versionName,
      coverLetterReady: Boolean(latestCoverLetter),
      screeningReady: pendingScreening === 0,
      screeningPendingCount: pendingScreening,
      applicationUrlAvailable: Boolean(job.applicationUrl),
      applicationUrl: job.applicationUrl,
      isApplied: Boolean(application.appliedDate || application.status === 'APPLIED' || application.status === 'INTERVIEW' || application.status === 'OFFER'),
      appliedDate: application.appliedDate ? application.appliedDate.toISOString() : null,
      followUpStatus,
      followUpDaysRemaining,
      nextFollowUpAt: application.nextFollowUpAt ? application.nextFollowUpAt.toISOString() : null,
    };

    const formattedEvents: ApplicationEventItem[] = application.events.map((e) => ({
      id: e.id,
      applicationId: e.applicationId,
      type: e.type,
      fromStatus: e.fromStatus as any,
      toStatus: e.toStatus as any,
      source: e.source,
      note: e.note,
      metadata: e.metadata,
      timestamp: e.createdAt.toISOString(),
      createdAt: e.createdAt.toISOString(),
    }));

    const formattedNotes = application.notesList.map((n) => ({
      id: n.id,
      applicationId: n.applicationId,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));

    return {
      id: application.id,
      jobId: application.jobId,
      status: application.status as any,
      appliedDate: application.appliedDate ? application.appliedDate.toISOString() : null,
      notes: application.notes,
      cvVersion: application.cvVersion,
      interviewDates: application.interviewDates,
      nextFollowUpAt: application.nextFollowUpAt ? application.nextFollowUpAt.toISOString() : null,
      lastActivityAt: application.lastActivityAt.toISOString(),
      lastUpdated: application.updatedAt.toISOString(),
      snapshotJson: (application.snapshotJson as any) || null,
      job: {
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
        techStack: job.techStack,
        description: job.description,
        requirements: job.requirements,
        preferredSkills: job.preferredSkills,
        applicationUrl: job.applicationUrl,
        canonicalUrl: job.canonicalUrl,
        source: job.source,
        visaStatus: job.visaStatus as any,
        roleFamily: job.roleFamily as any,
        seniority: job.seniority as any,
        remoteType: job.remoteType as any,
        visaSponsorship: job.visaSponsorship as any,
        applicationPriority: job.applicationPriority,
        priorityReasons: job.priorityReasons,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      },
      events: formattedEvents,
      notesList: formattedNotes,
      healthChecklist,
    };
  }

  /**
   * Fetches chronological activity timeline across all applications.
   */
  static async getApplicationTimeline(limit: number = 50): Promise<ApplicationTimelineItem[]> {
    const events = await prisma.applicationEvent.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        application: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                company: true,
              },
            },
          },
        },
      },
    });

    return events.map((e) => ({
      id: e.id,
      applicationId: e.applicationId,
      jobId: e.application.job.id,
      jobTitle: e.application.job.title,
      company: e.application.job.company,
      type: e.type,
      fromStatus: e.fromStatus as any,
      toStatus: e.toStatus as any,
      source: e.source,
      note: e.note,
      metadata: e.metadata,
      timestamp: e.createdAt.toISOString(),
    }));
  }
}
