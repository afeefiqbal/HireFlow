/**
 * HIREflow — Continuous Discovery & Autonomous Workflow Orchestrator
 * 
 * Periodically or on-demand discovers real jobs from Greenhouse, Lever, Ashby, and Arbeitnow,
 * matches them against Candidate Ground Truth, assigns Opportunity Tiers, auto-prepares
 * qualifying applications, and executes verified auto-apply when all gates pass.
 */

import { PrismaClient } from '@prisma/client';
import {
  OpportunityTier,
  QualifiedOpportunity,
  SubmissionMechanism,
} from '@ai-job-agent/shared';
import { DiscoveryService } from './discovery.service';
import { MatchingService } from './matching.service';
import { PreparationService } from './preparation.service';
import { AutoApplyService } from './auto-apply/auto-apply.service';

const prisma = new PrismaClient();

export class ContinuousDiscoveryService {
  private static workerInterval: NodeJS.Timeout | null = null;
  private static isRunningCycle = false;
  private static lastRunTimestamp: Date | null = null;

  /**
   * Runs one complete autonomous discovery, matching, preparation, and submission cycle.
   */
  static async runContinuousDiscoveryCycle(): Promise<{
    scanned: number;
    newJobs: number;
    analyzed: number;
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    autoAppliedCount: number;
  }> {
    if (this.isRunningCycle) {
      console.log('[ContinuousDiscovery] Cycle already in progress. Skipping duplicate run.');
      return { scanned: 0, newJobs: 0, analyzed: 0, tier1Count: 0, tier2Count: 0, tier3Count: 0, autoAppliedCount: 0 };
    }

    this.isRunningCycle = true;
    this.lastRunTimestamp = new Date();

    try {
      console.log('🔄 [ContinuousDiscovery] Starting autonomous discovery cycle...');

      // 1. Discover jobs from all supported sources
      const discoveryResult = await DiscoveryService.runRealJobDiscovery();

      // 2. Find jobs that have not yet been analyzed against active CandidateProfile
      const unanalyzedJobs = await prisma.job.findMany({
        where: {
          matches: { none: {} },
        },
        take: 20, // Safe batch size per cycle
        orderBy: { discoveredAt: 'desc' },
      });

      let analyzedCount = 0;
      for (const job of unanalyzedJobs) {
        try {
          await MatchingService.analyzeJob(job.id);
          analyzedCount++;
        } catch (err: any) {
          console.warn(`[ContinuousDiscovery] Error analyzing job ${job.id}:`, err.message);
        }
      }

      // 3. Fetch all active candidate matches to evaluate opportunity tiers
      const qualified = await this.getQualifiedOpportunities();

      let tier1Count = 0;
      let tier2Count = 0;
      let tier3Count = 0;
      let autoAppliedCount = 0;

      const autoApplyConfig = await AutoApplyService.getConfig();

      for (const opp of qualified) {
        if (opp.tier === 'DASHBOARD_QUALIFIED') tier1Count++;
        if (opp.tier === 'AUTO_PREPARED') tier2Count++;
        if (opp.tier === 'AUTO_APPLY_ELIGIBLE') tier3Count++;

        // 4. Automatic Preparation for Tier 2+ opportunities
        if (['AUTO_PREPARED', 'AUTO_APPLY_ELIGIBLE'].includes(opp.tier) && !opp.preparationStatus.cvReady) {
          try {
            await PreparationService.autoPrepareApplication(opp.job.id);
          } catch (err: any) {
            console.warn(`[ContinuousDiscovery] Auto-prepare failed for ${opp.job.id}:`, err.message);
          }
        }

        // 5. Fully Autonomous Submission (Tier 4)
        if (
          autoApplyConfig.enabled &&
          opp.matchScore >= autoApplyConfig.autonomousThreshold &&
          opp.autoApplyEligible &&
          opp.applicationStatus !== 'APPLIED'
        ) {
          try {
            console.log(`🚀 [ContinuousDiscovery] Submitting autonomous application for ${opp.job.title} at ${opp.job.company}...`);
            const subResult = await AutoApplyService.submit(opp.job.id, { dryRun: false });
            if (subResult.success) {
              autoAppliedCount++;
            }
          } catch (err: any) {
            console.warn(`[ContinuousDiscovery] Autonomous apply failed for ${opp.job.id}:`, err.message);
          }
        }
      }

      console.log(`✅ [ContinuousDiscovery] Cycle completed. New: ${discoveryResult.newSaved}, Analyzed: ${analyzedCount}, Qualified: ${qualified.length}, Auto-Applied: ${autoAppliedCount}`);

      return {
        scanned: discoveryResult.totalScanned,
        newJobs: discoveryResult.newSaved,
        analyzed: analyzedCount,
        tier1Count,
        tier2Count,
        tier3Count,
        autoAppliedCount,
      };
    } finally {
      this.isRunningCycle = false;
    }
  }

