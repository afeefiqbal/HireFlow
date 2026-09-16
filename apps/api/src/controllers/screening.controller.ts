import { Request, Response } from 'express';
import { ScreeningService } from '../services/screening.service';

export class ScreeningController {
  static async analyzeScreening(req: Request, res: Response) {
    try {
      const { id: jobId } = req.params;
      const { questions } = req.body;
      const results = await ScreeningService.analyzeScreeningQuestions(jobId, questions);
      return res.json({
        success: true,
        message: 'Screening questions analyzed successfully',
        data: results,
      });
    } catch (err: any) {
      console.error('Error analyzing screening questions:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getScreeningQuestions(req: Request, res: Response) {
    try {
      const { id: jobId } = req.params;
      const questions = await ScreeningService.getScreeningQuestions(jobId);
      return res.json({
        success: true,
        data: questions,
      });
    } catch (err: any) {
      console.error('Error fetching screening questions:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async answerQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { answer } = req.body;
      const updated = await ScreeningService.answerScreeningQuestion(id, answer);
      return res.json({
        success: true,
        message: 'Answer saved successfully',
        data: updated,
      });
    } catch (err: any) {
      console.error('Error saving screening answer:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
