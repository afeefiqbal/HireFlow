import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProfileController {
  static async getProfile(req: Request, res: Response) {
    try {
      const profile = await prisma.candidateProfile.findFirst({
        include: {
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

      return res.json({
        success: true,
        data: {
          ...profile,
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
      const { headline, targetRoles, targetLocations, remotePreference, relocationPreference } = req.body;
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
}
