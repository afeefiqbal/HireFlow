import { JobSourceAdapter, NormalizedJobResult, RawJobPayload } from './job-source.interface';
import { JobAgeStatus } from '@ai-job-agent/shared';

export class LeverAdapter implements JobSourceAdapter {
  sourceName = 'Lever Job Board';
  adapterType = 'lever';

  async fetchJobs(filterKeyword?: string): Promise<NormalizedJobResult[]> {
    const now = new Date();
    const sampleJobs: RawJobPayload[] = [
      {
        title: 'Full Stack Developer',
        company: 'MessageBird B.V.',
        location: 'Amsterdam, Netherlands · Remote',
        isRemote: true,
        employmentType: 'Full-time',
        postedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8h ago
        salaryMin: 70000,
        salaryMax: 85000,
        salaryCurrency: 'EUR',
        visaStatus: 'OFFERED',
        experienceRequired: '6+ years',
        techStack: ['Laravel', 'PHP', 'Vue.js', 'MySQL', 'REST APIs'],
        description: 'Building global communications APIs and developer portals.',
        requirements: ['6+ years full-stack development', 'Laravel & Vue.js expertise'],
        applicationUrl: 'https://jobs.lever.co/messagebird/fullstack',
        canonicalUrl: 'https://jobs.lever.co/messagebird/fullstack',
        source: this.sourceName,
      },
    ];

    return sampleJobs.map((j) => {
      const posted = j.postedAt ? new Date(j.postedAt) : null;
      let ageHours: number | null = null;
      let status: JobAgeStatus = 'UNKNOWN';

      if (posted && !isNaN(posted.getTime())) {
        ageHours = Math.round(((now.getTime() - posted.getTime()) / (1000 * 60 * 60)) * 10) / 10;
        status = ageHours <= 24 ? 'FRESH' : 'OLDER';
      }

      return {
        job: j,
        jobAgeHours: ageHours,
        ageStatus: status,
      };
    });
  }
}
