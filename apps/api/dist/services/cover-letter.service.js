"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoverLetterService = void 0;
const client_1 = require("@prisma/client");
const ai_service_1 = require("../ai/ai.service");
const prisma = new client_1.PrismaClient();
class CoverLetterService {
    /**
     * Generates a tailored, company-specific cover letter based on candidate ground truth without generic clichés.
     */
    static async generateCoverLetter(jobId) {
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job)
            throw new Error(`Job not found: ${jobId}`);
        const profile = await prisma.candidateProfile.findFirst();
        if (!profile)
            throw new Error('Candidate profile not found');
        const jobFull = `${job.title} ${job.description}`.toLowerCase();
        // ---------------------------------------------------------
        // Groq LLM Dynamic Generation via AiService
        // ---------------------------------------------------------
        const clData = await ai_service_1.AiService.generateCoverLetter(jobId, jobFull, job.company, profile, true);
        const opening = clData.subject || `Application for ${job.title}`;
        const middle = ''; // No longer splitting into opening/middle/closing
        const closing = '';
        const fullText = clData.body || '';
        // Save CoverLetter in DB
        const saved = await prisma.coverLetter.create({
            data: {
                profileId: profile.id,
                jobId,
                title: `Cover Letter - ${job.company} (${job.title})`,
                recipientTitle: `Hiring Team at ${job.company}`,
                opening,
                middle,
                closing,
                bodyText: fullText,
            },
        });
        // Update ApplicationPreparation checklist
        await prisma.applicationPreparation.upsert({
            where: { jobId },
            create: {
                jobId,
                coverLetterGenerated: true,
                latestCoverLetterId: saved.id,
            },
            update: {
                coverLetterGenerated: true,
                latestCoverLetterId: saved.id,
            },
        });
        return {
            id: saved.id,
            jobId,
            company: job.company,
            role: job.title,
            recipientTitle: saved.recipientTitle || undefined,
            opening,
            middle,
            closing,
            fullText,
            createdAt: saved.createdAt.toISOString(),
            updatedAt: saved.updatedAt.toISOString(),
        };
    }
    static async getCoverLettersByJob(jobId) {
        const list = await prisma.coverLetter.findMany({
            where: { jobId },
            orderBy: { createdAt: 'desc' },
        });
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        return list.map((cl) => ({
            id: cl.id,
            jobId: cl.jobId || jobId,
            company: job?.company || 'Employer',
            role: job?.title || 'Engineer',
            recipientTitle: cl.recipientTitle || undefined,
            opening: cl.opening || '',
            middle: cl.middle || '',
            closing: cl.closing || '',
            fullText: cl.bodyText,
            createdAt: cl.createdAt.toISOString(),
            updatedAt: cl.updatedAt.toISOString(),
        }));
    }
    static async getCoverLetterById(id) {
        const cl = await prisma.coverLetter.findUnique({
            where: { id },
            include: { job: true },
        });
        if (!cl)
            throw new Error(`CoverLetter not found: ${id}`);
        return {
            coverLetter: {
                id: cl.id,
                jobId: cl.jobId || '',
                company: cl.job?.company || 'Employer',
                role: cl.job?.title || 'Engineer',
                recipientTitle: cl.recipientTitle || undefined,
                opening: cl.opening || '',
                middle: cl.middle || '',
                closing: cl.closing || '',
                fullText: cl.bodyText,
                createdAt: cl.createdAt.toISOString(),
                updatedAt: cl.updatedAt.toISOString(),
            },
            job: cl.job,
        };
    }
    static async updateCoverLetter(id, bodyText) {
        const updated = await prisma.coverLetter.update({
            where: { id },
            data: { bodyText },
            include: { job: true },
        });
        return {
            id: updated.id,
            jobId: updated.jobId || '',
            company: updated.job?.company || 'Employer',
            role: updated.job?.title || 'Engineer',
            recipientTitle: updated.recipientTitle || undefined,
            opening: updated.opening || '',
            middle: updated.middle || '',
            closing: updated.closing || '',
            fullText: updated.bodyText,
            updatedAt: updated.updatedAt.toISOString(),
        };
    }
}
exports.CoverLetterService = CoverLetterService;
