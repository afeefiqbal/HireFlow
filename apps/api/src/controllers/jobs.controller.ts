import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { JobFilterService } from '../services/job-filter.service';

const prisma = new PrismaClient();

export class JobsController {
  static async getJobs(req: Request, res: Response) {
    try {
      const {
        search,
        freshOnly = 'false',
        role,
        technology,
        location,
        remoteOnly = 'false',
        minMatchScore,
        visaStatus,
        source,
        roleFamily,
        seniority,
        remoteType,
        freshnessStatus,
        visaSponsorship,
        page = '1',
        limit = '20',
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const take = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * take;

      const where: Prisma.JobWhereInput = {};

      // Strict 24h filter requirement
      if (freshOnly === 'true' || freshOnly === '1') {
        where.ageStatus = 'FRESH';
      }

      if (remoteOnly === 'true' || remoteOnly === '1') {
        where.isRemote = true;
      }

      if (visaStatus && visaStatus !== 'ALL') {
        where.visaStatus = visaStatus as any;
      }

      if (visaSponsorship && visaSponsorship !== 'ALL') {
        where.visaSponsorship = visaSponsorship as string;
      }

      if (roleFamily && roleFamily !== 'ALL') {
        where.roleFamily = roleFamily as string;
      }

      if (seniority && seniority !== 'ALL') {
        where.seniority = seniority as string;
      }

      if (remoteType && remoteType !== 'ALL') {
        where.remoteType = remoteType as string;
      }

      if (freshnessStatus && freshnessStatus !== 'ALL') {
        where.freshnessStatus = freshnessStatus as string;
      }

      if (source) {
        where.source = { contains: source as string, mode: 'insensitive' };
      }

      if (location) {
        where.location = { contains: location as string, mode: 'insensitive' };
      }

      if (search) {
        const q = (search as string).trim();
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { techStack: { has: q } },
        ];
      }

      if (technology) {
        where.techStack = { has: technology as string };
      }

      if (role) {
        where.title = { contains: role as string, mode: 'insensitive' };
      }

      if (minMatchScore) {
        const minScore = parseInt(minMatchScore as string, 10);
        where.matches = {
          some: {
            overallMatch: { gte: minScore },
          },
        };
      }

      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          include: {
            matches: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            application: {
              select: {
                id: true,
                status: true,
                appliedDate: true,
                notes: true,
              },
            },
          },
          orderBy: [
            { postedAt: 'desc' },
            { discoveredAt: 'desc' },
          ],
          skip,
          take,
        }),
        prisma.job.count({ where }),
      ]);

      const formattedJobs = jobs.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        isRemote: job.isRemote,
        employmentType: job.employmentType,
        postedAt: job.postedAt,
        discoveredAt: job.discoveredAt,
        jobAgeHours: job.jobAgeHours,
        ageStatus: job.ageStatus,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        visaStatus: job.visaStatus,
        experienceRequired: job.experienceRequired,
        techStack: job.techStack,
        description: job.description,
        requirements: job.requirements,
        preferredSkills: job.preferredSkills,
        applicationUrl: job.applicationUrl,
        canonicalUrl: job.canonicalUrl,
        source: job.source,

        // V4 Intelligence Fields
        sourceJobId: job.sourceJobId,
        sourceIdentity: job.sourceIdentity,
        canonicalIdentity: job.canonicalIdentity,
        locations: job.locations,
        remoteType: job.remoteType,
        remoteEvidence: job.remoteEvidence,
        postedAtSource: job.postedAtSource,
        freshnessStatus: job.freshnessStatus,
        seniority: job.seniority,
        roleFamily: job.roleFamily,
        visaSponsorship: job.visaSponsorship,
        visaEvidence: job.visaEvidence,
        relocation: job.relocation,
        relocationEvidence: job.relocationEvidence,
        responsibilities: job.responsibilities,
        technologyEvidence: job.technologyEvidence,
        normalizedCompany: job.normalizedCompany,
        normalizedTitle: job.normalizedTitle,
        whyThisJob: job.whyThisJob,
        applicationPriority: job.applicationPriority,
        priorityReasons: job.priorityReasons,

        latestMatch: job.matches[0]
          ? {
              id: job.matches[0].id,
              jobId: job.id,
              overall_match: job.matches[0].overallMatch,
              technical_match: job.matches[0].technicalMatch,
              experience_match: job.matches[0].experienceMatch,
              location_match: job.matches[0].locationMatch,
              visa_compatibility: job.matches[0].visaCompatibility,
              strong_matches: job.matches[0].strongMatches || [],
              missing_requirements: job.matches[0].missingRequirements || [],
              concerns: job.matches[0].concerns || [],
              reasoning: job.matches[0].reasoning || [],
              recommendation: job.matches[0].recommendation,
              createdAt: job.matches[0].createdAt.toISOString(),
            }
          : null,
        application: job.application,
      }));

      return res.json({
        success: true,
        data: formattedJobs,
        meta: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getJobById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const job = await prisma.job.findUnique({
        where: { id },
        include: {
          matches: {
            orderBy: { createdAt: 'desc' },
          },
          application: {
            include: {
              events: { orderBy: { createdAt: 'desc' } },
            },
          },
        },
      });

      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      return res.json({
        success: true,
        data: {
          ...job,
          latestMatch: job.matches[0]
            ? {
                id: job.matches[0].id,
                jobId: job.id,
                overall_match: job.matches[0].overallMatch,
                technical_match: job.matches[0].technicalMatch,
                experience_match: job.matches[0].experienceMatch,
                location_match: job.matches[0].locationMatch,
                visa_compatibility: job.matches[0].visaCompatibility,
                strong_matches: job.matches[0].strongMatches || [],
                missing_requirements: job.matches[0].missingRequirements || [],
                concerns: job.matches[0].concerns || [],
                reasoning: job.matches[0].reasoning || [],
                recommendation: job.matches[0].recommendation,
                createdAt: job.matches[0].createdAt.toISOString(),
              }
            : null,
        },
      });
    } catch (error: any) {
      console.error('Error fetching job by id:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async ingestJob(req: Request, res: Response) {
    try {
      const {
        title,
        company,
        location,
        isRemote = false,
        employmentType = 'Full-time',
        postedAt,
        salaryMin,
        salaryMax,
        salaryCurrency = 'EUR',
        experienceRequired,
        techStack = [],
        description,
        requirements = [],
        preferredSkills = [],
        applicationUrl,
        canonicalUrl,
        source,
        sourceJobId,
        sourceUrl,
      } = req.body;

      if (!title || !company || !canonicalUrl) {
        return res.status(400).json({
          success: false,
          message: 'Title, company, and canonicalUrl are required.',
        });
      }

      const { JobPipelineService } = await import('../services/intelligence/job-pipeline.service');
      const result = await JobPipelineService.processAndIngestJob({
        title,
        company,
        location: location || (isRemote ? 'Remote' : 'Unknown'),
        isRemote: Boolean(isRemote),
        employmentType,
        postedAt,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        salaryCurrency,
        experienceRequired,
        techStack,
        description: description || title,
        requirements,
        preferredSkills,
        applicationUrl: applicationUrl || canonicalUrl,
        canonicalUrl,
        source: source || 'External Ingestion',
        sourceJobId,
        sourceUrl,
      });

      return res.status(result.isNew ? 201 : 200).json({
        success: true,
        data: result.job,
        isNew: result.isNew,
        isMerged: result.isMerged,
      });
    } catch (error: any) {
      console.error('Error ingesting job:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getJobIntelligence(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const job = await prisma.job.findUnique({
        where: { id },
        include: {
          matches: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      return res.json({
        success: true,
        data: {
          jobId: job.id,
          title: job.title,
          company: job.company,
          normalizedTitle: job.normalizedTitle,
          normalizedCompany: job.normalizedCompany,
          roleFamily: job.roleFamily,
          seniority: job.seniority,
          remoteType: job.remoteType,
          freshnessStatus: job.freshnessStatus,
          visaSponsorship: job.visaSponsorship,
          visaEvidence: job.visaEvidence,
          relocation: job.relocation,
          relocationEvidence: job.relocationEvidence,
          technologyEvidence: job.technologyEvidence,
          whyThisJob: job.whyThisJob,
          applicationPriority: job.applicationPriority,
          priorityReasons: job.priorityReasons,
          latestMatch: job.matches[0] || null,
        },
      });
    } catch (err: any) {
      console.error('Error fetching job intelligence:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async normalizeJob(req: Request, res: Response) {
    try {
      const { company, title, techStack } = req.body;
      const { JobNormalizer } = await import('../services/intelligence/job-normalizer');
      const normalizedCompany = JobNormalizer.normalizeCompany(company || '');
      const normalizedTitle = JobNormalizer.normalizeTitle(title || '');
      const normalizedTechs = JobNormalizer.normalizeTechnologies(techStack || []);

      return res.json({
        success: true,
        data: {
          originalCompany: company,
          normalizedCompany,
          originalTitle: title,
          normalizedTitle,
          originalTechs: techStack,
          normalizedTechs,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async deduplicateJob(req: Request, res: Response) {
    try {
      const { JobDeduplicator } = await import('../services/intelligence/job-deduplicator');
      const { source, sourceJobId, company, title, location, description, canonicalUrl } = req.body;
      const identities = JobDeduplicator.generateIdentities(
        source || 'external',
        sourceJobId,
        company || '',
        title || '',
        location || '',
        description || '',
        canonicalUrl || ''
      );

      const existing = await prisma.job.findFirst({
        where: {
          OR: [
            { canonicalUrl: canonicalUrl || undefined },
            { canonicalIdentity: identities.canonicalIdentity },
          ],
        },
      });

      return res.json({
        success: true,
        data: {
          identities,
          isDuplicate: Boolean(existing),
          existingJobId: existing ? existing.id : null,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async triggerDiscovery(req: Request, res: Response) {
    try {
      const { DiscoveryService } = await import('../services/discovery.service');
      const results = await DiscoveryService.runRealJobDiscovery();
      return res.json({
        success: true,
        message: 'Real Job Discovery pipeline executed successfully',
        data: results,
      });
    } catch (error: any) {
      console.error('Error running discovery pipeline:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
