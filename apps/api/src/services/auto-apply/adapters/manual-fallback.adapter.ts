/**
 * HIREflow — Manual Fallback Submission Adapter
 * 
 * Safely handles applications requiring external login, Workday, Taleo, iCIMS,
 * CAPTCHA challenges, or unsupported custom portals.
 * Strictly avoids bypassing security controls and never falsely reports applied.
 */

import { Job, SubmissionMechanism } from '@ai-job-agent/shared';
import { SubmissionAdapter, ApplicationSubmissionPayload, AdapterExecutionResult } from '../submission-adapter.interface';

export class ManualFallbackAdapter implements SubmissionAdapter {
  name = 'Manual External Application Fallback';
  mechanism: SubmissionMechanism = 'MANUAL_EXTERNAL';

  canHandle(_job: Job): boolean {
    return true; // Fallback handler for all jobs
  }

  validate(_job: Job, _payload: ApplicationSubmissionPayload): { isValid: boolean; errors: string[] } {
    return { isValid: true, errors: [] };
  }

  async submit(
    job: Job,
    _payload: ApplicationSubmissionPayload,
    options?: { dryRun?: boolean }
  ): Promise<AdapterExecutionResult> {
    if (options?.dryRun) {
      return {
        success: false,
        isManualRequired: true,
        manualRequiredReason: `Employer portal (${job.source || 'External ATS'}) requires direct candidate application on employer site.`,
        sandboxResult: {
          testedAt: new Date().toISOString(),
          isValid: false,
          targetMechanism: this.mechanism,
          validationErrors: ['Automated direct submission unsupported for this ATS platform'],
          diagnosticInfo: {
            applicationUrl: job.applicationUrl,
            source: job.source,
          },
        },
      };
    }

    return {
      success: false,
      isManualRequired: true,
      manualRequiredReason: `This position at ${job.company} uses an external or authenticated application system. Please submit your prepared application directly on the employer site.`,
    };
  }
}
