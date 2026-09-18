import { Request, Response } from 'express';
import { InterviewService } from '../services/interview.service';
import { InterviewIntelligenceService } from '../services/interview-intelligence.service';

export class InterviewsController {
  static async listInterviews(req: Request, res: Response): Promise<void> {
    try {
      const { status, company, roundType } = req.query;
      const interviews = await InterviewService.listInterviews({
        status: status as string,
        company: company as string,
        roundType: roundType as string,
      });
      res.json({ success: true, data: interviews });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getInterviewStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await InterviewService.getInterviewStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getOrCreateInterview(req: Request, res: Response): Promise<void> {
    try {
      const { applicationId } = req.params;
      const interview = await InterviewService.getOrCreateInterview(applicationId);
      res.json({ success: true, data: interview });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  }

  static async getInterviewById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const interview = await InterviewService.getInterviewById(id);
      res.json({ success: true, data: interview });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  }

  static async updateInterview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const interview = await InterviewService.updateInterview(id, req.body);
      res.json({ success: true, data: interview });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async createRound(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const round = await InterviewService.createRound(id, req.body);
      res.status(201).json({ success: true, data: round });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateRound(req: Request, res: Response): Promise<void> {
    try {
      const { roundId } = req.params;
      const round = await InterviewService.updateRound(roundId, req.body);
      res.json({ success: true, data: round });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async deleteRound(req: Request, res: Response): Promise<void> {
    try {
      const { roundId } = req.params;
      await InterviewService.deleteRound(roundId);
      res.json({ success: true, message: 'Round deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async listQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { roundId } = req.query;
      const questions = await InterviewService.listQuestions(id, roundId as string);
      res.json({ success: true, data: questions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async addQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const question = await InterviewService.addQuestion(id, req.body);
      res.status(201).json({ success: true, data: question });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async generatePredictedQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { roundId } = req.body;
      const questions = await InterviewService.generatePredictedQuestions(id, roundId);
      res.json({ success: true, data: questions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async generateSTARAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { question, targetProjectTitle } = req.body;
      if (!question) {
        res.status(400).json({ success: false, error: 'Question is required' });
        return;
      }
      const star = await InterviewIntelligenceService.generateSTARAnswer(question, targetProjectTitle);
      res.json({ success: true, data: star });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async generatePrepKit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { roundId, forceRefresh } = req.body;
      const kit = await InterviewService.generatePrepKit(id, roundId, forceRefresh);
      res.json({ success: true, data: kit });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async startMockSession(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { roundType, roundId } = req.body;
      const session = await InterviewService.startMockSession(id, roundType, roundId);
      res.status(201).json({ success: true, data: session });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async submitMockAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { questionIndex, answer } = req.body;
      if (answer == null) {
        res.status(400).json({ success: false, error: 'Answer is required' });
        return;
      }
      const updated = await InterviewService.submitMockAnswer(sessionId, questionIndex || 0, answer);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async completeMockSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const completed = await InterviewService.completeMockSession(sessionId);
      res.json({ success: true, data: completed });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async submitDebrief(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const debrief = await InterviewService.submitDebrief(id, req.body);
      res.status(201).json({ success: true, data: debrief });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