  /**
   * Retrieves all qualified opportunities and computes their exact Opportunity Tier.
   */
  static async getQualifiedOpportunities(): Promise<QualifiedOpportunity[]> {
    const [jobs, config, todayCount] = await Promise.all([
      prisma.job.findMany({
        where: {
          roleFamily: { not: 'OTHER' },
          matches: {
            some: {
              overallMatch: { gte: 70 },
            },
          },
        },
        include: {
          matches: { orderBy: { overallMatch: 'desc' }, take: 1 },
          resumeVersions: { orderBy: { createdAt: 'desc' }, take: 1 },
          coverLetters: { orderBy: { createdAt: 'desc' }, take: 1 },
          screeningQuestions: true,
          application: true,
        },
        orderBy: { discoveredAt: 'desc' },
      }),
      AutoApplyService.getConfig(),
      AutoApplyService.getTodayAutoApplyCount(),
    ]);

    const results: QualifiedOpportunity[] = [];

    for (const job of jobs) {
      const match = job.matches[0];
      if (!match) continue;

      const score = match.overallMatch;
      const roleFamilyPass = (job.roleFamily as any) !== 'OTHER';

      // Tier 1 Gate: Minimum 70% match and Role Family Match Pass
      if (score < 70 || !roleFamilyPass) {
        continue;
      }

      const hasResume = job.resumeVersions.length > 0;
      const hasCoverLetter = job.coverLetters.length > 0;
      const hasScreening = job.screeningQuestions.length > 0;
      const pendingQuestions = job.screeningQuestions.filter((q) => q.requiresUserInput && !q.userAnswer);

      const adapter = AutoApplyService.getAdapterForJob(job);
      const atsMechanism: SubmissionMechanism = adapter.mechanism;

      let tier: OpportunityTier = 'DASHBOARD_QUALIFIED';
      let tierReason = 'Qualified for dashboard review (score >= 70%)';

      // Tier progression logic
      if (job.application?.status === 'APPLIED') {
        tier = 'APPLIED';
        tierReason = 'Application successfully submitted and verified';
      } else if (score >= 80 && hasResume && hasCoverLetter && pendingQuestions.length === 0 && atsMechanism !== 'MANUAL_EXTERNAL') {
        tier = 'AUTO_APPLY_ELIGIBLE';
        tierReason = 'All gates passed: score >= 80%, fully prepared, supported ATS, ready for 1-click apply';
      } else if (score >= 75) {
        tier = 'AUTO_PREPARED';
        tierReason = 'Auto-preparation threshold met (score >= 75%)';
      }

      const eligibility = AutoApplyService.evaluateEligibilityWithJob(job, config, todayCount);

      results.push({
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
          roleFamily: job.roleFamily as any,
          seniority: job.seniority as any,
          remoteType: job.remoteType as any,
          visaSponsorship: job.visaSponsorship as any,
          createdAt: job.createdAt.toISOString(),
          updatedAt: job.updatedAt.toISOString(),
        } as any,
        matchScore: score,
        roleFamilyPass,
        tier,
        tierReason,
        atsMechanism,
        autoApplyEligible: eligibility.isEligible,
        autoApplyIneligibleReason: eligibility.isEligible ? undefined : eligibility.reason,
        preparationStatus: {
          cvReady: hasResume,
          coverLetterReady: hasCoverLetter,
          screeningReady: hasScreening,
          pendingQuestionsCount: pendingQuestions.length,
        },
        applicationStatus: job.application?.status || null,
        applicationId: job.application?.id || null,
        submissionReceipt: (job.application?.submissionReceipt as any) || null,
      });
    }

    // Sort by match score descending, then by tier
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Starts safe background runner
   */
  static startBackgroundWorker(intervalMs: number = 3600000) {
    if (this.workerInterval) return;
    console.log(`⏰ [ContinuousDiscovery] Background discovery worker scheduled (interval: ${intervalMs / 1000}s)`);
    this.workerInterval = setInterval(() => {
      this.runContinuousDiscoveryCycle().catch((err) => {
        console.error('[ContinuousDiscovery] Background worker error:', err);
      });
    }, intervalMs);
  }

  /**
   * Stops background runner
   */
  static stopBackgroundWorker() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
      console.log('🛑 [ContinuousDiscovery] Background discovery worker stopped');
    }
  }

  static getStatus() {
    return {
      isRunningCycle: this.isRunningCycle,
      lastRunTimestamp: this.lastRunTimestamp?.toISOString() || null,
      isWorkerActive: this.workerInterval !== null,
    };
  }
}
