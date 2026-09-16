import { AIProvider } from '../ai.types';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import { CandidateContextBuilder } from '../candidate-context.builder';

export class GroqProvider implements AIProvider {
  private client: Groq | null = null;

  getName(): string {
    return 'Groq';
  }

  init(): void {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing');
    }
    this.client = new Groq({ apiKey });
  }

  private getPrompt(filename: string): string {
    const promptPath = path.join(process.cwd(), 'prompts', filename);
    return fs.readFileSync(promptPath, 'utf8');
  }

  async analyzeJob(jobDescription: string, candidateProfile: any): Promise<any> {
    if (!this.client) throw new Error('Provider not initialized');
    
    // Check if it's a classification or a match based on the presence of candidateProfile?
    // Actually, analyzeJob uses the candidateProfile to do Matching. So it's JOB_MATCHING.
    const contextStr = CandidateContextBuilder.buildContextForTask('JOB_MATCHING', candidateProfile, jobDescription);
    console.log(`[GroqProvider] analyzeJob Context Estimate: ~${Math.ceil(contextStr.length / 4)} tokens`);

    const systemPrompt = `
You are an AI Job Quality & Compatibility Analyzer. 
You must output STRICT JSON.
Never invent candidate facts.
Candidate Profile Context:
${contextStr}

SCHEMA REQUIRED:
{
  "role_type": "string",
  "seniority": "string",
  "required_skills": ["string"],
  "preferred_skills": ["string"],
  "years_required": number,
  "location_type": "string",
  "visa": { "sponsorship": "UNKNOWN|OFFERED|NOT_OFFERED", "relocation": boolean },
  "language": { "english": boolean },
  "salary": { "min": number | null, "max": number | null, "currency": "string", "period": "string" },
  "match_analysis": {
    "technical_score": number, // MUST be an integer between 0 and 100.
    "missing_requirements": ["string"],
    "concerns": ["string"],
    "reasoning": ["string"],
    "recommendation": "APPLY|REVIEW|SKIP"
  }
}
`;

    const completion = await this.client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: jobDescription }
      ],
      model: process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b',
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    // Normalize technical score to 0-100 range if it appears to be 0-10
    if (parsed.match_analysis && typeof parsed.match_analysis.technical_score === 'number') {
      if (parsed.match_analysis.technical_score <= 10 && parsed.match_analysis.technical_score > 0) {
        // Assume it was evaluated on a 0-10 scale
        parsed.match_analysis.technical_score = parsed.match_analysis.technical_score * 10;
      }
    }
    
    return parsed;
  }

  async generateResume(jobDescription: string, candidateProfile: any): Promise<any> {
    if (!this.client) throw new Error('Provider not initialized');
    
    const contextStr = CandidateContextBuilder.buildContextForTask('RESUME_GENERATION', candidateProfile, jobDescription);
    console.log(`[GroqProvider] generateResume Context Estimate: ~${Math.ceil(contextStr.length / 4)} tokens`);

    const basePrompt = this.getPrompt('resume-generation.md');
    const systemPrompt = `
${basePrompt}

CRITICAL JSON REQUIREMENT:
You must return the response as a strict JSON object conforming to this TypeScript interface:
interface TailoredCvData {
  targetRole: string;
  summary: string;
  primarySkills: string[];
  additionalSkills: string[];
  experiences: Array<{
    company: string;
    role: string;
    period: string;
    isCurrent: boolean;
    summary: string;
    bullets: Array<{
      text: string;
      evidence: {
        status: "DIRECT" | "PARTIAL" | "NOT_VERIFIED";
        sourceCompany: string | null;
        matchedTech: string[];
      };
    }>;
    technologies: string[];
  }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
}
Never invent qualifications.
You may reorder, summarize, rephrase, or emphasize verified experience.
You may NOT invent technologies, employers, projects, achievements, metrics, certifications, education, or responsibilities.
If relevant evidence does not exist for a requirement, state the lack of evidence. Do NOT guess.
Candidate Profile Context:
${contextStr}

You MUST output ONLY valid JSON matching the schema. No markdown, no explanations.
`;
    const completion = await this.client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: jobDescription }
      ],
      model: process.env.GROQ_SMART_MODEL || 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' },
    });
    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  }

  async generateCoverLetter(jobDescription: string, companyName: string, candidateProfile: any): Promise<{ subject: string; body: string }> {
    if (!this.client) throw new Error('Provider not initialized');
    
    const contextStr = CandidateContextBuilder.buildContextForTask('COVER_LETTER', candidateProfile, jobDescription);
    console.log(`[GroqProvider] generateCoverLetter Context Estimate: ~${Math.ceil(contextStr.length / 4)} tokens`);

    const basePrompt = this.getPrompt('cover-letter.md');
    
    const systemPrompt = `
${basePrompt}

CRITICAL RULES:
1. Output strict JSON with exactly two keys: "subject" and "body".
2. NEVER invent facts, metrics, scale, users, responsibilities, or technologies.
3. You are restricted ONLY to the facts explicitly provided in the Candidate Profile Context below.
4. If a fact is not in the context, do NOT write about it. Do NOT guess or infer.

Candidate Profile Context (GROUND TRUTH):
${contextStr}
`;
    const completion = await this.client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Write a cover letter for ${companyName} for the following job description.\n\nREMINDER: You are strictly forbidden from inventing metrics, responsibilities, or scale. Use ONLY the provided Ground Truth context to match the Job Description.\n\nJob Description: ${jobDescription}` }
      ],
      model: process.env.GROQ_SMART_MODEL || 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' },
    });
    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  }

  async answerScreeningQuestions(questions: string[], candidateProfile: any): Promise<Array<{ question: string; requiresUserInput: boolean; suggestedAnswer: string }>> {
    if (!this.client) throw new Error('Provider not initialized');
    
    const questionsText = questions.join('\n');
    const contextStr = CandidateContextBuilder.buildContextForTask('SCREENING_QUESTION', candidateProfile, questionsText);
    console.log(`[GroqProvider] answerScreeningQuestions Context Estimate: ~${Math.ceil(contextStr.length / 4)} tokens`);

    const basePrompt = this.getPrompt('screening-questions.md');
    
    const systemPrompt = `
${basePrompt}

CRITICAL JSON REQUIREMENT:
You must return a JSON object containing a "results" array.
For each question, output an object:
- "question": string
- "requiresUserInput": boolean
- "suggestedAnswer": string (empty if requiresUserInput=true)
Candidate Profile Context:
${contextStr}
`;
    const userMessage = JSON.stringify({ questions });
    const completion = await this.client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b',
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return parsed.results || [];
  }
}
