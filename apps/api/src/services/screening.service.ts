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

    const commonAnswers = (profile.commonAnswers as any) || {
      visaSponsorship: 'Yes, I will require visa sponsorship (EU Blue Card / work visa for Germany & EU).',
      workAuthorization: 'Indian citizen. Requires visa sponsorship / EU Blue Card for legal authorization in Europe.',
      noticePeriod: '30 days / 1 month notice period.',
      expectedSalary: '€75,000 – €85,000 gross per year (negotiable based on location & equity).',
      relocation: 'Yes, fully prepared and eager to relocate to Germany, Netherlands, or across the EU.',
    };

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

      // Deterministic check against Candidate Common Answers Bank
      const matchedBank = ScreeningService.matchCommonAnswer(q, commonAnswers);

      // Find if this question already exists for this job to update instead of duplicate
      const existing = await prisma.screeningQuestion.findFirst({
        where: { jobId, question: q }
      });

      let initialUserAnswer = existing?.userAnswer || null;
      if (!initialUserAnswer && matchedBank && requiresUserInput) {
        initialUserAnswer = matchedBank.answer;
        source = 'User Provided (Common Bank)';
        confidence = 'high';
      }

      let record;
      if (existing) {
        record = await prisma.screeningQuestion.update({
          where: { id: existing.id },
          data: {
            suggestedAnswer,
            confidence: initialUserAnswer ? 'high' : confidence,
            source: initialUserAnswer && !existing.userAnswer ? 'User Provided (Common Bank)' : source,
            requiresUserInput,
            userAnswer: initialUserAnswer,
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
            userAnswer: initialUserAnswer,
          },
        });
      }

      results.push({
        id: record.id,
        jobId,
        question: record.question,
        suggestedAnswer: record.suggestedAnswer,
        confidence,
        source: record.source,
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

  /**
   * Deterministically matches question patterns against Common Answers Bank
   */
  static matchCommonAnswer(question: string, bank: any): { answer: string; category: string } | null {
    if (!bank) return null;
    const qLower = question.toLowerCase();

    // 1. Visa Sponsorship
    if (bank.visaSponsorship && (
      qLower.includes('visa') || 
      qLower.includes('sponsor') || 
      qLower.includes('work permit') ||
      (qLower.includes('authorized') && qLower.includes('sponsor'))
    )) {
      return { answer: bank.visaSponsorship, category: 'Visa Sponsorship' };
    }

    // 2. Work Authorization / Legal Right to Work
    if (bank.workAuthorization && (
      qLower.includes('legally authorized') || 
      qLower.includes('work authorization') || 
      qLower.includes('legal right to work') ||
      qLower.includes('eligible to work')
    )) {
      return { answer: bank.workAuthorization, category: 'Work Authorization' };
    }

    // 3. Notice Period / Availability
    if (bank.noticePeriod && (
      qLower.includes('notice period') || 
      qLower.includes('earliest start') || 
      qLower.includes('earliest availability') || 
      qLower.includes('start date') ||
      qLower.includes('availability')
    )) {
      return { answer: bank.noticePeriod, category: 'Notice Period' };
    }

    // 4. Expected Salary / Compensation
    if (bank.expectedSalary && (
      qLower.includes('salary') || 
      qLower.includes('compensation') || 
      qLower.includes('remuneration') || 
      qLower.includes('desired pay') ||
      qLower.includes('expected annual')
    )) {
      return { answer: bank.expectedSalary, category: 'Salary Expectations' };
    }

    // 5. Relocation
    if (bank.relocation && (
      qLower.includes('relocat') || 
      qLower.includes('willing to move') || 
      qLower.includes('open to move')
    )) {
      return { answer: bank.relocation, category: 'Relocation Readiness' };
    }

    return null;
  }

  static async syncCommonAnswersForJob(jobId: string): Promise<ScreeningQuestionItem[]> {
    const profile = await prisma.candidateProfile.findFirst();
    const commonAnswers = (profile?.commonAnswers as any) || {
      visaSponsorship: 'Yes, I will require visa sponsorship (EU Blue Card / work visa for Germany & EU).',
      workAuthorization: 'Indian citizen. Requires visa sponsorship / EU Blue Card for legal authorization in Europe.',
      noticePeriod: '30 days / 1 month notice period.',
      expectedSalary: '€75,000 – €85,000 gross per year (negotiable based on location & equity).',
      relocation: 'Yes, fully prepared and eager to relocate to Germany, Netherlands, or across the EU.',
    };

    const questions = await prisma.screeningQuestion.findMany({ where: { jobId } });

    for (const q of questions) {
      if (q.requiresUserInput && !q.userAnswer) {
        const matched = ScreeningService.matchCommonAnswer(q.question, commonAnswers);
        if (matched) {
          await prisma.screeningQuestion.update({
            where: { id: q.id },
            data: {
              userAnswer: matched.answer,
              source: 'User Provided (Common Bank)',
              confidence: 'high',
            },
          });
        }
      }
    }

    return this.getScreeningQuestions(jobId);
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

    // Auto-fill any unanswered sensitive questions using candidate common bank
    const profile = await prisma.candidateProfile.findFirst();
    const commonAnswers = (profile?.commonAnswers as any) || {
      visaSponsorship: 'Yes, I will require visa sponsorship (EU Blue Card / work visa for Germany & EU).',
      workAuthorization: 'Indian citizen. Requires visa sponsorship / EU Blue Card for legal authorization in Europe.',
      noticePeriod: '30 days / 1 month notice period.',
      expectedSalary: '€75,000 – €85,000 gross per year (negotiable based on location & equity).',
      relocation: 'Yes, fully prepared and eager to relocate to Germany, Netherlands, or across the EU.',
    };

    let updatedAny = false;
    for (const q of questions) {
      if (q.requiresUserInput && !q.userAnswer) {
        const matched = ScreeningService.matchCommonAnswer(q.question, commonAnswers);
        if (matched) {
          q.userAnswer = matched.answer;
          q.source = 'User Provided (Common Bank)';
          q.confidence = 'high';
          await prisma.screeningQuestion.update({
            where: { id: q.id },
            data: {
              userAnswer: matched.answer,
              source: 'User Provided (Common Bank)',
              confidence: 'high',
            },
          });
          updatedAny = true;
        }
      }
    }

    if (updatedAny) {
      const pendingCount = questions.filter((q) => q.requiresUserInput && !q.userAnswer).length;
      await prisma.applicationPreparation.upsert({
        where: { jobId },
        create: {
          jobId,
          screeningInputNeeded: pendingCount,
          screeningTotalCount: questions.length,
        },
        update: {
          screeningInputNeeded: pendingCount,
          screeningTotalCount: questions.length,
        },
      });
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
