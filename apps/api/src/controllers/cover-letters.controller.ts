import { Request, Response } from 'express';
import { CoverLetterService } from '../services/cover-letter.service';

export class CoverLettersController {
  static async generateCoverLetter(req: Request, res: Response) {
    try {
      const { id: jobId } = req.params;
      const result = await CoverLetterService.generateCoverLetter(jobId);
      return res.json({
        success: true,
        message: 'Cover letter generated successfully',
        data: result,
      });
    } catch (err: any) {
      console.error('Error generating cover letter:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getCoverLettersByJob(req: Request, res: Response) {
    try {
      const { id: jobId } = req.params;
      const letters = await CoverLetterService.getCoverLettersByJob(jobId);
      return res.json({
        success: true,
        data: letters,
      });
    } catch (err: any) {
      console.error('Error fetching cover letters by job:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getCoverLetterById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await CoverLetterService.getCoverLetterById(id);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('Error fetching cover letter by id:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateCoverLetter(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { bodyText } = req.body;
      const result = await CoverLetterService.updateCoverLetter(id, bodyText);
      return res.json({
        success: true,
        message: 'Cover letter updated successfully',
        data: result,
      });
    } catch (err: any) {
      console.error('Error updating cover letter:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
