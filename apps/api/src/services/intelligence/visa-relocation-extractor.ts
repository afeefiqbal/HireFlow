/**
 * HIREflow V4 - Visa & Relocation Extractor
 * Strict evidence extraction with conservative classification.
 * Prevents overclaiming:
 * - EXPLICIT_NO_SPONSORSHIP -> NOT_AVAILABLE
 * - EXISTING_WORK_AUTHORIZATION_REQUIRED -> NOT_MENTIONED
 * - Explicit Sponsorship Offer -> AVAILABLE
 */

import { VisaSponsorship, Relocation, ExtractedFact } from '@ai-job-agent/shared';

export interface VisaRelocationResult {
  visaSponsorship: VisaSponsorship;
  visaEvidence: ExtractedFact<VisaSponsorship>;
  relocation: Relocation;
  relocationEvidence: ExtractedFact<Relocation>;
}

export class VisaRelocationExtractor {
  // Explicit statements that the company does NOT sponsor
  private static readonly NO_SPONSORSHIP_PATTERNS = [
    /\b(do not offer visa sponsorship|no visa sponsorship|unable to sponsor visas|cannot sponsor|will not sponsor|sponsorship is not available|not offering sponsorship|not able to sponsor)\b/i,
  ];

  // Statements requiring existing work authorization (conservative -> NOT_MENTIONED)
  private static readonly WORK_AUTH_PATTERNS = [
    /\b(must be legally authorized to work|valid work permit required|must already have authorization|eligible to work in (the us|germany|europe|the uk|the eu)|must possess valid work)\b/i,
  ];

  // Statements explicitly offering visa support
  private static readonly OFFER_SPONSORSHIP_PATTERNS = [
    /\b(visa sponsorship|visa support|sponsor visas?|eu blue card sponsorship|sponsorship available|visa assistance)\b/i,
  ];

  // Explicit statements offering relocation
  private static readonly OFFER_RELOCATION_PATTERNS = [
    /\b(relocation support|relocation package|relocation assistance|help with relocation|relocation allowance|we support relocation|flight and relocation)\b/i,
  ];

  // Explicit statements denying relocation
  private static readonly NO_RELOCATION_PATTERNS = [
    /\b(no relocation assistance|relocation is not offered|cannot provide relocation|no relocation package)\b/i,
  ];

  static extract(description: string = '', title: string = ''): VisaRelocationResult {
    const text = `${title}\n${description}`.replace(/<[^>]+>/g, ' ');
    const sentences = text
      .split(/(?<=[.!?\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    // 1. Visa Sponsorship Extraction
    let visaSponsorship: VisaSponsorship = 'NOT_MENTIONED';
    let visaFact: ExtractedFact<VisaSponsorship> = {
      value: 'NOT_MENTIONED',
      evidence: null,
      source: 'JOB_DESCRIPTION',
      confidence: 'LOW',
    };

    // Check for explicit denial first
    let denialMatch = sentences.find((s) => this.NO_SPONSORSHIP_PATTERNS.some((p) => p.test(s)));
    if (denialMatch) {
      visaSponsorship = 'NOT_AVAILABLE';
      visaFact = {
        value: 'NOT_AVAILABLE',
        evidence: denialMatch.length > 160 ? `${denialMatch.slice(0, 157)}...` : denialMatch,
        source: 'JOB_DESCRIPTION',
        confidence: 'HIGH',
      };
    } else {
      // Check for explicit sponsorship offer
      let offerMatch = sentences.find((s) => this.OFFER_SPONSORSHIP_PATTERNS.some((p) => p.test(s)));
      if (offerMatch) {
        visaSponsorship = 'AVAILABLE';
        visaFact = {
          value: 'AVAILABLE',
          evidence: offerMatch.length > 160 ? `${offerMatch.slice(0, 157)}...` : offerMatch,
          source: 'JOB_DESCRIPTION',
          confidence: 'HIGH',
        };
      } else {
        // Check for work authorization requirement -> conservative NOT_MENTIONED
        let authMatch = sentences.find((s) => this.WORK_AUTH_PATTERNS.some((p) => p.test(s)));
        if (authMatch) {
          visaSponsorship = 'NOT_MENTIONED';
          visaFact = {
            value: 'NOT_MENTIONED',
            evidence: `Work authorization required ("${authMatch.slice(0, 120)}..."). Sponsorship not explicitly stated.`,
            source: 'JOB_DESCRIPTION',
            confidence: 'MEDIUM',
          };
        }
      }
    }

    // 2. Relocation Extraction
    let relocation: Relocation = 'NOT_MENTIONED';
    let relocationFact: ExtractedFact<Relocation> = {
      value: 'NOT_MENTIONED',
      evidence: null,
      source: 'JOB_DESCRIPTION',
      confidence: 'LOW',
    };

    let relocOfferMatch = sentences.find((s) => this.OFFER_RELOCATION_PATTERNS.some((p) => p.test(s)));
    if (relocOfferMatch) {
      relocation = 'AVAILABLE';
      relocationFact = {
        value: 'AVAILABLE',
        evidence: relocOfferMatch.length > 160 ? `${relocOfferMatch.slice(0, 157)}...` : relocOfferMatch,
        source: 'JOB_DESCRIPTION',
        confidence: 'HIGH',
      };
    } else {
      let relocDenialMatch = sentences.find((s) => this.NO_RELOCATION_PATTERNS.some((p) => p.test(s)));
      if (relocDenialMatch) {
        relocation = 'NOT_AVAILABLE';
        relocationFact = {
          value: 'NOT_AVAILABLE',
          evidence: relocDenialMatch.length > 160 ? `${relocDenialMatch.slice(0, 157)}...` : relocDenialMatch,
          source: 'JOB_DESCRIPTION',
          confidence: 'HIGH',
        };
      }
    }

    return {
      visaSponsorship,
      visaEvidence: visaFact,
      relocation,
      relocationEvidence: relocationFact,
    };
  }
}
