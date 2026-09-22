import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ContinuousDiscoveryService } from '../services/continuous-discovery.service';

const prisma = new PrismaClient();

export class DashboardController {
  static async getStats(req: Request, res: Response) {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [
        jobsDiscoveredToday,
        freshJobs24h,
        strongMatchesCount,
        applicationsReady,
        applicationsSubmitted,
        interviewsCount,
        rejectedCount,
        totalActiveApplications,
        topMatches,
        aiCallsToday,
        aiUsages,
        qualifiedOpportunities,
      ] = await Promise.all([
        // Count discovered today
        prisma.job.count({
          where: {
            discoveredAt: { gte: startOfDay },
          },
        }),

        // Strict fresh jobs (< 24h)
        prisma.job.count({
          where: {
            ageStatus: 'FRESH',
          },
        }),

        // Strong matches (>= 75%)
        prisma.jobMatch.count({
          where: {
            overallMatch: { gte: 75 },
          },
        }),

        // Application counts
        prisma.application.count({
          where: { status: 'READY_TO_APPLY' },
        }),

        prisma.application.count({
          where: { status: 'APPLIED' },
        }),

        prisma.application.count({
          where: { status: 'INTERVIEW' },
        }),

        prisma.application.count({
          where: { status: 'REJECTED' },
        }),

        prisma.application.count({
          where: {
            status: {
              in: ['SAVED', 'CV_READY', 'READY_TO_APPLY', 'APPLIED', 'INTERVIEW', 'OFFER'],
            },
          },
        }),

        // Top matches (highest match score with valid role family)
        prisma.jobMatch.findMany({
          where: {
            overallMatch: { gte: 70 },
            job: {
              roleFamily: { not: 'OTHER' },
            },
          },
          orderBy: { overallMatch: 'desc' },
          include: {
            job: {
              include: {
                matches: { orderBy: { overallMatch: 'desc' }, take: 1 },
                application: true,
              },
            },
          },
          take: 5,
        }),

        // AI metrics
        prisma.aiUsage.count({
          where: { createdAt: { gte: startOfDay } },
        }),

        prisma.aiUsage.findMany({
          where: { createdAt: { gte: startOfDay } },
          select: { inputTokens: true, outputTokens: true },
        }),

        // Qualified opportunities stream (Tier 1-3)
        ContinuousDiscoveryService.getQualifiedOpportunities(),
      ]);

      let resolvedTopMatches = topMatches;
      if (resolvedTopMatches.length === 0) {
        resolvedTopMatches = await prisma.jobMatch.findMany({
          orderBy: { overallMatch: 'desc' },
          include: {
            job: {
              include: {
                matches: { orderBy: { overallMatch: 'desc' }, take: 1 },
                application: true,
              },
            },
          },
          take: 5,
        });
      }

      const strongestMatches = resolvedTopMatches.map((m) => {
        const j = m.job;
        return {
          id: j.id,
          title: j.title,
          company: j.company,
          location: j.location,
          isRemote: j.isRemote,
          postedAt: j.postedAt,
          jobAgeHours: j.jobAgeHours,
          ageStatus: j.ageStatus,
          salaryMin: j.salaryMin,
          salaryMax: j.salaryMax,
          salaryCurrency: j.salaryCurrency,
          visaStatus: j.visaStatus,
          techStack: j.techStack,
          description: j.description,
          applicationUrl: j.applicationUrl,
          canonicalUrl: j.canonicalUrl,
          source: j.source,
          overallMatch: m.overallMatch,
          recommendation: m.recommendation || 'APPLY',
          applicationStatus: j.application?.status || null,
        };
      });

      const tokensUsedToday = aiUsages.reduce((acc, curr) => acc + curr.inputTokens + curr.outputTokens, 0);

      return res.json({
        success: true,
        data: {
          stats: {
            jobsDiscoveredToday,
            freshJobs24h,
            strongMatchesCount,
            applicationsReady,
            applicationsSubmitted,
            interviewsCount,
            rejectedCount,
            totalActiveApplications,
          },
          ai: {
            provider: process.env.GROQ_ENABLED !== 'false' ? 'Groq' : 'None',
            model: process.env.GROQ_SMART_MODEL || 'GPT OSS 120B (Mock)',
            status: process.env.GROQ_ENABLED !== 'false' && process.env.GROQ_API_KEY ? 'Connected' : 'Not configured',
            callsToday: aiCallsToday,
            tokensUsedToday: tokensUsedToday,
          },
          strongestMatches,
          qualifiedOpportunities,
        },
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
