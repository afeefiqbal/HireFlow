/**
 * HIREflow V4 - Matching Gate & Explainable Intelligence Service
 * 1. Role Family Gate: Prevents generic overlap from creating false engineering matches.
 * 2. 4-State Technology Evidence Matching: DIRECT, PARTIAL, NOT_VERIFIED, NOT_RETRIEVED.
 * 3. 100% Deterministic Application Priority: Explicit weighted rules, zero LLM discretion.
 * 4. Explainable "Why This Job?" structured report.
 */

import {
  CandidateProfile,
  Job,
  RoleFamily,
  Seniority,
  WhyThisJobBreakdown,
  TechnologyEvidenceItem,
  FreshnessStatus,
  RemoteType,
  VisaSponsorship,
  Relocation,
} from '@ai-job-agent/shared';
import { JobDeduplicator } from './job-deduplicator';

export interface MatchingGateResult {
  whyThisJob: WhyThisJobBreakdown;
  applicationPriority: number;
  priorityReasons: string[];
  isRoleGatePassed: boolean;
  score: number; // 0-100 overall compatibility
}

export class MatchingGate {
  /**
   * Evaluates a job against the candidate ground truth profile.
   */
  static evaluate(
    job: {
      title: string;
      roleFamily?: string;
      seniority?: string;
      techStack: string[];
      technologyEvidence?: TechnologyEvidenceItem[] | null;
      location: string;
      remoteType?: string;
      isRemote: boolean;
      visaSponsorship?: string;
      relocation?: string;
      freshnessStatus?: string;
      jobAgeHours?: number | null;
      applicationUrl: string;
    },
    profile: CandidateProfile
  ): MatchingGateResult {
    const jobRoleFamily = (job.roleFamily as RoleFamily) || 'SOFTWARE_ENGINEERING';
    const jobSeniority = (job.seniority as Seniority) || 'SENIOR';
    const freshnessStatus = (job.freshnessStatus as FreshnessStatus) || 'UNKNOWN';
    const remoteType = (job.remoteType as RemoteType) || (job.isRemote ? 'REMOTE' : 'UNKNOWN');
    const visaSponsorship = (job.visaSponsorship as VisaSponsorship) || 'NOT_MENTIONED';
    const relocation = (job.relocation as Relocation) || 'NOT_MENTIONED';

    // Candidate baseline
    const candidateFamily: RoleFamily = 'SOFTWARE_ENGINEERING';
    const candidateSeniority: Seniority = 'SENIOR'; // Afeef Iqbal: 7+ years
    const verifiedSkills = [
      ...(profile.primaryTechnologies || []),
      ...(profile.additionalTechnologies || []),
      ...((profile as any).skills ? (profile as any).skills.map((s: any) => s.name) : []),
    ].map((s) => s.toLowerCase());

    // 1. Role Family Gate
    // If the role family does not align with Software Engineering, the gate fails
    const isRoleGatePassed = jobRoleFamily === candidateFamily;

    // 2. Seniority Match
    const seniorityMatch =
      jobSeniority === 'SENIOR' || jobSeniority === 'MID' || jobSeniority === 'UNKNOWN' || jobSeniority === 'LEAD';

    // 3. 4-State Technology Matching
    // Extract candidate verified technologies
    const techBreakdown: Array<{
      technology: string;
      status: 'DIRECT' | 'PARTIAL' | 'NOT_VERIFIED';
      evidence?: string;
    }> = [];

    let directCount = 0;
    const requiredTechs = job.techStack || [];

    for (const tech of requiredTechs) {
      const lower = tech.toLowerCase();
      if (verifiedSkills.includes(lower)) {
        directCount++;
        techBreakdown.push({
          technology: tech,
          status: 'DIRECT',
          evidence: `Directly verified in candidate profile (7+ years hands-on experience).`,
        });
      } else if (
        (lower.includes('vue') && verifiedSkills.some((s) => s.includes('react'))) ||
        (lower.includes('react') && verifiedSkills.some((s) => s.includes('vue'))) ||
        (lower.includes('angular') && verifiedSkills.some((s) => s.includes('vue') || s.includes('react'))) ||
        (lower.includes('postgres') && verifiedSkills.includes('mysql')) ||
        (lower.includes('mysql') && verifiedSkills.includes('postgresql'))
      ) {
        techBreakdown.push({
          technology: tech,
          status: 'PARTIAL',
          evidence: `Related architectural experience verified in complementary stack.`,
        });
      } else {
        techBreakdown.push({
          technology: tech,
          status: 'NOT_VERIFIED',
          evidence: `Not verified in profile (untested requirement, not assumed missing).`,
        });
      }
    }

    // 4. Remote & Work Setup Compatibility
    const remoteCompatible = remoteType === 'REMOTE' || (job.isRemote && remoteType !== 'ONSITE');

    // 5. Authentic Application URL
    const isAuthenticAts = JobDeduplicator.isAuthenticAtsUrl(job.applicationUrl);
    let appDomain = 'external';
    try {
      if (job.applicationUrl) {
        appDomain = new URL(job.applicationUrl).hostname;
      }
    } catch {
      appDomain = 'company-portal';
    }

    // 6. 100% Deterministic Weighted Application Priority Calculation
    // Explicit weights, zero LLM discretion
    let priorityScore = 0;
    const priorityReasons: string[] = [];

    if (isRoleGatePassed) {
      priorityScore += 2;
      priorityReasons.push('Role family matches (Software Engineering)');
    } else {
      priorityReasons.push(`Role family mismatch (${jobRoleFamily} vs Software Engineering)`);
    }

    if (seniorityMatch) {
      priorityScore += 1;
      priorityReasons.push('Seniority level matches candidate profile (Senior / 7+ yrs)');
    }

    if (directCount >= 3) {
      priorityScore += 2;
      priorityReasons.push(`${directCount} core technologies verified directly in profile`);
    } else if (directCount >= 1) {
      priorityScore += 1;
      priorityReasons.push(`${directCount} direct verified technology match`);
    }

    if (freshnessStatus === 'FRESH') {
      priorityScore += 1;
      priorityReasons.push('Posted within 6 hours (FRESH)');
    } else if (freshnessStatus === 'RECENT') {
      priorityScore += 1;
      priorityReasons.push('Posted within 12 hours (RECENT)');
    }

    if (remoteCompatible) {
      priorityScore += 1;
      priorityReasons.push('Remote work setup aligns with candidate preference');
    }

    if (isAuthenticAts) {
      priorityScore += 1;
      priorityReasons.push(`Authentic direct employer ATS URL (${appDomain})`);
    }

    if (visaSponsorship === 'AVAILABLE') {
      priorityScore += 1;
      priorityReasons.push('Explicit visa sponsorship provided');
    }

    // If role family gate failed, cap priority score to prevent false recommendations
    if (!isRoleGatePassed) {
      priorityScore = Math.min(2, priorityScore);
    }

    // Scale to standard score (0-100)
    let score = Math.min(99, Math.round((priorityScore / 9) * 100));
    if (!isRoleGatePassed) {
      score = Math.min(45, score); // Hard gate cap for different role families
    }

    const whyThisJob: WhyThisJobBreakdown = {
      roleFamily: {
        status: isRoleGatePassed ? 'MATCH' : 'MISMATCH',
        value: jobRoleFamily,
        candidateFamily: 'Software Engineering',
        isGatePass: isRoleGatePassed,
      },
      seniority: {
        status: seniorityMatch ? 'MATCH' : 'GAP',
        value: jobSeniority,
        candidateSeniority: 'Senior (7+ years)',
      },
      technologies: techBreakdown,
      workSetup: {
        remoteType,
        location: job.location,
        isCompatible: remoteCompatible,
      },
      visa: {
        status: visaSponsorship,
        evidence: null,
      },
      relocation: {
        status: relocation,
        evidence: null,
      },
      freshness: {
        status: freshnessStatus,
        ageHours: job.jobAgeHours || null,
        label: job.jobAgeHours !== null && job.jobAgeHours !== undefined ? `${job.jobAgeHours}h ago` : 'Age unverified',
      },
      applicationUrlQuality: {
        isAuthenticAts,
        domain: appDomain,
      },
      priorityScore,
      priorityReasons,
    };

    return {
      whyThisJob,
      applicationPriority: priorityScore,
      priorityReasons,
      isRoleGatePassed,
      score,
    };
  }
}
