/**
 * HIREflow V4 — Job Intelligence & Discovery Deterministic Regression Suite
 * 
 * Verifies the 10 core V4 intelligence capabilities:
 * 1. Tech & Company Normalization (dictionary mapping, suffix removal)
 * 2. Freshness Engine (<6h, 6-12h, 12-24h, >24h, unknown)
 * 3. Cross-Source Deduplication (Greenhouse vs Arbeitnow -> single canonical identity)
 * 4. Role Family & Seniority Classification (generic token boundary matching)
 * 5. Conservative Visa Classification (Explicit No, Work Auth Req, Explicit Offer)
 * 6. Relocation Classification (Explicit Offer, None)
 * 7. Technology Evidence Extraction (Required vs Optional, excerpt capture)
 * 8. 4-State Candidate Matching (DIRECT, PARTIAL, NOT_VERIFIED)
 * 9. Role Family Gate (Prevents PM/Sales from passing engineering match)
 * 10. 100% Deterministic Application Priority Scoring (explicit integer weights + reasons)
 */

import { JobNormalizer } from './services/intelligence/job-normalizer';
import { FreshnessEngine } from './services/intelligence/freshness-engine';
import { RoleClassifier } from './services/intelligence/role-classifier';
import { TechnologyExtractor } from './services/intelligence/technology-extractor';
import { VisaRelocationExtractor } from './services/intelligence/visa-relocation-extractor';
import { JobDeduplicator } from './services/intelligence/job-deduplicator';
import { MatchingGate } from './services/intelligence/matching-gate';
import { CandidateProfile } from '@ai-job-agent/shared';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: any) {
  if (condition) {
    results.push({ suite, name, passed: true, details });
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    results.push({ suite, name, passed: false, error: 'Assertion failed', details });
    console.error(`  ✗ [FAIL] ${name}`, details);
  }
}

