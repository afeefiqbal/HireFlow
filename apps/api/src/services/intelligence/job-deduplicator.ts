/**
 * HIREflow V4 - Job Deduplication Service
 * Separates sourceIdentity from canonicalIdentity to enable cross-source deduplication.
 * (e.g., merging Greenhouse and Arbeitnow postings for the same underlying role).
 */

import crypto from 'crypto';
import { JobNormalizer } from './job-normalizer';

export interface DeduplicationIdentities {
  sourceIdentity: string;
  canonicalIdentity: string;
  descriptionFingerprint: string;
}

export class JobDeduplicator {
  /**
   * Source Identity: Combines source adapter with unique job ID or URL slug.
   * e.g. "greenhouse::401" or "lever::spryker-401"
   */
  static createSourceIdentity(source: string, sourceJobId?: string | null, fallbackUrl: string = ''): string {
    const cleanSource = (source || 'external').toLowerCase().replace(/[^a-z0-9]/g, '');
    let cleanId = (sourceJobId || '').trim();

    if (!cleanId && fallbackUrl) {
      // Extract terminal slug/id from URL
      const parts = fallbackUrl.replace(/\/$/, '').split('/');
      cleanId = parts[parts.length - 1] || '';
    }

    return `${cleanSource}::${cleanId || 'unknown'}`;
  }

  /**
   * Description Fingerprint:
   * Hashes normalized core tokens of the job description (ignoring whitespace and HTML).
   */
  static createDescriptionFingerprint(description: string): string {
    if (!description) return 'empty';
    // Strip HTML and non-alphanumeric characters, lowercase, take first 500 characters
    const normalized = description
      .replace(/<[^>]+>/g, ' ')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 500);

    return crypto.createHash('md5').update(normalized).digest('hex').slice(0, 16);
  }

  /**
   * Canonical Identity:
   * Combines normalizedCompany + normalizedTitle + normalizedLocation + descriptionFingerprint
   * Does NOT include sourceJobId, allowing cross-source deduplication.
   */
  static createCanonicalIdentity(
    company: string,
    title: string,
    location: string,
    descriptionFingerprint: string
  ): string {
    const normComp = JobNormalizer.normalizeCompany(company).toLowerCase().replace(/[^a-z0-9]/g, '');
    const normTitle = JobNormalizer.normalizeTitle(title).toLowerCase().replace(/[^a-z0-9]/g, '');
    const normLoc = JobNormalizer.normalizeLocation(location || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);

    return `${normComp}::${normTitle}::${normLoc}::${descriptionFingerprint}`;
  }

  /**
   * Generates all identities for an incoming raw job payload.
   */
  static generateIdentities(
    source: string,
    sourceJobId: string | null | undefined,
    company: string,
    title: string,
    location: string,
    description: string,
    canonicalUrl: string
  ): DeduplicationIdentities {
    const sourceIdentity = this.createSourceIdentity(source, sourceJobId, canonicalUrl);
    const descriptionFingerprint = this.createDescriptionFingerprint(description);
    const canonicalIdentity = this.createCanonicalIdentity(company, title, location, descriptionFingerprint);

    return {
      sourceIdentity,
      canonicalIdentity,
      descriptionFingerprint,
    };
  }

  /**
   * Checks if an authentic application URL exists (e.g. directly on Greenhouse/Lever/Ashby/Company Careers)
   * vs an aggregator board URL.
   */
  static isAuthenticAtsUrl(url: string = ''): boolean {
    const lower = url.toLowerCase();
    return (
      lower.includes('greenhouse.io') ||
      lower.includes('lever.co') ||
      lower.includes('ashbyhq.com') ||
      lower.includes('workable.com') ||
      lower.includes('workday.com') ||
      lower.includes('/careers') ||
      lower.includes('/jobs/')
    );
  }
}
