import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

// Using a singleton for Groq client
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Models
const FAST_MODEL = 'llama-3.1-8b-instant';
const STRONG_MODEL = 'llama-3.3-70b-versatile';

export class LlmService {
  private static getPrompt(filename: string): string {
    const promptPath = path.join(process.cwd(), '..', '..', 'prompts', filename);
    return fs.readFileSync(promptPath, 'utf8');
  }

  /**
   * Evaluates screening questions using Groq and the screening prompt.
   */
  static async analyzeScreeningQuestions(questions: string[]): Promise<Array<{ question: string; requiresUserInput: boolean; suggestedAnswer: string }>> {
    if (!groq) throw new Error('Groq SDK not configured (Missing GROQ_API_KEY).');
    
    const basePrompt = this.getPrompt('screening-questions.md');
    
    const systemPrompt = `
${basePrompt}

CRITICAL JSON REQUIREMENT:
You must return the response as a strict JSON object containing a "results" array.
For each question, output an object in the array with exactly three keys:
- "question": (string) the original question
- "requiresUserInput": (boolean) exactly true or false based on the rules.
- "suggestedAnswer": (string) your formulated answer, or empty string "" if requiresUserInput is true.
Do not include markdown codeblocks, only output the JSON object.
`;

    const userMessage = `Here are the screening questions to evaluate:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: FAST_MODEL,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    return parsed.results || [];
  }

  /**
   * Generates tailored CV content
   */
  static async generateTailoredCv(jobDescription: string, isLaravel: boolean, isNode: boolean): Promise<any> {
    if (!groq) throw new Error('Groq SDK not configured.');

    const basePrompt = this.getPrompt('resume-generation.md');
    
    const systemPrompt = `
${basePrompt}

CRITICAL JSON REQUIREMENT:
You must return the response as a strict JSON object conforming to this TypeScript interface:
interface TailoredCvData {
  targetRole: string; // The tailored title for this job
  summary: string; // 3-4 sentence summary
  primarySkills: string[];
  additionalSkills: string[];
  experiences: Array<{
    company: string;
    role: string;
    period: string;
    isCurrent: boolean;
    summary: string;
    bullets: string[];
    technologies: string[];
  }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
}

Ensure all dates match the Ground Truth strictly. Do not invent any companies.
`;

    const userMessage = `Here is the target job description to tailor the CV for:\n\n${jobDescription}\n\nIs this a Laravel role? ${isLaravel}. Is this a Node.js role? ${isNode}. Tailor accordingly.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: STRONG_MODEL,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  }

  /**
   * Generates cover letter
   */
  static async generateCoverLetter(jobDescription: string, companyName: string): Promise<{ subject: string; body: string }> {
    if (!groq) throw new Error('Groq SDK not configured.');

    const basePrompt = this.getPrompt('cover-letter.md');

    const systemPrompt = `
${basePrompt}

CRITICAL JSON REQUIREMENT:
You must return the response as a strict JSON object with exactly two keys:
- "subject": (string) the subject line of the cover letter.
- "body": (string) the full multi-paragraph cover letter body text, using line breaks (\\n\\n) for paragraphs.
`;

    const userMessage = `Write a cover letter for the following job at ${companyName}:\n\n${jobDescription}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: STRONG_MODEL,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  }
}
