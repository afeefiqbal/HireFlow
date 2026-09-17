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

// Profile & Common Answers Bank
apiRouter.get('/profile', ProfileController.getProfile);
apiRouter.put('/profile', ProfileController.updateProfile);
apiRouter.put('/profile/common-answers', ProfileController.updateCommonAnswers);

// Applications Tracking
apiRouter.get('/applications', ApplicationsController.listApplications);
apiRouter.post('/applications', ApplicationsController.updateApplicationStatus);

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
