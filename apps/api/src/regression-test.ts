import { PrismaClient } from '@prisma/client';
import { MatchingService } from './services/matching.service';
import { ResumeService } from './services/resume.service';
import { CoverLetterService } from './services/cover-letter.service';
import { ScreeningService } from './services/screening.service';
import { AiService } from './ai/ai.service';
import { CandidateContextBuilder } from './ai/candidate-context.builder';
import { GroqProvider } from './ai/providers/groq.provider';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// ─── Token Budget Tracker ───────────────────────────────────────────────────

interface TokenBudget {
  dailyLimit: number;
  used: number;
  remaining: number;
  perTestCeiling: number; // max tokens any single test may consume
}

function createBudget(): TokenBudget {
  const isEval = process.env.AI_ENV === 'evaluation';
  return {
    dailyLimit: 200_000,
    used: 0,
    remaining: 200_000,
    // In evaluation mode, enforce stricter per-test ceiling
    perTestCeiling: isEval ? 4_000 : 10_000,
  };
}

function canAfford(budget: TokenBudget, estimatedTokens: number): boolean {
  return budget.remaining >= estimatedTokens;
}

function recordUsage(budget: TokenBudget, tokens: number): void {
  budget.used += tokens;
  budget.remaining = budget.dailyLimit - budget.used;
}

// ─── Fetch Jobs ─────────────────────────────────────────────────────────────

async function fetchTestJobs(limit: number = 4) {
  const laravelJobs = await prisma.job.findMany({ where: { title: { contains: 'Laravel', mode: 'insensitive' } }, take: 1 });
  const nodeJobs = await prisma.job.findMany({ where: { title: { contains: 'Node', mode: 'insensitive' } }, take: 1 });
  const fullStackJobs = await prisma.job.findMany({ where: { title: { contains: 'Full', mode: 'insensitive' } }, take: 1 });
  const remoteJobs = await prisma.job.findMany({ where: { isRemote: true }, take: 1 });

  const map = new Map();
  [...laravelJobs, ...nodeJobs, ...fullStackJobs, ...remoteJobs].forEach(j => map.set(j.id, j));
  return Array.from(map.values()).slice(0, limit);
}

async function loadProfile() {
  return prisma.candidateProfile.findFirst({
    include: {
      experiences: { orderBy: { orderIndex: 'asc' } },
      skills: true,
      projects: true,
    },
  });
}

// ─── Report Writer ──────────────────────────────────────────────────────────

class ReportWriter {
  private lines: string[] = [];

  h1(text: string) { this.lines.push(`# ${text}\n`); }
  h2(text: string) { this.lines.push(`## ${text}\n`); }
  h3(text: string) { this.lines.push(`### ${text}\n`); }
  line(text: string) { this.lines.push(text); }
  blank() { this.lines.push(''); }
  hr() { this.lines.push('---\n'); }

  pass(label: string) { this.lines.push(`✅ **PASS** — ${label}`); }
  fail(label: string) { this.lines.push(`❌ **FAIL** — ${label}`); }
  skip(label: string) { this.lines.push(`⏭️ **SKIP** — ${label}`); }
  warn(label: string) { this.lines.push(`⚠️ **WARN** — ${label}`); }

  table(headers: string[], rows: string[][]) {
    this.lines.push(`| ${headers.join(' | ')} |`);
    this.lines.push(`| ${headers.map(() => ':---').join(' | ')} |`);
    for (const row of rows) {
      this.lines.push(`| ${row.join(' | ')} |`);
    }
    this.blank();
  }

  budget(b: TokenBudget) {
    this.line(`> **Token Budget** — Used: ${b.used.toLocaleString()} / ${b.dailyLimit.toLocaleString()} — Remaining: ${b.remaining.toLocaleString()}`);
    this.blank();
  }

