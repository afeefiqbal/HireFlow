import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MatchingService } from '../services/matching.service';

const prisma = new PrismaClient();

export class MatchesController {
  static async analyzeJob(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await MatchingService.analyzeJob(id);
      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error analyzing job:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMatches(req: Request, res: Response) {
    try {
      const { minScore = '0' } = req.query;
      const matches = await prisma.jobMatch.findMany({
        where: {
          overallMatch: { gte: parseInt(minScore as string, 10) },
        },
        include: {
          job: true,
        },
        orderBy: { overallMatch: 'desc' },
      });

      return res.json({
        success: true,
        data: matches,
      });
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