async function runV4Tests() {
  console.log('====================================================');
  console.log('HIREflow V4: Automated Deterministic Regression Suite');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // Test 1: Normalization Engine
  // ----------------------------------------------------
  console.log('Suite 1: Tech & Company Normalization');
  const normalizedTech1 = JobNormalizer.normalizeTechnology('Node');
  const normalizedTech2 = JobNormalizer.normalizeTechnology('PHP 8.3');
  const normalizedTech3 = JobNormalizer.normalizeTechnology('Laravel 11');
  const normalizedTech4 = JobNormalizer.normalizeTechnology('ReactJS');
  const normalizedTech5 = JobNormalizer.normalizeTechnology('Postgres');
  const normalizedCompany1 = JobNormalizer.normalizeCompany('Stripe, Inc.');
  const normalizedCompany2 = JobNormalizer.normalizeCompany('Shopify LLC');
  const normalizedTitle = JobNormalizer.normalizeTitle('Senior Backend Engineer (m/f/d) - Urgent');

  assert(normalizedTech1 === 'Node.js', 'Normalization', 'Node normalizes to Node.js', { actual: normalizedTech1 });
  assert(normalizedTech2 === 'PHP', 'Normalization', 'PHP 8.3 normalizes to PHP', { actual: normalizedTech2 });
  assert(normalizedTech3 === 'Laravel', 'Normalization', 'Laravel 11 normalizes to Laravel', { actual: normalizedTech3 });
  assert(normalizedTech4 === 'React', 'Normalization', 'ReactJS normalizes to React', { actual: normalizedTech4 });
  assert(normalizedTech5 === 'PostgreSQL', 'Normalization', 'Postgres normalizes to PostgreSQL', { actual: normalizedTech5 });
  assert(normalizedCompany1 === 'Stripe', 'Normalization', 'Stripe, Inc. normalizes to Stripe', { actual: normalizedCompany1 });
  assert(normalizedCompany2 === 'Shopify', 'Normalization', 'Shopify LLC normalizes to Shopify', { actual: normalizedCompany2 });
  assert(normalizedTitle === 'Senior Backend Engineer', 'Normalization', 'Strips (m/f/d) and Urgent markers from title', { actual: normalizedTitle });

  // ----------------------------------------------------
  // Test 2: Freshness Engine
  // ----------------------------------------------------
  console.log('\nSuite 2: Freshness Engine');
  const now = new Date();
  const dateFresh = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
  const dateRecent = new Date(now.getTime() - 8 * 60 * 60 * 1000); // 8 hours ago
  const dateToday = new Date(now.getTime() - 16 * 60 * 60 * 1000); // 16 hours ago
  const dateStale = new Date(now.getTime() - 36 * 60 * 60 * 1000); // 36 hours ago

  const freshRes = FreshnessEngine.evaluateFreshness(dateFresh, 'ATS', now);
  const recentRes = FreshnessEngine.evaluateFreshness(dateRecent, 'ATS', now);
  const todayRes = FreshnessEngine.evaluateFreshness(dateToday, 'ATS', now);
  const staleRes = FreshnessEngine.evaluateFreshness(dateStale, 'ATS', now);
  const unknownRes = FreshnessEngine.evaluateFreshness(null, 'UNKNOWN', now);

  assert(freshRes.freshnessStatus === 'FRESH' && freshRes.isFresh, 'Freshness', '<6h is classified as FRESH and isFresh=true', freshRes);
  assert(recentRes.freshnessStatus === 'RECENT' && recentRes.isFresh, 'Freshness', '6-12h is classified as RECENT and isFresh=true', recentRes);
  assert(todayRes.freshnessStatus === 'TODAY' && todayRes.isFresh, 'Freshness', '12-24h is classified as TODAY and isFresh=true', todayRes);
  assert(staleRes.freshnessStatus === 'STALE' && !staleRes.isFresh, 'Freshness', '>24h is classified as STALE and isFresh=false', staleRes);
  assert(unknownRes.freshnessStatus === 'UNKNOWN' && !unknownRes.isFresh, 'Freshness', 'Null date is classified as UNKNOWN and isFresh=false', unknownRes);

  // ----------------------------------------------------
  // Test 3: Cross-Source Deduplication
  // ----------------------------------------------------
  console.log('\nSuite 3: Cross-Source Deduplication & Provenance Separation');
  const rawJobGreenhouse = {
    source: 'Greenhouse',
    sourceJobId: 'gh-99881',
    company: 'FinTech Hub GmbH',
    title: 'Senior Laravel Developer',
    location: 'Berlin, Germany',
    description: 'We are seeking a Senior Laravel Developer with deep PHP and MySQL expertise to scale our core payment platform.',
    applyUrl: 'https://boards.greenhouse.io/fintechhub/jobs/99881',
  };

  const rawJobArbeitnow = {
    source: 'Arbeitnow',
    sourceJobId: 'arb-44312',
    company: 'FinTech Hub',
    title: 'Senior Laravel Developer (m/w/d)',
    location: 'Berlin',
    description: 'We are seeking a Senior Laravel Developer with deep PHP and MySQL expertise to scale our core payment platform.',
    applyUrl: 'https://www.arbeitnow.com/view/senior-laravel-developer-fintechhub-44312',
  };

  const ghIdent = JobDeduplicator.generateIdentities(
    rawJobGreenhouse.source,
    rawJobGreenhouse.sourceJobId,
    rawJobGreenhouse.company,
    rawJobGreenhouse.title,
    rawJobGreenhouse.location,
    rawJobGreenhouse.description,
    rawJobGreenhouse.applyUrl
  );

  const arbIdent = JobDeduplicator.generateIdentities(
    rawJobArbeitnow.source,
    rawJobArbeitnow.sourceJobId,
    rawJobArbeitnow.company,
    rawJobArbeitnow.title,
    rawJobArbeitnow.location,
    rawJobArbeitnow.description,
    rawJobArbeitnow.applyUrl
  );

  assert(ghIdent.sourceIdentity === 'greenhouse::gh-99881', 'Deduplication', 'Greenhouse sourceIdentity preserves platform ID', { id: ghIdent.sourceIdentity });
  assert(arbIdent.sourceIdentity === 'arbeitnow::arb-44312', 'Deduplication', 'Arbeitnow sourceIdentity preserves platform ID', { id: arbIdent.sourceIdentity });
  assert(
    ghIdent.canonicalIdentity === arbIdent.canonicalIdentity,
    'Deduplication',
    'Greenhouse and Arbeitnow share EXACT same canonicalIdentity despite different source IDs',
    { gh: ghIdent.canonicalIdentity, arb: arbIdent.canonicalIdentity }
  );

  const ghIsAuthentic = JobDeduplicator.isAuthenticAtsUrl(rawJobGreenhouse.applyUrl);
  const arbIsAuthentic = JobDeduplicator.isAuthenticAtsUrl(rawJobArbeitnow.applyUrl);
  assert(ghIsAuthentic && !arbIsAuthentic, 'Deduplication', 'Authentic ATS application URL (Greenhouse) is recognized over aggregator (Arbeitnow)');

  // ----------------------------------------------------
  // Test 4: Role Family & Seniority Classifier
  // ----------------------------------------------------
  console.log('\nSuite 4: Role Family & Seniority Classifier');
  const role1 = RoleClassifier.classify('Senior Backend Engineer', 'We build distributed systems in Go and PHP.');
  const role2 = RoleClassifier.classify('Technical Project Manager', 'Coordinate sprints, roadmap planning, and stakeholder meetings.');
  const role3 = RoleClassifier.classify('Engineering Manager - Infrastructure', 'Lead a team of 8 site reliability engineers.');
  const role4 = RoleClassifier.classify('Junior Full Stack Developer', 'Entry level position for modern web apps.');

  assert(role1.roleFamily === 'SOFTWARE_ENGINEERING' && role1.seniority === 'SENIOR', 'Role Classifier', 'Senior Backend Engineer -> SOFTWARE_ENGINEERING / SENIOR', role1);
  assert(role2.roleFamily === 'PROJECT_MANAGEMENT', 'Role Classifier', 'Technical Project Manager -> PROJECT_MANAGEMENT', role2);
  assert(role3.roleFamily === 'ENGINEERING_MANAGEMENT' && (role3.seniority === 'LEAD' || role3.seniority === 'MANAGER'), 'Role Classifier', 'Engineering Manager -> ENGINEERING_MANAGEMENT / LEAD|MANAGER', role3);
  assert(role4.roleFamily === 'SOFTWARE_ENGINEERING' && role4.seniority === 'JUNIOR', 'Role Classifier', 'Junior Full Stack Developer -> SOFTWARE_ENGINEERING / JUNIOR', role4);

  // ----------------------------------------------------
  // Test 5: Conservative Visa Extraction
  // ----------------------------------------------------
  console.log('\nSuite 5: Conservative Visa Extraction');
  const visaExplicitOffer = VisaRelocationExtractor.extract(
    'Benefits: Visa sponsorship and relocation support provided for international hires.'
  );
  const visaExplicitNo = VisaRelocationExtractor.extract(
    'Unfortunately we do not offer visa sponsorship for this role. Candidates must not require sponsorship.'
  );
  const visaWorkAuthReq = VisaRelocationExtractor.extract(
    'Requirements: Candidates must be legally authorized to work in Germany or the EU.'
  );
  const visaNoMention = VisaRelocationExtractor.extract(
    'Come build great software with a dynamic and creative team.'
  );

  assert(visaExplicitOffer.visaSponsorship === 'AVAILABLE', 'Visa Extractor', 'Explicit sponsorship offer -> AVAILABLE', visaExplicitOffer);
  assert(visaExplicitNo.visaSponsorship === 'NOT_AVAILABLE', 'Visa Extractor', 'Explicit denial -> NOT_AVAILABLE', visaExplicitNo);
  assert(
    visaWorkAuthReq.visaSponsorship === 'NOT_MENTIONED',
    'Visa Extractor',
    'General work authorization requirement -> NOT_MENTIONED (conservative, does not overclaim lack of sponsorship)',
    visaWorkAuthReq
  );
  assert(visaNoMention.visaSponsorship === 'NOT_MENTIONED', 'Visa Extractor', 'No mention -> NOT_MENTIONED', visaNoMention);

  // ----------------------------------------------------
  // Test 6: Relocation Extraction
  // ----------------------------------------------------
  console.log('\nSuite 6: Relocation Extraction');
  const reloExplicit = VisaRelocationExtractor.extract(
    'We offer a generous relocation package including flight and relocation support.'
  );
  const reloNone = VisaRelocationExtractor.extract('Remote-first company with flexible working hours.');

  assert(reloExplicit.relocation === 'AVAILABLE', 'Relocation Extractor', 'Relocation assistance offered -> AVAILABLE', reloExplicit);
  assert(reloNone.relocation === 'NOT_MENTIONED', 'Relocation Extractor', 'No relocation mention -> NOT_MENTIONED', reloNone);

  // ----------------------------------------------------
  // Test 7: Technology Evidence Extraction
  // ----------------------------------------------------
  console.log('\nSuite 7: Technology Evidence Extraction');
  const sampleJD = `
    Required Qualifications:
    - 5+ years building backends with Laravel and PHP.
    - Deep knowledge of PostgreSQL and Docker containerization.
    
    Nice to Have:
    - Experience with Vue.js or React.
    - Familiarity with AWS and Kubernetes.
  `;
  const techEvidence = TechnologyExtractor.extract('Senior Backend Developer', sampleJD);
  const laravelItem = techEvidence.find((t) => t.technology === 'Laravel');
  const vueItem = techEvidence.find((t) => t.technology === 'Vue.js');

  assert(laravelItem?.status === 'REQUIRED', 'Technology Extractor', 'Laravel classified as REQUIRED with excerpt context', laravelItem);
  assert(vueItem?.status === 'OPTIONAL', 'Technology Extractor', 'Vue.js classified as OPTIONAL under Nice to Have', vueItem);
  assert(techEvidence.some((t) => t.technology === 'PostgreSQL'), 'Technology Extractor', 'PostgreSQL extracted from JD', {});

  // ----------------------------------------------------
  // Test 8: 4-State Candidate Matching
  // ----------------------------------------------------
  console.log('\nSuite 8: 4-State Candidate Matching & Role Family Gate');
  const mockCandidateProfile: CandidateProfile = {
    id: 'cand-afeef',
    fullName: 'Afeef Iqbal',
    headline: 'Senior Laravel / Full Stack Engineer',
    yearsOfExperience: 7,
    primaryTechnologies: ['Laravel', 'PHP', 'Vue.js', 'MySQL', 'Docker'],
    additionalTechnologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    targetRoles: ['Senior Laravel Developer', 'Senior Backend Engineer'],
    targetLocations: ['Germany', 'Netherlands', 'Remote'],
    remotePreference: 'preferred',
    relocationPreference: 'preferred',
    visaSponsorshipRequired: true,
    experiences: [],
    projects: [],
    hasKnownCareerGap: false,
    careerGapDescription: '',
  };

  const highMatchJob = {
    title: 'Senior Laravel Developer',
    roleFamily: 'SOFTWARE_ENGINEERING',
    seniority: 'SENIOR',
    techStack: ['Laravel', 'PHP', 'Vue.js', 'Angular', 'Go'],
    location: 'Berlin, Germany',
    remoteType: 'REMOTE',
    isRemote: true,
    visaSponsorship: 'AVAILABLE',
    relocation: 'AVAILABLE',
    freshnessStatus: 'FRESH',
    jobAgeHours: 3,
    applicationUrl: 'https://boards.greenhouse.io/sample/12345',
  };

  const gateResult = MatchingGate.evaluate(highMatchJob, mockCandidateProfile);

  const directLaravel = gateResult.whyThisJob.technologies.find((t) => t.technology === 'Laravel');
  const partialAngular = gateResult.whyThisJob.technologies.find((t) => t.technology === 'Angular');
  const notVerifiedGo = gateResult.whyThisJob.technologies.find((t) => t.technology === 'Go');

  assert(directLaravel?.status === 'DIRECT', '4-State Matching', 'Laravel matches candidate profile directly -> DIRECT', directLaravel);
  assert(partialAngular?.status === 'PARTIAL', '4-State Matching', 'Angular matches candidate complementary frontend skills -> PARTIAL', partialAngular);
  assert(notVerifiedGo?.status === 'NOT_VERIFIED', '4-State Matching', 'Go is unverified in profile -> NOT_VERIFIED (not assumed missing)', notVerifiedGo);

  // ----------------------------------------------------
  // Test 9: Role Family Gate
  // ----------------------------------------------------
  console.log('\nSuite 9: Role Family Gate (Prevents False Matches)');
  const pmJob = {
    ...highMatchJob,
    title: 'Technical Project Manager',
    roleFamily: 'PROJECT_MANAGEMENT',
  };

  const pmGateResult = MatchingGate.evaluate(pmJob, mockCandidateProfile);

  assert(gateResult.isRoleGatePassed, 'Role Family Gate', 'Software Engineering role passes engineering candidate gate', { passed: gateResult.isRoleGatePassed });
  assert(!pmGateResult.isRoleGatePassed, 'Role Family Gate', 'Project Manager role BLOCKED by Software Engineering candidate gate', { passed: pmGateResult.isRoleGatePassed });
  assert(pmGateResult.score <= 45, 'Role Family Gate', 'Blocked role family score capped at <= 45', { score: pmGateResult.score });

  // ----------------------------------------------------
  // Test 10: 100% Deterministic Application Priority
  // ----------------------------------------------------
  console.log('\nSuite 10: Deterministic Application Priority Scoring');
  assert(gateResult.applicationPriority >= 7, 'Priority Scoring', 'High priority score >= 7 calculated deterministically', { score: gateResult.applicationPriority });
  assert(
    gateResult.priorityReasons.some((r: string) => r.includes('Role family matches')),
    'Priority Scoring',
    'Includes deterministic reason for role family match',
    gateResult.priorityReasons
  );
  assert(
    gateResult.priorityReasons.some((r: string) => r.includes('Posted within 6 hours')),
    'Priority Scoring',
    'Includes deterministic reason for fresh posting (<6h)',
    gateResult.priorityReasons
  );
  assert(
    gateResult.priorityReasons.some((r: string) => r.includes('Authentic direct employer ATS URL')),
    'Priority Scoring',
    'Includes deterministic reason for authentic ATS URL',
    gateResult.priorityReasons
  );
  assert(
    gateResult.priorityReasons.some((r: string) => r.includes('Explicit visa sponsorship provided')),
    'Priority Scoring',
    'Includes deterministic reason for explicit visa sponsorship',
    gateResult.priorityReasons
  );

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`V4 Suite Execution Complete: ${passed}/${total} assertions PASSED (${failed} failed)`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runV4Tests().catch((err) => {
  console.error('Fatal error running V4 regression suite:', err);
  process.exit(1);
});
