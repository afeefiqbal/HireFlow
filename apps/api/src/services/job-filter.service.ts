import { JobAgeStatus } from '@ai-job-agent/shared';

export interface AgeEvaluationResult {
  jobAgeHours: number | null;
  ageStatus: JobAgeStatus;
  isFresh: boolean;
}

export class JobFilterService {
  /**
   * Calculates precise job age in decimal hours and classifies strictly.
   * Only jobs with verifiable posting timestamps <= 24.0 hours are FRESH.
   * If timestamp is missing or unparseable, ageStatus is UNKNOWN.
   */
  static evaluatePostingAge(postedAt: Date | string | number | null | undefined, referenceTime: Date = new Date()): AgeEvaluationResult {
    if (!postedAt) {
      return {
        jobAgeHours: null,
        ageStatus: 'UNKNOWN',
        isFresh: false,
      };
    }

    let date: Date;
    if (typeof postedAt === 'number') {
      // Handle epoch seconds vs epoch milliseconds
      date = postedAt < 10000000000 ? new Date(postedAt * 1000) : new Date(postedAt);
    } else if (typeof postedAt === 'string') {
      date = new Date(postedAt);
    } else {
      date = postedAt;
    }

    if (isNaN(date.getTime()) || date.getTime() <= 0) {
      return {
        jobAgeHours: null,
        ageStatus: 'UNKNOWN',
        isFresh: false,
      };
    }

    const diffMs = referenceTime.getTime() - date.getTime();
    if (diffMs < 0) {
      // Future timestamp skew
      return {
        jobAgeHours: 0.0,
        ageStatus: 'FRESH',
        isFresh: true,
      };
    }

    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

    if (hours <= 24.0) {
      return {
        jobAgeHours: hours,
        ageStatus: 'FRESH',
        isFresh: true,
      };
    }

    return {
      jobAgeHours: hours,
      ageStatus: 'OLDER',
      isFresh: false,
    };
  }

  /**
   * Generates a deterministic deduplication key from company, title, location, and canonical URL.
   */
  static generateDeduplicationKey(company: string, title: string, location: string, canonicalUrl?: string): string {
    const cleanComp = (company || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanTitle = (title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanLoc = (location || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanUrl = (canonicalUrl || '').toLowerCase().trim().replace(/^https?:\/\//, '').split('?')[0];

    return `${cleanComp}::${cleanTitle}::${cleanLoc}::${cleanUrl}`;
  }
}
