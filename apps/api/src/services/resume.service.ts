import { PrismaClient } from '@prisma/client';
import { TailoredCvData } from '@ai-job-agent/shared';
import { AtsAnalyzerService } from './ats-analyzer.service';
import { AiService } from '../ai/ai.service';

const prisma = new PrismaClient();

export class ResumeService {
  /**
   * Generates a tailored CV strictly adhering to candidate ground truth without inventing qualifications.
   */
  static async generateTailoredCv(jobId: string): Promise<{ resume: TailoredCvData; atsAnalysis: any }> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Job not found: ${jobId}`);

    const profile = await prisma.candidateProfile.findFirst({
      include: {
        experiences: { orderBy: { orderIndex: 'asc' } },
        projects: { orderBy: { orderIndex: 'asc' } },
        skills: true,
      },
    });

    if (!profile) throw new Error('Master candidate profile not found');

    const jobFullText = `${job.title} ${job.description} ${job.techStack.join(' ')}`.toLowerCase();

    // ---------------------------------------------------------
    // Groq LLM Dynamic Generation via AiService
    // ---------------------------------------------------------
    const cvGeneratedJson = await AiService.generateResume(jobId, jobFullText, profile);

    // Version name
    const companyClean = job.company.replace(/[^a-zA-Z0-9]/g, '');
    const count = await prisma.resumeVersion.count({ where: { jobId } });
    const versionNum = count + 1;
    const versionName = `Afeef_Iqbal_CV_${companyClean}_v${versionNum}`;

    const cvData: TailoredCvData = {
      jobId,
      versionName,
      fullName: 'Afeef Iqbal',
      targetRole: cvGeneratedJson.targetRole || 'Senior Software Engineer',
      summary: cvGeneratedJson.summary || '',
      primarySkills: cvGeneratedJson.primarySkills || [],
      additionalSkills: cvGeneratedJson.additionalSkills || [],
      experiences: cvGeneratedJson.experiences || [],
      projects: cvGeneratedJson.projects || [],
      status: 'generated',
    };

    // Save ResumeVersion
    const savedVer = await prisma.resumeVersion.create({
      data: {
        jobId,
        candidateId: profile.id,
        versionName,
        versionNum,
        tailoredFor: `${job.title} at ${job.company}`,
        targetRole: cvData.targetRole,
        status: 'generated',
        contentJson: cvData as any,
      },
    });

    cvData.id = savedVer.id;
    cvData.createdAt = savedVer.createdAt.toISOString();
    cvData.updatedAt = savedVer.updatedAt.toISOString();

    // Run ATS analysis
    const atsAnalysis = await AtsAnalyzerService.analyzeResume(savedVer.id, jobId);

    // Update ApplicationPreparation checklist
    await prisma.applicationPreparation.upsert({
      where: { jobId },
      create: {
        jobId,
        jobAnalyzed: true,
        cvGenerated: true,
        atsAnalyzed: true,
        latestResumeVersionId: savedVer.id,
      },
      update: {
        jobAnalyzed: true,
        cvGenerated: true,
        atsAnalyzed: true,
        latestResumeVersionId: savedVer.id,
      },
    });

    return {
      resume: cvData,
      atsAnalysis,
    };
  }

  static async getResumesByJob(jobId: string): Promise<TailoredCvData[]> {
    const list = await prisma.resumeVersion.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((v) => {
      const data = v.contentJson as unknown as TailoredCvData;
      return {
        ...data,
        id: v.id,
        versionName: v.versionName,
        targetRole: v.targetRole || data.targetRole,
        status: v.status,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      };
    });
  }

  static async getResumeById(id: string): Promise<{ resume: TailoredCvData; atsAnalysis: any; job: any }> {
    const ver = await prisma.resumeVersion.findUnique({
      where: { id },
      include: {
        atsAnalysis: true,
        job: true,
      },
    });

    if (!ver) throw new Error(`ResumeVersion not found: ${id}`);

    const data = ver.contentJson as unknown as TailoredCvData;
    return {
      resume: {
        ...data,
        id: ver.id,
        versionName: ver.versionName,
        targetRole: ver.targetRole || data.targetRole,
        status: ver.status,
        createdAt: ver.createdAt.toISOString(),
        updatedAt: ver.updatedAt.toISOString(),
      },
      atsAnalysis: ver.atsAnalysis,
      job: ver.job,
    };
  }

  static async updateResume(id: string, updatedContent: Partial<TailoredCvData>): Promise<TailoredCvData> {
    const ver = await prisma.resumeVersion.findUnique({ where: { id } });
    if (!ver) throw new Error(`ResumeVersion not found: ${id}`);

    const existing = ver.contentJson as unknown as TailoredCvData;
    const merged = { ...existing, ...updatedContent };

    const saved = await prisma.resumeVersion.update({
      where: { id },
      data: {
        contentJson: merged as any,
        targetRole: merged.targetRole || ver.targetRole,
        status: 'edited',
      },
    });

    if (ver.jobId) {
      // Re-run ATS analyzer on edited content
      await AtsAnalyzerService.analyzeResume(id, ver.jobId);
    }

    return {
      ...merged,
      id: saved.id,
      status: saved.status,
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  static async regenerateResume(id: string): Promise<{ resume: TailoredCvData; atsAnalysis: any }> {
    const ver = await prisma.resumeVersion.findUnique({ where: { id } });
    if (!ver || !ver.jobId) throw new Error('Resume version or associated jobId not found');
    return this.generateTailoredCv(ver.jobId);
  }
}
