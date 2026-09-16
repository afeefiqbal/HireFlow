import { Request, Response } from 'express';
import { ResumeService } from '../services/resume.service';
import { AtsAnalyzerService } from '../services/ats-analyzer.service';

export class ResumesController {
  static async generateTailoredCv(req: Request, res: Response) {
    try {
      const { id: jobId } = req.params;
      const result = await ResumeService.generateTailoredCv(jobId);
      return res.json({
        success: true,
        message: 'Tailored CV generated successfully',
        data: result,
      });
    } catch (err: any) {
      console.error('Error generating tailored CV:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getResumesByJob(req: Request, res: Response) {
    try {
      const { id: jobId } = req.params;
      const resumes = await ResumeService.getResumesByJob(jobId);
      return res.json({
        success: true,
        data: resumes,
      });
    } catch (err: any) {
      console.error('Error fetching resumes by job:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getResumeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ResumeService.getResumeById(id);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('Error fetching resume by id:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateResume(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await ResumeService.updateResume(id, req.body);
      return res.json({
        success: true,
        message: 'Resume updated successfully',
        data: updated,
      });
    } catch (err: any) {
      console.error('Error updating resume:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async regenerateResume(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ResumeService.regenerateResume(id);
      return res.json({
        success: true,
        message: 'Resume regenerated successfully',
        data: result,
      });
    } catch (err: any) {
      console.error('Error regenerating resume:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getAtsAnalysis(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resumeVer = await ResumeService.getResumeById(id);
      return res.json({
        success: true,
        data: resumeVer.atsAnalysis,
      });
    } catch (err: any) {
      console.error('Error getting ATS analysis:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
