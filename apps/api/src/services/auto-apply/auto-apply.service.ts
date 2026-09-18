/**
 * HIREflow — Auto-Apply Service
 * 
 * Orchestrates evaluation of auto-apply eligibility, submission through legitimate adapters,
 * verified receipt tracking, and safe status transitions to APPLIED.
 */

import { PrismaClient } from '@prisma/client';
import {
  AutoApplyEligibilityResult,
  SubmissionMechanism,
  SubmissionReceipt,
  SandboxTestResult,
  AutoApplyConfig,
} from '@ai-job-agent/shared';
import { SubmissionAdapter, ApplicationSubmissionPayload } from './submission-adapter.interface';
import { LeverSubmissionAdapter } from './adapters/lever-submission.adapter';
import { GreenhouseSubmissionAdapter } from './adapters/greenhouse-submission.adapter';
import { ManualFallbackAdapter } from './adapters/manual-fallback.adapter';
import { ApplicationService } from '../application.service';

const prisma = new PrismaClient();

export class AutoApplyService {
  private static adapters: SubmissionAdapter[] = [
    new LeverSubmissionAdapter(),
    new GreenhouseSubmissionAdapter(),
    new ManualFallbackAdapter(),
  ];

  /**
   * Retrieves user's auto-apply configuration.
   */
  static async getConfig(): Promise<AutoApplyConfig> {
    const profile = await prisma.candidateProfile.findFirst();
    const raw = (profile?.autoApplyConfig as any) || {};
    return {
      enabled: Boolean(raw.enabled),
      autonomousThreshold: typeof raw.autonomousThreshold === 'number' ? raw.autonomousThreshold : 85,
      dailyLimit: typeof raw.dailyLimit === 'number' ? raw.dailyLimit : 5,
    };
  }

  /**
   * Resolves the legitimate submission adapter for a given job.
   */
  static getAdapterForJob(job: any): SubmissionAdapter {
    for (const adapter of this.adapters) {
      if (adapter.canHandle(job)) {
        return adapter;
      }
    }
    return new ManualFallbackAdapter();
  }

