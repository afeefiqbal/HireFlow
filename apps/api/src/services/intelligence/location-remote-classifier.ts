/**
 * HIREflow V4 - Location & Remote Intelligence Classifier
 * Determines work setup (REMOTE, HYBRID, ONSITE, UNKNOWN) and standardizes location tokens.
 */

import { RemoteType, ExtractedFact } from '@ai-job-agent/shared';

export interface LocationClassificationResult {
  remoteType: RemoteType;
  remoteEvidence: ExtractedFact<RemoteType>;
  locations: string[];
}

export class LocationRemoteClassifier {
  static classify(
    rawLocation: string = '',
    title: string = '',
    description: string = '',
    isRemoteFlag: boolean = false
  ): LocationClassificationResult {
    const locText = `${rawLocation} ${title}`.toLowerCase();
    const descSample = description.slice(0, 1500).toLowerCase();

    let remoteType: RemoteType = 'UNKNOWN';
    let evidence = '';

    if (/\b(hybrid|flexible remote|partially remote)\b/i.test(locText) || /\b(hybrid work model|days in office)\b/i.test(descSample)) {
      remoteType = 'HYBRID';
      evidence = `Hybrid setup indicated in location/description: "${rawLocation}"`;
    } else if (
      /\b(100%\s*remote|remote\s*[-—–|·:]|fully remote|worldwide remote|remote-first|remote)\b/i.test(locText) ||
      /\b(fully remote position|work from anywhere|100% remote)\b/i.test(descSample) ||
      isRemoteFlag
    ) {
      remoteType = 'REMOTE';
      evidence = `Remote work explicitly indicated: "${rawLocation || 'Remote'}"`;
    } else if (/\b(on-site|onsite|in-office|office-based)\b/i.test(locText) || /\b(mandatory in-office|based on-site)\b/i.test(descSample)) {
      remoteType = 'ONSITE';
      evidence = `On-site presence required: "${rawLocation}"`;
    } else if (rawLocation && rawLocation.trim().length > 0) {
      // Named city without remote indicator -> likely ONSITE or standard office location
      remoteType = 'ONSITE';
      evidence = `Physical location specified without remote indicators: "${rawLocation}"`;
    }

    // Extract standardized location tokens (e.g. ['Berlin', 'Germany'])
    const locations: string[] = [];
    if (rawLocation) {
      const parts = rawLocation
        .split(/[,·/|-]/)
        .map((p) => p.trim())
        .filter((p) => p.length > 2 && !/^(remote|hybrid|onsite|full-?time)$/i.test(p));

      locations.push(...parts);
    }

    return {
      remoteType,
      remoteEvidence: {
        value: remoteType,
        evidence,
        source: rawLocation ? 'ATS_METADATA' : 'JOB_DESCRIPTION',
        confidence: remoteType !== 'UNKNOWN' ? 'HIGH' : 'LOW',
      },
      locations,
    };
  }
}
