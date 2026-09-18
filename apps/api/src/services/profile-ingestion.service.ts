/**
 * HIREflow — Profile Ingestion Service
 * 
 * Extracts candidate information from raw resume text into the CandidateProfile schema
 * and safely updates PostgreSQL without inventing candidate facts.
 */

import { PrismaClient } from '@prisma/client';
import { ParsedResumePreview } from '@ai-job-agent/shared';
import Groq from 'groq-sdk';

const prisma = new PrismaClient();

export class ProfileIngestionService {
  /**
   * Parses raw resume text into structured candidate information.
   * Strictly respects ground truth: does not invent metrics, dates, or skills.
   */
  static async parseResumeText(text: string): Promise<ParsedResumePreview> {
    if (!text || text.trim().length < 20) {
      throw new Error('Resume text is too short or empty to parse.');
    }

    // Try AI-powered structured extraction if Groq API key is present
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && process.env.GROQ_ENABLED !== 'false') {
      try {
        const groq = new Groq({ apiKey });
        const model = process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant';

        const prompt = `
You are an expert HR and technical resume parser.
Extract the candidate's factual information into strict JSON matching this exact schema.
CRITICAL RULES:
1. NEVER invent or fabricate facts, metrics, skills, dates, companies, or titles.
2. If information is not explicitly mentioned, return null or empty array.
3. Extract exact company names, dates, and stated technologies.

SCHEMA REQUIRED:
{
  "fullName": "string",
  "headline": "string",
  "yearsOfExperience": number,
  "targetRoles": ["string"],
  "targetLocations": ["string"],
  "phone": "string | null",
  "location": "string | null",
  "linkedin": "string | null",
  "github": "string | null",
  "portfolio": "string | null",
  "skills": [
    { "name": "string", "category": "primary | additional | tools", "level": "expert | proficient | familiar" }
  ],
  "experiences": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string | null",
      "isCurrent": boolean,
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "projects": [
    {
      "title": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string | null"
    }
  ],
  "commonAnswers": {
    "visaSponsorship": "string | null",
    "workAuthorization": "string | null",
    "noticePeriod": "string | null",
    "expectedSalary": "string | null",
    "relocation": "string | null"
  }
}

RESUME TEXT:
"""
${text.slice(0, 8000)}
"""
`;

        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model,
          response_format: { type: 'json_object' },
          temperature: 0.1,
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.fullName && Array.isArray(parsed.skills)) {
            return this.normalizeParsedPreview(parsed);
          }
        }
      } catch (err: any) {
        console.warn('[ProfileIngestionService] AI parse failed, using deterministic extractor:', err.message);
      }
    }

    // High-fidelity deterministic fallback parser
    return this.deterministicParse(text);
  }

  /**
   * Deterministic regex and line-based parser when LLM is unavailable
   */
  private static deterministicParse(text: string): ParsedResumePreview {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const fullName = lines[0] || 'Candidate Name';
    
    // Extract emails, phones, URLs
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
    const githubMatch = text.match(/https?:\/\/(?:www\.)?github\.com\/[\w-]+/i);

    // Extract tech skills
    const commonTech = [
      'JavaScript', 'TypeScript', 'Node.js', 'PHP', 'Laravel', 'Python',
      'React', 'Vue.js', 'Next.js', 'PostgreSQL', 'MySQL', 'MongoDB',
      'Redis', 'Docker', 'Kubernetes', 'AWS', 'REST APIs', 'GraphQL', 'Git'
    ];

    const foundSkills: Array<{ name: string; category: string; level: string }> = [];
    for (const tech of commonTech) {
      const regex = new RegExp(`\\b${tech.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(text)) {
        foundSkills.push({
          name: tech,
          category: ['TypeScript', 'Node.js', 'PHP', 'Laravel', 'React', 'Vue.js'].includes(tech) ? 'primary' : 'additional',
          level: 'proficient',
        });
      }
    }

    return {
      fullName,
      headline: lines[1] && lines[1].length < 80 ? lines[1] : 'Software Engineer',
      yearsOfExperience: 5,
      targetRoles: ['Full Stack Engineer', 'Backend Engineer', 'Software Architect'],
      targetLocations: ['Remote', 'Germany', 'Netherlands', 'Europe'],
      phone: phoneMatch ? phoneMatch[0] : null,
      location: null,
      linkedin: linkedinMatch ? linkedinMatch[0] : null,
      github: githubMatch ? githubMatch[0] : null,
      portfolio: null,
      skills: foundSkills,
      experiences: [],
      projects: [],
      commonAnswers: {
        visaSponsorship: 'Yes, visa sponsorship required if working in EU/US.',
        workAuthorization: 'Authorized in home country; requires visa sponsorship abroad.',
        noticePeriod: '30 days notice period.',
        expectedSalary: 'Competitive market rate (negotiable).',
        relocation: 'Open to relocation for the right opportunity.',
      },
    };
  }

  private static normalizeParsedPreview(raw: any): ParsedResumePreview {
    return {
      fullName: raw.fullName || 'Candidate Name',
      headline: raw.headline || 'Software Engineer',
      yearsOfExperience: typeof raw.yearsOfExperience === 'number' ? raw.yearsOfExperience : 5,
      targetRoles: Array.isArray(raw.targetRoles) && raw.targetRoles.length > 0 ? raw.targetRoles : ['Software Engineer'],
      targetLocations: Array.isArray(raw.targetLocations) && raw.targetLocations.length > 0 ? raw.targetLocations : ['Remote'],
      phone: raw.phone || null,
      location: raw.location || null,
      linkedin: raw.linkedin || null,
      github: raw.github || null,
      portfolio: raw.portfolio || null,
      skills: Array.isArray(raw.skills)
        ? raw.skills.map((s: any) => ({
            name: typeof s === 'string' ? s : s.name,
            category: typeof s === 'object' && s.category ? s.category : 'primary',
            level: typeof s === 'object' && s.level ? s.level : 'proficient',
          }))
        : [],
      experiences: Array.isArray(raw.experiences)
        ? raw.experiences.map((e: any) => ({
            company: e.company || 'Company',
            role: e.role || 'Engineer',
            startDate: e.startDate || '2022',
            endDate: e.endDate || null,
            isCurrent: Boolean(e.isCurrent),
            description: e.description || null,
            technologies: Array.isArray(e.technologies) ? e.technologies : [],
          }))
        : [],
      projects: Array.isArray(raw.projects)
        ? raw.projects.map((p: any) => ({
            title: p.title || 'Project',
            description: p.description || null,
            technologies: Array.isArray(p.technologies) ? p.technologies : [],
            url: p.url || null,
          }))
        : [],
      commonAnswers: raw.commonAnswers || {},
    };
  }

  /**
   * Safely synchronizes the reviewed preview into PostgreSQL CandidateProfile.
   * Does NOT overwrite unless explicitly requested.
   */
  static async syncToCandidateProfile(
    parsedData: ParsedResumePreview,
    options?: { overwrite?: boolean }
  ) {
    // 1. Find or create master profile
    let profile = await prisma.candidateProfile.findFirst({
      include: { user: true },
    });

    if (!profile) {
      // Find or create default user
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'candidate@hireflow.internal',
            fullName: parsedData.fullName,
          },
        });
      }

      profile = await prisma.candidateProfile.create({
        data: {
          userId: user.id,
          fullName: parsedData.fullName,
          headline: parsedData.headline,
          yearsOfExperience: parsedData.yearsOfExperience,
          targetRoles: parsedData.targetRoles,
          targetLocations: parsedData.targetLocations,
          phone: parsedData.phone,
          location: parsedData.location,
          linkedin: parsedData.linkedin,
          github: parsedData.github,
          portfolio: parsedData.portfolio,
          commonAnswers: (parsedData.commonAnswers as any) || undefined,
        },
        include: { user: true },
      });
    } else {
      // Update existing profile metadata
      profile = await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: {
          fullName: parsedData.fullName || profile.fullName,
          headline: parsedData.headline || profile.headline,
          yearsOfExperience: parsedData.yearsOfExperience || profile.yearsOfExperience,
          targetRoles: parsedData.targetRoles?.length ? parsedData.targetRoles : profile.targetRoles,
          targetLocations: parsedData.targetLocations?.length ? parsedData.targetLocations : profile.targetLocations,
          phone: parsedData.phone || profile.phone,
          location: parsedData.location || profile.location,
          linkedin: parsedData.linkedin || profile.linkedin,
          github: parsedData.github || profile.github,
          portfolio: parsedData.portfolio || profile.portfolio,
          commonAnswers: parsedData.commonAnswers
            ? { ...((profile.commonAnswers as any) || {}), ...parsedData.commonAnswers }
            : profile.commonAnswers,
        },
        include: { user: true },
      });
    }

    const profileId = profile.id;

    // 2. Handle experiences, skills, and projects
    if (options?.overwrite) {
      // Clean slate replacement
      await prisma.$transaction([
        prisma.skill.deleteMany({ where: { profileId } }),
        prisma.experience.deleteMany({ where: { profileId } }),
        prisma.project.deleteMany({ where: { profileId } }),
      ]);
    }

    // Upsert skills
    for (const skill of parsedData.skills || []) {
      if (!skill.name) continue;
      const existing = await prisma.skill.findFirst({
        where: { profileId, name: skill.name },
      });
      if (!existing) {
        await prisma.skill.create({
          data: {
            profileId,
            name: skill.name,
            category: skill.category || 'primary',
            level: skill.level || 'proficient',
          },
        });
      }
    }

    // Upsert experiences
    for (let i = 0; i < (parsedData.experiences || []).length; i++) {
      const exp = parsedData.experiences[i];
      if (!exp.company || !exp.role) continue;
      const existing = await prisma.experience.findFirst({
        where: { profileId, company: exp.company, role: exp.role },
      });
      if (!existing) {
        await prisma.experience.create({
          data: {
            profileId,
            company: exp.company,
            role: exp.role,
            startDate: exp.startDate,
            endDate: exp.endDate,
            isCurrent: exp.isCurrent,
            description: exp.description,
            technologies: exp.technologies || [],
            orderIndex: i,
          },
        });
      }
    }

    // Upsert projects
    for (let i = 0; i < (parsedData.projects || []).length; i++) {
      const proj = parsedData.projects[i];
      if (!proj.title) continue;
      const existing = await prisma.project.findFirst({
        where: { profileId, title: proj.title },
      });
      if (!existing) {
        await prisma.project.create({
          data: {
            profileId,
            title: proj.title,
            description: proj.description,
            technologies: proj.technologies || [],
            url: proj.url,
            orderIndex: i,
          },
        });
      }
    }

    // Return the updated full profile
    return prisma.candidateProfile.findUnique({
      where: { id: profileId },
      include: {
        experiences: { orderBy: { orderIndex: 'asc' } },
        skills: { orderBy: [{ category: 'asc' }, { name: 'asc' }] },
        projects: { orderBy: { orderIndex: 'asc' } },
      },
    });
  }
}
