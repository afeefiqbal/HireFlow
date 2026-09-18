import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { JobsController } from '../controllers/jobs.controller';
import { MatchesController } from '../controllers/matches.controller';
import { ProfileController } from '../controllers/profile.controller';
import { ApplicationsController } from '../controllers/applications.controller';
import { ResumesController } from '../controllers/resumes.controller';
import { CoverLettersController } from '../controllers/cover-letters.controller';
import { ScreeningController } from '../controllers/screening.controller';
import { PreparationController } from '../controllers/preparation.controller';
import { InterviewsController } from '../controllers/interviews.controller';
import { AutoApplyController } from '../controllers/auto-apply.controller';

export const apiRouter = Router();

// ==========================================
// V1 CORE ROUTES (Strictly Preserved)
// ==========================================

// Dashboard
apiRouter.get('/dashboard/stats', DashboardController.getStats);

// Jobs & 24h Filter & Real Discovery
apiRouter.get('/jobs', JobsController.getJobs);
apiRouter.post('/jobs/discover', JobsController.triggerDiscovery);
apiRouter.get('/jobs/:id', JobsController.getJobById);
apiRouter.get('/jobs/:id/intelligence', JobsController.getJobIntelligence);
apiRouter.post('/jobs/normalize', JobsController.normalizeJob);
apiRouter.post('/jobs/deduplicate', JobsController.deduplicateJob);
apiRouter.post('/jobs/ingest', JobsController.ingestJob);

// AI Matching
apiRouter.post('/jobs/:id/analyze', MatchesController.analyzeJob);
apiRouter.get('/matches', MatchesController.getMatches);

// Profile & Common Answers Bank & Ingestion
apiRouter.get('/profile', ProfileController.getProfile);
apiRouter.put('/profile', ProfileController.updateProfile);
apiRouter.put('/profile/common-answers', ProfileController.updateCommonAnswers);
apiRouter.post('/profile/upload-resume', ProfileController.uploadResume);
apiRouter.post('/profile/commit-resume', ProfileController.commitResume);
apiRouter.get('/profile/auto-apply-config', ProfileController.getAutoApplyConfig);
apiRouter.put('/profile/auto-apply-config', ProfileController.updateAutoApplyConfig);

// Applications Tracking & V5 Analytics
apiRouter.get('/applications', ApplicationsController.listApplications);
apiRouter.post('/applications', ApplicationsController.updateApplicationStatus);
apiRouter.get('/applications/analytics', ApplicationsController.getAnalytics);
apiRouter.get('/applications/timeline', ApplicationsController.getTimeline);
apiRouter.get('/applications/:id', ApplicationsController.getApplicationById);
apiRouter.post('/applications/:id/notes', ApplicationsController.addNote);
apiRouter.post('/applications/:id/follow-up', ApplicationsController.setFollowUp);
apiRouter.patch('/applications/:id/follow-up', ApplicationsController.setFollowUp);

// ==========================================
// V2 INTELLIGENCE WORKFLOWS
// ==========================================

// 1. AI Tailored CV Generator & ATS Analyzer
apiRouter.post('/jobs/:id/resume/generate', ResumesController.generateTailoredCv);
apiRouter.get('/jobs/:id/resumes', ResumesController.getResumesByJob);
apiRouter.get('/resumes/:id', ResumesController.getResumeById);
apiRouter.put('/resumes/:id', ResumesController.updateResume);
apiRouter.post('/resumes/:id/regenerate', ResumesController.regenerateResume);
apiRouter.get('/resumes/:id/ats-analysis', ResumesController.getAtsAnalysis);

// 2. AI Cover Letter Generator & Editor
apiRouter.post('/jobs/:id/cover-letter/generate', CoverLettersController.generateCoverLetter);
apiRouter.get('/jobs/:id/cover-letters', CoverLettersController.getCoverLettersByJob);
apiRouter.get('/cover-letters/:id', CoverLettersController.getCoverLetterById);
apiRouter.put('/cover-letters/:id', CoverLettersController.updateCoverLetter);

// 3. AI Screening Question Assistant
apiRouter.post('/jobs/:id/screening/analyze', ScreeningController.analyzeScreening);
apiRouter.get('/jobs/:id/screening', ScreeningController.getScreeningQuestions);
apiRouter.post('/screening/:id/answer', ScreeningController.answerQuestion);
apiRouter.post('/jobs/:id/screening/sync-common', ScreeningController.syncCommonAnswers);

// 4. Application Preparation Workspace & Queue
apiRouter.get('/jobs/:id/application-preparation', PreparationController.getPreparation);
apiRouter.get('/application-queue', PreparationController.getQueue);

// Autonomous Continuous Discovery & Verified Auto-Apply
apiRouter.post('/jobs/:id/auto-apply', AutoApplyController.autoApply);
apiRouter.get('/jobs/:id/auto-apply/eligibility', AutoApplyController.evaluateEligibility);
apiRouter.post('/jobs/:id/auto-prepare', AutoApplyController.autoPrepare);
apiRouter.post('/discovery/continuous/run', AutoApplyController.runContinuousDiscovery);
apiRouter.get('/discovery/continuous/status', AutoApplyController.getContinuousDiscoveryStatus);
apiRouter.get('/discovery/qualified-opportunities', AutoApplyController.getQualifiedOpportunities);

// ==========================================
// V6 INTERVIEW INTELLIGENCE
// ==========================================

// Central Interview Command Center & Stats
apiRouter.get('/interviews', InterviewsController.listInterviews);
apiRouter.get('/interviews/stats', InterviewsController.getInterviewStats);

// Application Interview Bootstrap & Lookup
apiRouter.get('/applications/:applicationId/interview', InterviewsController.getOrCreateInterview);
apiRouter.post('/applications/:applicationId/interview', InterviewsController.getOrCreateInterview);

// Interview Details & Status
apiRouter.get('/interviews/:id', InterviewsController.getInterviewById);
apiRouter.patch('/interviews/:id', InterviewsController.updateInterview);

// Multi-Stage Round Tracking
apiRouter.post('/interviews/:id/rounds', InterviewsController.createRound);
apiRouter.patch('/interview-rounds/:roundId', InterviewsController.updateRound);
apiRouter.delete('/interview-rounds/:roundId', InterviewsController.deleteRound);

// Prep Kit & Prediction
apiRouter.post('/interviews/:id/prep-kit/generate', InterviewsController.generatePrepKit);

// Questions (Predicted + Actual) & STAR Answers
apiRouter.get('/interviews/:id/questions', InterviewsController.listQuestions);
apiRouter.post('/interviews/:id/questions', InterviewsController.addQuestion);
apiRouter.post('/interviews/:id/questions/generate', InterviewsController.generatePredictedQuestions);
apiRouter.post('/interviews/star/generate', InterviewsController.generateSTARAnswer);

// Interactive Mock Interview Simulator
apiRouter.post('/interviews/:id/mock-sessions', InterviewsController.startMockSession);
apiRouter.post('/mock-sessions/:sessionId/answer', InterviewsController.submitMockAnswer);
apiRouter.post('/mock-sessions/:sessionId/complete', InterviewsController.completeMockSession);

// Post-Interview Debrief
apiRouter.post('/interviews/:id/debrief', InterviewsController.submitDebrief);

