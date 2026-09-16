import { JobAgeStatus, VisaStatus } from '@ai-job-agent/shared';

export interface RawJobPayload {
  title: string;
  company: string;
  location: string;
  isRemote?: boolean;
  employmentType?: string;
  postedAt?: string | Date | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  visaStatus?: VisaStatus;
  experienceRequired?: string | null;
  techStack?: string[];
  description: string;
  requirements?: string[];
  preferredSkills?: string[];
  applicationUrl: string;
  canonicalUrl: string;
  source: string;
  sourceUrl?: string;
}

export interface NormalizedJobResult {
  job: RawJobPayload;
  jobAgeHours: number | null;
  ageStatus: JobAgeStatus;
}

export interface JobSourceAdapter {
  sourceName: string;
  adapterType: string;
  fetchJobs(filterKeyword?: string): Promise<NormalizedJobResult[]>;
}
