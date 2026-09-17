/**
 * HIREflow V4 - Freshness Engine
 * Evaluates verifiable job posting timestamps strictly.
 * Never invents a posting date. If unverified, postedAt is null and status is UNKNOWN.
 */

import { FreshnessStatus, JobAgeStatus, FactConfidence } from '@ai-job-agent/shared';

export interface FreshnessEvaluation {
  postedAt: Date | null;
  jobAgeHours: number | null;
  freshnessStatus: FreshnessStatus;
  ageStatus: JobAgeStatus; // Backward compatibility for V3.1
  postedAtSource: 'SOURCE' | 'ATS' | 'FEED' | 'PARSED' | 'UNKNOWN';
  label: string;
  isFresh: boolean;
  confidence: FactConfidence;
}

export class FreshnessEngine {
  /**
   * Calculates precision age and classifies freshness tier.
   */
  static evaluateFreshness(
    postedAtRaw: Date | string | number | null | undefined,
    sourceHint: 'SOURCE' | 'ATS' | 'FEED' | 'PARSED' | 'UNKNOWN' = 'ATS',
    referenceTime: Date = new Date()
  ): FreshnessEvaluation {
    if (!postedAtRaw) {
      return {
        postedAt: null,
        jobAgeHours: null,
        freshnessStatus: 'UNKNOWN',
        ageStatus: 'UNKNOWN',
        postedAtSource: 'UNKNOWN',
        label: 'Posting age unknown',
        isFresh: false,
        confidence: 'LOW',
      };
    }

    let date: Date;
    if (typeof postedAtRaw === 'number') {
      // Handle epoch seconds vs epoch milliseconds
      date = postedAtRaw < 10000000000 ? new Date(postedAtRaw * 1000) : new Date(postedAtRaw);
    } else if (typeof postedAtRaw === 'string') {
      date = new Date(postedAtRaw);
    } else {
      date = postedAtRaw;
    }

    if (isNaN(date.getTime()) || date.getTime() <= 0) {
      return {
        postedAt: null,
        jobAgeHours: null,
        freshnessStatus: 'UNKNOWN',
        ageStatus: 'UNKNOWN',
        postedAtSource: 'UNKNOWN',
        label: 'Posting age unknown',
        isFresh: false,
        confidence: 'LOW',
      };
    }

    const diffMs = referenceTime.getTime() - date.getTime();
    const hours = diffMs < 0 ? 0.0 : Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

    let freshnessStatus: FreshnessStatus;
    let label: string;

    if (hours < 6.0) {
      freshnessStatus = 'FRESH';
      label = hours < 1.0 ? 'Posted <1h ago (FRESH)' : `Posted ${Math.round(hours)}h ago (FRESH)`;
    } else if (hours <= 12.0) {
      freshnessStatus = 'RECENT';
      label = `Posted ${Math.round(hours)}h ago (RECENT)`;
    } else if (hours <= 24.0) {
      freshnessStatus = 'TODAY';
      label = `Posted ${Math.round(hours)}h ago (TODAY)`;
    } else {
      freshnessStatus = 'STALE';
      const days = Math.max(1, Math.round(hours / 24));
      label = `Posted ${days}d ago (STALE)`;
    }

    // Backward compatibility for V3.1
    const isFresh = hours <= 24.0;
    const ageStatus: JobAgeStatus = isFresh ? 'FRESH' : 'OLDER';

    return {
      postedAt: date,
      jobAgeHours: hours,
      freshnessStatus,
      ageStatus,
      postedAtSource: sourceHint,
      label,
      isFresh,
      confidence: sourceHint === 'ATS' || sourceHint === 'FEED' ? 'HIGH' : 'MEDIUM',
    };
  }
}