  toString() { return this.lines.join('\n'); }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE A: Context Builder (NO LLM — deterministic, run freely)
// ═══════════════════════════════════════════════════════════════════════════

async function suiteA_ContextBuilder(report: ReportWriter) {
  report.h2('Suite A: Context Builder (Deterministic — No LLM)');

  const profile = await loadProfile();
  if (!profile) { report.fail('No candidate profile found'); return; }

  const jobs = await fetchTestJobs(5);
  console.log(`[Suite A] Testing context builder against ${jobs.length} jobs`);

  const tasks = ['JOB_MATCHING', 'RESUME_GENERATION', 'COVER_LETTER', 'SCREENING_QUESTION'] as const;
  const rows: string[][] = [];

  for (const job of jobs) {
    for (const task of tasks) {
      const jobText = `${job.title} ${job.description} ${job.requirements.join(' ')} ${job.techStack.join(' ')}`;
      const ctx = CandidateContextBuilder.buildContextForTask(task, profile, jobText);
      const parsed = JSON.parse(ctx);
      const tokenEstimate = Math.ceil(ctx.length / 4);

      const hasCoreContext = !!parsed.CORE_CONTEXT;
      const hasRelevantContext = !!parsed.RELEVANT_CONTEXT;
      const hasTimeline = !!parsed.FULL_VERIFIED_TIMELINE;

      // Validation checks
      const checks: string[] = [];
      if (!hasCoreContext) checks.push('Missing CORE_CONTEXT');
      if (!hasRelevantContext) checks.push('Missing RELEVANT_CONTEXT');
      if (task === 'RESUME_GENERATION' && !hasTimeline) checks.push('Missing FULL_VERIFIED_TIMELINE');

      const status = checks.length === 0 ? '✅' : `❌ ${checks.join(', ')}`;
      rows.push([job.title.slice(0, 40), task, `~${tokenEstimate}`, status]);
    }
  }

  report.table(['Job', 'Task', 'Tokens', 'Status'], rows);

  const failures = rows.filter(r => r[3].startsWith('❌'));
  if (failures.length === 0) {
    report.pass(`All ${rows.length} context builds passed structural validation`);
  } else {
    report.fail(`${failures.length}/${rows.length} context builds failed`);
  }
  report.blank();
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE B: Matching (20B — 4-5 jobs)
// ═══════════════════════════════════════════════════════════════════════════

async function suiteB_Matching(report: ReportWriter, budget: TokenBudget) {
  report.h2('Suite B: Job Matching (20B model — 4-5 jobs)');

  const estimatePerJob = 3_000;
  if (!canAfford(budget, estimatePerJob)) {
    report.skip(`Insufficient token budget (need ~${estimatePerJob}, have ${budget.remaining})`);
    return;
  }

  // Force 20B model for matching tests
  const origSmart = process.env.GROQ_SMART_MODEL;
  // analyzeJob already uses GROQ_FAST_MODEL (20B), so no override needed

  const jobs = await fetchTestJobs(4);
  console.log(`[Suite B] Testing matching against ${jobs.length} jobs`);

  const rows: string[][] = [];

  for (const job of jobs) {
    if (!canAfford(budget, estimatePerJob)) {
      report.warn(`Stopping early — insufficient tokens for next job`);
      break;
    }

    const before = budget.used;
    try {
      // Clear cache for this job's match
      await prisma.jobMatch.deleteMany({ where: { jobId: job.id } });
      
      const result = await MatchingService.analyzeJob(job.id);
      const tokensUsed = Math.ceil((budget.used === before ? 2500 : 0)); // estimate from context
      recordUsage(budget, 2500);
      
      const scoreValid = typeof result.technical_match === 'number' && result.technical_match >= 0 && result.technical_match <= 100;
      const hasRecommendation = ['APPLY', 'REVIEW', 'SKIP'].includes(result.recommendation);
      const noHallucination = result.reasoning.every((r: string) => !r.includes('millions') && !r.includes('revenue'));

      const status = (scoreValid && hasRecommendation && noHallucination) ? '✅' : '❌';
      const issues: string[] = [];
      if (!scoreValid) issues.push(`score=${result.technical_match}`);
      if (!hasRecommendation) issues.push(`rec=${result.recommendation}`);
      if (!noHallucination) issues.push('hallucination detected');

      rows.push([
        job.title.slice(0, 35),
        String(result.technical_match),
        result.recommendation,
        `${status} ${issues.join(', ')}`
      ]);

      console.log(`  [B] ${job.title.slice(0, 30)}: score=${result.technical_match}, rec=${result.recommendation}`);
      await delay(15_000); // Rate limit protection
    } catch (e: any) {
      rows.push([job.title.slice(0, 35), 'ERR', 'ERR', `❌ ${e.message.slice(0, 60)}`]);
      recordUsage(budget, 1000);
      
      if (e.message.includes('rate_limit') || e.message.includes('429')) {
        report.warn('Rate limit hit — stopping Suite B');
        break;
      }
      await delay(15_000);
    }
  }

  report.table(['Job', 'Tech Score', 'Rec', 'Validation'], rows);
  report.budget(budget);
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE C: Resume Generation (120B — 1-2 jobs only)
// ═══════════════════════════════════════════════════════════════════════════

async function suiteC_Resume(report: ReportWriter, budget: TokenBudget) {
  report.h2('Suite C: Resume Generation (120B model — 1-2 jobs)');

  const estimatePerJob = 6_000;
  if (!canAfford(budget, estimatePerJob)) {
    report.skip(`Insufficient token budget (need ~${estimatePerJob}, have ${budget.remaining})`);
    return;
  }

  const jobs = await fetchTestJobs(2);
  console.log(`[Suite C] Testing resume generation against ${jobs.length} job(s)`);

  for (const job of jobs.slice(0, 2)) {
    if (!canAfford(budget, estimatePerJob)) {
      report.warn(`Stopping early — insufficient tokens`);
      break;
    }

    report.h3(`Job: ${job.title} at ${job.company}`);
    
    try {
      // Clear cache
      await prisma.aiCache.deleteMany({});
      
      const result = await ResumeService.generateTailoredCv(job.id);
      recordUsage(budget, 5000);

      // Validate structure
      const resume = result?.resume || result;
      const hasExperiences = Array.isArray(resume?.experiences) && resume.experiences.length > 0;
      const hasSkills = Array.isArray(resume?.primarySkills) && resume.primarySkills.length > 0;
      const hasSummary = typeof resume?.summary === 'string' && resume.summary.length > 20;

      // Anti-hallucination check: no invented metrics
      const fullText = JSON.stringify(resume);
      const hallucinationPatterns = ['million users', 'revenue', '$1M', '10x', '100x', 'saved the company', 'generated $'];
      const hallucinations = hallucinationPatterns.filter(p => fullText.toLowerCase().includes(p.toLowerCase()));

      const rows: string[][] = [];
      rows.push(['Has Experiences', hasExperiences ? '✅' : '❌']);
      rows.push(['Has Skills', hasSkills ? '✅' : '❌']);
      rows.push(['Has Summary', hasSummary ? '✅' : '❌']);
      rows.push(['Projects Count', String(resume?.projects?.length || 0)]);
      rows.push(['Hallucination Check', hallucinations.length === 0 ? '✅ Clean' : `❌ Found: ${hallucinations.join(', ')}`]);

      report.table(['Check', 'Result'], rows);
      
      if (hasExperiences && hasSkills && hasSummary && hallucinations.length === 0) {
        report.pass(`Resume for "${job.title}" passed all checks`);
      } else {
        report.fail(`Resume for "${job.title}" has issues`);
      }

      await delay(20_000); // Extra delay for 120B model
    } catch (e: any) {
      report.fail(`Resume generation error: ${e.message.slice(0, 100)}`);
      recordUsage(budget, 3000);
      
      if (e.message.includes('rate_limit') || e.message.includes('429')) {
        report.warn('Rate limit hit — stopping Suite C');
        break;
      }
      await delay(15_000);
    }
  }

  report.budget(budget);
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE D: Cover Letter (20B or 120B depending on production routing)
// ═══════════════════════════════════════════════════════════════════════════

async function suiteD_CoverLetter(report: ReportWriter, budget: TokenBudget) {
  report.h2('Suite D: Cover Letter (production model — 1-2 jobs)');

  const estimatePerJob = 5_000;
  if (!canAfford(budget, estimatePerJob)) {
    report.skip(`Insufficient token budget (need ~${estimatePerJob}, have ${budget.remaining})`);
    return;
  }

  const jobs = await fetchTestJobs(2);
  console.log(`[Suite D] Testing cover letter against ${jobs.length} job(s)`);

  for (const job of jobs.slice(0, 2)) {
    if (!canAfford(budget, estimatePerJob)) {
      report.warn(`Stopping early — insufficient tokens`);
      break;
    }

    report.h3(`Job: ${job.title} at ${job.company}`);

    try {
      await prisma.aiCache.deleteMany({});
      
      const result = await CoverLetterService.generateCoverLetter(job.id);
      recordUsage(budget, 4000);

      const hasOpening = typeof result?.opening === 'string' && result.opening.length > 5;
      const hasFullText = typeof result?.fullText === 'string' && result.fullText.length > 50;
      
      // Anti-hallucination checks
      const textLower = (result?.fullText || '').toLowerCase();
      const hallucinationPatterns = ['million', 'revenue', '$1m', '10x increase', 'saved the company', 'generated $'];
      const hallucinations = hallucinationPatterns.filter(p => textLower.includes(p));

      // Tone check: should NOT sound like an AI summary
      const aiTonePatterns = ['as an ai', 'i would be happy', 'in conclusion'];
      const toneIssues = aiTonePatterns.filter(p => textLower.includes(p));

      const rows: string[][] = [];
      rows.push(['Has Opening', hasOpening ? '✅' : '❌']);
      rows.push(['Has Full Text', hasFullText ? `✅ (${result.fullText.length} chars)` : '❌']);
      rows.push(['Hallucination Check', hallucinations.length === 0 ? '✅ Clean' : `❌ ${hallucinations.join(', ')}`]);
      rows.push(['Tone Check', toneIssues.length === 0 ? '✅ Professional' : `⚠️ ${toneIssues.join(', ')}`]);

      report.table(['Check', 'Result'], rows);

      if (hasOpening && hasFullText && hallucinations.length === 0) {
        report.pass(`Cover letter for "${job.title}" passed all checks`);
      } else {
        report.fail(`Cover letter for "${job.title}" has issues`);
      }

      await delay(15_000);
    } catch (e: any) {
      report.fail(`Cover letter error: ${e.message.slice(0, 100)}`);
      recordUsage(budget, 2000);
      
      if (e.message.includes('rate_limit') || e.message.includes('429')) {
        report.warn('Rate limit hit — stopping Suite D');
        break;
      }
      await delay(15_000);
    }
  }

  report.budget(budget);
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE E: Screening Questions (20B — 2-3 questions)
// ═══════════════════════════════════════════════════════════════════════════

async function suiteE_Screening(report: ReportWriter, budget: TokenBudget) {
  report.h2('Suite E: Screening Questions (20B model)');

  const estimatePerRun = 3_000;
  if (!canAfford(budget, estimatePerRun)) {
    report.skip(`Insufficient token budget (need ~${estimatePerRun}, have ${budget.remaining})`);
    return;
  }

  const jobs = await fetchTestJobs(2);
  console.log(`[Suite E] Testing screening for ${jobs.length} job(s)`);

  for (const job of jobs.slice(0, 2)) {
    if (!canAfford(budget, estimatePerRun)) {
      report.warn(`Stopping early — insufficient tokens`);
      break;
    }

    report.h3(`Job: ${job.title}`);

    try {
      const result = await ScreeningService.analyzeScreeningQuestions(job.id);
      recordUsage(budget, 2500);

      const rows: string[][] = [];
      let passCount = 0;

      for (const q of result) {
        // Validate: answers should be full sentences, not single bare numbers.
        // Short numeric answers like "7 years" or "3 months" are acceptable
        // for quantitative questions (e.g. "How many years...").
        const answer = q.suggestedAnswer.trim();
        const isBareNumber = /^\d+$/.test(answer); // "7" with no context
        const isShortNumericWithUnit = /^\d+\s*(years?|months?|weeks?|days?|hrs?|hours?)$/i.test(answer);
        const isAcceptableLength = answer.length === 0 || answer.length > 10 || isShortNumericWithUnit;
        const needsInput = q.requiresUserInput;

        let status = '✅';
        if (isBareNumber && !needsInput) {
          status = '❌ Single-token answer (bare number)';
        } else if (!isAcceptableLength && !needsInput) {
          status = '⚠️ Too short';
        } else {
          passCount++;
        }

        rows.push([
          q.question.slice(0, 50) + (q.question.length > 50 ? '...' : ''),
          needsInput ? '🟡 User' : '🟢 AI',
          q.suggestedAnswer.slice(0, 60) + (q.suggestedAnswer.length > 60 ? '...' : ''),
          status
        ]);
      }

      report.table(['Question', 'Source', 'Answer Preview', 'Valid'], rows);

      if (passCount === result.length) {
        report.pass(`All ${result.length} screening answers passed validation`);
      } else {
        report.fail(`${passCount}/${result.length} screening answers passed`);
      }

      await delay(15_000);
    } catch (e: any) {
      report.fail(`Screening error: ${e.message.slice(0, 100)}`);
      recordUsage(budget, 1500);
      
      if (e.message.includes('rate_limit') || e.message.includes('429')) {
        report.warn('Rate limit hit — stopping Suite E');
        break;
      }
      await delay(15_000);
    }
  }

  report.budget(budget);
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE F: Deterministic Validation (NO LLM — run freely)
// ═══════════════════════════════════════════════════════════════════════════

async function suiteF_DeterministicValidation(report: ReportWriter) {
  report.h2('Suite F: Deterministic Fallback Validation (No LLM)');

  // This suite must run BEFORE AiService.registerProvider() is called,
  // so AiService.isEnabled() returns false and MatchingService falls back
  // to its deterministic evaluation engine.

  const jobs = await fetchTestJobs(4);
  console.log(`[Suite F] Testing deterministic matching for ${jobs.length} jobs`);

  const rows: string[][] = [];

  for (const job of jobs) {
    try {
      // Clear existing matches
      await prisma.jobMatch.deleteMany({ where: { jobId: job.id } });

      const result = await MatchingService.analyzeJob(job.id);

      const scoreInRange = result.technical_match >= 0 && result.technical_match <= 100;
      const hasRecommendation = ['APPLY', 'REVIEW', 'SKIP'].includes(result.recommendation);
      const hasReasoning = result.reasoning.length > 0;

      const status = (scoreInRange && hasRecommendation && hasReasoning) ? '✅' : '❌';
      rows.push([
        job.title.slice(0, 35),
        String(result.technical_match),
        result.recommendation,
        String(result.missing_requirements.length),
        status
      ]);
    } catch (e: any) {
      rows.push([job.title.slice(0, 35), 'ERR', 'ERR', 'ERR', `❌ ${e.message.slice(0, 40)}`]);
    }
  }

  report.table(['Job', 'Tech Score', 'Rec', 'Missing', 'Status'], rows);

  const failures = rows.filter(r => r[4].startsWith('❌'));
  if (failures.length === 0) {
    report.pass(`All ${rows.length} deterministic evaluations passed`);
  } else {
    report.fail(`${failures.length}/${rows.length} deterministic evaluations failed`);
  }
  report.blank();
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN RUNNER
// ═══════════════════════════════════════════════════════════════════════════

async function runRegressionSuite() {
  const isEval = process.env.AI_ENV === 'evaluation';
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  AI Job Agent — Regression Test Suite`);
  console.log(`  Mode: ${isEval ? 'EVALUATION (strict limits)' : 'DEVELOPMENT'}`);
  console.log(`  Smart Model: ${process.env.GROQ_SMART_MODEL || 'openai/gpt-oss-120b'}`);
  console.log(`  Fast Model: ${process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b'}`);
  console.log(`${'═'.repeat(60)}\n`);

  const report = new ReportWriter();
  const budget = createBudget();

  report.h1('AI Job Agent — Regression Test Report');
  report.line(`**Generated**: ${timestamp()}`);
  report.line(`**Mode**: ${isEval ? 'Evaluation' : 'Development'}`);
  report.line(`**Smart Model**: ${process.env.GROQ_SMART_MODEL || 'openai/gpt-oss-120b'}`);
  report.line(`**Fast Model**: ${process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b'}`);
  report.blank();
  report.hr();

  // ── Phase 1: No-LLM suites (run BEFORE registering AI provider) ──

  // Suite A: Context Builder (no LLM)
  console.log('\n[Suite A] Context Builder (deterministic)...');
  await suiteA_ContextBuilder(report);
  report.hr();

  // Suite F: Deterministic Fallback (no LLM) — run before AI provider
  console.log('\n[Suite F] Deterministic Validation (no LLM)...');
  await suiteF_DeterministicValidation(report);
  report.hr();

  // ── Phase 2: Register AI provider for LLM suites ──

  AiService.registerProvider(new GroqProvider());

  // Suite B: Matching (20B)
  console.log('\n[Suite B] Job Matching (20B)...');
  await suiteB_Matching(report, budget);
  report.hr();

  // Suite E: Screening (20B)
  console.log('\n[Suite E] Screening Questions (20B)...');
  await suiteE_Screening(report, budget);
  report.hr();

  // Suite C: Resume (120B) — expensive, run last
  console.log('\n[Suite C] Resume Generation (120B)...');
  await suiteC_Resume(report, budget);
  report.hr();

  // Suite D: Cover Letter (production model)
  console.log('\n[Suite D] Cover Letter (production model)...');
  await suiteD_CoverLetter(report, budget);
  report.hr();

  // Final summary
  report.h2('Token Usage Summary');
  report.budget(budget);

  const outPath = path.join(process.cwd(), 'regression_report.md');
  fs.writeFileSync(outPath, report.toString());
  console.log(`\n✅ Report generated at ${outPath}`);
}

runRegressionSuite().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
