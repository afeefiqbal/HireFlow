import { PrismaClient, VisaStatus } from '@prisma/client';
import { JobFilterService } from './job-filter.service';
import { JobPipelineService } from './intelligence/job-pipeline.service';

const prisma = new PrismaClient();

interface IngestCandidate {
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  employmentType: string;
  postedAt: Date | string | number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  visaStatus: VisaStatus;
  experienceRequired?: string | null;
  techStack: string[];
  description: string;
  requirements: string[];
  preferredSkills: string[];
  applicationUrl: string;
  canonicalUrl: string;
  source: string;
  sourceJobId?: string | null;
  sourceUrl?: string;
}

export class DiscoveryService {
  /**
   * Target tech keywords matching Afeef Iqbal's positioning
   */
  private static readonly TARGET_KEYWORDS = [
    'laravel',
    'php',
    'node',
    'nodejs',
    'node.js',
    'express',
    'vue',
    'vue.js',
    'react',
    'full stack',
    'fullstack',
    'backend',
    'full-stack',
  ];

  /**
   * Target location keywords (Germany, Netherlands, Europe, Remote, Worldwide)
   */
  private static readonly TARGET_LOCATIONS = [
    'germany',
    'deutschland',
    'berlin',
    'munich',
    'münchen',
    'hamburg',
    'cologne',
    'frankfurt',
    'netherlands',
    'amsterdam',
    'rotterdam',
    'utrecht',
    'europe',
    'remote',
    'worldwide',
    'emea',
    'eu',
  ];

  /**
   * Main Discovery Pipeline: Ingests from 4 real ATS and job board platforms.
   */
  static async runRealJobDiscovery(): Promise<{
    totalScanned: number;
    relevantFound: number;
    newSaved: number;
    freshSaved: number;
    duplicatesSkipped: number;
    sources: Record<string, number>;
  }> {
    console.log('🚀 Starting Real Job Discovery Pipeline...');

    const candidates: IngestCandidate[] = [];
    const sourceStats: Record<string, number> = {
      Greenhouse: 0,
      Lever: 0,
      Ashby: 0,
      'Arbeitnow (EU Tech)': 0,
      'Remotive (Open Tech API)': 0,
      'Jobicy (Remote API)': 0,
    };

    // 1. Fetch from Real Greenhouse Boards
    try {
      const greenhouseJobs = await this.fetchGreenhouse();
      candidates.push(...greenhouseJobs);
      sourceStats.Greenhouse = greenhouseJobs.length;
    } catch (e: any) {
      console.warn('Greenhouse fetch issue:', e.message);
    }

    // 2. Fetch from Real Lever Boards
    try {
      const leverJobs = await this.fetchLever();
      candidates.push(...leverJobs);
      sourceStats.Lever = leverJobs.length;
    } catch (e: any) {
      console.warn('Lever fetch issue:', e.message);
    }

    // 3. Fetch from Real Ashby Boards
    try {
      const ashbyJobs = await this.fetchAshby();
      candidates.push(...ashbyJobs);
      sourceStats.Ashby = ashbyJobs.length;
    } catch (e: any) {
      console.warn('Ashby fetch issue:', e.message);
    }

    // 4. Fetch from Real European Tech API (Arbeitnow)
    try {
      const arbeitnowJobs = await this.fetchArbeitnow();
      candidates.push(...arbeitnowJobs);
      sourceStats['Arbeitnow (EU Tech)'] = arbeitnowJobs.length;
    } catch (e: any) {
      console.warn('Arbeitnow fetch issue:', e.message);
    }

    // 5. Fetch from Remotive Public Developer API
    try {
      const remotiveJobs = await this.fetchRemotive();
      candidates.push(...remotiveJobs);
      sourceStats['Remotive (Open Tech API)'] = remotiveJobs.length;
    } catch (e: any) {
      console.warn('Remotive fetch issue:', e.message);
    }

    // 6. Fetch from Jobicy Remote Engineering API
    try {
      const jobicyJobs = await this.fetchJobicy();
      candidates.push(...jobicyJobs);
      sourceStats['Jobicy (Remote API)'] = jobicyJobs.length;
    } catch (e: any) {
      console.warn('Jobicy fetch issue:', e.message);
    }

    // Filter relevant to Afeef's role & target locations
    const relevantCandidates = candidates.filter((job) => this.isRelevantJob(job));

    let newSaved = 0;
    let freshSaved = 0;
    let duplicatesSkipped = 0;

    for (const item of relevantCandidates) {
      try {
        // Liveness check: skip dead / 404 links before ingesting
        const targetUrl = item.applicationUrl || item.canonicalUrl;
        const isAlive = await this.isUrlAlive(targetUrl);
        if (!isAlive) {
          console.log(`[Discovery] Skipping unreachable/404 job posting: ${targetUrl} (${item.company} - ${item.title})`);
          continue;
        }

        const result = await JobPipelineService.processAndIngestJob({
          title: item.title,
          company: item.company,
          location: item.location,
          isRemote: item.isRemote,
          employmentType: item.employmentType,
          postedAt: item.postedAt,
          salaryMin: item.salaryMin,
          salaryMax: item.salaryMax,
          salaryCurrency: item.salaryCurrency || 'EUR',
          experienceRequired: item.experienceRequired,
          techStack: item.techStack,
          description: item.description,
          requirements: item.requirements,
          preferredSkills: item.preferredSkills,
          applicationUrl: item.applicationUrl,
          canonicalUrl: item.canonicalUrl,
          source: item.source,
          sourceJobId: item.sourceJobId,
          sourceUrl: item.sourceUrl,
        });

        if (result.isNew) {
          newSaved++;
          if (result.job.ageStatus === 'FRESH') {
            freshSaved++;
          }
        } else {
          duplicatesSkipped++;
        }
      } catch (err: any) {
        console.warn(`Error processing discovery candidate ${item.title}:`, err.message);
      }
    }

    console.log(
      `✅ Discovery complete. Scanned: ${candidates.length}, Relevant: ${relevantCandidates.length}, New Saved: ${newSaved} (${freshSaved} fresh <24h)`
    );

    return {
      totalScanned: candidates.length,
      relevantFound: relevantCandidates.length,
      newSaved,
      freshSaved,
      duplicatesSkipped,
      sources: sourceStats,
    };
  }

