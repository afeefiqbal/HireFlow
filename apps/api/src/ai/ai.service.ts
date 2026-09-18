import { AIProvider } from './ai.types';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class AiService {
  private static provider: AIProvider | null = null;
  private static enabled = process.env.GROQ_ENABLED !== 'false';

  static registerProvider(provider: AIProvider) {
    this.provider = provider;
    try {
      if (this.enabled) {
        this.provider.init();
      }
    } catch (err) {
      console.warn('[AiService] Failed to init provider:', err);
      this.enabled = false;
    }
  }

  static isEnabled(): boolean {
    return this.enabled && this.provider !== null;
  }

  static getProvider(): AIProvider | null {
    return this.provider;
  }

  private static generateCacheKey(operation: string, data: any): string {
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    return `${operation}:${hash}`;
  }

  private static async checkCache(cacheKey: string): Promise<any | null> {
    const cached = await prisma.aiCache.findUnique({ where: { cacheKey } });
    return cached ? cached.responseJson : null;
  }

  private static async saveCache(cacheKey: string, responseJson: any): Promise<void> {
    await prisma.aiCache.upsert({
      where: { cacheKey },
      create: { cacheKey, responseJson },
      update: { responseJson },
    });
  }

  private static async trackUsage(
    operation: string,
    jobId: string | null,
    inputStr: string,
    outputStr: string,
    latencyMs: number,
    status: 'SUCCESS' | 'ERROR' | 'RATE_LIMIT',
    error?: string
  ) {
    if (!this.provider) return;
    
    // Very rough token estimation (4 chars ~= 1 token)
    const inputTokens = Math.ceil(inputStr.length / 4);
    const outputTokens = Math.ceil(outputStr.length / 4);

    try {
      await prisma.aiUsage.create({
        data: {
          provider: this.provider.getName(),
          model: process.env.GROQ_SMART_MODEL || 'unknown',
          operation,
          jobId,
          inputTokens,
          outputTokens,
          latencyMs,
          status,
          error,
        },
      });
    } catch (e) {
      console.error('[AiService] Failed to track usage', e);
    }
  }

  static async executeWithCacheAndTracking<T>(
    operation: string,
    jobId: string | null,
    cachePayload: any,
    fn: () => Promise<T>,
    forceRefresh: boolean = false
  ): Promise<T> {
    if (!this.isEnabled() || !this.provider) {
      throw new Error('AI Provider is not configured or enabled.');
    }

    const cacheKey = this.generateCacheKey(operation, cachePayload);
    
    if (!forceRefresh) {
      const cached = await this.checkCache(cacheKey);
      if (cached) {
        console.log(`[AiService] Cache hit for ${operation}`);
        return cached as T;
      }
    }

    const start = Date.now();
    try {
      const result = await fn();
      const latency = Date.now() - start;
      
      // Save cache & track success
      await this.saveCache(cacheKey, result);
      await this.trackUsage(
        operation,
        jobId,
        JSON.stringify(cachePayload),
        JSON.stringify(result),
        latency,
        'SUCCESS'
      );
      
      return result;
    } catch (err: any) {
      const latency = Date.now() - start;
      const isRateLimit = err.message?.toLowerCase().includes('rate') || err.status === 429;
      
      await this.trackUsage(
        operation,
        jobId,
        JSON.stringify(cachePayload),
        '',
        latency,
        isRateLimit ? 'RATE_LIMIT' : 'ERROR',
        err.message
      );
      
      throw err;
    }
  }

  // ==========================================
  // Public Interface methods
  // ==========================================

  static async analyzeJob(jobId: string, jobDescription: string, candidateProfile: any, forceRefresh = false): Promise<any> {
    return this.executeWithCacheAndTracking(
      'analyzeJob',
      jobId,
      { jobDescription, profileId: candidateProfile.id },
      () => this.provider!.analyzeJob(jobDescription, candidateProfile),
      forceRefresh
    );
  }

  static async generateResume(jobId: string, jobDescription: string, candidateProfile: any, forceRefresh = false): Promise<any> {
    return this.executeWithCacheAndTracking(
      'generateResume',
      jobId,
      { jobDescription, profileId: candidateProfile.id },
      () => this.provider!.generateResume(jobDescription, candidateProfile),
      forceRefresh
    );
  }

  static async generateCoverLetter(jobId: string, jobDescription: string, companyName: string, candidateProfile: any, forceRefresh = false): Promise<any> {
    return this.executeWithCacheAndTracking(
      'generateCoverLetter',
      jobId,
      { jobDescription, companyName, profileId: candidateProfile.id },
      () => this.provider!.generateCoverLetter(jobDescription, companyName, candidateProfile),
      forceRefresh
    );
  }

  static async answerScreeningQuestions(jobId: string, questions: string[], candidateProfile: any, forceRefresh = false): Promise<any> {
    return this.executeWithCacheAndTracking(
      'answerScreeningQuestions',
      jobId,
      { questions, profileId: candidateProfile.id },
      () => this.provider!.answerScreeningQuestions(questions, candidateProfile),
      forceRefresh
    );
  }
}
