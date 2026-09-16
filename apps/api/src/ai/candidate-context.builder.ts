export type ContextTaskType =
  | 'JOB_CLASSIFICATION'
  | 'JOB_MATCHING'
  | 'SCREENING_QUESTION'
  | 'COVER_LETTER'
  | 'RESUME_GENERATION';

const TECHNOLOGIES = [
  'laravel', 'php', 'node', 'nodejs', 'node.js', 'react', 'vue', 'vue.js',
  'postgresql', 'mysql', 'mongodb', 'aws', 'docker', 'rest apis', 'graphql',
  'redis', 'typescript', 'javascript', 'html', 'css', 'git', 'github', 'ci/cd'
];

const CAPABILITIES = [
  'api development', 'api integration', 'authentication', 'payment integration',
  'performance optimization', 'deployment', 'database development',
  'frontend development', 'backend development', 'microservices', 'architecture',
  'testing', 'debugging', 'mentoring', 'code review', 'agile'
];

const DOMAINS = [
  'e-commerce', 'crm', 'education', 'saas', 'payments', 'b2b', 'b2c', 'startup',
  'enterprise', 'healthcare', 'fintech'
];

export class CandidateContextBuilder {
  /**
   * Deterministic keyword scoring to find relevant evidence
   */
  private static scoreRelevance(text: string, targetText: string): string[] {
    const matchedKeywords: string[] = [];
    const sourceText = text.toLowerCase();
    const target = targetText.toLowerCase();

    // Only look for keywords that are actually mentioned in the target text
    const checkMatch = (kwList: string[]) => {
      for (const kw of kwList) {
        if (target.includes(kw) && sourceText.includes(kw)) {
          if (!matchedKeywords.includes(kw)) {
            matchedKeywords.push(kw);
          }
        }
      }
    };

    checkMatch(TECHNOLOGIES);
    checkMatch(CAPABILITIES);
    checkMatch(DOMAINS);

    return matchedKeywords;
  }

  /**
   * Builds the Core Context: Small stable summary
   */
  private static buildCoreContext(profile: any): any {
    return {
      fullName: profile.fullName,
      headline: profile.headline,
      yearsOfExperience: profile.yearsOfExperience,
      targetRoles: profile.targetRoles,
      // Minimal timeline: just company, role, and dates
      employmentTimeline: (profile.experiences || []).map((exp: any) => ({
        company: exp.company,
        role: exp.role,
        period: `${exp.startDate} - ${exp.endDate || 'Present'}`
      })),
      primaryTechnologies: (profile.skills || [])
        .filter((s: any) => s.level === 'expert' || s.category === 'Backend' || s.category === 'Frontend')
        .map((s: any) => s.name)
        .slice(0, 10),
    };
  }

  /**
   * Builds Relevant Context: Deterministic scoring of experiences and projects
   */
  private static buildRelevantContext(profile: any, targetText: string): any {
    const relevantExperiences: any[] = [];
    const relevantProjects: any[] = [];

    // Score Experiences
    for (const exp of (profile.experiences || [])) {
      const expText = `${exp.company} ${exp.role} ${exp.description || ''} ${(exp.technologies || []).join(' ')} ${exp.bullets ? exp.bullets.join(' ') : ''}`;
      const matches = this.scoreRelevance(expText, targetText);
      
      if (matches.length > 0) {
        relevantExperiences.push({
          source: exp.company,
          role: exp.role,
          relevance: matches,
          verified: true,
          details: exp.description || (exp.bullets ? exp.bullets.join('; ') : ''),
          technologies: exp.technologies
        });
      }
    }

    // Score Projects
    for (const proj of (profile.projects || [])) {
      const projText = `${proj.title} ${proj.description || ''} ${(proj.technologies || []).join(' ')}`;
      const matches = this.scoreRelevance(projText, targetText);
      
      if (matches.length > 0) {
        relevantProjects.push({
          source: proj.title,
          relevance: matches,
          verified: true,
          details: proj.description,
          technologies: proj.technologies
        });
      }
    }

    // If no relevant info found, provide at least something to prevent hallucination of "I have no experience"
    if (relevantExperiences.length === 0 && relevantProjects.length === 0) {
      return {
        notice: "No highly specific matching evidence found. Use CORE_CONTEXT."
      };
    }

    return {
      relevantExperiences,
      relevantProjects
    };
  }

  /**
   * Builds Full Context: Complete chronological information
   */
  private static buildFullContext(profile: any): any {
    return {
      name: profile.fullName,
      headline: profile.headline,
      experience: profile.experiences,
      skills: profile.skills,
      projects: profile.projects,
    };
  }

  /**
   * Routes the context building based on the task type
   */
  public static buildContextForTask(
    task: ContextTaskType,
    profile: any,
    targetText: string = ''
  ): string {
    if (process.env.USE_LEGACY_CONTEXT === 'true') {
      const verified = {
        name: profile.fullName,
        headline: profile.headline,
        experience: profile.experiences,
        skills: profile.skills,
        projects: profile.projects,
      };
      return JSON.stringify(verified, null, 2);
    }

    const core = this.buildCoreContext(profile);
    
    let finalContext: any = {};

    switch (task) {
      case 'JOB_CLASSIFICATION':
        finalContext = { CORE_CONTEXT: core };
        break;

      case 'JOB_MATCHING':
      case 'SCREENING_QUESTION':
      case 'COVER_LETTER': {
        const relevant = this.buildRelevantContext(profile, targetText);
        finalContext = {
          CORE_CONTEXT: core,
          RELEVANT_CONTEXT: relevant
        };
        break;
      }

      case 'RESUME_GENERATION': {
        const relevant = this.buildRelevantContext(profile, targetText);
        // Resume requires chronological details to not omit employers/periods
        finalContext = {
          CORE_CONTEXT: core,
          RELEVANT_CONTEXT: relevant,
          FULL_VERIFIED_TIMELINE: this.buildFullContext(profile).experience
        };
        break;
      }

      default:
        finalContext = this.buildFullContext(profile);
    }

    return JSON.stringify(finalContext, null, 2);
  }
}
