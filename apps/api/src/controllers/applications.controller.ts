import { Request, Response } from 'express';
import { PrismaClient, ApplicationStatus } from '@prisma/client';
import { ApplicationService } from '../services/application.service';

const prisma = new PrismaClient();

export class ApplicationsController {
  static async listApplications(req: Request, res: Response) {
    try {
      const applications = await ApplicationService.listApplications();
      return res.json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      console.error('Error listing applications:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateApplicationStatus(req: Request, res: Response) {
    try {
      const { jobId, status, note } = req.body;

      if (!jobId || !status) {
        return res.status(400).json({ success: false, message: 'jobId and status are required' });
      }

      const validStatuses = [
        'DISCOVERED',
        'MATCHED',
        'SAVED',
        'CV_READY',
        'READY_TO_APPLY',
        'APPLIED',
        'INTERVIEW',
        'REJECTED',
        'OFFER',
        'WITHDRAWN',
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
      }

      const updated = await ApplicationService.updateStatus(jobId, status as ApplicationStatus, note);

      return res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      console.error('Error updating application status:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
