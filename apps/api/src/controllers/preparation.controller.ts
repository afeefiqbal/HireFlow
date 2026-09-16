import { Request, Response } from 'express';
import { PreparationService } from '../services/preparation.service';

export class PreparationController {
  static async getPreparation(req: Request, res: Response) {
    try {
      const { id: jobId } = req.params;
      const result = await PreparationService.getApplicationPreparation(jobId);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('Error fetching application preparation:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getQueue(req: Request, res: Response) {
    try {
      const result = await PreparationService.getApplicationQueue();
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('Error fetching application queue:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
