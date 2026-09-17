import { PrismaClient } from '@prisma/client';
import { JobNormalizer } from '../services/intelligence/job-normalizer';
import { FreshnessEngine } from '../services/intelligence/freshness-engine';
import { RoleClassifier } from '../services/intelligence/role-classifier';
import { TechnologyExtractor } from '../services/intelligence/technology-extractor';
import { VisaRelocationExtractor } from '../services/intelligence/visa-relocation-extractor';
import { LocationRemoteClassifier } from '../services/intelligence/location-remote-classifier';
import { JobDeduplicator } from '../services/intelligence/job-deduplicator';
import { MatchingGate } from '../services/intelligence/matching-gate';

const prisma = new PrismaClient();

async function backfill() {
  console.log('🔄 Backfilling V4 Job Ground Truth on existing jobs...');
  const profile = (await prisma.candidateProfile.findFirst({
    include: {
      experiences: true,
      skills: true,
      projects: true,
    },
  })) as any;

  const jobs = await prisma.job.findMany();
  console.log(`Found ${jobs.length} jobs to enrich with V4 intelligence.`);

  let count = 0;
  for (const job of jobs) {
    const normalizedCompany = JobNormalizer.normalizeCompany(job.company);
    const normalizedTitle = JobNormalizer.normalizeTitle(job.title);
    const normalizedTechs = JobNormalizer.normalizeTechnologies(job.techStack || []);

    const freshnessEval = FreshnessEngine.evaluateFreshness(
      job.postedAt,
      job.source?.toLowerCase().includes('greenhouse') ||
        job.source?.toLowerCase().includes('lever') ||
        job.source?.toLowerCase().includes('ashby')
        ? 'ATS'
        : 'FEED'
    );

    const roleClassification = RoleClassifier.classify(
      job.title,
      job.description,
      job.experienceRequired || ''
    );

    const techEvidence = TechnologyExtractor.extract(job.title, job.description, job.techStack || []);
    const allNormalizedTechs = Array.from(
      new Set([...normalizedTechs, ...techEvidence.map((t) => t.technology)])
    );

    const locClassification = LocationRemoteClassifier.classify(
      job.location,
      job.title,
      job.description,
      job.isRemote
    );

    const visaReloc = VisaRelocationExtractor.extract(job.description, job.title);

    const identities = JobDeduplicator.generateIdentities(
      job.source,
      job.sourceJobId,
      normalizedCompany,
      normalizedTitle,
      job.location,
      job.description,
      job.canonicalUrl
    );

    const matchingResult = MatchingGate.evaluate(
      {
        title: job.title,
        roleFamily: roleClassification.roleFamily,
        seniority: roleClassification.seniority,
        techStack: allNormalizedTechs,
        technologyEvidence: techEvidence,
        location: job.location,
        remoteType: locClassification.remoteType,
        isRemote: locClassification.remoteType === 'REMOTE' || Boolean(job.isRemote),
        visaSponsorship: visaReloc.visaSponsorship,
        relocation: visaReloc.relocation,
        freshnessStatus: freshnessEval.freshnessStatus,
        jobAgeHours: freshnessEval.jobAgeHours,
        applicationUrl: job.applicationUrl || job.canonicalUrl,
      },
      profile
    );

    await prisma.job.update({
      where: { id: job.id },
      data: {
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
        technologyEvidence: techEvidence as any,
        normalizedCompany,
        normalizedTitle,
        whyThisJob: matchingResult.whyThisJob as any,
        applicationPriority: matchingResult.applicationPriority,
        priorityReasons: matchingResult.priorityReasons,
        techStack: allNormalizedTechs,
      },
    });

    count++;
    if (count % 50 === 0) {
      console.log(`Enriched ${count}/${jobs.length} jobs...`);
    }
  }

  console.log(`✅ Backfill complete! Enriched ${count} jobs with full V4 Job Ground Truth.`);
  await prisma.$disconnect();
}

backfill().catch((err) => {
  console.error('Backfill error:', err);
  process.exit(1);
});
