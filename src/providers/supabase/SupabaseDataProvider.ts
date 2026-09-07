import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SupabaseConceptRow, SupabaseRevisionRow, SupabaseQuizRow } from '../../types/database.types';
import { IDataProvider } from '../../contracts/IDataProvider';
import {
  UserProfile,
  UserProgress,
  Course,
  CourseConcept,
  Revision,
  Quiz,
  QuizSession,
  ProcessingJob,
  Subject,
  AppNotification,
  AppSettings,
  SearchResultItem,
  QuizAttempt,
  ComprehensionQuestion,
  Exercise,
  QuizPlan,
  SubscriptionPlan,
  EconomyState,
  EnergyConversionResult,
  RewardClaimResult,
  RevisionUsageResult,
  DiamondTransaction,
  EnergyTransaction
} from '../../types';
import { UserRepository } from '../../repositories/UserRepository';
import { CourseRepository } from '../../repositories/CourseRepository';
import { RevisionRepository } from '../../repositories/RevisionRepository';
import { QuizRepository } from '../../repositories/QuizRepository';
import { ProgressRepository } from '../../repositories/ProgressRepository';
import { NotificationRepository } from '../../repositories/NotificationRepository';
import { SettingsRepository } from '../../repositories/SettingsRepository';
import { ExerciseRepository } from '../../repositories/ExerciseRepository';
import { EconomyRepository } from '../../repositories/EconomyRepository';

/**
 * REVIZO — SupabaseDataProvider
 * Implémente le contrat IDataProvider via les Repositories et Supabase Client.
 * Les composants React restent 100% découplés de cette implémentation.
 */
export class SupabaseDataProvider implements IDataProvider {
  private userRepo: UserRepository;
  private courseRepo: CourseRepository;
  private revisionRepo: RevisionRepository;
  private quizRepo: QuizRepository;
  private progressRepo: ProgressRepository;
  private notifRepo: NotificationRepository;
  private settingsRepo: SettingsRepository;
  private exerciseRepo: ExerciseRepository;
  private economyRepo: EconomyRepository;

  private currentUserId: string = '';
  private activeSessions: Map<string, QuizSession> = new Map();
  private jobs: Map<string, ProcessingJob> = new Map();

  constructor(private client: SupabaseClient<Database>, initialUser?: UserProfile) {
    this.userRepo = new UserRepository(client);
    this.courseRepo = new CourseRepository(client);
    this.revisionRepo = new RevisionRepository(client);
    this.quizRepo = new QuizRepository(client);
    this.progressRepo = new ProgressRepository(client);
    this.notifRepo = new NotificationRepository(client);
    this.settingsRepo = new SettingsRepository(client);
    this.exerciseRepo = new ExerciseRepository(client);
    this.economyRepo = new EconomyRepository(client);

    if (initialUser) {
      this.currentUserId = initialUser.id;
    }
  }

  setActiveProfile(user: UserProfile): void {
    this.currentUserId = user.id;
  }

