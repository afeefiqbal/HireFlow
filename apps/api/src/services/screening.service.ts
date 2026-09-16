import { PrismaClient } from '@prisma/client';
import { ScreeningQuestionItem } from '@ai-job-agent/shared';
import { AiService } from '../ai/ai.service';

const prisma = new PrismaClient();

export class ScreeningService {
  /**
   * Analyzes screening questions, detecting which questions require explicit user input
   * vs. which questions can be answered with high confidence from Candidate Ground Truth.
   */
  static async analyzeScreeningQuestions(jobId: string, rawQuestions?: string[] | string): Promise<ScreeningQuestionItem[]> {
    let questionsList: string[] = [];

    if (!rawQuestions) {
      // Look up in job
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });
      if (!job) throw new Error(`Job not found: ${jobId}`);

      // Parse questions from description if we didn't have them
      // This is a naive split for MVP. In reality, the ATS adapter provides this.
      const lines = job.description.split('\n');
      questionsList = lines.filter((l) => l.includes('?') && l.length < 200).slice(0, 5);
    } else if (typeof rawQuestions === 'string') {
      questionsList = [rawQuestions];
    } else {
      questionsList = rawQuestions;
    }

    if (questionsList.length === 0) {
      // Default questions if none found
      questionsList = [
        'How many years of professional software development experience do you have?',
        'Describe your hands-on experience with relational databases and query optimization.',
        'Will you now or in the future require visa sponsorship to work in the target location?',
        'What is your expected annual salary for this role?',
        'What is your current notice period or earliest availability date?',
      ];
    }

    const profile = await prisma.candidateProfile.findFirst({
      include: {
        experiences: { orderBy: { orderIndex: 'asc' } },
        projects: { orderBy: { orderIndex: 'asc' } },
        skills: true,
      },
    });

    if (!profile) throw new Error('Candidate profile not found');

    // If rawQuestions was explicitly provided (e.g. user requested regeneration or added custom), bypass cache
    const isExplicitRequest = !!rawQuestions;

    // ---------------------------------------------------------
    // Groq LLM Dynamic Evaluation via AiService
    // ---------------------------------------------------------
    const llmResults = await AiService.answerScreeningQuestions(jobId, questionsList, profile, isExplicitRequest);
    const results: ScreeningQuestionItem[] = [];

    for (const res of llmResults) {
      const q = res.question;
      const requiresUserInput = res.requiresUserInput;
      const suggestedAnswer = res.suggestedAnswer;

      let confidence: 'high' | 'medium' | 'low' = requiresUserInput ? 'low' : 'high';
      let source = requiresUserInput ? 'User Input Required' : 'Candidate Ground Truth';

      // Find if this question already exists for this job to update instead of duplicate
      const existing = await prisma.screeningQuestion.findFirst({
        where: { jobId, question: q }
      });

      let record;
      if (existing) {
        record = await prisma.screeningQuestion.update({
          where: { id: existing.id },
          data: {
            suggestedAnswer,
            confidence,
            source,
            requiresUserInput,
            // If regenerating, we might want to clear the userAnswer so they see the new suggestion
            // or we could keep it. We'll keep it if it's there.
          },
        });
      } else {
        record = await prisma.screeningQuestion.create({
          data: {
            jobId,
            question: q,
            suggestedAnswer,
            confidence,
            source,
            requiresUserInput,
            userAnswer: null,
          },
        });
      }

      results.push({
        id: record.id,
        jobId,
        question: record.question,
        suggestedAnswer: record.suggestedAnswer,
        confidence,
        source,
        requiresUserInput,
        userAnswer: record.userAnswer,
        createdAt: record.createdAt.toISOString(),
      });
    }

    // Update ApplicationPreparation checklist
    const pendingCount = results.filter((r) => r.requiresUserInput && !r.userAnswer).length;
    await prisma.applicationPreparation.upsert({
      where: { jobId },
      create: {
        jobId,
        screeningInputNeeded: pendingCount,
        screeningTotalCount: results.length,
      },
      update: {
        screeningInputNeeded: pendingCount,
        screeningTotalCount: results.length,
      },
    });

    return results;
  }

  static async getScreeningQuestions(jobId: string): Promise<ScreeningQuestionItem[]> {
    const questions = await prisma.screeningQuestion.findMany({
      where: { jobId },
      orderBy: [{ requiresUserInput: 'desc' }, { createdAt: 'asc' }],
    });

    if (questions.length === 0) {
      // Auto-analyze initial screening questions
      return this.analyzeScreeningQuestions(jobId);
    }

    return questions.map((q) => ({
      id: q.id,
      jobId: q.jobId,
      question: q.question,
      suggestedAnswer: q.suggestedAnswer,
      confidence: q.confidence as 'high' | 'medium' | 'low',
      source: q.source,
      requiresUserInput: q.requiresUserInput,
      userAnswer: q.userAnswer,
      createdAt: q.createdAt.toISOString(),
    }));
  }

  static async answerScreeningQuestion(id: string, answer: string): Promise<ScreeningQuestionItem> {
    const updated = await prisma.screeningQuestion.update({
      where: { id },
      data: { userAnswer: answer },
    });

    // Update ApplicationPreparation pending count
    const pendingCount = await prisma.screeningQuestion.count({
      where: {
        jobId: updated.jobId,
        requiresUserInput: true,
        userAnswer: null,
      },
    });

    await prisma.applicationPreparation.upsert({
      where: { jobId: updated.jobId },
      create: {
        jobId: updated.jobId,
        screeningInputNeeded: pendingCount,
      },
      update: {
        screeningInputNeeded: pendingCount,
      },
    });

    return {
      id: updated.id,
      jobId: updated.jobId,
      question: updated.question,
      suggestedAnswer: updated.suggestedAnswer,
      confidence: updated.confidence as 'high' | 'medium' | 'low',
      source: updated.source,
      requiresUserInput: updated.requiresUserInput,
      userAnswer: updated.userAnswer,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
