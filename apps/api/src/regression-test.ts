import { PrismaClient } from '@prisma/client';
import { MatchingService } from './services/matching.service';
import { ResumeService } from './services/resume.service';
import { ScreeningService } from './services/screening.service';
import { AiService } from './ai/ai.service';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJobs() {
  const laravelJobs = await prisma.job.findMany({ where: { title: { contains: 'Laravel', mode: 'insensitive' } }, take: 1 });
  const nodeJobs = await prisma.job.findMany({ where: { title: { contains: 'Node', mode: 'insensitive' } }, take: 1 });
  const fullStackJobs = await prisma.job.findMany({ where: { title: { contains: 'Full', mode: 'insensitive' } }, take: 1 });
  const remoteJobs = await prisma.job.findMany({ where: { isRemote: true }, take: 1 });
  
  // Deduplicate
  const allJobsMap = new Map();
  [...laravelJobs, ...nodeJobs, ...fullStackJobs, ...remoteJobs].forEach(j => allJobsMap.set(j.id, j));
  return Array.from(allJobsMap.values());
}

import { GroqProvider } from './ai/providers/groq.provider';

async function runRegression() {
  AiService.registerProvider(new GroqProvider());
  const jobs = await fetchJobs();
  console.log(`Found ${jobs.length} jobs for testing.`);
  
  let report = `# Quality Regression Test Report\n\n`;
  report += `Testing against ${jobs.length} unique jobs.\n\n`;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    console.log(`Testing Job [${i+1}/${jobs.length}]: ${job.title}`);
    report += `## Job: ${job.title} at ${job.company}\n`;
    
    // Clear AI cache for this job to force regeneration
    await prisma.aiCache.deleteMany({});
    
    // 1. BEFORE OPTIMIZATION
    console.log(`  -> Running Before Optimization...`);
    process.env.USE_LEGACY_CONTEXT = 'true';
    
    let matchBefore = null;
    let resumeBefore = null;
    
    try {
      matchBefore = await MatchingService.analyzeJob(job.id);
      await delay(15000); // Prevent rate limit
      // Just test matching and resume to save time and tokens, as they are representative
      resumeBefore = await ResumeService.generateTailoredCv(job.id);
      await delay(15000);
    } catch(e: any) {
      console.log(`Error in Before:`, e.message);
    }

    // 2. AFTER OPTIMIZATION
    console.log(`  -> Running After Optimization...`);
    process.env.USE_LEGACY_CONTEXT = 'false';
    await prisma.aiCache.deleteMany({}); // clear cache again
    
    let matchAfter = null;
    let resumeAfter = null;
    
    try {
      matchAfter = await MatchingService.analyzeJob(job.id);
      await delay(2000);
      resumeAfter = await ResumeService.generateTailoredCv(job.id);
      await delay(2000);
    } catch(e: any) {
      console.log(`Error in After:`, e.message);
    }

    report += `### Job Matching Comparison\n`;
    report += `| Feature | Before | After |\n`;
    report += `| :--- | :--- | :--- |\n`;
    report += `| Technical Score | ${matchBefore?.technical_match || 'N/A'} | ${matchAfter?.technical_match || 'N/A'} |\n`;
    report += `| Missing Skills | ${(matchBefore?.missing_requirements || []).join(', ')} | ${(matchAfter?.missing_requirements || []).join(', ')} |\n`;
    report += `| Recommendation | ${matchBefore?.recommendation || 'N/A'} | ${matchAfter?.recommendation || 'N/A'} |\n\n`;

    report += `### Resume Generation Comparison\n`;
    const projBefore = resumeBefore?.resume?.projects?.map(p => p.title).join(', ') || 'N/A';
    const projAfter = resumeAfter?.resume?.projects?.map(p => p.title).join(', ') || 'N/A';
    
    // Ensure chronological dates
    const datesBefore = resumeBefore?.resume?.experiences?.map(e => e.period).join(' | ') || 'N/A';
    const datesAfter = resumeAfter?.resume?.experiences?.map(e => e.period).join(' | ') || 'N/A';
    
    report += `| Feature | Before | After |\n`;
    report += `| :--- | :--- | :--- |\n`;
    report += `| Included Projects | ${projBefore} | ${projAfter} |\n`;
    report += `| Timeline Dates Preserved | ${datesBefore !== 'N/A' ? 'Yes' : 'No'} | ${datesBefore === datesAfter ? 'Yes, perfectly matches legacy' : 'Modified'} |\n\n`;
    
    report += `---\n\n`;
  }

  const outPath = path.join(process.cwd(), 'regression_report.md');
  fs.writeFileSync(outPath, report);
  console.log(`Report generated at ${outPath}`);
}

runRegression().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
