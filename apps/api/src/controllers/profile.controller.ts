import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_COMMON_ANSWERS = {
  visaSponsorship: 'Yes, I will require visa sponsorship (EU Blue Card / work visa for Germany & EU).',
  workAuthorization: 'Indian citizen. Requires visa sponsorship / EU Blue Card for legal authorization in Europe.',
  noticePeriod: '30 days / 1 month notice period.',
  expectedSalary: '€75,000 – €85,000 gross per year (negotiable based on location & equity).',
  relocation: 'Yes, fully prepared and eager to relocate to Germany, Netherlands, or across the EU.',
};

export class ProfileController {
  static async getProfile(req: Request, res: Response) {
    try {
      const profile = await prisma.candidateProfile.findFirst({
        include: {
          user: true,
          experiences: {
            orderBy: { orderIndex: 'asc' },
          },
          skills: {
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
          },
          projects: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Candidate profile not found' });
      }

      // Group skills for frontend convenience
      const primarySkills = profile.skills.filter((s) => s.category === 'primary').map((s) => s.name);
      const additionalSkills = profile.skills.filter((s) => s.category === 'additional').map((s) => s.name);

      const commonAnswers = (profile.commonAnswers as any) || DEFAULT_COMMON_ANSWERS;

      return res.json({
        success: true,
        data: {
          ...profile,
          email: profile.user?.email || null,
          fullName: profile.fullName || profile.user?.fullName || 'Afeef Iqbal',
          phone: profile.phone || null,
          location: profile.location || 'Alappuzha, Kerala, India',
          linkedin: profile.linkedin || 'https://linkedin.com/in/afeef-iqbal',
          github: profile.github || 'https://github.com/afeefiqbal',
          portfolio: profile.portfolio || null,
          commonAnswers,
          primarySkills,
          additionalSkills,
        },
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const { headline, targetRoles, targetLocations, remotePreference, relocationPreference, commonAnswers } = req.body;
      const profile = await prisma.candidateProfile.findFirst();

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Candidate profile not found' });
      }

      const updated = await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: {
          headline: headline || profile.headline,
          targetRoles: targetRoles || profile.targetRoles,
          targetLocations: targetLocations || profile.targetLocations,
          remotePreference: remotePreference || profile.remotePreference,
          relocationPreference: relocationPreference || profile.relocationPreference,
          commonAnswers: commonAnswers !== undefined ? commonAnswers : profile.commonAnswers,
        },
      });

      return res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateCommonAnswers(req: Request, res: Response) {
    try {
      const { commonAnswers } = req.body;
      const profile = await prisma.candidateProfile.findFirst();

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Candidate profile not found' });
      }

      const updated = await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: {
          commonAnswers: commonAnswers || {},
        },
      });

      return res.json({
        success: true,
        message: 'Common Answers Bank updated successfully',
        data: updated.commonAnswers,
      });
    } catch (error: any) {
      console.error('Error updating common answers:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async uploadResume(req: Request, res: Response) {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ success: false, message: 'Resume text is required' });
      }

      const { ProfileIngestionService } = await import('../services/profile-ingestion.service');
      const preview = await ProfileIngestionService.parseResumeText(text);

      return res.json({
        success: true,
        data: preview,
        message: 'Resume parsed successfully into candidate preview',
      });
    } catch (error: any) {
      console.error('Error uploading/parsing resume:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async commitResume(req: Request, res: Response) {
    try {
      const { preview, overwrite } = req.body;
      if (!preview || !preview.fullName) {
        return res.status(400).json({ success: false, message: 'Valid preview data is required' });
      }

      const { ProfileIngestionService } = await import('../services/profile-ingestion.service');
      const updated = await ProfileIngestionService.syncToCandidateProfile(preview, {
        overwrite: Boolean(overwrite),
      });

      return res.json({
        success: true,
        data: updated,
        message: 'Candidate Ground Truth updated successfully from resume',
      });
    } catch (error: any) {
      console.error('Error committing resume to profile:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAutoApplyConfig(req: Request, res: Response) {
    try {
      const profile = await prisma.candidateProfile.findFirst();
      const rawConfig = (profile?.autoApplyConfig as any) || {};

      const config = {
        enabled: Boolean(rawConfig.enabled),
        autonomousThreshold: typeof rawConfig.autonomousThreshold === 'number' ? rawConfig.autonomousThreshold : 85,
        dailyLimit: typeof rawConfig.dailyLimit === 'number' ? rawConfig.dailyLimit : 5,
      };

      return res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('Error fetching auto-apply config:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateAutoApplyConfig(req: Request, res: Response) {
    try {
      const { enabled, autonomousThreshold, dailyLimit } = req.body;
      const profile = await prisma.candidateProfile.findFirst();
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Candidate profile not found' });
      }

      const newConfig = {
        enabled: Boolean(enabled),
        autonomousThreshold: typeof autonomousThreshold === 'number' ? autonomousThreshold : 85,
        dailyLimit: typeof dailyLimit === 'number' ? dailyLimit : 5,
      };

      await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: { autoApplyConfig: newConfig as any },
      });

      return res.json({
        success: true,
        data: newConfig,
        message: 'Auto-apply configuration saved successfully',
      });
    } catch (error: any) {
      console.error('Error updating auto-apply config:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
