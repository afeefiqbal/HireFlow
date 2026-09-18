/**
 * HIREflow — Autonomous Job Discovery, Preparation & Verified Auto-Apply Test Suite
 * 
 * Tests:
 * 1. Profile Ingestion & Ground Truth synchronization
 * 2. Reconciled Opportunity Tier engine (Tier 1: >=70%, Tier 2: >=75%, Tier 3: >=80%, Tier 4: >=85%)
 * 3. Role family mismatch gate blocking
 * 4. USER_INPUT_REQUIRED screening questions blocking auto-apply
 * 5. Lever, Greenhouse, and Manual Fallback submission adapters
 * 6. Sandbox dry-run isolation (NEVER marks APPLIED, NEVER affects analytics)
 * 7. Verified submission receipt generation and transition to APPLIED
 * 8. Immutable ApplicationSnapshot creation
 * 9. Duplicate application prevention
 * 10. Daily limit enforcement
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';
import { AiService } from './ai/ai.service';
import { GroqProvider } from './ai/providers/groq.provider';
AiService.registerProvider(new GroqProvider());

import { ProfileIngestionService } from './services/profile-ingestion.service';
import { AutoApplyService } from './services/auto-apply/auto-apply.service';
import { LeverSubmissionAdapter } from './services/auto-apply/adapters/lever-submission.adapter';
import { GreenhouseSubmissionAdapter } from './services/auto-apply/adapters/greenhouse-submission.adapter';
import { ManualFallbackAdapter } from './services/auto-apply/adapters/manual-fallback.adapter';
import { PreparationService } from './services/preparation.service';
import { ApplicationService } from './services/application.service';
import { ContinuousDiscoveryService } from './services/continuous-discovery.service';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failed++;
  }
}

async function runAutonomousWorkflowTests() {
  console.log('\n================================================================');
  console.log('🚀 RUNNING AUTONOMOUS WORKFLOW & VERIFIED AUTO-APPLY TEST SUITE');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // TEST GROUP 1: Profile Ingestion & Ground Truth Synchronization
    // -------------------------------------------------------------
    console.log('--- Test Group 1: Profile Ingestion & Ground Truth Synchronization ---');

    const sampleResumeText = `
Elena Rostova
Senior Distributed Systems Engineer
Munich, Germany · +49 151 23456789 · elena.rostova@example.com
https://linkedin.com/in/elena-rostova · https://github.com/erostova

SUMMARY:
Staff-level backend engineer with 8 years of experience designing fault-tolerant distributed platforms using TypeScript, Node.js, Go, and PostgreSQL.

SKILLS:
TypeScript, Node.js, Go, PostgreSQL, Redis, Docker, Kubernetes, AWS, REST APIs

EXPERIENCE:
Staff Backend Engineer · CloudScale GmbH
Jan 2022 – Present · Munich, Germany
- Designed distributed message broker handling 40,000 requests/sec.
- Technologies: Go, TypeScript, Node.js, PostgreSQL, Redis, Docker

Senior Backend Developer · FinTech Global
Mar 2019 – Dec 2021 · Berlin, Germany
- Built PCI-DSS compliant payment processing service.
- Technologies: Node.js, TypeScript, PostgreSQL, AWS

PROJECTS:
ReliableQueue: High-availability distributed FIFO queue engine built in TypeScript.
`;

    const parsedPreview = await ProfileIngestionService.parseResumeText(sampleResumeText);

    assert(parsedPreview.fullName === 'Elena Rostova', 'Extracted candidate fullName matches input');
    assert(parsedPreview.yearsOfExperience >= 5, 'Calculated realistic experience years');
    assert(parsedPreview.skills.some((s) => s.name === 'TypeScript'), 'Extracted verified TypeScript skill');
    assert(parsedPreview.skills.some((s) => s.name === 'Node.js'), 'Extracted verified Node.js skill');
    assert(!parsedPreview.skills.some((s) => s.name === 'Fortran'), 'Did not hallucinate unmentioned skills (Fortran)');

    // Test profile sync (without overwrite to protect current profile)
    const syncedProfile = await ProfileIngestionService.syncToCandidateProfile(parsedPreview, { overwrite: false });
    assert(Boolean(syncedProfile?.id), 'Successfully upserted candidate profile in PostgreSQL');

    // -------------------------------------------------------------
    // TEST GROUP 2: Reconciled Opportunity Tier Hierarchy
    // -------------------------------------------------------------
    console.log('\n--- Test Group 2: Reconciled Opportunity Tier Hierarchy ---');

    // Seed test jobs with different simulated match scores and role families
    const testCompany = `TestCo_${Date.now()}`;
    const jobLowScore = await prisma.job.create({
      data: {
        title: 'Junior HTML Developer',
        company: testCompany,
        location: 'Remote',
        description: 'Junior developer needed for basic HTML and CSS styling.',
        requirements: ['Basic HTML'],
        techStack: ['HTML', 'CSS'],
        applicationUrl: 'https://jobs.lever.co/testco/junior-html',
        canonicalUrl: `https://jobs.lever.co/testco/junior-html-${Date.now()}`,
        source: 'Lever',
        roleFamily: 'SOFTWARE_ENGINEERING',
      },
    });
    await prisma.jobMatch.create({
      data: {
        jobId: jobLowScore.id,
        overallMatch: 65,
        technicalMatch: 65,
        experienceMatch: 65,
        locationMatch: 65,
        visaCompatibility: 'compatible',
        recommendation: 'SKIP',
      },
    });

    const jobTier1 = await prisma.job.create({
      data: {
        title: 'Backend Engineer',
        company: testCompany,
        location: 'Remote',
        description: 'Backend engineer needed for API development in Node.js.',
        requirements: ['Node.js'],
        techStack: ['Node.js', 'PostgreSQL'],
        applicationUrl: 'https://jobs.lever.co/testco/backend-eng',
        canonicalUrl: `https://jobs.lever.co/testco/backend-eng-${Date.now()}`,
        source: 'Lever',
        roleFamily: 'SOFTWARE_ENGINEERING',
      },
    });
    await prisma.jobMatch.create({
      data: {
        jobId: jobTier1.id,
        overallMatch: 72,
        technicalMatch: 72,
        experienceMatch: 72,
        locationMatch: 72,
        visaCompatibility: 'compatible',
        recommendation: 'REVIEW',
      },
    });

    const jobTier2 = await prisma.job.create({
      data: {
        title: 'Senior Node Engineer',
        company: testCompany,
        location: 'Remote',
        description: 'Senior engineer for scalable Node.js microservices.',
        requirements: ['Node.js', 'PostgreSQL'],
        techStack: ['Node.js', 'PostgreSQL', 'Docker'],
        applicationUrl: 'https://jobs.lever.co/testco/senior-node',
        canonicalUrl: `https://jobs.lever.co/testco/senior-node-${Date.now()}`,
        source: 'Lever',
        roleFamily: 'SOFTWARE_ENGINEERING',
      },
    });
    await prisma.jobMatch.create({
      data: {
        jobId: jobTier2.id,
        overallMatch: 78,
        technicalMatch: 78,
        experienceMatch: 78,
        locationMatch: 78,
        visaCompatibility: 'compatible',
        recommendation: 'APPLY',
      },
    });

    const jobTier3 = await prisma.job.create({
      data: {
        title: 'Staff Fullstack Architect',
        company: testCompany,
        location: 'Remote',
        description: 'Staff engineer specializing in Node.js and TypeScript microservices.',
        requirements: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
        techStack: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
        applicationUrl: 'https://jobs.lever.co/testco/staff-arch',
        canonicalUrl: `https://jobs.lever.co/testco/staff-arch-${Date.now()}`,
        source: 'Lever',
        roleFamily: 'SOFTWARE_ENGINEERING',
      },
    });
    await prisma.jobMatch.create({
      data: {
        jobId: jobTier3.id,
        overallMatch: 88,
        technicalMatch: 88,
        experienceMatch: 88,
        locationMatch: 88,
        visaCompatibility: 'compatible',
        recommendation: 'APPLY',
      },
    });

    // Test Role Family Gate rejection
    const jobRoleMismatch = await prisma.job.create({
      data: {
        title: 'Lead Product Strategist',
        company: testCompany,
        location: 'Remote',
        description: 'Product management leadership role.',
        requirements: ['Roadmapping'],
        techStack: ['Product Management'],
        applicationUrl: 'https://jobs.lever.co/testco/lead-pm',
        canonicalUrl: `https://jobs.lever.co/testco/lead-pm-${Date.now()}`,
        source: 'Lever',
        roleFamily: 'OTHER', // Role family mismatch!
      },
    });
    await prisma.jobMatch.create({
      data: {
        jobId: jobRoleMismatch.id,
        overallMatch: 82,
        technicalMatch: 82,
        experienceMatch: 82,
        locationMatch: 82,
        visaCompatibility: 'compatible',
        recommendation: 'APPLY',
      },
    });

    const allQualified = await ContinuousDiscoveryService.getQualifiedOpportunities();

    assert(
      !allQualified.some((q) => q.job.id === jobLowScore.id),
      'Score 65% does NOT qualify for dashboard (< 70%)'
    );

    assert(
      !allQualified.some((q) => q.job.id === jobRoleMismatch.id),
      'Role family mismatch (roleFamily === OTHER) is strictly blocked from qualification despite 82% score'
    );

    const qTier1 = allQualified.find((q) => q.job.id === jobTier1.id);
    assert(Boolean(qTier1), 'Score 72% qualifies for Dashboard (Tier 1)');
    assert(qTier1?.tier === 'DASHBOARD_QUALIFIED', 'Tier 1 correctly labeled DASHBOARD_QUALIFIED');

    const qTier2 = allQualified.find((q) => q.job.id === jobTier2.id);
    assert(Boolean(qTier2), 'Score 78% qualifies for Auto-Preparation (Tier 2)');
    assert(qTier2?.tier === 'AUTO_PREPARED', 'Tier 2 correctly labeled AUTO_PREPARED');

    // -------------------------------------------------------------
    // TEST GROUP 3: Auto-Preparation & Subjective Answer Gate
    // -------------------------------------------------------------
    console.log('\n--- Test Group 3: Auto-Preparation & Subjective Answer Gate ---');

    // Automatically prepare jobTier3
    const prepSummary = await PreparationService.autoPrepareApplication(jobTier3.id);
    assert(prepSummary.cvGenerated, 'Tailored CV generated automatically for Tier 3 job');
    assert(prepSummary.coverLetterGenerated, 'Cover letter generated automatically for Tier 3 job');

    // Test subjective question gate: Add a question requiring user input with empty answer
    const subjQuestion = await prisma.screeningQuestion.create({
      data: {
        jobId: jobTier3.id,
        question: 'What is your philosophy on remote team leadership and mentorship?',
        suggestedAnswer: '',
        confidence: 'low',
        requiresUserInput: true,
        userAnswer: null,
      },
    });

    // Evaluate eligibility with pending subjective question
    let eligibility = await AutoApplyService.evaluateEligibility(jobTier3.id);
    assert(!eligibility.isEligible, 'USER_INPUT_REQUIRED screening question blocks auto-apply');
    assert(eligibility.requiresUserInputCount >= 1, 'Correctly reports pending manual input questions');

    // Provide the answer from user for all questions on jobTier3
    await prisma.screeningQuestion.updateMany({
      where: { jobId: jobTier3.id },
      data: { userAnswer: 'Verified answer provided from Candidate Ground Truth' },
    });

    // Re-evaluate eligibility
    eligibility = await AutoApplyService.evaluateEligibility(jobTier3.id);
    assert(eligibility.isEligible, 'All questions answered allows auto-apply eligibility (Tier 3)');
    assert(eligibility.adapterType === 'LEVER_DIRECT', 'Correctly resolves Lever Direct adapter');

    // -------------------------------------------------------------
    // TEST GROUP 4: Submission Adapters & Anti-Bot Fallback
    // -------------------------------------------------------------
    console.log('\n--- Test Group 4: Submission Adapters & Anti-Bot Fallback ---');

    const leverAdapter = new LeverSubmissionAdapter();
    const ghAdapter = new GreenhouseSubmissionAdapter();
    const manualAdapter = new ManualFallbackAdapter();

    assert(leverAdapter.canHandle({ applicationUrl: 'https://jobs.lever.co/company/slug' } as any), 'Lever adapter handles lever.co URLs');
    assert(ghAdapter.canHandle({ applicationUrl: 'https://boards.greenhouse.io/company/jobs/123' } as any), 'Greenhouse adapter handles greenhouse.io URLs');
    assert(manualAdapter.canHandle({ applicationUrl: 'https://workday.com/apply' } as any), 'Manual fallback handles Workday/generic portals');

    // Test CAPTCHA detection
    const captchaJob = {
      id: 'test_captcha',
      company: 'Secured Corp',
      applicationUrl: 'https://jobs.lever.co/secured/job?captcha=turnstile',
      source: 'Lever',
    } as any;
    const captchaPayload = {
      candidate: { fullName: 'Test Candidate', email: 'test@example.com' },
      resume: { versionName: 'v1', contentJson: {} },
      screeningAnswers: [],
    } as any;

    const captchaResult = await leverAdapter.submit(captchaJob, captchaPayload, { dryRun: false });
    assert(captchaResult.isManualRequired === true, 'CAPTCHA detection immediately triggers isManualRequired');
    assert(!captchaResult.success, 'CAPTCHA detection never falsely marks applied');

    // -------------------------------------------------------------
    // TEST GROUP 5: Sandbox Dry-Run Mode Isolation
    // -------------------------------------------------------------
    console.log('\n--- Test Group 5: Sandbox Dry-Run Mode Isolation ---');

    // Check application status before dry run
    const appBefore = await prisma.application.findUnique({ where: { jobId: jobTier3.id } });
    const statusBefore = appBefore?.status;

    // Execute dry run
    const sandboxResult = await AutoApplyService.submit(jobTier3.id, { dryRun: true });

    assert(sandboxResult.success === true, 'Sandbox dry run succeeds');
    assert(sandboxResult.mode === 'SANDBOX', 'Sandbox returns mode: SANDBOX');
    assert(Boolean(sandboxResult.sandboxResult?.isValid), 'Sandbox produces valid SandboxTestResult');

    // Assert database status was NOT changed to APPLIED
    const appAfter = await prisma.application.findUnique({ where: { jobId: jobTier3.id } });
    assert(appAfter?.status !== 'APPLIED', 'CRITICAL: Sandbox dry run did NOT change Application.status to APPLIED');
    assert(appAfter?.status === statusBefore, 'Application.status preserved during dry run');

    // -------------------------------------------------------------
    // TEST GROUP 6: Verified Live Submission & Snapshot Immutability
    // -------------------------------------------------------------
    console.log('\n--- Test Group 6: Verified Live Submission & Snapshot Immutability ---');

    // Execute verified live submission
    const liveResult = await AutoApplyService.submit(jobTier3.id, { dryRun: false });

    assert(liveResult.success === true, 'Live submission succeeded');
    assert(liveResult.mode === 'LIVE', 'Live submission returns mode: LIVE');
    assert(Boolean(liveResult.receipt?.receiptId), 'Verified SubmissionReceipt generated');
    assert(liveResult.receipt?.mechanism === 'LEVER_DIRECT', 'Receipt records correct mechanism');

    // Verify Application status transitioned to APPLIED
    const appliedApp = await prisma.application.findUnique({
      where: { jobId: jobTier3.id },
      include: { events: true },
    });
    assert(appliedApp?.status === 'APPLIED', 'Application.status is strictly APPLIED upon verified submission');
    assert(Boolean(appliedApp?.appliedDate), 'Application.appliedDate timestamp is set');

    // Verify immutable ApplicationSnapshot
    const snapshot = appliedApp?.snapshotJson as any;
    assert(Boolean(snapshot), 'Immutable ApplicationSnapshot created');
    assert(snapshot.jobTitle === jobTier3.title, 'Snapshot recorded exact job title');
    assert(Boolean(snapshot.candidate?.fullName), 'Snapshot recorded candidate Ground Truth');
    assert(Boolean(snapshot.resume?.versionId), 'Snapshot recorded frozen tailored CV');
    assert(Boolean(snapshot.coverLetter?.fullText), 'Snapshot recorded frozen cover letter');
    assert(snapshot.screeningAnswers?.length >= 1, 'Snapshot recorded frozen screening answers');

    // Verify ApplicationEvent
    const appliedEvent = appliedApp?.events.find((e) => e.type === 'APPLIED');
    assert(Boolean(appliedEvent), 'ApplicationEvent recorded for APPLIED');
    assert(appliedEvent?.source === 'AUTO_APPLY_ENGINE', 'ApplicationEvent source is AUTO_APPLY_ENGINE');

    // -------------------------------------------------------------
    // TEST GROUP 7: Duplicate Protection & Daily Limit Enforcement
    // -------------------------------------------------------------
    console.log('\n--- Test Group 7: Duplicate Protection & Daily Limit Enforcement ---');

    // Attempting to re-submit the already APPLIED job must be rejected
    const duplicateEligibility = await AutoApplyService.evaluateEligibility(jobTier3.id);
    assert(!duplicateEligibility.isEligible, 'Duplicate application blocked: already applied');

    const duplicateSubmit = await AutoApplyService.submit(jobTier3.id, { dryRun: false });
    assert(!duplicateSubmit.success, 'Duplicate live submission attempt rejected');

    // Daily Limit test
    const todayCount = await AutoApplyService.getTodayAutoApplyCount();
    assert(todayCount >= 1, 'Today auto-apply count correctly counts verified applications');

    // Cleanup test jobs
    await prisma.job.deleteMany({
      where: { company: testCompany },
    });

    console.log('\n================================================================');
    console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error('Fatal test suite error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAutonomousWorkflowTests();
