"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ApplicationService {
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
    static async getApplicationByJobId(jobId) {
        return prisma.application.findUnique({
            where: { jobId },
            include: {
                job: true,
                events: { orderBy: { createdAt: 'desc' } },
                answers: true,
            },
        });
    }
    static async updateStatus(jobId, toStatus, note) {
        const existing = await prisma.application.findUnique({
            where: { jobId },
        });
        let cvVersion = null;
        let coverLetterId = null;
        if (toStatus === 'APPLIED') {
            const prep = await prisma.applicationPreparation.findUnique({ where: { jobId } });
            if (prep) {
                cvVersion = prep.latestResumeVersionId;
                coverLetterId = prep.latestCoverLetterId;
            }
        }
        if (!existing) {
            // Create new application record
            const job = await prisma.job.findUnique({ where: { id: jobId } });
            if (!job)
                throw new Error('Job not found');
            return prisma.application.create({
                data: {
                    jobId,
                    status: toStatus,
                    applicationUrl: job.applicationUrl,
                    notes: note || `Application initialized to ${toStatus}`,
                    appliedDate: toStatus === 'APPLIED' ? new Date() : null,
                    cvVersion,
                    coverLetterId,
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
        }
        const updated = await prisma.application.update({
            where: { jobId },
            data: {
                status: toStatus,
                notes: note ? `${existing.notes ? existing.notes + '\n' : ''}${note}` : existing.notes,
                appliedDate: toStatus === 'APPLIED' && !existing.appliedDate ? new Date() : existing.appliedDate,
                cvVersion: toStatus === 'APPLIED' ? cvVersion : existing.cvVersion,
                coverLetterId: toStatus === 'APPLIED' ? coverLetterId : existing.coverLetterId,
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
        return updated;
    }
}
exports.ApplicationService = ApplicationService;
