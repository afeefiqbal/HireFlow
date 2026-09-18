/**
 * HIREflow V5 — Analytics Service
 * 
 * 100% Deterministic PostgreSQL / Prisma aggregation.
 * Zero LLM calls.
 * Calculates factual:
 * - Funnel counts
 * - Conversion rates (with exact denominators and zero-division protection)
 * - Time metrics (with median & average, explicit insufficientData flag)
 * - Cross-tabulated source, role family, technology, remote, visa, and freshness breakdowns
 */

import { PrismaClient, ApplicationStatus } from '@prisma/client';
import {
  ApplicationAnalytics,
  FunnelCounts,
  ApplicationConversionMetrics,
  ApplicationTimeMetrics,
  BreakdownItem,
} from '@ai-job-agent/shared';

const prisma = new PrismaClient();

export class AnalyticsService {
  /**
   * Resolves date boundaries based on date range string.
   */
  static getDateBoundaries(
    range: 'today' | '7d' | '30d' | '90d' | 'all' | 'custom' = 'all',
    customStart?: string | Date,
    customEnd?: string | Date
  ): { startDate: Date | null; endDate: Date | null } {
    const now = new Date();
    const end = customEnd ? (customEnd instanceof Date ? customEnd : new Date(customEnd)) : now;

    if (range === 'all') {
      return { startDate: null, endDate: null };
    }

    if (range === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: end };
    }

