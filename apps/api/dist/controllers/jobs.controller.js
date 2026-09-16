"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsController = void 0;
const client_1 = require("@prisma/client");
const job_filter_service_1 = require("../services/job-filter.service");
const prisma = new client_1.PrismaClient();
class JobsController {
    static async getJobs(req, res) {
        try {
            const { search, freshOnly = 'false', role, technology, location, remoteOnly = 'false', minMatchScore, visaStatus, source, page = '1', limit = '20', } = req.query;
            const pageNum = Math.max(1, parseInt(page, 10));
            const take = Math.min(50, Math.max(1, parseInt(limit, 10)));
            const skip = (pageNum - 1) * take;
            const where = {};
            // Strict 24h filter requirement
            if (freshOnly === 'true' || freshOnly === '1') {
                where.ageStatus = 'FRESH';
            }
            if (remoteOnly === 'true' || remoteOnly === '1') {
                where.isRemote = true;
            }
            if (visaStatus && visaStatus !== 'ALL') {
                where.visaStatus = visaStatus;
            }
            if (source) {
                where.source = { contains: source, mode: 'insensitive' };
            }
            if (location) {
                where.location = { contains: location, mode: 'insensitive' };
            }
            if (search) {
                const q = search.trim();
                where.OR = [
                    { title: { contains: q, mode: 'insensitive' } },
                    { company: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                    { techStack: { has: q } },
                ];
            }
            if (technology) {
                where.techStack = { has: technology };
            }
            if (role) {
                where.title = { contains: role, mode: 'insensitive' };
            }
            if (minMatchScore) {
                const minScore = parseInt(minMatchScore, 10);
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
        }
        catch (error) {
            console.error('Error fetching jobs:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getJobById(req, res) {
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
                            strong_matches: job.matches[0].strongMatches,
                            missing_requirements: job.matches[0].missingRequirements,
                            concerns: job.matches[0].concerns,
                            reasoning: job.matches[0].reasoning,
                            recommendation: job.matches[0].recommendation,
                            createdAt: job.matches[0].createdAt.toISOString(),
                        }
                        : null,
                },
            });
        }
        catch (error) {
            console.error('Error fetching job by id:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    static async ingestJob(req, res) {
        try {
            const { title, company, location, isRemote = false, employmentType = 'Full-time', postedAt, salaryMin, salaryMax, salaryCurrency = 'EUR', visaStatus = 'NOT_STATED', experienceRequired, techStack = [], description, requirements = [], preferredSkills = [], applicationUrl, canonicalUrl, source, sourceUrl, } = req.body;
            if (!title || !company || !canonicalUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, company, and canonicalUrl are required.',
                });
            }
            // Check deduplication
            const existing = await prisma.job.findUnique({
                where: { canonicalUrl },
            });
            if (existing) {
                return res.status(200).json({
                    success: true,
                    message: 'Job already exists. Skipped duplicate.',
                    data: existing,
                });
            }
            // 24-hour evaluation
            const ageEvaluation = job_filter_service_1.JobFilterService.evaluatePostingAge(postedAt);
            const newJob = await prisma.job.create({
                data: {
                    title,
                    company,
                    location: location || (isRemote ? 'Remote' : 'Unknown'),
                    isRemote: Boolean(isRemote),
                    employmentType,
                    postedAt: postedAt ? new Date(postedAt) : null,
                    jobAgeHours: ageEvaluation.jobAgeHours,
                    ageStatus: ageEvaluation.ageStatus,
                    salaryMin: salaryMin ? Number(salaryMin) : null,
                    salaryMax: salaryMax ? Number(salaryMax) : null,
                    salaryCurrency,
                    visaStatus,
                    experienceRequired,
                    techStack,
                    description: description || title,
                    requirements,
                    preferredSkills,
                    applicationUrl: applicationUrl || canonicalUrl,
                    canonicalUrl,
                    source: source || 'External Ingestion',
                    sourceUrl,
                },
            });
            return res.status(201).json({
                success: true,
                data: newJob,
            });
        }
        catch (error) {
            console.error('Error ingesting job:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    static async triggerDiscovery(req, res) {
        try {
            const { DiscoveryService } = await Promise.resolve().then(() => __importStar(require('../services/discovery.service')));
            const results = await DiscoveryService.runRealJobDiscovery();
            return res.json({
                success: true,
                message: 'Real Job Discovery pipeline executed successfully',
                data: results,
            });
        }
        catch (error) {
            console.error('Error running discovery pipeline:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.JobsController = JobsController;
