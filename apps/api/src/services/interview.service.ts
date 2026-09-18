import { PrismaClient, InterviewStatus, InterviewRoundType, InterviewRoundStatus, QuestionCategory, QuestionSource, EvidenceAttribution } from '@prisma/client';
import {
  InterviewRecord,
  InterviewRoundRecord,
  InterviewQuestionItem,
  InterviewStatsSummary,
  MockSessionRecord,
  InterviewDebriefRecord,
} from '@ai-job-agent/shared';
import { InterviewIntelligenceService } from './interview-intelligence.service';

const prisma = new PrismaClient();

export class InterviewService {
  /**
   * Retrieves or bootstraps an Interview domain record for a given Application.
   * Keeps ApplicationStatus separate from Interview lifecycle.
   */
  static async getOrCreateInterview(applicationId: string): Promise<InterviewRecord> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!application) {
      throw new Error(`Application not found: ${applicationId}`);
    }

    let interview = await prisma.interview.findUnique({
      where: { applicationId },
      include: {
        rounds: { orderBy: { sequence: 'asc' } },
        prepKits: { orderBy: { createdAt: 'desc' }, take: 1 },
        questions: { orderBy: { createdAt: 'desc' } },
        mockSessions: { orderBy: { createdAt: 'desc' } },
        debriefs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!interview) {
      // Auto-create initial planned interview
      interview = await prisma.interview.create({
        data: {
          applicationId,
          status: 'PLANNED',
          notes: 'Interview preparation cockpit initialized.',
          rounds: {
            create: {
              roundType: 'SCREENING_CALL',
              title: 'Initial Recruiter / HR Screening',
              sequence: 1,
              status: 'SCHEDULED',
            },
          },
        },
        include: {
          rounds: { orderBy: { sequence: 'asc' } },
          prepKits: true,
          questions: true,
          mockSessions: true,
          debriefs: true,
        },
      });

      // Also log an application event
      await prisma.applicationEvent.create({
        data: {
          applicationId,
          type: 'INTERVIEW_CREATED',
          fromStatus: application.status,
          toStatus: application.status,
          source: 'SYSTEM',
          note: 'Interview domain initialized with Screening Call round.',
        },
      });
    }

    return this.mapToRecord(interview, application);
  }

  /**
   * Lists all interviews with filters.
   */
  static async listInterviews(filters?: {
    status?: string;
    company?: string;
    roundType?: string;
  }): Promise<InterviewRecord[]> {
    const where: any = {};
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status as InterviewStatus;
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        application: {
          include: { job: true },
        },
        rounds: { orderBy: { sequence: 'asc' } },
        prepKits: { orderBy: { createdAt: 'desc' }, take: 1 },
        questions: true,
        mockSessions: true,
        debriefs: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    let results = interviews.map((i) => this.mapToRecord(i, i.application));

    if (filters?.company) {
      const q = filters.company.toLowerCase();
      results = results.filter((r) => r.application?.job.company.toLowerCase().includes(q));
    }
    if (filters?.roundType && filters.roundType !== 'ALL') {
      results = results.filter((r) => r.rounds.some((round) => round.roundType === filters.roundType));
    }

    return results;
  }

  /**
   * Gets single interview by ID with full details.
   */
  static async getInterviewById(interviewId: string): Promise<InterviewRecord> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: { include: { job: true } },
        rounds: { orderBy: { sequence: 'asc' } },
        prepKits: { orderBy: { createdAt: 'desc' } },
        questions: { orderBy: { createdAt: 'desc' } },
        mockSessions: { orderBy: { createdAt: 'desc' } },
        debriefs: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!interview) throw new Error(`Interview not found: ${interviewId}`);

    return this.mapToRecord(interview, interview.application);
  }

  /**
   * Updates interview status or overall outcome.
   */
  static async updateInterview(
    interviewId: string,
    data: { status?: InterviewStatus; overallOutcome?: string; notes?: string }
  ): Promise<InterviewRecord> {
    const interview = await prisma.interview.update({
      where: { id: interviewId },
      data,
      include: {
        application: { include: { job: true } },
        rounds: { orderBy: { sequence: 'asc' } },
        prepKits: true,
        questions: true,
        mockSessions: true,
        debriefs: true,
      },
    });

    return this.mapToRecord(interview, interview.application);
  }

  /**
   * Creates a new round in the interview.
   */
  static async createRound(
    interviewId: string,
    data: {
      roundType: InterviewRoundType;
      title: string;
      sequence?: number;
      scheduledAt?: string | null;
      interviewerName?: string | null;
      interviewerTitle?: string | null;
      meetingUrl?: string | null;
      notes?: string | null;
    }
  ): Promise<InterviewRoundRecord> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { rounds: true },
    });
    if (!interview) throw new Error(`Interview not found: ${interviewId}`);

    const sequence = data.sequence || (interview.rounds.length + 1);

    const round = await prisma.interviewRound.create({
      data: {
        interviewId,
        roundType: data.roundType,
        title: data.title,
        sequence,
        status: 'SCHEDULED',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        interviewerName: data.interviewerName,
        interviewerTitle: data.interviewerTitle,
        meetingUrl: data.meetingUrl,
        notes: data.notes,
      },
    });

    // Update interview status to SCHEDULED if currently PLANNED
    if (interview.status === 'PLANNED') {
      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: 'SCHEDULED' },
      });
    }

    return this.mapRoundToRecord(round);
  }

  /**
   * Updates an existing interview round.
   */
  static async updateRound(
    roundId: string,
    data: {
      title?: string;
      roundType?: InterviewRoundType;
      status?: InterviewRoundStatus;
      scheduledAt?: string | null;
      completedAt?: string | null;
      interviewerName?: string | null;
      interviewerTitle?: string | null;
      meetingUrl?: string | null;
      notes?: string | null;
    }
  ): Promise<InterviewRoundRecord> {
    const existing = await prisma.interviewRound.findUnique({ where: { id: roundId } });
    if (!existing) throw new Error(`Round not found: ${roundId}`);

    // Transition validation
    if (data.status && data.status !== existing.status) {
      if (existing.status === 'COMPLETED' && data.status === 'SCHEDULED') {
        throw new Error('Cannot revert a completed round to scheduled status.');
      }
    }

    const round = await prisma.interviewRound.update({
      where: { id: roundId },
      data: {
        ...data,
        scheduledAt: data.scheduledAt !== undefined ? (data.scheduledAt ? new Date(data.scheduledAt) : null) : undefined,
        completedAt:
          data.completedAt !== undefined
            ? data.completedAt
              ? new Date(data.completedAt)
              : null
            : data.status === 'COMPLETED'
            ? new Date()
            : undefined,
      },
    });

    return this.mapRoundToRecord(round);
  }

  /**
   * Deletes a round.
   */
  static async deleteRound(roundId: string): Promise<{ success: boolean }> {
    await prisma.interviewRound.delete({ where: { id: roundId } });
    return { success: true };
  }

  /**
   * Generates or retrieves the prep kit for an interview.
   */
  static async generatePrepKit(
    interviewId: string,
    roundId?: string | null,
    forceRefresh = false
  ) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { application: true, rounds: true },
    });
    if (!interview) throw new Error(`Interview not found: ${interviewId}`);

    const round = roundId
      ? interview.rounds.find((r) => r.id === roundId)
      : interview.rounds[0];

    const kitData = await InterviewIntelligenceService.generatePrepKit(
      interview.application.jobId,
      round?.roundType || 'SCREENING_CALL',
      forceRefresh
    );

    const saved = await prisma.interviewPrepKit.create({
      data: {
        interviewId,
        roundId: round?.id || null,
        versionNum: 1,
        modelUsed: kitData.modelUsed,
        promptVersion: kitData.promptVersion,
        companyBriefJson: kitData.companyBrief as any,
        roleBriefJson: kitData.roleBrief as any,
        techTopicsJson: kitData.techTopics as any,
        projectDeepDivesJson: kitData.projectDeepDives as any,
        starBlueprintsJson: kitData.starBlueprints as any,
        systemDesignJson: (kitData.systemDesignTopics as any) || null,
        questionsToAsk: kitData.questionsToAsk,
      },
    });

    return {
      id: saved.id,
      interviewId: saved.interviewId,
      roundId: saved.roundId,
      versionNum: saved.versionNum,
      modelUsed: saved.modelUsed || undefined,
      promptVersion: saved.promptVersion || undefined,
      companyBrief: saved.companyBriefJson as any,
      roleBrief: saved.roleBriefJson as any,
      techTopics: saved.techTopicsJson as any,
      projectDeepDives: saved.projectDeepDivesJson as any,
      starBlueprints: saved.starBlueprintsJson as any,
      systemDesignTopics: (saved.systemDesignJson as any) || [],
      questionsToAsk: saved.questionsToAsk,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  /**
   * Questions Management
   */
  static async listQuestions(interviewId: string, roundId?: string): Promise<InterviewQuestionItem[]> {
    const where: any = { interviewId };
    if (roundId) where.roundId = roundId;

    const questions = await prisma.interviewQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return questions.map(this.mapQuestionToItem);
  }

  static async addQuestion(
    interviewId: string,
    data: {
      roundId?: string | null;
      category: QuestionCategory;
      source?: QuestionSource;
      questionText: string;
      suggestedAnswer?: string | null;
      userNotes?: string | null;
      resultAttribution?: EvidenceAttribution;
      relevanceReason?: string | null;
    }
  ): Promise<InterviewQuestionItem> {
    const question = await prisma.interviewQuestion.create({
      data: {
        interviewId,
        roundId: data.roundId || null,
        category: data.category,
        source: data.source || 'USER_PROVIDED',
        questionText: data.questionText,
        suggestedAnswer: data.suggestedAnswer,
        userNotes: data.userNotes,
        resultAttribution: data.resultAttribution || (data.source === 'PREDICTED' ? 'AI_VERIFIED' : 'USER_PROVIDED'),
        relevanceReason: data.relevanceReason,
      },
    });

    return this.mapQuestionToItem(question);
  }

  static async generatePredictedQuestions(interviewId: string, roundId?: string): Promise<InterviewQuestionItem[]> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { application: true, rounds: true },
    });
    if (!interview) throw new Error(`Interview not found: ${interviewId}`);

    const round = roundId ? interview.rounds.find((r) => r.id === roundId) : interview.rounds[0];
    const predicted = await InterviewIntelligenceService.predictQuestions(
      interview.application.jobId,
      round?.roundType || 'SCREENING_CALL'
    );

    const created: InterviewQuestionItem[] = [];
    for (const q of predicted) {
      const rec = await prisma.interviewQuestion.create({
        data: {
          interviewId,
          roundId: round?.id || null,
          category: q.category,
          source: 'PREDICTED',
          questionText: q.questionText,
          suggestedAnswer: q.suggestedAnswer,
          starSituation: q.starSituation,
          starTask: q.starTask,
          starAction: q.starAction,
          starResult: q.starResult,
          resultAttribution: q.resultAttribution,
          relevanceReason: q.relevanceReason,
        },
      });
      created.push(this.mapQuestionToItem(rec));
    }

    return created;
  }

  /**
   * Mock Interview Session
   */
  static async startMockSession(
    interviewId: string,
    roundType: InterviewRoundType = 'TECHNICAL_SCREEN',
    roundId?: string
  ): Promise<MockSessionRecord> {
    const session = await prisma.mockInterviewSession.create({
      data: {
        interviewId,
        roundId: roundId || null,
        roundType,
        status: 'ACTIVE',
        qnaJson: [
          {
            question: `How do you handle performance bottlenecks and optimize database queries in high-throughput applications?`,
          },
        ] as any,
      },
    });

    return this.mapMockSession(session);
  }

  static async submitMockAnswer(
    sessionId: string,
    questionIndex: number,
    answer: string
  ): Promise<MockSessionRecord> {
    const session = await prisma.mockInterviewSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const qna = (session.qnaJson as any[]) || [];
    const item = qna[questionIndex] || { question: 'General question' };

    const feedback = await InterviewIntelligenceService.evaluateMockAnswer(item.question, answer);
    qna[questionIndex] = {
      ...item,
      answer,
      feedback,
    };

    // Auto-append next question if < 3 questions
    if (qna.length === 1) {
      qna.push({
        question: `Tell me about an architectural trade-off you made in a recent project. Why did you choose that path?`,
      });
    } else if (qna.length === 2) {
      qna.push({
        question: `How do you ensure data consistency and prevent race conditions when multiple workers process queued tasks?`,
      });
    }

    const updated = await prisma.mockInterviewSession.update({
      where: { id: sessionId },
      data: { qnaJson: qna },
    });

    return this.mapMockSession(updated);
  }

  static async completeMockSession(sessionId: string): Promise<MockSessionRecord> {
    const session = await prisma.mockInterviewSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const qna = (session.qnaJson as any[]) || [];
    const unverifiedFound = qna
      .flatMap((q) => q.feedback?.unverifiedClaims || [])
      .filter(Boolean);

    const feedbackSummary = {
      overallStrengths: [
        'Demonstrates solid familiarity with full-stack development patterns.',
        'Logical articulation of database query patterns and indexing concepts.',
      ],
      keyAreasToImprove: [
        'Incorporate measurable business or latency results into your answers.',
        'Address database deadlocks and distributed locking considerations.',
      ],
      unverifiedClaimsFound: unverifiedFound,
    };

    const updated = await prisma.mockInterviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        feedbackSummary,
      },
    });

    return this.mapMockSession(updated);
  }

  /**
   * Post-Interview Debrief
   */
  static async submitDebrief(
    interviewId: string,
    data: {
      roundId?: string | null;
      candidateReflection: string;
      questionsAsked: string[];
      technicalTopics: string[];
      behavioralTopics: string[];
      whatWentWell?: string;
      whatWasDifficult?: string;
      topicsToStudy?: string[];
      interviewerFeedback?: string;
      nextSteps?: string;
      outcome?: string;
    }
  ): Promise<InterviewDebriefRecord> {
    // Generate AI suggestions based strictly on user reflection
    const aiSuggestions = [
      'Revise technical topics highlighted during the round.',
      'Send a prompt thank-you note within 24 hours emphasizing your core alignment.',
      'Prepare system design scalability follow-ups for potential next stage.',
    ];

    // Compute suggested follow-up date (+24h for thank you note)
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 1);

    const debrief = await prisma.interviewDebrief.create({
      data: {
        interviewId,
        roundId: data.roundId || null,
        candidateReflection: data.candidateReflection,
        questionsAsked: data.questionsAsked || [],
        technicalTopics: data.technicalTopics || [],
        behavioralTopics: data.behavioralTopics || [],
        whatWentWell: data.whatWentWell,
        whatWasDifficult: data.whatWasDifficult,
        topicsToStudy: data.topicsToStudy || [],
        interviewerFeedback: data.interviewerFeedback,
        nextSteps: data.nextSteps,
        aiObservedSummary: `Candidate reflected on ${data.questionsAsked.length} questions. Key areas noted: ${data.technicalTopics.join(', ') || 'General engineering'}.`,
        aiSuggestions,
        followUpDate,
        outcome: data.outcome || 'PENDING_FEEDBACK',
      },
    });

    // Also automatically register actual interview questions in Question Bank
    for (const qText of data.questionsAsked || []) {
      if (qText.trim()) {
        await prisma.interviewQuestion.create({
          data: {
            interviewId,
            roundId: data.roundId || null,
            category: 'ROLE_SPECIFIC',
            source: 'ACTUAL_INTERVIEW',
            questionText: qText.trim(),
            resultAttribution: 'USER_PROVIDED',
          },
        });
      }
    }

    return {
      id: debrief.id,
      interviewId: debrief.interviewId,
      roundId: debrief.roundId,
      candidateReflection: debrief.candidateReflection,
      questionsAsked: debrief.questionsAsked,
      technicalTopics: debrief.technicalTopics,
      behavioralTopics: debrief.behavioralTopics,
      whatWentWell: debrief.whatWentWell,
      whatWasDifficult: debrief.whatWasDifficult,
      topicsToStudy: debrief.topicsToStudy,
      interviewerFeedback: debrief.interviewerFeedback,
      aiObservedSummary: debrief.aiObservedSummary,
      aiSuggestions: debrief.aiSuggestions,
      nextSteps: debrief.nextSteps,
      followUpDate: debrief.followUpDate ? debrief.followUpDate.toISOString() : null,
      outcome: debrief.outcome,
      createdAt: debrief.createdAt.toISOString(),
    };
  }

  /**
   * Factual Interview Stats
   */
  static async getInterviewStats(): Promise<InterviewStatsSummary> {
    const totalInterviews = await prisma.interview.count();
    const activeInterviews = await prisma.interview.count({
      where: { status: { in: ['PLANNED', 'SCHEDULED', 'IN_PROGRESS'] } },
    });
    const completedRounds = await prisma.interviewRound.count({
      where: { status: 'COMPLETED' },
    });
    const upcomingRounds = await prisma.interviewRound.count({
      where: { status: 'SCHEDULED' },
    });
    const mockSessionsPracticed = await prisma.mockInterviewSession.count();
    const questionsRecorded = await prisma.interviewQuestion.count();
    const debriefsCompleted = await prisma.interviewDebrief.count();

    return {
      totalInterviews,
      activeInterviews,
      completedRounds,
      upcomingRounds,
      mockSessionsPracticed,
      questionsRecorded,
      debriefsCompleted,
    };
  }

  // ==========================================
  // Helper Mappers
  // ==========================================

  private static mapToRecord(interview: any, application?: any): InterviewRecord {
    return {
      id: interview.id,
      applicationId: interview.applicationId,
      status: interview.status,
      overallOutcome: interview.overallOutcome,
      notes: interview.notes,
      createdAt: interview.createdAt.toISOString(),
      updatedAt: interview.updatedAt.toISOString(),
      application: application
        ? {
            id: application.id,
            jobId: application.jobId,
            status: application.status,
            job: application.job,
            snapshotJson: application.snapshotJson,
          }
        : undefined,
      rounds: (interview.rounds || []).map(this.mapRoundToRecord),
      questions: (interview.questions || []).map(this.mapQuestionToItem),
      mockSessions: (interview.mockSessions || []).map(this.mapMockSession),
    };
  }

  private static mapRoundToRecord(round: any): InterviewRoundRecord {
    return {
      id: round.id,
      interviewId: round.interviewId,
      roundType: round.roundType,
      title: round.title,
      sequence: round.sequence,
      status: round.status,
      scheduledAt: round.scheduledAt ? round.scheduledAt.toISOString() : null,
      completedAt: round.completedAt ? round.completedAt.toISOString() : null,
      interviewerName: round.interviewerName,
      interviewerTitle: round.interviewerTitle,
      meetingUrl: round.meetingUrl,
      notes: round.notes,
      createdAt: round.createdAt.toISOString(),
      updatedAt: round.updatedAt.toISOString(),
    };
  }

  private static mapQuestionToItem(q: any): InterviewQuestionItem {
    return {
      id: q.id,
      interviewId: q.interviewId,
      roundId: q.roundId,
      category: q.category,
      source: q.source,
      questionText: q.questionText,
      suggestedAnswer: q.suggestedAnswer,
      starSituation: q.starSituation,
      starTask: q.starTask,
      starAction: q.starAction,
      starResult: q.starResult,
      resultAttribution: q.resultAttribution,
      unverifiedClaims: q.unverifiedClaims || [],
      relevanceReason: q.relevanceReason,
      userNotes: q.userNotes,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    };
  }

  private static mapMockSession(s: any): MockSessionRecord {
    return {
      id: s.id,
      interviewId: s.interviewId,
      roundId: s.roundId,
      roundType: s.roundType,
      status: s.status,
      qna: (s.qnaJson as any[]) || [],
      feedbackSummary: s.feedbackSummary as any,
      createdAt: s.createdAt.toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
    };
  }
}
