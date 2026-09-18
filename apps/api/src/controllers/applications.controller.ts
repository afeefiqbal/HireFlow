import { Request, Response } from 'express';
import { ApplicationStatus } from '@prisma/client';
import { ApplicationService } from '../services/application.service';
import { AnalyticsService } from '../services/analytics.service';

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

  static async getApplicationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Application ID is required' });
      }

      const detail = await ApplicationService.getApplicationDetail(id);
      return res.json({
        success: true,
        data: detail,
      });
    } catch (error: any) {
      console.error('Error getting application detail:', error);
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  static async updateApplicationStatus(req: Request, res: Response) {
    try {
      const { jobId, status, note, source } = req.body;

      if (!jobId || !status) {
        return res.status(400).json({ success: false, message: 'jobId and status are required' });
      }

      const validStatuses = [
        'DISCOVERED',
        'MATCHED',
        'SAVED',
        'SHORTLISTED',
        'PREPARING',
        'CV_READY',
        'READY_TO_APPLY',
        'APPLIED',
        'INTERVIEW',
        'REJECTED',
        'OFFER',
        'WITHDRAWN',
        'EXPIRED',
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
      }

      const updated = await ApplicationService.updateStatus(
        jobId,
        status as ApplicationStatus,
        note,
        source || 'USER'
      );

      return res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      console.error('Error updating application status:', error);
      // Return 400 for transition gate rejections
      const isGateError = error.message && error.message.includes('Invalid status transition');
      return res.status(isGateError ? 400 : 500).json({ success: false, message: error.message });
    }
  }

  static async addNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content, source } = req.body;

      if (!id || !content) {
        return res.status(400).json({ success: false, message: 'Application ID and note content are required' });
      }

      const note = await ApplicationService.addNote(id, content, source || 'USER');
      return res.json({
        success: true,
        data: note,
      });
    } catch (error: any) {
      console.error('Error adding note to application:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async setFollowUp(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nextFollowUpAt, source } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: 'Application ID is required' });
      }

      const updated = await ApplicationService.setFollowUp(id, nextFollowUpAt || null, source || 'USER');
      return res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      console.error('Error updating follow-up date:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAnalytics(req: Request, res: Response) {
    try {
      const { range, start, end } = req.query;
      const analytics = await AnalyticsService.getAnalytics(
        (range as any) || 'all',
        start as string | undefined,
        end as string | undefined
      );

      return res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      console.error('Error generating analytics:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getTimeline(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const timeline = await ApplicationService.getApplicationTimeline(limit);

      return res.json({
        success: true,
        data: timeline,
      });
    } catch (error: any) {
      console.error('Error fetching application timeline:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