  /**
   * Counts real applications submitted today by the auto-apply engine.
   */
  static async getTodayAutoApplyCount(): Promise<number> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return prisma.application.count({
      where: {
        status: 'APPLIED',
        appliedDate: { gte: startOfToday },
        events: {
          some: {
            type: 'APPLIED',
            source: 'AUTO_APPLY_ENGINE',
          },
        },
      },
    });
  }

  /**
   * Evaluates all safety and qualification gates for auto-applying to a job.
   */
  static async evaluateEligibility(jobId: string): Promise<AutoApplyEligibilityResult> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        matches: { orderBy: { createdAt: 'desc' }, take: 1 },
        resumeVersions: { orderBy: { createdAt: 'desc' }, take: 1 },
        coverLetters: { orderBy: { createdAt: 'desc' }, take: 1 },
        screeningQuestions: true,
        application: true,
      },
    });

    if (!job) {
      return {
        isEligible: false,
        reason: 'Job not found',
        adapterType: 'MANUAL_EXTERNAL',
        requiresUserInputCount: 0,
      };
    }

    const adapter = this.getAdapterForJob(job);

    // 1. Check if already applied
    if (job.application?.status === 'APPLIED') {
      return {
        isEligible: false,
        reason: 'Application has already been submitted to this opportunity',
        adapterType: adapter.mechanism,
        requiresUserInputCount: 0,
      };
    }

    // 2. Check Match Score (Minimum 80% for auto-apply eligibility)
    const latestMatch = job.matches[0];
    const matchScore = latestMatch?.overallMatch ?? 0;
    const roleFamilyPass = (job.roleFamily as any) !== 'OTHER';

    if (matchScore < 80) {
      return {
        isEligible: false,
        reason: `Match score (${matchScore}%) is below auto-apply threshold (80%)`,
        adapterType: adapter.mechanism,
        requiresUserInputCount: 0,
      };
    }

    if (!roleFamilyPass) {
      return {
        isEligible: false,
        reason: 'Role family mismatch gate blocked auto-apply',
        adapterType: adapter.mechanism,
        requiresUserInputCount: 0,
      };
    }

    // 3. Check Preparation Artifacts
    const hasResume = job.resumeVersions.length > 0;
    const hasCoverLetter = job.coverLetters.length > 0;

    if (!hasResume || !hasCoverLetter) {
      return {
        isEligible: false,
        reason: 'Application materials not fully prepared (missing CV or cover letter)',
        adapterType: adapter.mechanism,
        requiresUserInputCount: 0,
      };
    }

    // 4. Check for screening questions requiring user input
    const pendingQuestions = job.screeningQuestions.filter(
      (q) => q.requiresUserInput && (!q.userAnswer || q.userAnswer.trim().length === 0)
    );

    if (pendingQuestions.length > 0) {
      return {
        isEligible: false,
        reason: `${pendingQuestions.length} screening question(s) require explicit candidate input`,
        adapterType: adapter.mechanism,
        requiresUserInputCount: pendingQuestions.length,
      };
    }

    // 5. Check supported adapter mechanism
    if (adapter.mechanism === 'MANUAL_EXTERNAL') {
      return {
        isEligible: false,
        reason: 'Employer uses an external application system requiring direct manual application',
        adapterType: 'MANUAL_EXTERNAL',
        requiresUserInputCount: 0,
      };
    }

    // 6. Check daily limit
    const config = await this.getConfig();
    const todayCount = await this.getTodayAutoApplyCount();
    if (todayCount >= config.dailyLimit) {
      return {
        isEligible: false,
        reason: `Daily auto-apply limit of ${config.dailyLimit} reached for today (${todayCount} submitted)`,
        adapterType: adapter.mechanism,
        requiresUserInputCount: 0,
      };
    }

    return {
      isEligible: true,
      reason: 'All safety, quality, and technical gates passed. Ready for verified submission.',
      adapterType: adapter.mechanism,
      requiresUserInputCount: 0,
    };
  }

  /**
   * Submits application through legitimate supported adapters.
   * In sandbox mode, validates schema but NEVER marks Application as APPLIED.
   */
  static async submit(
    jobId: string,
    options?: { dryRun?: boolean }
  ): Promise<{
    success: boolean;
    mode: 'LIVE' | 'SANDBOX';
    receipt?: SubmissionReceipt;
    sandboxResult?: SandboxTestResult;
    error?: string;
  }> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        resumeVersions: { orderBy: { createdAt: 'desc' }, take: 1 },
        coverLetters: { orderBy: { createdAt: 'desc' }, take: 1 },
        screeningQuestions: true,
        application: true,
      },
    });

    if (!job) {
      return { success: false, mode: options?.dryRun ? 'SANDBOX' : 'LIVE', error: 'Job not found' };
    }

    // Load active CandidateProfile Ground Truth
    const profile = await prisma.candidateProfile.findFirst({
      include: { user: true },
    });

    if (!profile) {
      return { success: false, mode: options?.dryRun ? 'SANDBOX' : 'LIVE', error: 'Candidate profile not found' };
    }

    // Build standard submission payload
    const latestResumeVer = job.resumeVersions[0];
    const latestCl = job.coverLetters[0];
    const resumeContent = latestResumeVer ? (latestResumeVer.contentJson as any) : null;

    const payload: ApplicationSubmissionPayload = {
      candidate: {
        fullName: profile.fullName || profile.user?.fullName || 'Afeef Iqbal',
        email: profile.user?.email || 'afeef@example.com',
        phone: profile.phone || null,
        location: profile.location || null,
        linkedin: profile.linkedin || null,
        github: profile.github || null,
        portfolio: profile.portfolio || null,
      },
      resume: {
        versionId: latestResumeVer?.id,
        versionName: latestResumeVer?.versionName || 'CV_v1',
        summary: resumeContent?.summary,
        targetRole: latestResumeVer?.targetRole || resumeContent?.targetRole,
        contentJson: resumeContent || {},
      },
      coverLetter: latestCl
        ? {
            id: latestCl.id,
            fullText: latestCl.bodyText,
          }
        : null,
      screeningAnswers: job.screeningQuestions.map((q) => ({
        question: q.question,
        answer: q.userAnswer || q.suggestedAnswer || '',
        requiresUserInput: q.requiresUserInput,
      })),
    };

    const adapter = this.getAdapterForJob(job);

    // -------------------------------------------------------------
    // SANDBOX / DRY-RUN EXECUTION
    // -------------------------------------------------------------
    if (options?.dryRun) {
      const result = await adapter.submit(job as any, payload, { dryRun: true });

      // Save sandbox diagnostic result on application without touching status or analytics
      if (job.application) {
        await prisma.application.update({
          where: { id: job.application.id },
          data: {
            sandboxResult: (result.sandboxResult as any) || undefined,
          },
        });
      }

      return {
        success: result.success,
        mode: 'SANDBOX',
        sandboxResult: result.sandboxResult,
        error: result.error,
      };
    }

    // -------------------------------------------------------------
    // LIVE SUBMISSION EXECUTION
    // -------------------------------------------------------------
    // Check eligibility before real live submission
    const eligibility = await this.evaluateEligibility(jobId);
    if (!eligibility.isEligible) {
      return {
        success: false,
        mode: 'LIVE',
        error: `Submission blocked by eligibility gate: ${eligibility.reason}`,
      };
    }

    const executionResult = await adapter.submit(job as any, payload, { dryRun: false });

    if (!executionResult.success || !executionResult.receipt) {
      // Record failure or manual required event without marking APPLIED
      if (job.application) {
        await prisma.applicationEvent.create({
          data: {
            applicationId: job.application.id,
            type: 'STATUS_CHANGED',
            fromStatus: job.application.status,
            toStatus: job.application.status,
            source: 'AUTO_APPLY_ENGINE',
            note: `Auto-apply attempt: ${executionResult.manualRequiredReason || executionResult.error || 'Submission failed'}`,
            metadata: { error: executionResult.error, isManualRequired: executionResult.isManualRequired },
          },
        });
      }

      return {
        success: false,
        mode: 'LIVE',
        error: executionResult.manualRequiredReason || executionResult.error || 'Submission failed',
      };
    }

    // -------------------------------------------------------------
    // SUBMISSION VERIFIED: TRANSITION APPLICATION TO APPLIED
    // -------------------------------------------------------------
    const receipt = executionResult.receipt;

    // Advance to READY_TO_APPLY if currently in PREPARING / SHORTLISTED / SAVED
    const currentApp = await prisma.application.findUnique({ where: { jobId } });
    if (currentApp && ['PREPARING', 'SHORTLISTED', 'SAVED'].includes(currentApp.status)) {
      await ApplicationService.updateStatus(
        jobId,
        'READY_TO_APPLY',
        'Advanced to READY_TO_APPLY for verified auto-apply submission',
        'AUTO_APPLY_ENGINE'
      );
    }

    // Transition application status and freeze immutable snapshot
    const updatedApplication = await ApplicationService.updateStatus(
      jobId,
      'APPLIED',
      `Auto-applied successfully via ${receipt.mechanism} (Receipt ID: ${receipt.receiptId})`,
      'AUTO_APPLY_ENGINE'
    );

    // Persist verified submission receipt
    await prisma.application.update({
      where: { id: updatedApplication.id },
      data: {
        submissionReceipt: receipt as any,
      },
    });

    return {
      success: true,
      mode: 'LIVE',
      receipt,
    };
  }
}
