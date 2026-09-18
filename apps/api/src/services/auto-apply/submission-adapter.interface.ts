/**
 * HIREflow — Application Submission Adapter Interface
 * 
 * Standard contract for legitimate employer application submission adapters.
 */

import { Job, SubmissionMechanism, SubmissionReceipt, SandboxTestResult } from '@ai-job-agent/shared';

export interface ApplicationSubmissionPayload {
  candidate: {
    fullName: string;
    email: string;
    phone?: string | null;
    location?: string | null;
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
  };
  resume: {
    versionId?: string;
    versionName: string;
    summary?: string;
    targetRole?: string;
    rawText?: string;
    contentJson: any;
  };
  coverLetter?: {
    id?: string;
    fullText: string;
  } | null;
  screeningAnswers: Array<{
    question: string;
    answer: string;
    requiresUserInput: boolean;
  }>;
}

export interface AdapterExecutionResult {
  success: boolean;
  isManualRequired?: boolean;
  manualRequiredReason?: string;
  receipt?: SubmissionReceipt;
  sandboxResult?: SandboxTestResult;
  error?: string;
}

export interface SubmissionAdapter {
  name: string;
  mechanism: SubmissionMechanism;

  /**
   * Returns true if this adapter can legitimately handle the job's application URL.
   */
  canHandle(job: Job): boolean;

  /**
   * Validates whether the application payload satisfies all mandatory fields.
   */
  validate(job: Job, payload: ApplicationSubmissionPayload): { isValid: boolean; errors: string[] };

  /**
   * Executes the submission (or dry-run sandbox validation).
   * Strictly respects: no CAPTCHA bypassing, no bot scraping.
   */
  submit(
    job: Job,
    payload: ApplicationSubmissionPayload,
    options?: { dryRun?: boolean }
  ): Promise<AdapterExecutionResult>;
}
