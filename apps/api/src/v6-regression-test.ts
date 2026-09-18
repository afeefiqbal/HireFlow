/**
 * HIREflow V6 — Interview Intelligence & System Hardening Regression Suite
 * 
 * Verifies:
 * 1. ApplicationStatus & Interview Lifecycle Separation
 * 2. Interview Creation & Application Association
 * 3. Multi-Stage Round Sequencing & Status Progression
 * 4. Question Bank Separation (PREDICTED vs ACTUAL_INTERVIEW)
 * 5. STAR Framework Generation with Strict Attribution (No Hallucination)
 * 6. Mock Interview Simulator & Unverified Claim Auditing
 * 7. Post-Round Debrief Persistence & Follow-Up Date Calculation
 * 8. Interview Stats Aggregation
 * 9. ApplicationSnapshot Immutability Preserved
 * 10. Candidate Ground Truth Dynamic Context
 */

import { PrismaClient } from '@prisma/client';
import { InterviewService } from './services/interview.service';
import { InterviewIntelligenceService } from './services/interview-intelligence.service';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: any) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    results.push({ name, passed: false, error: 'Assertion failed', details });
    console.error(`  ✗ [FAIL] ${name}`, details);
  }
}

async function runV6Tests() {
  console.log('====================================================');
  console.log('HIREflow V6 — INTERVIEW INTELLIGENCE REGRESSION SUITE');
  console.log('====================================================\n');

  try {
    // 0. Setup test job & application
    const uniqueCanon = `https://careers.v6intelligence.com/jobs/${Date.now()}`;
    const testJob = await prisma.job.create({
      data: {
        title: 'Senior Full Stack Engineer (V6 Test)',
        company: 'V6 Intelligence Labs',
        location: 'Remote, US',
        isRemote: true,
        description: 'Looking for a Senior Full Stack Engineer with strong Laravel, Node.js, and Vue experience.',
        applicationUrl: uniqueCanon,
        canonicalUrl: uniqueCanon,
        source: 'DIRECT_TEST',
        techStack: ['Laravel', 'Node.js', 'Vue.js', 'PostgreSQL', 'Docker'],
      },
    });

    const testApp = await prisma.application.create({
      data: {
        jobId: testJob.id,
        status: 'APPLIED',
        appliedDate: new Date(),
        snapshotJson: {
          jobId: testJob.id,
          jobTitle: testJob.title,
          company: testJob.company,
          location: testJob.location,
          description: testJob.description,
          techStack: testJob.techStack,
          capturedAt: new Date().toISOString(),
          statusAtSnapshot: 'APPLIED',
        },
      },
    });

    // 1. ApplicationStatus & Interview Lifecycle Separation
    console.log('[Test 1] Interview Creation & Lifecycle Separation');
    const interview = await InterviewService.getOrCreateInterview(testApp.id);
    assert(interview !== null, 'Interview record created for application');
    assert(interview.status === 'PLANNED', 'Initial interview status is PLANNED');
    
    // Check that application status remains strictly APPLIED (not mutated to INTERVIEW automatically)
    const refreshedApp = await prisma.application.findUnique({ where: { id: testApp.id } });
    assert(refreshedApp?.status === 'APPLIED', 'ApplicationStatus remains APPLIED (strict lifecycle separation)');

    // 2. Round Sequencing & Progression
    console.log('\n[Test 2] Multi-Stage Round Sequencing & Management');
    const round1 = await InterviewService.createRound(interview.id, {
      roundType: 'SCREENING_CALL',
      title: 'Initial Recruiter Screen',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      interviewerName: 'Sarah Connor',
      interviewerTitle: 'Talent Lead',
      meetingUrl: 'https://meet.google.com/abc-def-ghi',
      notes: 'Review salary and notice period',
    });
    // Note: getOrCreateInterview may have created a default round 1, so verify ordering
    assert(round1.sequence >= 1, 'First user-created round has positive sequence');
    assert(round1.status === 'SCHEDULED', 'Initial round status is SCHEDULED');

    const round2 = await InterviewService.createRound(interview.id, {
      roundType: 'TECHNICAL_ROUND',
      title: 'Core Architecture Deep Dive',
      scheduledAt: new Date(Date.now() + 172800000).toISOString(),
      interviewerName: 'John Doe',
      interviewerTitle: 'Staff Architect',
      notes: 'Laravel queue scaling & PostgreSQL indexing',
    });
    assert(round2.sequence > round1.sequence, 'Subsequent round receives higher sequence number');

    // Transition round 1 to COMPLETED
    const updatedRound1 = await InterviewService.updateRound(round1.id, { status: 'COMPLETED' });
    assert(updatedRound1.status === 'COMPLETED', 'Round 1 transitioned to COMPLETED');
    assert(updatedRound1.completedAt !== null, 'Round 1 completedAt timestamp recorded');

    // 3. Question Bank Separation (PREDICTED vs ACTUAL_INTERVIEW)
    console.log('\n[Test 3] Question Bank & Attribution Separation');
    // Add an actual interview question
    const actualQ = await InterviewService.addQuestion(interview.id, {
      questionText: 'How do you handle Redis cache stampedes in Laravel?',
      category: 'TECHNICAL',
      source: 'ACTUAL_INTERVIEW',
      resultAttribution: 'USER_PROVIDED',
      userNotes: 'Asked by Staff Architect in Round 2',
    });
    assert(actualQ.source === 'ACTUAL_INTERVIEW', 'Actual question recorded with source ACTUAL_INTERVIEW');
    assert(actualQ.resultAttribution === 'USER_PROVIDED', 'Actual question attribution is USER_PROVIDED');

    // Add a predicted question
    const predictedQ = await InterviewService.addQuestion(interview.id, {
      questionText: 'Tell me about a time you resolved a major production database bottleneck.',
      category: 'BEHAVIORAL',
      source: 'PREDICTED',
      resultAttribution: 'AI_VERIFIED',
      relevanceReason: 'Predicted from high traffic backend requirements in JD',
    });
    assert(predictedQ.source === 'PREDICTED', 'Predicted question recorded with source PREDICTED');
    assert(predictedQ.source !== actualQ.source, 'PREDICTED questions are strictly distinct from ACTUAL_INTERVIEW');

    // List and filter questions
    const allQuestions = await InterviewService.listQuestions(interview.id);
    assert(allQuestions.length >= 2, 'Both questions retrieved in question bank');

    // 4. STAR Answer Generation with Strict Attribution
    console.log('\n[Test 4] STAR Answer Generation with Attribution Compliance');
    const starAnswer = await InterviewIntelligenceService.generateSTARAnswer(
      'Describe a time you solved a performance bottleneck in a production web application',
      'DealCode'
    );
    assert(starAnswer.question.length > 0, 'STAR answer generated for target question');
    assert(starAnswer.situation.attribution === 'AI_VERIFIED', 'Situation attributed to AI_VERIFIED Ground Truth');
    assert(starAnswer.task.attribution === 'AI_VERIFIED', 'Task attributed to AI_VERIFIED Ground Truth');
    assert(starAnswer.action.attribution === 'AI_VERIFIED', 'Action attributed to AI_VERIFIED Ground Truth');
    assert(
      starAnswer.result.attribution === 'USER_INPUT_REQUIRED' || starAnswer.result.attribution === 'AI_VERIFIED',
      'Result attribution strictly distinguished'
    );
    if (starAnswer.result.attribution === 'USER_INPUT_REQUIRED') {
      assert(
        starAnswer.result.text.includes('[USER INPUT REQUIRED]'),
        'Unverified metrics require candidate confirmation placeholder'
      );
    }

    // 5. Mock Interview Simulator & Unverified Claim Auditing
    console.log('\n[Test 5] Mock Interview Simulator & Unverified Claim Audit');
    const mockSession = await InterviewService.startMockSession(interview.id, 'TECHNICAL_ROUND', round2.id);
    assert(mockSession.status === 'ACTIVE', 'Mock session started with status ACTIVE');
    assert(mockSession.qna.length > 0, 'Mock session initialized with question list');

    // Candidate submits an answer claiming unverified technologies (e.g. Apache Kafka & Kubernetes cluster deployment)
    const mockWithUnverified = await InterviewService.submitMockAnswer(
      mockSession.id,
      0,
      'At my previous company, I architected our distributed message bus using Apache Kafka and deployed a 50-node Kubernetes cluster to process 100 million messages daily.'
    );
    assert(mockWithUnverified.qna[0].answer !== undefined, 'Candidate answer recorded in session');
    assert(mockWithUnverified.qna[0].feedback !== undefined, 'AI evaluation generated for mock answer');
    const unverifiedClaims = mockWithUnverified.qna[0].feedback?.unverifiedClaims || [];
    assert(
      unverifiedClaims.some((c: string) => c.toLowerCase().includes('kafka') || c.toLowerCase().includes('kubernetes')),
      'Audit correctly flagged unverified technologies (Kafka/Kubernetes)'
    );

    // Complete mock session
    const completedMock = await InterviewService.completeMockSession(mockSession.id);
    assert(completedMock.status === 'COMPLETED', 'Mock session marked COMPLETED');
    assert(completedMock.completedAt !== null, 'Mock session completedAt recorded');

    // 6. Post-Round Debrief & Follow-Up Date Calculation
    console.log('\n[Test 6] Post-Round Debrief & Follow-Up Calculation');
    const debrief = await InterviewService.submitDebrief(interview.id, {
      roundId: round1.id,
      candidateReflection: 'Screening went very smoothly. Good alignment on role scope and Laravel/Node.js tech stack.',
      whatWentWell: 'Discussed DealCode architecture and remote team leadership.',
      whatWasDifficult: 'Interview was short, had to summarize 7 years of experience in 10 minutes.',
      questionsAsked: ['What is the current deployment cadence?', 'How is the engineering team structured?'],
      technicalTopics: ['Laravel', 'PostgreSQL', 'Docker'],
      behavioralTopics: ['Remote communication'],
      topicsToStudy: ['Event-driven architecture in AWS'],
      nextSteps: 'Recruiter will confirm technical round date with hiring manager.',
    });
    assert(debrief !== null, 'Debrief recorded successfully');
    assert(debrief.followUpDate !== null, 'Suggested follow-up date automatically calculated');
    const followUp = new Date(debrief.followUpDate!);
    assert(followUp.getTime() > Date.now(), 'Follow-up date is in the future');

    // 7. Interview Stats Aggregation
    console.log('\n[Test 7] Interview Intelligence Stats Aggregation');
    const stats = await InterviewService.getInterviewStats();
    assert(stats.totalInterviews >= 1, 'Total interviews count accurate');
    assert(stats.completedRounds >= 1, 'Completed rounds count accurate');
    assert(stats.questionsRecorded >= 2, 'Questions recorded count accurate');
    assert(stats.debriefsCompleted >= 1, 'Debriefs completed count accurate');

    // 8. Snapshot Immutability Check
    console.log('\n[Test 8] ApplicationSnapshot Immutability Preserved');
    const appAfterInterview = await prisma.application.findUnique({ where: { id: testApp.id } });
    const originalSnap = testApp.snapshotJson as any;
    const finalSnap = appAfterInterview?.snapshotJson as any;
    assert(
      JSON.stringify(originalSnap) === JSON.stringify(finalSnap),
      'ApplicationSnapshot remains 100% immutable and untouched across all V6 actions'
    );

    // Clean up test data
    await prisma.interviewDebrief.deleteMany({ where: { interviewId: interview.id } });
    await prisma.mockInterviewSession.deleteMany({ where: { interviewId: interview.id } });
    await prisma.interviewQuestion.deleteMany({ where: { interviewId: interview.id } });
    await prisma.interviewRound.deleteMany({ where: { interviewId: interview.id } });
    await prisma.interviewPrepKit.deleteMany({ where: { interviewId: interview.id } });
    await prisma.interview.deleteMany({ where: { id: interview.id } });
    await prisma.application.deleteMany({ where: { id: testApp.id } });
    await prisma.job.deleteMany({ where: { id: testJob.id } });

    console.log('\n====================================================');
    console.log(`V6 REGRESSION RESULTS: ${results.filter(r => r.passed).length} / ${results.length} PASSED`);
    console.log('====================================================');

    if (results.some(r => !r.passed)) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during V6 regression tests:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runV6Tests();
