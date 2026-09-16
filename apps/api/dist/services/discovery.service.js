"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryService = void 0;
const client_1 = require("@prisma/client");
const job_filter_service_1 = require("./job-filter.service");
const prisma = new client_1.PrismaClient();
class DiscoveryService {
    /**
     * Target tech keywords matching Afeef Iqbal's positioning
     */
    static TARGET_KEYWORDS = [
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
    static TARGET_LOCATIONS = [
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
    static async runRealJobDiscovery() {
        console.log('🚀 Starting Real Job Discovery Pipeline...');
        const candidates = [];
        const sourceStats = {
            Greenhouse: 0,
            Lever: 0,
            Ashby: 0,
            'Arbeitnow (EU Tech)': 0,
        };
        // 1. Fetch from Real Greenhouse Boards
        try {
            const greenhouseJobs = await this.fetchGreenhouse();
            candidates.push(...greenhouseJobs);
            sourceStats.Greenhouse = greenhouseJobs.length;
        }
        catch (e) {
            console.warn('Greenhouse fetch issue:', e.message);
        }
        // 2. Fetch from Real Lever Boards
        try {
            const leverJobs = await this.fetchLever();
            candidates.push(...leverJobs);
            sourceStats.Lever = leverJobs.length;
        }
        catch (e) {
            console.warn('Lever fetch issue:', e.message);
        }
        // 3. Fetch from Real Ashby Boards
        try {
            const ashbyJobs = await this.fetchAshby();
            candidates.push(...ashbyJobs);
            sourceStats.Ashby = ashbyJobs.length;
        }
        catch (e) {
            console.warn('Ashby fetch issue:', e.message);
        }
        // 4. Fetch from Real European Tech API (Arbeitnow)
        try {
            const arbeitnowJobs = await this.fetchArbeitnow();
            candidates.push(...arbeitnowJobs);
            sourceStats['Arbeitnow (EU Tech)'] = arbeitnowJobs.length;
        }
        catch (e) {
            console.warn('Arbeitnow fetch issue:', e.message);
        }
        // Filter relevant to Afeef's role & target locations
        const relevantCandidates = candidates.filter((job) => this.isRelevantJob(job));
        let newSaved = 0;
        let freshSaved = 0;
        let duplicatesSkipped = 0;
        for (const item of relevantCandidates) {
            // Check for duplicates by canonicalUrl
            const existing = await prisma.job.findUnique({
                where: { canonicalUrl: item.canonicalUrl },
            });
            if (existing) {
                duplicatesSkipped++;
                continue;
            }
            // 24-Hour calculation
            const ageEval = job_filter_service_1.JobFilterService.evaluatePostingAge(item.postedAt);
            const parsedPostedAt = item.postedAt instanceof Date
                ? item.postedAt
                : typeof item.postedAt === 'number'
                    ? item.postedAt < 10000000000
                        ? new Date(item.postedAt * 1000)
                        : new Date(item.postedAt)
                    : typeof item.postedAt === 'string'
                        ? new Date(item.postedAt)
                        : null;
            await prisma.job.create({
                data: {
                    title: item.title,
                    company: item.company,
                    location: item.location,
                    isRemote: item.isRemote,
                    employmentType: item.employmentType,
                    postedAt: parsedPostedAt && !isNaN(parsedPostedAt.getTime()) ? parsedPostedAt : null,
                    jobAgeHours: ageEval.jobAgeHours,
                    ageStatus: ageEval.ageStatus,
                    salaryMin: item.salaryMin,
                    salaryMax: item.salaryMax,
                    salaryCurrency: item.salaryCurrency || 'EUR',
                    visaStatus: item.visaStatus,
                    experienceRequired: item.experienceRequired,
                    techStack: item.techStack,
                    description: item.description,
                    requirements: item.requirements,
                    preferredSkills: item.preferredSkills,
                    applicationUrl: item.applicationUrl,
                    canonicalUrl: item.canonicalUrl,
                    source: item.source,
                    sourceUrl: item.sourceUrl,
                },
            });
            newSaved++;
            if (ageEval.isFresh) {
                freshSaved++;
            }
        }
        console.log(`✅ Discovery complete. Scanned: ${candidates.length}, Relevant: ${relevantCandidates.length}, New Saved: ${newSaved} (${freshSaved} fresh <24h)`);
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
     * Greenhouse Public Board Collector
     */
    static async fetchGreenhouse() {
        const companies = ['spryker', 'taxfix', 'deliveryhero', 'gitlab'];
        const results = [];
        for (const comp of companies) {
            try {
                const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${comp}/jobs?content=true`, {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok)
                    continue;
                const data = (await res.json());
                const jobs = data.jobs || [];
                for (const j of jobs) {
                    const location = j.location?.name || 'Germany · Remote';
                    const isRemote = location.toLowerCase().includes('remote') ||
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
                        sourceUrl: `https://boards.greenhouse.io/${comp}`,
                    });
                }
            }
            catch (err) {
                console.warn(`Greenhouse error for ${comp}:`, err.message);
            }
        }
        return results;
    }
    /**
     * Lever Public Job Board Collector
     */
    static async fetchLever() {
        const companies = ['kinsta', 'pleo', 'hotjar', 'atlan'];
        const results = [];
        for (const comp of companies) {
            try {
                const res = await fetch(`https://api.lever.co/v0/postings/${comp}?mode=json`, {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok)
                    continue;
                const jobs = (await res.json());
                for (const j of jobs) {
                    const loc = j.categories?.location || 'Europe · Remote';
                    const isRemote = j.categories?.workplaceType === 'remote' ||
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
                        requirements: j.lists ? j.lists.flatMap((l) => l.content ? [l.text] : []) : [],
                        preferredSkills: [],
                        applicationUrl: j.applyUrl || j.hostedUrl,
                        canonicalUrl: j.hostedUrl,
                        source: 'Lever',
                        sourceUrl: `https://jobs.lever.co/${comp}`,
                    });
                }
            }
            catch (err) {
                console.warn(`Lever error for ${comp}:`, err.message);
            }
        }
        return results;
    }
    /**
     * Ashby Public Board Collector
     */
    static async fetchAshby() {
        const companies = ['posthog', 'sentry', 'linear'];
        const results = [];
        for (const comp of companies) {
            try {
                const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${comp}`, {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok)
                    continue;
                const data = (await res.json());
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
                        sourceUrl: `https://jobs.ashbyhq.com/${comp}`,
                    });
                }
            }
            catch (err) {
                console.warn(`Ashby error for ${comp}:`, err.message);
            }
        }
        return results;
    }
    /**
     * European Tech API (Arbeitnow) with authentic timestamps
     */
    static async fetchArbeitnow() {
        const results = [];
        try {
            const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok)
                return results;
            const json = (await res.json());
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
                    source: 'Company Careers',
                    sourceUrl: j.url,
                });
            }
        }
        catch (err) {
            console.warn('Arbeitnow error:', err.message);
        }
        return results;
    }
    /**
     * Filters candidate jobs for relevance to Afeef's profile
     */
    static isRelevantJob(job) {
        const fullText = `${job.title} ${job.description} ${job.techStack.join(' ')}`.toLowerCase();
        const locText = `${job.location} ${job.isRemote ? 'remote' : ''}`.toLowerCase();
        // 1. Must match target technologies / roles
        const hasRoleOrTech = this.TARGET_KEYWORDS.some((kw) => {
            const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
            return regex.test(fullText);
        });
        if (!hasRoleOrTech)
            return false;
        // 2. Must match target locations (Europe, Germany, Netherlands, Remote, Worldwide)
        const hasLocation = this.TARGET_LOCATIONS.some((loc) => {
            const regex = new RegExp(`\\b${loc}\\b`, 'i');
            return regex.test(locText);
        });
        return hasLocation || job.isRemote;
    }
    static extractTechStack(text) {
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
        const found = [];
        for (const tech of known) {
            const regex = new RegExp(`\\b${tech.replace('.', '\\.')}\\b`, 'i');
            if (regex.test(text)) {
                found.push(tech);
            }
        }
        return found.length > 0 ? found : ['PHP', 'Backend'];
    }
    static extractRequirements(htmlOrText) {
        const lines = htmlOrText
            .replace(/<[^>]+>/g, '\n')
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 20 && l.length < 200 && (l.startsWith('-') || l.startsWith('•') || /^\d+\./.test(l)));
        return lines.slice(0, 6).map((l) => l.replace(/^[-•\d.]+\s*/, ''));
    }
    static stripHtml(html) {
        return html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
exports.DiscoveryService = DiscoveryService;
