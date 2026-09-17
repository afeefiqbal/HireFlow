/**
 * HIREflow V4 - Job Pipeline Service
 * Orchestrates the complete V4 Job Intelligence & Ground Truth workflow:
 * Ingest -> Normalize -> Deduplicate -> Freshness -> Role/Seniority -> Tech -> Location -> Visa -> Matching -> Persist
 */

import { PrismaClient, VisaStatus, JobAgeStatus } from '@prisma/client';
import { CandidateProfile, FactConfidence, VisaSponsorship } from '@ai-job-agent/shared';
import { JobNormalizer } from './job-normalizer';
import { FreshnessEngine } from './freshness-engine';
import { RoleClassifier } from './role-classifier';
import { TechnologyExtractor } from './technology-extractor';
import { VisaRelocationExtractor } from './visa-relocation-extractor';
import { LocationRemoteClassifier } from './location-remote-classifier';
import { JobDeduplicator } from './job-deduplicator';
import { MatchingGate } from './matching-gate';

const prisma = new PrismaClient();

export interface RawJobInput {
  title: string;
  company: string;
  location: string;
  isRemote?: boolean;
  employmentType?: string;
  postedAt?: Date | string | number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  experienceRequired?: string | null;
  techStack?: string[];
  description: string;
  requirements?: string[];
  preferredSkills?: string[];
  applicationUrl: string;
  canonicalUrl: string;
  source: string;
  sourceJobId?: string | null;
  sourceUrl?: string;
}

