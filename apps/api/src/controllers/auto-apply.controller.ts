/**
 * HIREflow — Auto-Apply & Autonomous Discovery Controller
 */

import { Request, Response } from 'express';
import { AutoApplyService } from '../services/auto-apply/auto-apply.service';
import { PreparationService } from '../services/preparation.service';
import { ContinuousDiscoveryService } from '../services/continuous-discovery.service';

export class AutoApplyController {
  static async autoApply(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { dryRun } = req.body;

      const result = await AutoApplyService.submit(id, { dryRun: Boolean(dryRun) });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          mode: result.mode,
          message: result.error || 'Auto-apply submission failed or blocked',
          sandboxResult: result.sandboxResult,
        });
      }

      return res.json({
        success: true,
        mode: result.mode,
        message: result.mode === 'SANDBOX'
          ? 'Sandbox schema validation passed (application status unchanged)'
          : 'Application successfully submitted and verified',
        receipt: result.receipt,
        sandboxResult: result.sandboxResult,
      });
    } catch (error: any) {
      console.error('Error in autoApply:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async evaluateEligibility(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await AutoApplyService.evaluateEligibility(id);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error in evaluateEligibility:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async autoPrepare(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const summary = await PreparationService.autoPrepareApplication(id);
      return res.json({
        success: true,
        data: summary,
        message: 'Application materials prepared automatically',
      });
    } catch (error: any) {
      console.error('Error in autoPrepare:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async runContinuousDiscovery(req: Request, res: Response) {
    try {
      const result = await ContinuousDiscoveryService.runContinuousDiscoveryCycle();
      return res.json({
        success: true,
        data: result,
        message: 'Autonomous discovery cycle completed',
      });
    } catch (error: any) {
      console.error('Error in runContinuousDiscovery:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getContinuousDiscoveryStatus(req: Request, res: Response) {
    try {
      const status = ContinuousDiscoveryService.getStatus();
      return res.json({ success: true, data: status });
    } catch (error: any) {
      console.error('Error in getContinuousDiscoveryStatus:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getQualifiedOpportunities(req: Request, res: Response) {
    try {
      const opportunities = await ContinuousDiscoveryService.getQualifiedOpportunities();
      return res.json({ success: true, data: opportunities });
    } catch (error: any) {
      console.error('Error in getQualifiedOpportunities:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