  // ----------------------------------------------------
  // 1. PROFIL & PROGRESSION
  // ----------------------------------------------------
  async getProfile(): Promise<UserProfile> {
    if (!this.currentUserId) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) this.currentUserId = user.id;
    }

    const profile = await this.userRepo.getById(this.currentUserId);
    if (!profile) {
      const { data: { user } } = await this.client.auth.getUser();
      const userEmail = user?.email || '';
      const userDisplayName = (user?.user_metadata?.display_name as string) || (userEmail ? userEmail.split('@')[0] : 'Élève');
      const userGrade = (user?.user_metadata?.grade_level as any) || '3e';
      const newProfile: UserProfile = {
        id: this.currentUserId || user?.id || 'usr-default',
        email: userEmail,
        displayName: userDisplayName,
        gradeLevel: userGrade,
        joinedAt: user?.created_at || new Date().toISOString()
      };
      await this.userRepo.upsert(newProfile).catch(() => {});
      return newProfile;
    }
    return profile;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.userRepo.update(this.currentUserId, updates);
  }

  async getProgress(): Promise<UserProgress> {
    const prog = await this.progressRepo.getByUserId(this.currentUserId);
    if (!prog) {
      // Progression initiale conforme au trigger handle_new_user() (10 diamants, 3 énergies, 0 XP, série 1)
      const initialProgress: UserProgress = {
        userId: this.currentUserId,
        totalXp: 0,
        level: 1,
        xpToNextLevel: 100,
        currentStreak: 1,
        longestStreak: 1,
        diamondsBalance: 10,
        energyBalance: 3,
        dailyGoalMinutes: 15,
        dailyGoalProgressMinutes: 0,
        lastActivityDate: new Date().toISOString().split('T')[0],
        weeklyDays: [false, false, false, false, false, false, false]
      };
      if (this.currentUserId) {
        await this.progressRepo.upsert(initialProgress).catch(() => {});
      }
      return initialProgress;
    }
    return prog;
  }

  async spendDiamondsForEnergy(amount: number = 3): Promise<{ success: boolean; newEnergy: number; newDiamonds: number }> {
    return this.progressRepo.refillEnergyWithDiamonds(this.currentUserId, 10, amount);
  }

  // ----------------------------------------------------
  // 2. PARAMÈTRES
  // ----------------------------------------------------
  async getSettings(): Promise<AppSettings> {
    const s = await this.settingsRepo.getByUserId(this.currentUserId);
    if (!s) {
      return {
        theme: 'light',
        animationsEnabled: true,
        language: 'fr',
        notificationsRevision: true,
        notificationsDailyReminders: true,
        notificationsRewards: true
      };
    }
    return s;
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    return this.settingsRepo.upsert(updates, this.currentUserId);
  }

  // ----------------------------------------------------
  // 3. MATIÈRES & COURS
  // ----------------------------------------------------
  async getSubjects(): Promise<Subject[]> {
    const courses = await this.courseRepo.listByUserId(this.currentUserId);
    if (courses.length === 0) {
      // Aucune matière importée : scores neutres initiaux à 0%
      return [
        { id: 'sbj-math', name: 'Mathématiques', color: '#EA580C', icon: 'Calculator', masteryScore: 0, level: 1 },
        { id: 'sbj-fr', name: 'Français', color: '#10B981', icon: 'BookOpen', masteryScore: 0, level: 1 },
        { id: 'sbj-sci', name: 'Sciences', color: '#8B5CF6', icon: 'FlaskConical', masteryScore: 0, level: 1 }
      ];
    }

    // Agréger les matières réelles selon les cours importés par l'élève
    const subjectMap = new Map<string, { id: string; name: string; courseIds: string[] }>();
    for (const c of courses) {
      const subName = c.subjectName || 'Général';
      const subId = c.subjectId || `sbj-${subName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      if (!subjectMap.has(subName)) {
        subjectMap.set(subName, { id: subId, name: subName, courseIds: [] });
      }
      subjectMap.get(subName)!.courseIds.push(c.id);
    }

    // Récupérer les concepts réels pour calculer le taux de maîtrise exact
    const { data: allConcepts } = await this.client
      .from('concepts')
      .select('*')
      .eq('user_id', this.currentUserId);

    const conceptRows = (allConcepts as SupabaseConceptRow[]) || [];

    const result: Subject[] = [];
    for (const [subName, info] of subjectMap.entries()) {
      const courseIdSet = new Set(info.courseIds);
      const subConcepts = conceptRows.filter(c => courseIdSet.has(c.course_id));

      let avgMastery = 0;
      if (subConcepts.length > 0) {
        const totalMastery = subConcepts.reduce((acc, c) => acc + (c.mastery_score || 0), 0);
        avgMastery = Math.round(totalMastery / subConcepts.length);
      }

      const isMath = subName.toLowerCase().includes('math');
      const isFr = subName.toLowerCase().includes('fran');
      const isSci = subName.toLowerCase().includes('sci') || subName.toLowerCase().includes('svt');
      const isHist = subName.toLowerCase().includes('hist') || subName.toLowerCase().includes('géo');

      const color = isMath ? '#EA580C' : isFr ? '#10B981' : isSci ? '#8B5CF6' : isHist ? '#D97706' : '#6366F1';
      const icon = isMath ? 'Calculator' : isFr ? 'BookOpen' : isSci ? 'FlaskConical' : 'BookOpen';
      const level = Math.max(1, Math.min(10, Math.floor(avgMastery / 12) + 1));

      result.push({
        id: info.id,
        name: subName,
        color,
        icon,
        masteryScore: avgMastery,
        level
      });
    }

    return result;
  }

  async getCourses(subjectId?: string): Promise<Course[]> {
    return this.courseRepo.listByUserId(this.currentUserId, subjectId);
  }

  async getCourseById(id: string): Promise<Course | null> {
    return this.courseRepo.getById(id, this.currentUserId);
  }

  async createCourse(course: Partial<Course>): Promise<Course> {
    return this.courseRepo.create(course, this.currentUserId);
  }

  async deleteCourse(id: string): Promise<boolean> {
    return this.courseRepo.delete(id, this.currentUserId);
  }

  // ----------------------------------------------------
  // 4. CONCEPTS
  // ----------------------------------------------------
  async getConceptsByCourseId(courseId: string): Promise<CourseConcept[]> {
    const { data, error } = await this.client
      .from('concepts')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', this.currentUserId)
      .order('order_index', { ascending: true });

    if (error || !data) return [];
    return (data as SupabaseConceptRow[]).map(c => ({
      id: c.id,
      courseId: c.course_id,
      name: c.name,
      summary: c.summary,
      importance: (c.importance as 1 | 2 | 3 | 4 | 5) || 3,
      masteryScore: c.mastery_score,
      keyPoints: Array.isArray(c.key_points) ? c.key_points : [],
      rulesFormulas: Array.isArray(c.rules_formulas) ? c.rules_formulas : undefined,
      isWeak: c.mastery_score < 60
    }));
  }

  async getWeakConcepts(): Promise<CourseConcept[]> {
    const { data, error } = await this.client
      .from('concepts')
      .select('*')
      .eq('user_id', this.currentUserId)
      .lt('mastery_score', 60)
      .order('mastery_score', { ascending: true });

    if (error || !data) return [];
    return (data as SupabaseConceptRow[]).map(c => ({
      id: c.id,
      courseId: c.course_id,
      name: c.name,
      summary: c.summary,
      importance: (c.importance as 1 | 2 | 3 | 4 | 5) || 3,
      masteryScore: c.mastery_score,
      keyPoints: Array.isArray(c.key_points) ? c.key_points : [],
      rulesFormulas: Array.isArray(c.rules_formulas) ? c.rules_formulas : undefined,
      isWeak: true
    }));
  }

  async updateConceptMastery(conceptId: string, masteryDelta: number): Promise<CourseConcept> {
    const { data: current } = await this.client
      .from('concepts')
      .select('*')
      .eq('id', conceptId)
      .eq('user_id', this.currentUserId)
      .single();

    const currentScore = current ? (current as SupabaseConceptRow).mastery_score : 50;
    const newScore = Math.min(100, Math.max(0, currentScore + masteryDelta));

    const { data, error } = await this.client
      .from('concepts')
      .update({ mastery_score: newScore })
      .eq('id', conceptId)
      .eq('user_id', this.currentUserId)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Impossible de mettre à jour la maîtrise du concept.');
    }

    const row = data as SupabaseConceptRow;
    return {
      id: row.id,
      courseId: row.course_id,
      name: row.name,
      summary: row.summary,
      importance: (row.importance as 1 | 2 | 3 | 4 | 5) || 3,
      masteryScore: row.mastery_score,
      keyPoints: Array.isArray(row.key_points) ? row.key_points : [],
      rulesFormulas: Array.isArray(row.rules_formulas) ? row.rules_formulas : undefined,
      isWeak: row.mastery_score < 60
    };
  }

  // ----------------------------------------------------
  // 5. RÉVISIONS
  // ----------------------------------------------------
  async getRevisionByCourseId(courseId: string): Promise<Revision | null> {
    return this.revisionRepo.getByCourseId(courseId, this.currentUserId);
  }

  async markRevisionDownloaded(revisionId: string, isDownloaded: boolean): Promise<boolean> {
    return this.revisionRepo.markDownloaded(revisionId, this.currentUserId, isDownloaded);
  }

  // ----------------------------------------------------
  // 6. QUIZ
  // ----------------------------------------------------
  async getQuizzes(): Promise<Quiz[]> {
    return this.quizRepo.listByUserId(this.currentUserId);
  }

  async getQuizByCourseId(courseId: string): Promise<Quiz | null> {
    return this.quizRepo.getByCourseId(courseId, this.currentUserId);
  }

  async startQuizSession(quizId: string): Promise<QuizSession> {
    const { data: quizData } = await this.client
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('user_id', this.currentUserId)
      .single();

    const quiz = quizData as SupabaseQuizRow | null;
    if (!quiz) throw new Error('Quiz introuvable.');

    const prog = await this.getProgress();
    if (prog.energyBalance <= 0) {
      throw new Error("Plus d'énergie disponible. Recharge tes énergies avec tes diamants.");
    }

    const session: QuizSession = {
      id: `ses-${Date.now()}`,
      quizId,
      courseId: quiz.course_id,
      currentPosition: 0,
      totalQuestions: quiz.total_questions,
      energyRemaining: prog.energyBalance,
      status: 'active',
      attempts: [],
      startedAt: new Date().toISOString()
    };

    this.activeSessions.set(session.id, session);
    return session;
  }

  async submitQuizAnswer(
    sessionId: string,
    attempt: { questionId: string; conceptId: string; selectedChoiceIndex: number }
  ): Promise<{
    session: QuizSession;
    isCorrect: boolean;
    explanation: string;
    xpEarned: number;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session introuvable.');

    const quiz = await this.quizRepo.getByCourseId(session.courseId, this.currentUserId);
    const question = quiz?.questions.find(q => q.id === attempt.questionId);
    if (!question) throw new Error('Question introuvable.');

    const isCorrect = attempt.selectedChoiceIndex === question.correctChoiceIndex;
    const xpEarned = isCorrect ? 25 : 5;
    const energyLost = isCorrect ? 0 : 1;

    const fullAttempt: QuizAttempt = {
      ...attempt,
      isCorrect,
      energyLost,
      xpAwarded: xpEarned,
      answeredAt: new Date().toISOString()
    };

    session.attempts.push(fullAttempt);
    session.currentPosition += 1;
    session.energyRemaining = Math.max(0, session.energyRemaining - energyLost);

    if (energyLost > 0) {
      await this.progressRepo.deductEnergy(this.currentUserId, energyLost);
    }
    await this.progressRepo.addXP(this.currentUserId, xpEarned);

    // Ajustement dynamique de la maîtrise du concept évalué (Phase 18)
    if (attempt.conceptId) {
      const delta = isCorrect ? 10 : -10;
      await this.updateConceptMastery(attempt.conceptId, delta).catch(err => {
        console.warn('[SupabaseDataProvider] Impossible de mettre à jour le score du concept :', err);
      });
    }

    // Condition d'échec (épuisement d'énergie) ou de victoire
    if (session.energyRemaining <= 0) {
      session.status = 'game_over';
      session.completedAt = new Date().toISOString();
      await this.saveSessionResult(session, quiz).catch(err => {
        console.warn('[SupabaseDataProvider] Impossible d’enregistrer le résultat du quiz :', err);
      });
    } else if (session.currentPosition >= session.totalQuestions) {
      session.status = 'victory';
      session.completedAt = new Date().toISOString();
      // Récompense victoire : +5 diamants
      await this.progressRepo.addDiamonds(this.currentUserId, 5).catch(err => {
        console.warn('[SupabaseDataProvider] Impossible de créditer les diamants de victoire :', err);
      });
      await this.saveSessionResult(session, quiz).catch(err => {
        console.warn('[SupabaseDataProvider] Impossible d’enregistrer le résultat du quiz :', err);
      });
    }

    return {
      session,
      isCorrect,
      explanation: question.explanation,
      xpEarned
    };
  }

  private async saveSessionResult(session: QuizSession, quiz: Quiz | null): Promise<void> {
    const score = session.attempts.filter(a => a.isCorrect).length;
    const total = session.totalQuestions || (quiz?.questions.length ?? 1);
    const percentage = Math.min(100, Math.max(0, Math.round((score / (total || 1)) * 100)));
    const xpEarned = session.attempts.reduce((sum, a) => sum + (a.xpAwarded || 0), 0);

    await this.quizRepo.saveResult({
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: this.currentUserId,
      quiz_id: session.quizId,
      course_id: session.courseId,
      score,
      total_questions: total,
      percentage,
      xp_earned: xpEarned,
      attempts: session.attempts
    });
  }

  // ----------------------------------------------------
  // 7. PIPELINE IA & DONNÉES IMPORTÉES
  // ----------------------------------------------------
  async createProcessingJob(courseId: string): Promise<ProcessingJob> {
    const job: ProcessingJob = {
      id: `job-${Date.now()}`,
      courseId,
      step: 'analysis',
      status: 'pending',
      progressPct: 0,
      message: 'Initialisation de l’analyse pédagogique…'
    };
    this.jobs.set(job.id, job);
    return job;
  }

  async getProcessingJob(jobId: string): Promise<ProcessingJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async saveImportedCourseData(
    course: Course,
    concepts: CourseConcept[],
    revision: Revision,
    quiz: Quiz,
    comprehensionQuestions?: ComprehensionQuestion[],
    exercises?: Exercise[],
    quizPlan?: QuizPlan
  ): Promise<void> {
    await this.courseRepo.create(course, this.currentUserId);
    await this.revisionRepo.create(revision, this.currentUserId);
    await this.quizRepo.create(quiz, this.currentUserId);

    if (concepts.length > 0) {
      const conceptsPayload = concepts.map((c, idx) => ({
        id: c.id,
        course_id: course.id,
        analysis_id: null,
        user_id: this.currentUserId,
        name: c.name,
        summary: c.summary,
        importance: c.importance,
        difficulty: 2,
        mastery_score: c.masteryScore,
        order_index: idx,
        key_points: c.keyPoints || [],
        rules_formulas: c.rulesFormulas || null
      }));
      await this.client.from('concepts').insert(conceptsPayload as any);
    }

    if (comprehensionQuestions && comprehensionQuestions.length > 0) {
      await this.exerciseRepo.saveComprehensionQuestions(comprehensionQuestions, this.currentUserId);
    }

    if (exercises && exercises.length > 0) {
      await this.exerciseRepo.saveExercises(exercises, this.currentUserId);
    }

    if (quizPlan) {
      await this.exerciseRepo.saveQuizPlan(quizPlan, this.currentUserId);
    }
  }

  // ----------------------------------------------------
  // CURRICULUM AVANCÉ (COMPRÉHENSION, EXERCICES, QUIZ PLANS)
  // ----------------------------------------------------
  async getComprehensionQuestions(courseId: string): Promise<ComprehensionQuestion[]> {
    return this.exerciseRepo.getComprehensionQuestionsByCourseId(courseId, this.currentUserId);
  }

  async getExercises(courseId: string): Promise<Exercise[]> {
    return this.exerciseRepo.getExercisesByCourseId(courseId, this.currentUserId);
  }

  async getQuizPlan(courseId: string): Promise<QuizPlan | null> {
    return this.exerciseRepo.getQuizPlanByCourseId(courseId, this.currentUserId);
  }

  // ----------------------------------------------------
  // 8. NOTIFICATIONS
  // ----------------------------------------------------
  async getNotifications(): Promise<AppNotification[]> {
    return this.notifRepo.listByUserId(this.currentUserId);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    return this.notifRepo.markAsRead(id, this.currentUserId);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    return this.notifRepo.markAllAsRead(this.currentUserId);
  }

  async clearAllNotifications(): Promise<void> {
    return this.notifRepo.clearAll(this.currentUserId);
  }

  // ----------------------------------------------------
  // 9. RECHERCHE GLOBALE
  // ----------------------------------------------------
  async searchAll(query: string): Promise<SearchResultItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    // Recherche Cours
    const courses = await this.courseRepo.listByUserId(this.currentUserId);
    courses.forEach(c => {
      if (c.title.toLowerCase().includes(q) || c.subjectName.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)) {
        results.push({
          id: `search-course-${c.id}`,
          type: 'course',
          title: c.title,
          subjectName: c.subjectName,
          description: c.summary,
          badgeText: 'Cours',
          courseId: c.id,
          targetTab: 'courses',
          extraInfo: `${c.conceptsCount} notions clés`
        });
      }
    });

    // Recherche Révisions
    const { data: revs } = await this.client
      .from('revisions')
      .select('*')
      .eq('user_id', this.currentUserId);

    if (revs) {
      (revs as SupabaseRevisionRow[]).forEach(r => {
        const titleMatch = r.title.toLowerCase().includes(q);
        const summaryMatch = r.summary.toLowerCase().includes(q);
        const conceptsMatch = Array.isArray(r.key_concepts) && r.key_concepts.some((kc: string) => kc.toLowerCase().includes(q));

        if (titleMatch || summaryMatch || conceptsMatch) {
          const associated = courses.find(c => c.id === r.course_id);
          results.push({
            id: `search-rev-${r.id}`,
            type: 'revision',
            title: r.title,
            subjectName: associated?.subjectName || 'Révision',
            description: r.summary,
            badgeText: 'Révision',
            courseId: r.course_id,
            targetTab: 'revisions',
            extraInfo: `${r.total_sections} sections synthétiques`
          });
        }
      });
    }

    // Recherche Quiz
    const quizzes = await this.quizRepo.listByUserId(this.currentUserId);
    quizzes.forEach(qz => {
      if (qz.title.toLowerCase().includes(q) || qz.courseTitle.toLowerCase().includes(q)) {
        const associated = courses.find(c => c.id === qz.courseId);
        results.push({
          id: `search-quiz-${qz.id}`,
          type: 'quiz',
          title: qz.title,
          subjectName: associated?.subjectName || 'Quiz',
          description: `Évaluation de compréhension : ${qz.totalQuestions} questions ciblées sur ce cours.`,
          badgeText: 'Quiz',
          courseId: qz.courseId,
          targetTab: 'quizzes',
          extraInfo: `${qz.totalQuestions} questions • Niveau ${qz.difficulty}`
        });
      }
    });

    return results;
  }

  // ----------------------------------------------------
  // 10. ÉCONOMIE, ABONNEMENTS, ÉNERGIE & PARRAINAGE
  // ----------------------------------------------------
  async getEconomyState(): Promise<EconomyState> {
    if (!this.currentUserId) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) this.currentUserId = user.id;
    }
    return this.economyRepo.getEconomyState(this.currentUserId);
  }

  async activateSubscription(plan: SubscriptionPlan, paymentProvider?: string, externalId?: string): Promise<EconomyState> {
    if (!this.currentUserId) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) this.currentUserId = user.id;
    }
    return this.economyRepo.activateSubscription(this.currentUserId, plan, paymentProvider, externalId);
  }

  async createCheckoutSession(
    plan: SubscriptionPlan,
    customer?: { firstname?: string; lastname?: string; email?: string; phone?: string },
    returnUrl?: string
  ): Promise<{ success: boolean; checkoutUrl?: string; token?: string; transactionId?: string; simulated?: boolean; message?: string }> {
    if (!this.currentUserId) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) this.currentUserId = user.id;
    }
    return this.economyRepo.createCheckoutSession(this.currentUserId, plan, customer, returnUrl);
  }

  async consumeEnergy(amount: number = 1, reason: string = 'Session pédagogique', referenceId?: string): Promise<{ success: boolean; currentEnergy: number; maxEnergy: number; message?: string }> {
    if (!this.currentUserId) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) this.currentUserId = user.id;
    }
    return this.economyRepo.consumeEnergy(this.currentUserId, amount, reason, referenceId);
  }

  async convertDiamondsToEnergy(): Promise<EnergyConversionResult> {
    if (!this.currentUserId) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) this.currentUserId = user.id;
    }
    return this.economyRepo.convertDiamondsToEnergy(this.currentUserId);
  }

  async claimReward(eventKey: string, rewardType: string, diamonds: number, reason: string, metadata?: any): Promise<RewardClaimResult> {
    if (!this.currentUserId) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) this.currentUserId = user.id;
    }
    return this.economyRepo.claimReward(this.currentUserId, eventKey, rewardType, diamonds, reason, metadata);
  }

  async applyReferralCode(code: string): Promise<{ success: boolean; message: string }> {
    if (!this.currentUserId) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) this.currentUserId = user.id;
    }
    return this.economyRepo.applyReferralCode(this.currentUserId, code);
  }

  async recordRevisionUsage(): Promise<RevisionUsageResult> {
    if (!this.currentUserId) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) this.currentUserId = user.id;
    }
    return this.economyRepo.recordRevisionUsage(this.currentUserId);
  }

  async getTransactionHistory(): Promise<{ diamonds: DiamondTransaction[]; energy: EnergyTransaction[] }> {
    if (!this.currentUserId) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) this.currentUserId = user.id;
    }
    return this.economyRepo.getTransactionHistory(this.currentUserId);
  }
}
