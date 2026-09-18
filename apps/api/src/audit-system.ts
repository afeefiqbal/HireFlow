import { PrismaClient } from '@prisma/client';
import { JobNormalizer } from './services/intelligence/job-normalizer';
import { FreshnessEngine } from './services/intelligence/freshness-engine';
import { MatchingGate } from './services/intelligence/matching-gate';
import { RoleClassifier } from './services/intelligence/role-classifier';
import { TechnologyExtractor } from './services/intelligence/technology-extractor';
import { AnalyticsService } from './services/analytics.service';
import { InterviewService } from './services/interview.service';

const prisma = new PrismaClient();

async function runAudit() {
  console.log('===========================================================');
  console.log('HIREflow V1–V6 PRODUCTION SYSTEM FACTUAL AUDIT');
  console.log('===========================================================\n');

  // 1. Candidate Ground Truth State
  const profile = await prisma.candidateProfile.findFirst({
    include: {
      skills: true,
      experiences: { orderBy: { orderIndex: 'asc' } },
      projects: { orderBy: { orderIndex: 'asc' } },
    },
  });

  console.log('1. CANDIDATE GROUND TRUTH:');
  console.log(`- Candidate: ${profile?.fullName}`);
  console.log(`- Total Years Exp: ${profile?.yearsOfExperience}`);
  console.log(`- Verified Skills (${profile?.skills.length}): ${profile?.skills.map(s => s.name).slice(0, 10).join(', ')}...`);
  console.log(`- Verified Companies (${profile?.experiences.length}): ${profile?.experiences.map(e => e.company).join(', ')}`);
  console.log(`- Verified Projects (${profile?.projects.length}): ${profile?.projects.map(p => p.title).join(', ')}`);

  // 2. Database Job Inventory
  const totalJobs = await prisma.job.count();
  const remoteJobs = await prisma.job.count({ where: { isRemote: true } });
  const totalApps = await prisma.application.count();
  const totalInterviews = await prisma.interview.count();
  const statusCounts = await prisma.application.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  console.log('\n2. DATABASE INVENTORY:');
  console.log(`- Total Jobs: ${totalJobs} (${remoteJobs} remote)`);
  console.log(`- Total Applications: ${totalApps}`);
  console.log(`- Total Interviews: ${totalInterviews}`);
  console.log('- Applications by Status:', statusCounts.map(s => `${s.status}: ${s._count.id}`).join(', '));

  // 3. Workflow Step: Discovery & Normalization
  console.log('\n3. WORKFLOW AUDIT: DISCOVERY & NORMALIZATION');
  const sampleJobs = await prisma.job.findMany({
    take: 3,
    orderBy: { discoveredAt: 'desc' },
  });

  for (const job of sampleJobs) {
    console.log(`\n  * Job ID: ${job.id}`);
    console.log(`    Title: "${job.title}"`);
    console.log(`    Company: "${job.company}"`);
    console.log(`    Source: ${job.source}`);
    console.log(`    Authentic Application URL: ${job.applicationUrl}`);
    console.log(`    Canonical URL: ${job.canonicalUrl}`);
    console.log(`    Tech Stack (${job.techStack.length}): ${job.techStack.join(', ')}`);
    console.log(`    Seniority: ${job.seniority} | Role Family: ${job.roleFamily}`);
    console.log(`    Freshness: ${job.freshnessStatus} (Age: ${job.jobAgeHours ? job.jobAgeHours.toFixed(1) + 'h' : 'N/A'})`);
  }

  // 4. Workflow Step: 4-State Candidate Matching & Anti-Hallucination
  console.log('\n4. WORKFLOW AUDIT: 4-STATE MATCHING & ANTI-HALLUCINATION');
  if (sampleJobs.length > 0 && profile) {
    const job = sampleJobs[0];
    const match = MatchingGate.evaluate(job as any, profile as any);
    console.log(`- Evaluated against Job: "${job.title}" at ${job.company}`);
    console.log(`- Role Family Gate Passed: ${match.isRoleGatePassed ? 'YES' : 'NO'}`);
    console.log(`- Overall Match Score: ${match.score}/100`);
    console.log(`- Application Priority: ${match.applicationPriority}/10`);
    console.log(`- Priority Reasons: ${match.priorityReasons.join(' | ')}`);
    console.log(`- Direct Matches (${match.whyThisJob.technologies.filter((t: any) => t.status === 'DIRECT').length}): ${match.whyThisJob.technologies.filter((t: any) => t.status === 'DIRECT').map((t: any) => t.technology).join(', ')}`);
    console.log(`- Partial Matches (${match.whyThisJob.technologies.filter((t: any) => t.status === 'PARTIAL').length}): ${match.whyThisJob.technologies.filter((t: any) => t.status === 'PARTIAL').map((t: any) => t.technology).join(', ')}`);
    console.log(`- Unverified in Profile (${match.whyThisJob.technologies.filter((t: any) => t.status === 'NOT_VERIFIED').length}): ${match.whyThisJob.technologies.filter((t: any) => t.status === 'NOT_VERIFIED').map((t: any) => t.technology).join(', ')}`);
  }

  // 5. Workflow Step: Application Preparation & Immutable Snapshot
  console.log('\n5. WORKFLOW AUDIT: APPLICATION PREPARATION & IMMUTABILITY');
  const apps = await prisma.application.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: { job: true },
  });

  for (const app of apps) {
    const snap = app.snapshotJson as any;
    console.log(`\n  * Application ID: ${app.id}`);
    console.log(`    Job: "${app.job.title}" at ${app.job.company}`);
    console.log(`    Status: ${app.status}`);
    console.log(`    Snapshot Present: ${snap ? 'YES (Immutable Evidence Finalized)' : 'NO (In preparation / shortlist)'}`);
    if (snap) {
      console.log(`    Snapshot Captured At: ${snap.capturedAt}`);
      console.log(`    Snapshot Status: ${snap.statusAtSnapshot}`);
    }
  }

  // 6. Workflow Step: Analytics & Conversion Correctness
  console.log('\n6. WORKFLOW AUDIT: ANALYTICS ENGINE');
  const analytics = await AnalyticsService.getAnalytics();
  console.log(`- Total Discovered: ${analytics.funnel.discovered}`);
  console.log(`- Total Shortlisted: ${analytics.funnel.shortlisted}`);
  console.log(`- Total Preparing: ${analytics.funnel.preparing}`);
  console.log(`- Total Ready to Apply: ${analytics.funnel.readyToApply}`);
  console.log(`- Total Applied: ${analytics.funnel.applied}`);
  console.log(`- Total Interview: ${analytics.funnel.interview}`);
  console.log(`- Total Offer: ${analytics.funnel.offer}`);
  console.log(`- Interview Rate: ${analytics.conversions.interviewRate.formatted} (${analytics.conversions.interviewRate.numerator}/${analytics.conversions.interviewRate.denominator})`);
  console.log(`- Offer Rate: ${analytics.conversions.offerRate.formatted} (${analytics.conversions.offerRate.numerator}/${analytics.conversions.offerRate.denominator})`);
  console.log(`- Zero-Division Guard Active: ${analytics.conversions.interviewRate.insufficientData ? 'YES (Zero Denominator Handled)' : 'NO (Denominator Valid)'}`);

  // 7. Workflow Step: V6 Interview Intelligence Separation
  console.log('\n7. WORKFLOW AUDIT: V6 INTERVIEW INTELLIGENCE');
  const interviewStats = await InterviewService.getInterviewStats();
  console.log(`- Total Interviews: ${interviewStats.totalInterviews}`);
  console.log(`- Active Pipelines: ${interviewStats.activeInterviews}`);
  console.log(`- Completed Rounds: ${interviewStats.completedRounds}`);
  console.log(`- Upcoming Rounds: ${interviewStats.upcomingRounds}`);
  console.log(`- Questions Recorded: ${interviewStats.questionsRecorded}`);
  console.log(`- Debriefs Completed: ${interviewStats.debriefsCompleted}`);

  console.log('\n===========================================================');
  console.log('AUDIT INITIALIZATION COMPLETE');
  console.log('===========================================================');
}

runAudit()
  .catch(err => {
    console.error('Audit script encountered error:', err);
  })
  .finally(() => prisma.$disconnect());
