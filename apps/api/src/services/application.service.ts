import { PrismaClient, ApplicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class ApplicationService {
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
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async getApplicationByJobId(jobId: string) {
    return prisma.application.findUnique({
      where: { jobId },
      include: {
        job: true,
        events: { orderBy: { createdAt: 'desc' } },
        answers: true,
      },
    });
  }

  static async updateStatus(jobId: string, toStatus: ApplicationStatus, note?: string) {
    const existing = await prisma.application.findUnique({
      where: { jobId },
    });

    let cvVersion = null;
    let coverLetterId = null;
    let snapshotData: any = null;
    let screeningQs: any[] = [];

    if (toStatus === 'APPLIED') {
      const [job, prep, latestResumeVer, latestCl, questions] = await Promise.all([
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
      ]);

      screeningQs = questions;

      if (prep) {
        cvVersion = prep.latestResumeVersionId || latestResumeVer?.id || null;
        coverLetterId = prep.latestCoverLetterId || latestCl?.id || null;
      } else {
        cvVersion = latestResumeVer?.id || null;
        coverLetterId = latestCl?.id || null;
      }

      if (job) {
        const resumeContent = latestResumeVer ? (latestResumeVer.contentJson as any) : null;
        snapshotData = {
          jobTitle: job.title,
          company: job.company,
          appliedDate: new Date().toISOString(),
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
          appliedDate: toStatus === 'APPLIED' ? new Date() : null,
          cvVersion,
          coverLetterId,
          snapshotJson: snapshotData || undefined,
          events: {
            create: {
              fromStatus: null,
              toStatus,
              note: note || `Created in ${toStatus}`,
            },
          },
        },
        include: { events: true },
      });
    } else {
      applicationRecord = await prisma.application.update({
        where: { jobId },
        data: {
          status: toStatus,
          notes: note ? `${existing.notes ? existing.notes + '\n' : ''}${note}` : existing.notes,
          appliedDate: toStatus === 'APPLIED' && !existing.appliedDate ? new Date() : existing.appliedDate,
          cvVersion: toStatus === 'APPLIED' ? cvVersion : existing.cvVersion,
          coverLetterId: toStatus === 'APPLIED' ? coverLetterId : existing.coverLetterId,
          snapshotJson: snapshotData || existing.snapshotJson || undefined,
          events: {
            create: {
              fromStatus: existing.status,
              toStatus,
              note: note || `Status updated to ${toStatus}`,
            },
          },
        },
        include: { events: true },
      });
    }

    // Persist relational answers on APPLIED transition
    if (toStatus === 'APPLIED' && screeningQs.length > 0) {
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
}