export class JobPipelineService {
  /**
   * Processes a single raw job through the entire deterministic V4 intelligence pipeline.
   */
  static async processAndIngestJob(raw: RawJobInput, profileOverride?: CandidateProfile | null) {
    // 1. Load candidate profile for matching
    const profile =
      profileOverride ||
      ((await prisma.candidateProfile.findFirst({
        include: {
          experiences: true,
          skills: true,
          projects: true,
        },
      })) as any);

    // 2. Normalization
    const normalizedCompany = JobNormalizer.normalizeCompany(raw.company);
    const normalizedTitle = JobNormalizer.normalizeTitle(raw.title);
    const normalizedTechs = JobNormalizer.normalizeTechnologies(raw.techStack || []);

    // 3. Freshness Engine
    const freshnessEval = FreshnessEngine.evaluateFreshness(
      raw.postedAt,
      raw.source?.toLowerCase().includes('greenhouse') ||
        raw.source?.toLowerCase().includes('lever') ||
        raw.source?.toLowerCase().includes('ashby')
        ? 'ATS'
        : 'FEED'
    );

    // 4. Role Family & Seniority
    const roleClassification = RoleClassifier.classify(raw.title, raw.description, raw.experienceRequired || '');

    // 5. Technology Evidence Extraction
    const techEvidence = TechnologyExtractor.extract(raw.title, raw.description, raw.techStack || []);
    // Combine normalized tech list with extracted techs
    const allNormalizedTechs = Array.from(
      new Set([...normalizedTechs, ...techEvidence.map((t) => t.technology)])
    );

    // 6. Location & Remote Intelligence
    const locClassification = LocationRemoteClassifier.classify(
      raw.location,
      raw.title,
      raw.description,
      raw.isRemote || false
    );

    // 7. Visa & Relocation Extraction (Conservative)
    const visaReloc = VisaRelocationExtractor.extract(raw.description, raw.title);

    // 8. Deduplication Identities
    const identities = JobDeduplicator.generateIdentities(
      raw.source,
      raw.sourceJobId,
      normalizedCompany,
      normalizedTitle,
      raw.location,
      raw.description,
      raw.canonicalUrl
    );

    // 9. Candidate Matching & Explainability Gate
    const matchingResult = MatchingGate.evaluate(
      {
        title: raw.title,
        roleFamily: roleClassification.roleFamily,
        seniority: roleClassification.seniority,
        techStack: allNormalizedTechs,
        technologyEvidence: techEvidence,
        location: raw.location,
        remoteType: locClassification.remoteType,
        isRemote: locClassification.remoteType === 'REMOTE' || Boolean(raw.isRemote),
        visaSponsorship: visaReloc.visaSponsorship,
        relocation: visaReloc.relocation,
        freshnessStatus: freshnessEval.freshnessStatus,
        jobAgeHours: freshnessEval.jobAgeHours,
        applicationUrl: raw.applicationUrl || raw.canonicalUrl,
      },
      profile
    );

    // 10. Check Deduplication in Database
    // Check either canonicalIdentity match or direct canonicalUrl match
    let existingJob = await prisma.job.findFirst({
      where: {
        OR: [
          { canonicalUrl: raw.canonicalUrl },
          { canonicalIdentity: identities.canonicalIdentity },
        ],
      },
    });

    // Map VisaSponsorship enum to legacy VisaStatus enum for 100% backward compatibility
    let legacyVisaStatus: VisaStatus = 'NOT_STATED';
    if (visaReloc.visaSponsorship === 'AVAILABLE') legacyVisaStatus = 'OFFERED';
    else if (visaReloc.visaSponsorship === 'NOT_AVAILABLE') legacyVisaStatus = 'NOT_OFFERED';

    if (existingJob) {
      // Merge Provenance: if new source provides a direct ATS application URL and existing is an aggregator, upgrade it
      const isNewAts = JobDeduplicator.isAuthenticAtsUrl(raw.applicationUrl);
      const isExistingAts = JobDeduplicator.isAuthenticAtsUrl(existingJob.applicationUrl);

      const updateData: any = {
        updatedAt: new Date(),
        // Keep freshest timestamp
        ...(freshnessEval.postedAt &&
        (!existingJob.postedAt || freshnessEval.postedAt > existingJob.postedAt)
          ? {
              postedAt: freshnessEval.postedAt,
              jobAgeHours: freshnessEval.jobAgeHours,
              ageStatus: freshnessEval.ageStatus,
              freshnessStatus: freshnessEval.freshnessStatus,
            }
          : {}),
        // Upgrade to authentic ATS url if existing was aggregator
        ...(!isExistingAts && isNewAts
          ? {
              applicationUrl: raw.applicationUrl,
              source: raw.source,
              sourceJobId: raw.sourceJobId || existingJob.sourceJobId,
            }
          : {}),
      };

      const updated = await prisma.job.update({
        where: { id: existingJob.id },
        data: updateData,
      });

      return {
        job: updated,
        isNew: false,
        isMerged: true,
        matching: matchingResult,
      };
    }

    // 11. Create New Canonical Job Record
    const newJob = await prisma.job.create({
      data: {
        title: raw.title,
        company: raw.company,
        location: raw.location || 'Unknown',
        isRemote: locClassification.remoteType === 'REMOTE' || Boolean(raw.isRemote),
        employmentType: raw.employmentType || 'Full-time',
        postedAt: freshnessEval.postedAt,
        discoveredAt: new Date(),
        jobAgeHours: freshnessEval.jobAgeHours,
        ageStatus: freshnessEval.ageStatus,
        salaryMin: raw.salaryMin,
        salaryMax: raw.salaryMax,
        salaryCurrency: raw.salaryCurrency || 'EUR',
        visaStatus: legacyVisaStatus,
        experienceRequired: raw.experienceRequired,
        techStack: allNormalizedTechs,
        description: raw.description,
        requirements: raw.requirements || [],
        preferredSkills: raw.preferredSkills || [],
        applicationUrl: raw.applicationUrl || raw.canonicalUrl,
        canonicalUrl: raw.canonicalUrl,
        source: raw.source,
        sourceUrl: raw.sourceUrl,

        // V4 Intelligence Fields
        sourceJobId: raw.sourceJobId,
        sourceIdentity: identities.sourceIdentity,
        canonicalIdentity: identities.canonicalIdentity,
        descriptionFingerprint: identities.descriptionFingerprint,
        locations: locClassification.locations,
        remoteType: locClassification.remoteType,
        remoteEvidence: locClassification.remoteEvidence as any,
        postedAtSource: freshnessEval.postedAtSource,
        freshnessStatus: freshnessEval.freshnessStatus,
        seniority: roleClassification.seniority,
        roleFamily: roleClassification.roleFamily,
        visaSponsorship: visaReloc.visaSponsorship,
        visaEvidence: visaReloc.visaEvidence as any,
        relocation: visaReloc.relocation,
        relocationEvidence: visaReloc.relocationEvidence as any,
        responsibilities: [],
        technologyEvidence: techEvidence as any,
        normalizedCompany,
        normalizedTitle,
        whyThisJob: matchingResult.whyThisJob as any,
        applicationPriority: matchingResult.applicationPriority,
        priorityReasons: matchingResult.priorityReasons,
      },
    });

    // Create a default initial JobMatch record if not existing
    await prisma.jobMatch.create({
      data: {
        jobId: newJob.id,
        overallMatch: matchingResult.score,
        technicalMatch: Math.min(95, matchingResult.score + 5),
        experienceMatch: matchingResult.whyThisJob.seniority.status === 'MATCH' ? 90 : 70,
        locationMatch: matchingResult.whyThisJob.workSetup.isCompatible ? 95 : 60,
        visaCompatibility:
          visaReloc.visaSponsorship === 'AVAILABLE'
            ? 'compatible'
            : visaReloc.visaSponsorship === 'NOT_AVAILABLE'
            ? 'incompatible'
            : 'unknown',
        strongMatches: techEvidence.filter((t) => t.status === 'REQUIRED').map((t) => t.technology),
        missingRequirements: matchingResult.whyThisJob.technologies
          .filter((t) => t.status === 'NOT_VERIFIED')
          .map((t) => t.technology),
        concerns: matchingResult.isRoleGatePassed
          ? []
          : [`Role family (${roleClassification.roleFamily}) diverges from Software Engineering.`],
        reasoning: matchingResult.priorityReasons,
        recommendation: matchingResult.score >= 75 ? 'APPLY' : matchingResult.score >= 55 ? 'REVIEW' : 'SKIP',
      },
    });

    return {
      job: newJob,
      isNew: true,
      isMerged: false,
      matching: matchingResult,
    };
  }
}