    if (range === '7d') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: end };
    }

    if (range === '30d') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: end };
    }

    if (range === '90d') {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: end };
    }

    if (range === 'custom') {
      const start = customStart ? (customStart instanceof Date ? customStart : new Date(customStart)) : null;
      return { startDate: start, endDate: end };
    }

    return { startDate: null, endDate: null };
  }

  /**
   * Main analytics aggregator.
   */
  static async getAnalytics(
    range: 'today' | '7d' | '30d' | '90d' | 'all' | 'custom' = '30d',
    customStart?: string | Date,
    customEnd?: string | Date
  ): Promise<ApplicationAnalytics> {
    const { startDate, endDate } = this.getDateBoundaries(range, customStart, customEnd);

    // 1. Fetch Discovered canonical jobs in date range
    const jobDateFilter = startDate && endDate ? { discoveredAt: { gte: startDate, lte: endDate } } : {};
    const discoveredCount = await prisma.job.count({
      where: jobDateFilter,
    });

    // 2. Fetch all Applications with job details, notes, and events
    const applications = await prisma.application.findMany({
      include: {
        job: true,
        events: { orderBy: { createdAt: 'asc' } },
        notesList: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter applications relevant to date range if applied
    const filteredApplications = applications.filter((app) => {
      if (!startDate || !endDate) return true;
      const refDate = app.appliedDate || app.createdAt;
      return refDate >= startDate && refDate <= endDate;
    });

    // 3. Funnel Counts
    // Discovered is canonical jobs
    // Shortlisted / Saved
    const shortlistedApps = filteredApplications.filter(
      (a) =>
        a.status === 'SHORTLISTED' ||
        a.status === 'SAVED' ||
        a.events.some((e) => e.type === 'SHORTLISTED' || e.toStatus === 'SHORTLISTED' || e.toStatus === 'SAVED')
    );

    // Preparing / CV Ready
    const preparingApps = filteredApplications.filter(
      (a) =>
        a.status === 'PREPARING' ||
        a.status === 'CV_READY' ||
        a.events.some((e) => e.type === 'PREPARATION_STARTED' || e.toStatus === 'PREPARING' || e.toStatus === 'CV_READY')
    );

    // Ready to apply
    const readyToApplyApps = filteredApplications.filter(
      (a) =>
        a.status === 'READY_TO_APPLY' ||
        a.events.some((e) => e.type === 'READY_TO_APPLY' || e.toStatus === 'READY_TO_APPLY')
    );

    // Applied (Applied or subsequent states with an applied event or appliedDate)
    const appliedApps = filteredApplications.filter(
      (a) =>
        a.status === 'APPLIED' ||
        a.status === 'INTERVIEW' ||
        a.status === 'OFFER' ||
        Boolean(a.appliedDate) ||
        a.events.some((e) => e.type === 'APPLIED' || e.toStatus === 'APPLIED')
    );

    // Interview
    const interviewApps = filteredApplications.filter(
      (a) =>
        a.status === 'INTERVIEW' ||
        a.status === 'OFFER' ||
        a.events.some((e) => e.type === 'INTERVIEW_SCHEDULED' || e.toStatus === 'INTERVIEW')
    );

    // Offer
    const offerApps = filteredApplications.filter(
      (a) => a.status === 'OFFER' || a.events.some((e) => e.type === 'OFFER_RECEIVED' || e.toStatus === 'OFFER')
    );

    const funnel: FunnelCounts = {
      discovered: discoveredCount,
      shortlisted: shortlistedApps.length,
      preparing: preparingApps.length,
      readyToApply: readyToApplyApps.length,
      applied: appliedApps.length,
      interview: interviewApps.length,
      offer: offerApps.length,
    };

    // 4. Conversion Metrics (guarded against zero division)
    const conversions: ApplicationConversionMetrics = {
      applicationRate: this.calculateConversion(funnel.applied, funnel.shortlisted),
      interviewRate: this.calculateConversion(funnel.interview, funnel.applied),
      offerRate: this.calculateConversion(funnel.offer, funnel.applied),
    };

    // 5. Time Metrics
    const timeMetrics = this.calculateTimeMetrics(filteredApplications);

    // 6. Breakdowns (Source, Role Family, Tech, Remote, Visa, Freshness)
    const breakdowns = this.calculateBreakdowns(appliedApps, interviewApps, offerApps);

    // 7. Follow-ups Due
    const now = new Date();
    const followUpsDueCount = filteredApplications.filter((a) => a.nextFollowUpAt && a.nextFollowUpAt <= now).length;

    const summary = {
      totalApplications: filteredApplications.length,
      appliedCount: funnel.applied,
      interviewCount: funnel.interview,
      offerCount: funnel.offer,
      rejectedCount: filteredApplications.filter((a) => a.status === 'REJECTED').length,
      pendingCount: filteredApplications.filter((a) => a.status === 'APPLIED' && !a.events.some((e) => e.toStatus === 'INTERVIEW' || e.toStatus === 'OFFER' || e.toStatus === 'REJECTED')).length,
      followUpsDueCount,
    };

    return {
      dateRange: range,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      summary,
      funnel,
      conversions,
      conversionMetrics: conversions,
      timeMetrics,
      breakdowns,
    };
  }

  private static calculateConversion(numerator: number, denominator: number) {
    if (denominator <= 0) {
      return {
        numerator,
        denominator,
        rate: null,
        formatted: 'Insufficient data',
        insufficientData: true,
      };
    }

    const percentage = Math.round((numerator / denominator) * 1000) / 10;
    return {
      numerator,
      denominator,
      rate: percentage,
      percentage,
      formatted: `${percentage}%`,
      insufficientData: false,
    };
  }

  private static calculateTimeMetrics(applications: any[]): ApplicationTimeMetrics {
    const discoveryToApplyDays: number[] = [];
    const applyToInterviewDays: number[] = [];
    const interviewToOfferDays: number[] = [];

    for (const app of applications) {
      // Discovery -> Apply
      const appliedEvent = app.events?.find((e: any) => e.type === 'APPLIED' || e.toStatus === 'APPLIED');
      const appliedTime = app.appliedDate ? new Date(app.appliedDate).getTime() : appliedEvent ? new Date(appliedEvent.createdAt).getTime() : null;
      const discoveredTime = app.job?.discoveredAt ? new Date(app.job.discoveredAt).getTime() : null;

      if (appliedTime && discoveredTime && appliedTime >= discoveredTime) {
        const days = Math.round(((appliedTime - discoveredTime) / (1000 * 60 * 60 * 24)) * 10) / 10;
        discoveryToApplyDays.push(days);
      }

      // Apply -> Interview
      const interviewEvent = app.events?.find((e: any) => e.type === 'INTERVIEW_SCHEDULED' || e.toStatus === 'INTERVIEW');
      const interviewTime = interviewEvent ? new Date(interviewEvent.createdAt).getTime() : null;

      if (appliedTime && interviewTime && interviewTime >= appliedTime) {
        const days = Math.round(((interviewTime - appliedTime) / (1000 * 60 * 60 * 24)) * 10) / 10;
        applyToInterviewDays.push(days);
      }

      // Interview -> Offer
      const offerEvent = app.events?.find((e: any) => e.type === 'OFFER_RECEIVED' || e.toStatus === 'OFFER');
      const offerTime = offerEvent ? new Date(offerEvent.createdAt).getTime() : null;

      if (interviewTime && offerTime && offerTime >= interviewTime) {
        const days = Math.round(((offerTime - interviewTime) / (1000 * 60 * 60 * 24)) * 10) / 10;
        interviewToOfferDays.push(days);
      }
    }

    const formatMetric = (samples: number[]) => {
      if (samples.length === 0) {
        return {
          avgDays: null,
          medianDays: null,
          sampleCount: 0,
          insufficientData: true,
          label: 'Insufficient data',
        };
      }
      const sum = samples.reduce((a, b) => a + b, 0);
      const avg = Math.round((sum / samples.length) * 10) / 10;
      const sorted = [...samples].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;

      return {
        avgDays: avg,
        medianDays: median,
        sampleCount: samples.length,
        insufficientData: false,
        label: `${avg} days (avg) / ${median} days (median)`,
      };
    };

    const d2a = formatMetric(discoveryToApplyDays);
    const a2i = formatMetric(applyToInterviewDays);
    const i2o = formatMetric(interviewToOfferDays);

    return {
      discoveryToApply: d2a,
      applyToInterview: a2i,
      interviewToOffer: i2o,
      avgDaysToApply: d2a.avgDays,
      medianDaysToApply: d2a.medianDays,
      avgDaysToInterview: a2i.avgDays,
      medianDaysToInterview: a2i.medianDays,
      avgDaysToOffer: i2o.avgDays,
      medianDaysToOffer: i2o.medianDays,
      insufficientData: d2a.insufficientData && a2i.insufficientData && i2o.insufficientData,
    };
  }

  private static calculateBreakdowns(appliedApps: any[], interviewApps: any[], offerApps: any[]) {
    // 1. Source Breakdown
    const sourceMap = new Map<string, { count: number; interviews: number; offers: number }>();
    // 2. Role Family Breakdown
    const roleMap = new Map<string, { count: number; interviews: number; offers: number }>();
    // 3. Tech Breakdown
    const techMap = new Map<string, { count: number; interviews: number; offers: number }>();
    // 4. Remote Breakdown
    const remoteMap = new Map<string, { count: number; interviews: number; offers: number }>();
    // 5. Visa Breakdown
    const visaMap = new Map<string, { count: number; interviews: number; offers: number }>();
    // 6. Freshness Breakdown
    const freshnessMap = new Map<string, { count: number; interviews: number; offers: number }>();

    for (const app of appliedApps) {
      const isInterview = interviewApps.some((i) => i.id === app.id);
      const isOffer = offerApps.some((o) => o.id === app.id);
      const job = app.job;

      if (!job) continue;

      // Source
      const src = job.source || 'Other';
      const srcObj = sourceMap.get(src) || { count: 0, interviews: 0, offers: 0 };
      srcObj.count++;
      if (isInterview) srcObj.interviews++;
      if (isOffer) srcObj.offers++;
      sourceMap.set(src, srcObj);

      // Role Family
      const role = job.roleFamily || 'OTHER';
      const roleObj = roleMap.get(role) || { count: 0, interviews: 0, offers: 0 };
      roleObj.count++;
      if (isInterview) roleObj.interviews++;
      if (isOffer) roleObj.offers++;
      roleMap.set(role, roleObj);

      // Technologies
      const techs = job.techStack || [];
      for (const t of techs) {
        const techObj = techMap.get(t) || { count: 0, interviews: 0, offers: 0 };
        techObj.count++;
        if (isInterview) techObj.interviews++;
        if (isOffer) techObj.offers++;
        techMap.set(t, techObj);
      }

      // Remote
      const rem = job.remoteType || (job.isRemote ? 'REMOTE' : 'UNKNOWN');
      const remObj = remoteMap.get(rem) || { count: 0, interviews: 0, offers: 0 };
      remObj.count++;
      if (isInterview) remObj.interviews++;
      if (isOffer) remObj.offers++;
      remoteMap.set(rem, remObj);

      // Visa
      const visa = job.visaSponsorship || 'NOT_MENTIONED';
      const visaObj = visaMap.get(visa) || { count: 0, interviews: 0, offers: 0 };
      visaObj.count++;
      if (isInterview) visaObj.interviews++;
      if (isOffer) visaObj.offers++;
      visaMap.set(visa, visaObj);

      // Freshness
      const fresh = job.freshnessStatus || 'UNKNOWN';
      const freshObj = freshnessMap.get(fresh) || { count: 0, interviews: 0, offers: 0 };
      freshObj.count++;
      if (isInterview) freshObj.interviews++;
      if (isOffer) freshObj.offers++;
      freshnessMap.set(fresh, freshObj);
    }

    const toBreakdownList = (map: Map<string, { count: number; interviews: number; offers: number }>): BreakdownItem[] => {
      const total = appliedApps.length;
      return Array.from(map.entries())
        .map(([key, data]) => ({
          key,
          label: key.replace(/_/g, ' '),
          count: data.count,
          percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
          interviewCount: data.interviews,
          offerCount: data.offers,
        }))
        .sort((a, b) => b.count - a.count);
    };

    const techList = toBreakdownList(techMap).slice(0, 15);

    return {
      source: toBreakdownList(sourceMap),
      roleFamily: toBreakdownList(roleMap),
      technologies: techList,
      technology: techList,
      remote: toBreakdownList(remoteMap),
      visa: toBreakdownList(visaMap),
      freshness: toBreakdownList(freshnessMap),
    };
  }
}
