import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardController {
  static async getStats(req: Request, res: Response) {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Count discovered today
      const jobsDiscoveredToday = await prisma.job.count({
        where: {
          discoveredAt: { gte: startOfDay },
        },
      });

      // Strict fresh jobs (< 24h)
      const freshJobs24h = await prisma.job.count({
        where: {
          ageStatus: 'FRESH',
        },
      });

      // Strong matches (>= 85%)
      const strongMatchesCount = await prisma.jobMatch.count({
        where: {
          overallMatch: { gte: 85 },
        },
      });

      // Application counts
      const applicationsReady = await prisma.application.count({
        where: { status: 'READY_TO_APPLY' },
      });

      const applicationsSubmitted = await prisma.application.count({
        where: { status: 'APPLIED' },
      });

      const interviewsCount = await prisma.application.count({
        where: { status: 'INTERVIEW' },
      });

      const rejectedCount = await prisma.application.count({
        where: { status: 'REJECTED' },
      });

      const totalActiveApplications = await prisma.application.count({
        where: {
          status: {
            in: ['SAVED', 'CV_READY', 'READY_TO_APPLY', 'APPLIED', 'INTERVIEW', 'OFFER'],
          },
        },
      });

      // Today's strongest matches (Fresh jobs with highest match score)
      const strongestMatches = await prisma.job.findMany({
        where: {
          ageStatus: 'FRESH',
          matches: { some: {} },
        },
        include: {
          matches: {
            orderBy: { overallMatch: 'desc' },
            take: 1,
          },
          application: true,
        },
        orderBy: {
          postedAt: 'desc',
        },
        take: 5,
      });

      const aiCallsToday = await prisma.aiUsage.count({
        where: { createdAt: { gte: startOfDay } },
      });

      const aiUsages = await prisma.aiUsage.findMany({
        where: { createdAt: { gte: startOfDay } },
        select: { inputTokens: true, outputTokens: true },
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
          strongestMatches: strongestMatches.map((j) => ({
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
            overallMatch: j.matches[0]?.overallMatch || 0,
            recommendation: j.matches[0]?.recommendation || 'SKIP',
            applicationStatus: j.application?.status || null,
          })),
          qualifiedOpportunities: await (async () => {
            const { ContinuousDiscoveryService } = await import('../services/continuous-discovery.service');
            return ContinuousDiscoveryService.getQualifiedOpportunities();
          })(),
        },
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
