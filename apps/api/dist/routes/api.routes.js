"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const jobs_controller_1 = require("../controllers/jobs.controller");
const matches_controller_1 = require("../controllers/matches.controller");
const profile_controller_1 = require("../controllers/profile.controller");
const applications_controller_1 = require("../controllers/applications.controller");
const resumes_controller_1 = require("../controllers/resumes.controller");
const cover_letters_controller_1 = require("../controllers/cover-letters.controller");
const screening_controller_1 = require("../controllers/screening.controller");
const preparation_controller_1 = require("../controllers/preparation.controller");
exports.apiRouter = (0, express_1.Router)();
// ==========================================
// V1 CORE ROUTES (Strictly Preserved)
// ==========================================
// Dashboard
exports.apiRouter.get('/dashboard/stats', dashboard_controller_1.DashboardController.getStats);
// Jobs & 24h Filter & Real Discovery
exports.apiRouter.get('/jobs', jobs_controller_1.JobsController.getJobs);
exports.apiRouter.post('/jobs/discover', jobs_controller_1.JobsController.triggerDiscovery);
exports.apiRouter.get('/jobs/:id', jobs_controller_1.JobsController.getJobById);
exports.apiRouter.post('/jobs/ingest', jobs_controller_1.JobsController.ingestJob);
// AI Matching
exports.apiRouter.post('/jobs/:id/analyze', matches_controller_1.MatchesController.analyzeJob);
exports.apiRouter.get('/matches', matches_controller_1.MatchesController.getMatches);
// Profile
exports.apiRouter.get('/profile', profile_controller_1.ProfileController.getProfile);
exports.apiRouter.put('/profile', profile_controller_1.ProfileController.updateProfile);
// Applications Tracking
exports.apiRouter.get('/applications', applications_controller_1.ApplicationsController.listApplications);
exports.apiRouter.post('/applications', applications_controller_1.ApplicationsController.updateApplicationStatus);
// ==========================================
// V2 INTELLIGENCE WORKFLOWS
// ==========================================
// 1. AI Tailored CV Generator & ATS Analyzer
exports.apiRouter.post('/jobs/:id/resume/generate', resumes_controller_1.ResumesController.generateTailoredCv);
exports.apiRouter.get('/jobs/:id/resumes', resumes_controller_1.ResumesController.getResumesByJob);
exports.apiRouter.get('/resumes/:id', resumes_controller_1.ResumesController.getResumeById);
exports.apiRouter.put('/resumes/:id', resumes_controller_1.ResumesController.updateResume);
exports.apiRouter.post('/resumes/:id/regenerate', resumes_controller_1.ResumesController.regenerateResume);
exports.apiRouter.get('/resumes/:id/ats-analysis', resumes_controller_1.ResumesController.getAtsAnalysis);
// 2. AI Cover Letter Generator & Editor
exports.apiRouter.post('/jobs/:id/cover-letter/generate', cover_letters_controller_1.CoverLettersController.generateCoverLetter);
exports.apiRouter.get('/jobs/:id/cover-letters', cover_letters_controller_1.CoverLettersController.getCoverLettersByJob);
exports.apiRouter.get('/cover-letters/:id', cover_letters_controller_1.CoverLettersController.getCoverLetterById);
exports.apiRouter.put('/cover-letters/:id', cover_letters_controller_1.CoverLettersController.updateCoverLetter);
// 3. AI Screening Question Assistant
exports.apiRouter.post('/jobs/:id/screening/analyze', screening_controller_1.ScreeningController.analyzeScreening);
exports.apiRouter.get('/jobs/:id/screening', screening_controller_1.ScreeningController.getScreeningQuestions);
exports.apiRouter.post('/screening/:id/answer', screening_controller_1.ScreeningController.answerQuestion);
// 4. Application Preparation Workspace & Queue
exports.apiRouter.get('/jobs/:id/application-preparation', preparation_controller_1.PreparationController.getPreparation);
exports.apiRouter.get('/application-queue', preparation_controller_1.PreparationController.getQueue);
