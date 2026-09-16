export type AiModelClass = 'FAST' | 'STRONG';

export interface AIProvider {
  /**
   * Initializes the provider (e.g. checking API keys)
   */
  init(): void;
  
  /**
   * Evaluates job quality, matching, eligibility etc.
   */
  analyzeJob(jobDescription: string, candidateProfile: any): Promise<any>;

  /**
   * Generates a tailored CV JSON payload.
   */
  generateResume(jobDescription: string, candidateProfile: any): Promise<any>;

  /**
   * Generates a cover letter JSON payload.
   */
  generateCoverLetter(jobDescription: string, companyName: string, candidateProfile: any): Promise<{ subject: string; body: string }>;

  /**
   * Analyzes screening questions.
   */
  answerScreeningQuestions(questions: string[], candidateProfile: any): Promise<Array<{ question: string; requiresUserInput: boolean; suggestedAnswer: string }>>;

  /**
   * Internal wrapper to track usage.
   */
  getName(): string;
}