  /**
   * Greenhouse Public Board Collector (Active Verified Tech Companies)
   */
  private static async fetchGreenhouse(): Promise<IngestCandidate[]> {
    const companies = ['gitlab', 'wikimedia', 'canonical', 'elastic', 'datadog', 'spryker'];
    const results: IngestCandidate[] = [];

    for (const comp of companies) {
      try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${comp}/jobs?content=true`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) continue;
        const data = (await res.json()) as any;
        const jobs = data.jobs || [];

        for (const j of jobs) {
          const location = j.location?.name || 'Germany · Remote';
          const isRemote =
            location.toLowerCase().includes('remote') ||
            (j.title && j.title.toLowerCase().includes('remote'));

          results.push({
            title: j.title,
            company: comp.charAt(0).toUpperCase() + comp.slice(1),
            location,
            isRemote,
            employmentType: 'Full-time',
            postedAt: j.updated_at ? new Date(j.updated_at) : null,
            visaStatus: 'NOT_STATED',
            techStack: this.extractTechStack(j.title + ' ' + (j.content || '')),
            description: this.stripHtml(j.content || j.title),
            requirements: this.extractRequirements(j.content || ''),
            preferredSkills: [],
            applicationUrl: j.absolute_url,
            canonicalUrl: j.absolute_url,
            source: 'Greenhouse',
            sourceJobId: String(j.id || ''),
            sourceUrl: `https://boards.greenhouse.io/${comp}`,
          });
        }
      } catch (err: any) {
        console.warn(`Greenhouse error for ${comp}:`, err.message);
      }
    }
    return results;
  }

  /**
   * Lever Public Job Board Collector (Active Verified Boards)
   */
  private static async fetchLever(): Promise<IngestCandidate[]> {
    const companies = ['kinsta', 'spotify', 'figma'];
    const results: IngestCandidate[] = [];

    for (const comp of companies) {
      try {
        const res = await fetch(`https://api.lever.co/v0/postings/${comp}?mode=json`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) continue;
        const jobs = (await res.json()) as any[];

        for (const j of jobs) {
          const loc = j.categories?.location || 'Europe · Remote';
          const isRemote =
            j.categories?.workplaceType === 'remote' ||
            loc.toLowerCase().includes('remote') ||
            j.text.toLowerCase().includes('remote');

          results.push({
            title: j.text,
            company: comp.charAt(0).toUpperCase() + comp.slice(1),
            location: loc,
            isRemote,
            employmentType: j.categories?.commitment || 'Full-time',
            postedAt: j.createdAt ? new Date(j.createdAt) : null,
            visaStatus: 'NOT_STATED',
            techStack: this.extractTechStack(j.text + ' ' + (j.descriptionPlain || '')),
            description: j.descriptionPlain || j.text,
            requirements: j.lists ? j.lists.flatMap((l: any) => l.content ? [l.text] : []) : [],
            preferredSkills: [],
            applicationUrl: j.applyUrl || j.hostedUrl,
            canonicalUrl: j.hostedUrl,
            source: 'Lever',
            sourceJobId: String(j.id || ''),
            sourceUrl: `https://jobs.lever.co/${comp}`,
          });
        }
      } catch (err: any) {
        console.warn(`Lever error for ${comp}:`, err.message);
      }
    }
    return results;
  }

  /**
   * Ashby Public Board Collector (Active Verified Tech Companies)
   */
  private static async fetchAshby(): Promise<IngestCandidate[]> {
    const companies = ['supabase', 'posthog', 'sentry', 'linear'];
    const results: IngestCandidate[] = [];

    for (const comp of companies) {
      try {
        const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${comp}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) continue;
        const data = (await res.json()) as any;
        const jobs = data.jobs || [];

        for (const j of jobs) {
          const loc = j.locationName || 'Worldwide Remote';
          const isRemote = j.isRemote || loc.toLowerCase().includes('remote');

          results.push({
            title: j.title,
            company: comp.charAt(0).toUpperCase() + comp.slice(1),
            location: loc,
            isRemote,
            employmentType: 'Full-time',
            postedAt: j.publishedAt ? new Date(j.publishedAt) : null,
            visaStatus: 'NOT_STATED',
            techStack: this.extractTechStack(j.title + ' ' + (j.descriptionPlain || '')),
            description: j.descriptionPlain || j.title,
            requirements: [],
            preferredSkills: [],
            applicationUrl: j.jobUrl,
            canonicalUrl: j.jobUrl,
            source: 'Ashby',
            sourceJobId: String(j.id || ''),
            sourceUrl: `https://jobs.ashbyhq.com/${comp}`,
          });
        }
      } catch (err: any) {
        console.warn(`Ashby error for ${comp}:`, err.message);
      }
    }
    return results;
  }

  /**
   * Remotive Open Developer Job API Collector (Free & Open)
   */
  private static async fetchRemotive(): Promise<IngestCandidate[]> {
    const results: IngestCandidate[] = [];
    try {
      const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=40', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return results;
      const data = (await res.json()) as any;
      const jobs = data.jobs || [];

      for (const j of jobs) {
        const tags = Array.isArray(j.tags) ? j.tags : [];
        results.push({
          title: j.title,
          company: j.company_name,
          location: j.candidate_required_location || 'Worldwide Remote',
          isRemote: true,
          employmentType: j.job_type === 'full_time' ? 'Full-time' : 'Contract',
          postedAt: j.publication_date ? new Date(j.publication_date) : null,
          visaStatus: 'NOT_STATED',
          techStack: this.extractTechStack(j.title + ' ' + tags.join(' ') + ' ' + (j.description || '')),
          description: this.stripHtml(j.description || j.title),
          requirements: tags,
          preferredSkills: [],
          applicationUrl: j.url,
          canonicalUrl: j.url,
          source: 'Remotive (Open Tech API)',
          sourceJobId: String(j.id || ''),
          sourceUrl: j.url,
        });
      }
    } catch (err: any) {
      console.warn('Remotive error:', err.message);
    }
    return results;
  }

  /**
   * Jobicy Remote Engineering API Collector (Free & Open)
   */
  private static async fetchJobicy(): Promise<IngestCandidate[]> {
    const results: IngestCandidate[] = [];
    try {
      const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=30&industry=engineering', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return results;
      const data = (await res.json()) as any;
      const jobs = data.jobs || [];

      for (const j of jobs) {
        results.push({
          title: j.jobTitle,
          company: j.companyName,
          location: j.jobGeo || 'Worldwide Remote',
          isRemote: true,
          employmentType: Array.isArray(j.jobType) ? j.jobType[0] : 'Full-time',
          postedAt: j.pubDate ? new Date(j.pubDate) : null,
          salaryMin: j.annualSalaryMin ? Number(j.annualSalaryMin) : undefined,
          salaryMax: j.annualSalaryMax ? Number(j.annualSalaryMax) : undefined,
          salaryCurrency: j.salaryCurrency || 'USD',
          visaStatus: 'NOT_STATED',
          techStack: this.extractTechStack(j.jobTitle + ' ' + (j.jobDescription || '')),
          description: this.stripHtml(j.jobDescription || j.jobTitle),
          requirements: Array.isArray(j.jobIndustry) ? j.jobIndustry : [],
          preferredSkills: [],
          applicationUrl: j.url,
          canonicalUrl: j.url,
          source: 'Jobicy (Remote API)',
          sourceJobId: String(j.id || ''),
          sourceUrl: j.url,
        });
      }
    } catch (err: any) {
      console.warn('Jobicy error:', err.message);
    }
    return results;
  }

  /**
   * Checks if an external URL is reachable and not returning 404 / 410 / NXDOMAIN
   */
  private static async isUrlAlive(url: string): Promise<boolean> {
    if (!url || !url.startsWith('http')) return false;
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(4000),
      });
      return res.status !== 404 && res.status !== 410;
    } catch {
      // Failed DNS resolution or timeout
      return false;
    }
  }

  /**
   * European Tech API (Arbeitnow) with authentic timestamps
   */
  private static async fetchArbeitnow(): Promise<IngestCandidate[]> {
    const results: IngestCandidate[] = [];
    try {
      const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return results;
      const json = (await res.json()) as any;
      const jobs = json.data || [];

      for (const j of jobs) {
        // created_at is authentic epoch timestamp
        const postedDate = j.created_at ? new Date(j.created_at * 1000) : null;
        const tags = Array.isArray(j.tags) ? j.tags : [];

        results.push({
          title: j.title,
          company: j.company_name,
          location: j.location || (j.remote ? 'Europe · Remote' : 'Germany'),
          isRemote: Boolean(j.remote),
          employmentType: 'Full-time',
          postedAt: postedDate,
          visaStatus: 'NOT_STATED',
          techStack: this.extractTechStack(j.title + ' ' + tags.join(' ') + ' ' + (j.description || '')),
          description: this.stripHtml(j.description || j.title),
          requirements: tags,
          preferredSkills: [],
          applicationUrl: j.url,
          canonicalUrl: j.url,
          source: 'Arbeitnow (EU Tech)',
          sourceJobId: String(j.slug || ''),
          sourceUrl: j.url,
        });
      }
    } catch (err: any) {
      console.warn('Arbeitnow error:', err.message);
    }
    return results;
  }

  /**
   * Filters candidate jobs for relevance to Afeef's profile
   */
  private static isRelevantJob(job: IngestCandidate): boolean {
    const fullText = `${job.title} ${job.description} ${job.techStack.join(' ')}`.toLowerCase();
    const locText = `${job.location} ${job.isRemote ? 'remote' : ''}`.toLowerCase();

    // 1. Must match target technologies / roles
    const hasRoleOrTech = this.TARGET_KEYWORDS.some((kw) => {
      const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
      return regex.test(fullText);
    });

    if (!hasRoleOrTech) return false;

    // 2. Must match target locations (Europe, Germany, Netherlands, Remote, Worldwide)
    const hasLocation = this.TARGET_LOCATIONS.some((loc) => {
      const regex = new RegExp(`\\b${loc}\\b`, 'i');
      return regex.test(locText);
    });

    return hasLocation || job.isRemote;
  }

  private static extractTechStack(text: string): string[] {
    const known = [
      'PHP',
      'Laravel',
      'Node.js',
      'Express.js',
      'Vue.js',
      'React',
      'MySQL',
      'PostgreSQL',
      'AWS',
      'Docker',
      'Git',
      'REST APIs',
      'TypeScript',
      'JavaScript',
      'Redis',
      'Kubernetes',
      'GraphQL',
    ];

    const found: string[] = [];
    for (const tech of known) {
      const regex = new RegExp(`\\b${tech.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(text)) {
        found.push(tech);
      }
    }
    return found.length > 0 ? found : ['PHP', 'Backend'];
  }

  private static extractRequirements(htmlOrText: string): string[] {
    const lines = htmlOrText
      .replace(/<[^>]+>/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 20 && l.length < 200 && (l.startsWith('-') || l.startsWith('•') || /^\d+\./.test(l)));

    return lines.slice(0, 6).map((l) => l.replace(/^[-•\d.]+\s*/, ''));
  }

  private static stripHtml(html: string): string {
    if (!html) return '';
    let text = html;

    const decodeEntities = (str: string) =>
      str
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
        .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&bull;/gi, '•')
        .replace(/&middot;/gi, '·')
        .replace(/&mdash;/gi, '—')
        .replace(/&ndash;/gi, '–')
        .replace(/&reg;/gi, '®')
        .replace(/&trade;/gi, '™')
        .replace(/&copy;/gi, '©');

    // Decode in two passes to handle double-encoded entities like &amp;lt;
    text = decodeEntities(text);
    text = decodeEntities(text);

    // Remove script and style elements
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // Convert block elements to clean line breaks
    text = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/(h[1-6]|div|tr)>/gi, '\n\n')
      .replace(/<hr\s*\/?>/gi, '\n---\n');

    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Final entity decode
    text = decodeEntities(text);

    return text
      .split('\n')
      .map((l) => l.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
