/**
 * HIREflow V4 - Role Family & Seniority Classifier
 * Deterministic boundary classification to prevent cross-domain false matches.
 */

import { RoleFamily, Seniority, FactConfidence } from '@ai-job-agent/shared';

export interface RoleClassificationResult {
  roleFamily: RoleFamily;
  seniority: Seniority;
  confidence: FactConfidence;
}

export class RoleClassifier {
  /**
   * Classifies Role Family and Seniority using deterministic token boundary analysis.
   */
  static classify(title: string, description: string = '', experienceRequired: string = ''): RoleClassificationResult {
    const titleLower = title.toLowerCase();
    const fullText = `${titleLower} ${description.slice(0, 1000).toLowerCase()}`;

    // 1. Classify Seniority
    const seniority = this.extractSeniority(titleLower, experienceRequired);

    // 2. Classify Role Family
    const roleFamily = this.extractRoleFamily(titleLower, fullText);

    return {
      roleFamily,
      seniority,
      confidence: 'HIGH',
    };
  }

  private static extractSeniority(titleLower: string, experienceRequired: string): Seniority {
    // Check Director / Executive
    if (/\b(director|vp|vice president|head of|chief)\b/i.test(titleLower)) {
      return 'DIRECTOR';
    }

    // Check Manager / Lead
    if (/\b(principal)\b/i.test(titleLower)) {
      return 'PRINCIPAL';
    }
    if (/\b(staff)\b/i.test(titleLower)) {
      return 'STAFF';
    }
    if (/\b(lead|team lead|tech lead)\b/i.test(titleLower)) {
      return 'LEAD';
    }
    if (/\b(manager|engineering manager|project manager|product manager)\b/i.test(titleLower)) {
      return 'MANAGER';
    }

    // Check Senior
    if (/\b(senior|sr\.?|lead developer|architect)\b/i.test(titleLower)) {
      return 'SENIOR';
    }

    // Check Junior / Intern
    if (/\b(intern|internship|working student|werkstudent|trainee|apprentice)\b/i.test(titleLower)) {
      return 'INTERN';
    }
    if (/\b(junior|jr\.?|entry-level|associate|graduate)\b/i.test(titleLower)) {
      return 'JUNIOR';
    }

    // Infer from experience if mentioned
    if (experienceRequired) {
      const match = experienceRequired.match(/(\d+)\+?\s*years?/i);
      if (match) {
        const years = parseInt(match[1], 10);
        if (years >= 5) return 'SENIOR';
        if (years <= 2) return 'JUNIOR';
        return 'MID';
      }
    }

    // Check Mid-level or standard engineer
    if (/\b(mid|intermediate)\b/i.test(titleLower) || /\b(developer|engineer)\b/i.test(titleLower)) {
      return 'MID';
    }

    return 'UNKNOWN';
  }

  private static extractRoleFamily(titleLower: string, fullText: string): RoleFamily {
    // 1. Engineering Management (checked before software engineering)
    if (
      /\b(engineering manager|director of engineering|vp of engineering|head of engineering|software engineering manager)\b/i.test(
        titleLower
      )
    ) {
      return 'ENGINEERING_MANAGEMENT';
    }

    // 2. Project Management / Program Management / Scrum Master
    if (
      /\b(project manager|program manager|technical project manager|scrum master|delivery manager|pmo|technical program manager)\b/i.test(
        titleLower
      )
    ) {
      return 'PROJECT_MANAGEMENT';
    }

    // 3. Product Management
    if (/\b(product manager|product owner|head of product|group product manager)\b/i.test(titleLower)) {
      return 'PRODUCT';
    }

    // 4. QA / Testing
    if (
      /\b(qa|quality assurance|sdet|test automation|automation engineer|test engineer|qa engineer|software test)\b/i.test(
        titleLower
      )
    ) {
      return 'QA';
    }

    // 5. DevOps / Platform / SRE / Cloud
    if (
      /\b(devops|sre|site reliability|infrastructure engineer|platform engineer|cloud engineer|systems engineer)\b/i.test(
        titleLower
      )
    ) {
      return 'DEVOPS';
    }

    // 6. Data / ML / AI
    if (
      /\b(data engineer|data scientist|machine learning|ml engineer|ai engineer|data analyst|bi developer)\b/i.test(
        titleLower
      )
    ) {
      return 'DATA';
    }

    // 7. UI/UX Design
    if (/\b(ui\/ux|ux designer|product designer|ui designer|visual designer|ux researcher)\b/i.test(titleLower)) {
      return 'DESIGN';
    }

    // 8. Sales / Business Development
    if (/\b(sales|account executive|bdr|sdr|business development|account manager)\b/i.test(titleLower)) {
      return 'SALES';
    }

    // 9. Marketing
    if (/\b(marketing|growth manager|seo specialist|content manager)\b/i.test(titleLower)) {
      return 'MARKETING';
    }

    // 10. Customer Success / Support
    if (/\b(customer success|support engineer|customer support|support specialist)\b/i.test(titleLower)) {
      return 'CUSTOMER_SUCCESS';
    }

    // 11. Software Engineering (Core engineering roles)
    if (
      /\b(backend|frontend|full\s*stack|fullstack|full-stack|software developer|software engineer|web developer|developer|engineer|programmer|laravel|php|node|react|vue|python|golang|java|c#|\.net|mobile developer|ios developer|android developer)\b/i.test(
        titleLower
      )
    ) {
      return 'SOFTWARE_ENGINEERING';
    }

    // Check description fallback if title was ambiguous
    if (/\b(write clean code|building apis|backend services|frontend applications|microservices architecture)\b/i.test(fullText)) {
      return 'SOFTWARE_ENGINEERING';
    }

    return 'OTHER';
  }
}
