import { IDataProvider } from '../../contracts/IDataProvider';
import {
  UserProfile,
  UserProgress,
  Subject,
  Course,
  CourseConcept,
  Revision,
  Quiz,
  QuizSession,
  QuizAttempt,
  ProcessingJob,
  AppNotification,
  AppSettings,
  SearchResultItem,
  ComprehensionQuestion,
  Exercise,
  QuizPlan,
  SubscriptionPlan,
  EconomyState,
  EnergyConversionResult,
  RewardClaimResult,
  RevisionUsageResult,
  DiamondTransaction,
  EnergyTransaction,
  ReferralInfo,
  UserEnergyState,
  UserDiamondsState,
  UserSubscription
} from '../../types';
import {
  INITIAL_PROFILE,
  INITIAL_PROGRESS,
  INITIAL_SETTINGS,
  SUBJECTS_FIXTURES,
  COURSES_FIXTURES,
  CONCEPTS_FIXTURES,
  REVISIONS_FIXTURES,
  QUIZZES_FIXTURES,
  NOTIFICATIONS_FIXTURES
} from './fixtures';

export class MockDataProvider implements IDataProvider {
  private profile: UserProfile;
  private progress: UserProgress;
  private settings: AppSettings;
  private subjects: Subject[];
  private courses: Course[];
  private concepts: CourseConcept[];
  private revisions: Revision[];
  private quizzes: Quiz[];
  private notifications: AppNotification[];
  private comprehensionQuestions: ComprehensionQuestion[] = [];
  private exercises: Exercise[] = [];
  private quizPlans: Map<string, QuizPlan> = new Map();
  private activeSessions: Map<string, QuizSession> = new Map();
  private jobs: Map<string, ProcessingJob> = new Map();
  private latencyMs: number;

  // État économique Mock
  private subscriptions: Map<string, UserSubscription> = new Map();
  private userEnergy: Map<string, UserEnergyState> = new Map();
  private userDiamonds: Map<string, UserDiamondsState> = new Map();
  private referralAccounts: Map<string, ReferralInfo> = new Map();
  private referralCodes: Map<string, string> = new Map(); // code -> userId
  private rewardEvents: Set<string> = new Set();
  private diamondTransactions: DiamondTransaction[] = [];
  private energyTransactions: EnergyTransaction[] = [];

  constructor(latencyMs: number = 60) {
    this.latencyMs = latencyMs;
    // Deep clone to ensure memory isolation
    this.profile = JSON.parse(JSON.stringify(INITIAL_PROFILE));
    this.progress = JSON.parse(JSON.stringify(INITIAL_PROGRESS));
    this.subjects = JSON.parse(JSON.stringify(SUBJECTS_FIXTURES));
    this.courses = JSON.parse(JSON.stringify(COURSES_FIXTURES));
    this.concepts = JSON.parse(JSON.stringify(CONCEPTS_FIXTURES));
    this.revisions = JSON.parse(JSON.stringify(REVISIONS_FIXTURES));
    this.quizzes = JSON.parse(JSON.stringify(QUIZZES_FIXTURES));
    this.notifications = JSON.parse(JSON.stringify(NOTIFICATIONS_FIXTURES));
    this.settings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));

    this.initUserEconomy(this.profile.id);
  }

  private initUserEconomy(userId: string): void {
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, {
        userId,
        plan: 'free',
        price: 0,
        status: 'active',
        startedAt: new Date().toISOString(),
        expiresAt: null,
        paymentProvider: 'none',
        dailyRevisionLimit: 1
      });
    }

    if (!this.userEnergy.has(userId)) {
      this.userEnergy.set(userId, {
        currentEnergy: 3,
        maxEnergy: 3,
        dailyRevisionLimit: 1,
        dailyRevisionUsed: 0,
        dailyRevisionRemaining: 1,
        diamondsConvertedToday: 0,
        maxDailyDiamondConversions: 10
      });
    }

    if (!this.userDiamonds.has(userId)) {
      this.userDiamonds.set(userId, {
        balance: 10
      });
    }

    if (!this.referralAccounts.has(userId)) {
      const code = `REV-${userId.slice(-6).toUpperCase()}`;
      this.referralAccounts.set(userId, {
        referralCode: code,
        referredByUserId: null,
        referralStatus: 'none',
        totalReferrals: 0,
        rewardedReferrals: 0
      });
      this.referralCodes.set(code, userId);
    }
  }

  private async simulateDelay(): Promise<void> {
    if (this.latencyMs <= 0) return;
    return new Promise(resolve => setTimeout(resolve, this.latencyMs));
  }

  async getProfile(): Promise<UserProfile> {
    await this.simulateDelay();
    return { ...this.profile };
  }

  setActiveProfile(user: UserProfile): void {
    this.profile = JSON.parse(JSON.stringify(user));
    this.initUserEconomy(user.id);
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    await this.simulateDelay();
    this.profile = { ...this.profile, ...updates };
    return { ...this.profile };
  }

  async getSettings(): Promise<AppSettings> {
    await this.simulateDelay();
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    await this.simulateDelay();
    this.settings = { ...this.settings, ...updates };
    return { ...this.settings };
  }

  async getProgress(): Promise<UserProgress> {
    await this.simulateDelay();
    return { ...this.progress };
  }

  async spendDiamondsForEnergy(amount: number): Promise<{ success: boolean; newEnergy: number; newDiamonds: number }> {
    await this.simulateDelay();
    const cost = 10 * amount;
    if (this.progress.diamondsBalance < cost || this.progress.energyBalance >= 3) {
      return {
        success: false,
        newEnergy: this.progress.energyBalance,
        newDiamonds: this.progress.diamondsBalance
      };
    }

    this.progress.diamondsBalance -= cost;
    this.progress.energyBalance = Math.min(3, this.progress.energyBalance + amount);

    return {
      success: true,
      newEnergy: this.progress.energyBalance,
      newDiamonds: this.progress.diamondsBalance
    };
  }

  async awardXP(amount: number): Promise<void> {
    await this.simulateDelay();
    this.progress.totalXp += amount;
  }

  async deductEnergy(amount: number): Promise<void> {
    await this.simulateDelay();
    if (this.progress.energyBalance > 0) {
      this.progress.energyBalance = Math.max(0, this.progress.energyBalance - amount);
    }
  }

  async awardStreakReward(): Promise<void> {
    await this.simulateDelay();
    this.progress.diamondsBalance += 5;
  }

  async getSubjects(): Promise<Subject[]> {
    await this.simulateDelay();
    return [...this.subjects];
  }

  async getCourses(subjectId?: string): Promise<Course[]> {
    await this.simulateDelay();
    // Filtrage par userId du profil actif (simule le RLS Supabase)
    let filtered = this.courses.filter(c => c.userId === this.profile.id);
    if (subjectId) {
      filtered = filtered.filter(c => c.subjectId === subjectId);
    }
    return [...filtered];
  }

  async getCourseById(id: string): Promise<Course | null> {
    await this.simulateDelay();
    const course = this.courses.find(c => c.id === id);
    return course ? { ...course } : null;
  }

  async createCourse(data: Partial<Course>): Promise<Course> {
    await this.simulateDelay();
    const newCourse: Course = {
      id: `crs-${Date.now()}`,
      userId: this.profile.id,
      subjectId: data.subjectId || 'sbj-svt',
      subjectName: data.subjectName || 'SVT',
      title: data.title || 'Nouveau cours sans titre',
      summary: data.summary || 'Analyse en attente...',
      difficulty: data.difficulty || 2,
      status: 'ready',
      conceptsCount: data.conceptsCount || 0,
      originalDocumentName: data.originalDocumentName,
      fileSize: data.fileSize,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDownloaded: false
    };

    this.courses.unshift(newCourse);
    return newCourse;
  }

  async deleteCourse(id: string): Promise<boolean> {
    await this.simulateDelay();
    const initialLen = this.courses.length;
    this.courses = this.courses.filter(c => c.id !== id);
    return this.courses.length < initialLen;
  }

  async getConceptsByCourseId(courseId: string): Promise<CourseConcept[]> {
    await this.simulateDelay();
    return this.concepts.filter(c => c.courseId === courseId);
  }

  async getWeakConcepts(): Promise<CourseConcept[]> {
    await this.simulateDelay();
    return this.concepts.filter(c => c.isWeak || c.masteryScore < 60);
  }

  async updateConceptMastery(conceptId: string, masteryDelta: number): Promise<CourseConcept> {
    await this.simulateDelay();
    const concept = this.concepts.find(c => c.id === conceptId);
    if (!concept) throw new Error(`Notion introuvable : ${conceptId}`);

    concept.masteryScore = Math.min(100, Math.max(0, concept.masteryScore + masteryDelta));
    concept.isWeak = concept.masteryScore < 60;
    return { ...concept };
  }

  async getRevisionByCourseId(courseId: string): Promise<Revision | null> {
    await this.simulateDelay();
    const rev = this.revisions.find(r => r.courseId === courseId);
    return rev ? { ...rev } : null;
  }

  async markRevisionDownloaded(revisionId: string, isDownloaded: boolean): Promise<boolean> {
    await this.simulateDelay();
    const rev = this.revisions.find(r => r.id === revisionId);
    if (rev) {
      rev.isDownloaded = isDownloaded;
      rev.downloadedAt = isDownloaded ? new Date().toISOString() : undefined;
      const course = this.courses.find(c => c.id === rev.courseId);
      if (course) course.isDownloaded = isDownloaded;
      return true;
    }
    return false;
  }

  async getQuizzes(): Promise<Quiz[]> {
    await this.simulateDelay();
    return [...this.quizzes];
  }

  async getQuizByCourseId(courseId: string): Promise<Quiz | null> {
    await this.simulateDelay();
    const qz = this.quizzes.find(q => q.courseId === courseId);
    return qz ? { ...qz } : null;
  }

  async startQuizSession(quizId: string): Promise<QuizSession> {
    await this.simulateDelay();
    const quiz = this.quizzes.find(q => q.id === quizId);
    if (!quiz) throw new Error(`Quiz introuvable`);

    if (this.progress.energyBalance <= 0) {
      throw new Error(`Plus d'énergie disponible. Recharge tes énergies avec tes diamants.`);
    }

    const session: QuizSession = {
      id: `ses-${Date.now()}`,
      quizId,
      courseId: quiz.courseId,
      currentPosition: 0,
      totalQuestions: quiz.totalQuestions,
      energyRemaining: this.progress.energyBalance,
      status: 'active',
      attempts: [],
      startedAt: new Date().toISOString()
    };

    this.activeSessions.set(session.id, session);
    return session;
  }

  async submitQuizAnswer(sessionId: string, attempt: { questionId: string; conceptId: string; selectedChoiceIndex: number }): Promise<{
    session: QuizSession;
    isCorrect: boolean;
    explanation: string;
    xpEarned: number;
  }> {
    await this.simulateDelay();
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session introuvable`);

    const quiz = this.quizzes.find(q => q.id === session.quizId);
    if (!quiz) throw new Error(`Quiz introuvable`);

    const question = quiz.questions.find(q => q.id === attempt.questionId);
    if (!question) throw new Error(`Question introuvable`);

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

    if (!isCorrect) {
      session.energyRemaining = Math.max(0, session.energyRemaining - 1);
      this.progress.energyBalance = session.energyRemaining;
      // Ajuste la maîtrise du concept
      const concept = this.concepts.find(c => c.id === attempt.conceptId);
      if (concept) {
        concept.masteryScore = Math.max(10, concept.masteryScore - 10);
        concept.isWeak = true;
      }
    } else {
      // Valorise la réussite
      const concept = this.concepts.find(c => c.id === attempt.conceptId);
      if (concept) {
        concept.masteryScore = Math.min(100, concept.masteryScore + 10);
        concept.isWeak = concept.masteryScore < 60;
      }
    }

    // Mise à jour de l'XP globale
    this.progress.totalXp += xpEarned;
    this.progress.level = Math.floor(this.progress.totalXp / 250) + 1;

    // Condition d'échec ou de victoire
    if (session.energyRemaining <= 0) {
      session.status = 'game_over';
      session.completedAt = new Date().toISOString();
    } else if (session.currentPosition >= session.totalQuestions) {
      session.status = 'victory';
      session.completedAt = new Date().toISOString();
      // Récompense victoire : diamants
      this.progress.diamondsBalance += 5;
    }

    return {
      session: { ...session },
      isCorrect,
      explanation: question.explanation,
      xpEarned
    };
  }

  async createProcessingJob(courseId: string): Promise<ProcessingJob> {
    await this.simulateDelay();
    const job: ProcessingJob = {
      id: `job-${Date.now()}`,
      courseId,
      step: 'upload',
      status: 'processing',
      progressPct: 15,
      message: 'Lecture et extraction du document en cours...'
    };
    this.jobs.set(job.id, job);
    return job;
  }

  async getProcessingJob(jobId: string): Promise<ProcessingJob | null> {
    await this.simulateDelay();
    const job = this.jobs.get(jobId);
    return job ? { ...job } : null;
  }

  /**
   * Enregistre en mémoire volatile le cours importé, ses concepts, sa révision et son quiz
   * (Zéro persistance externe ou locale interdite)
   */
  async saveImportedCourseData(
    course: Course,
    concepts: CourseConcept[],
    revision: Revision,
    quiz: Quiz,
    comprehensionQuestions?: ComprehensionQuestion[],
    exercises?: Exercise[],
    quizPlan?: QuizPlan
  ): Promise<void> {
    await this.simulateDelay();
    // Insère le cours en tête de liste
    this.courses.unshift({ ...course });
    this.concepts.unshift(...concepts.map(c => ({ ...c })));
    this.revisions.unshift({ ...revision });
    this.quizzes.unshift({ ...quiz });
    if (comprehensionQuestions && comprehensionQuestions.length > 0) {
      this.comprehensionQuestions.unshift(...comprehensionQuestions.map(q => ({ ...q })));
    }
    if (exercises && exercises.length > 0) {
      this.exercises.unshift(...exercises.map(e => ({ ...e })));
    }
    if (quizPlan) {
      this.quizPlans.set(quizPlan.courseId, { ...quizPlan });
    }
  }

  async getComprehensionQuestions(courseId: string): Promise<ComprehensionQuestion[]> {
    await this.simulateDelay();
    return this.comprehensionQuestions.filter(q => q.courseId === courseId);
  }

  async getExercises(courseId: string): Promise<Exercise[]> {
    await this.simulateDelay();
    return this.exercises.filter(e => e.courseId === courseId);
  }

  async getQuizPlan(courseId: string): Promise<QuizPlan | null> {
    await this.simulateDelay();
    return this.quizPlans.get(courseId) || null;
  }

  async getNotifications(): Promise<AppNotification[]> {
    await this.simulateDelay();
    return [...this.notifications];
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.simulateDelay();
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.simulateDelay();
    this.notifications.forEach(n => {
      n.read = true;
    });
  }

  async clearAllNotifications(): Promise<void> {
    await this.simulateDelay();
    this.notifications = [];
  }

  async searchAll(query: string): Promise<SearchResultItem[]> {
    await this.simulateDelay();
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    // 1. Recherche dans les Cours
    this.courses.forEach(c => {
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchSubject = c.subjectName.toLowerCase().includes(q);
      const matchSummary = c.summary.toLowerCase().includes(q);

      if (matchTitle || matchSubject || matchSummary) {
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

    // 2. Recherche dans les Révisions
    this.revisions.forEach(r => {
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchSummary = r.summary.toLowerCase().includes(q);
      const matchConcepts = r.keyConcepts.some(kc => kc.toLowerCase().includes(q));
      const matchSections = r.sections.some(
        s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
      );

      if (matchTitle || matchSummary || matchConcepts || matchSections) {
        const associatedCourse = this.courses.find(c => c.id === r.courseId);
        results.push({
          id: `search-rev-${r.id}`,
          type: 'revision',
          title: r.title,
          subjectName: associatedCourse?.subjectName || 'Révision',
          description: r.summary,
          badgeText: 'Révision',
          courseId: r.courseId,
          targetTab: 'revisions',
          extraInfo: `${r.totalSections} sections synthétiques`
        });
      }
    });

    // 3. Recherche dans les Quiz
    this.quizzes.forEach(qz => {
      const matchTitle = qz.title.toLowerCase().includes(q);
      const matchCourse = qz.courseTitle.toLowerCase().includes(q);

      if (matchTitle || matchCourse) {
        const associatedCourse = this.courses.find(c => c.id === qz.courseId);
        results.push({
          id: `search-quiz-${qz.id}`,
          type: 'quiz',
          title: qz.title,
          subjectName: associatedCourse?.subjectName || 'Quiz',
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
  // ÉCONOMIE, ABONNEMENTS, ÉNERGIE, DIAMANTS & PARRAINAGE
  // ----------------------------------------------------
  async getEconomyState(): Promise<EconomyState> {
    await this.simulateDelay();
    const userId = this.profile.id;
    this.initUserEconomy(userId);

    const sub = this.subscriptions.get(userId)!;
    const energy = this.userEnergy.get(userId)!;
    const diamonds = this.userDiamonds.get(userId)!;
    const referral = this.referralAccounts.get(userId)!;

    // Détection et bascule automatique en Free si abonnement expiré
    if (sub.status === 'active' && sub.plan !== 'free' && sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      sub.status = 'expired';
      sub.plan = 'free';
      sub.price = 0;
      sub.dailyRevisionLimit = 1;
      energy.maxEnergy = 3;
      energy.dailyRevisionLimit = 1;
      energy.currentEnergy = Math.min(energy.currentEnergy, 3);
    }

    return {
      subscription: { ...sub },
      energy: { ...energy },
      diamonds: { ...diamonds },
      referral: { ...referral }
    };
  }

  async activateSubscription(
    plan: SubscriptionPlan,
    paymentProvider: string = 'fedapay',
    externalId?: string
  ): Promise<EconomyState> {
    await this.simulateDelay();
    const userId = this.profile.id;
    this.initUserEconomy(userId);

    let price = 0;
    let limit = 1;
    let maxEnergy = 3;
    let initialDiamonds = 0;

    if (plan === 'essentiel') {
      price = 1000;
      limit = 3;
      maxEnergy = 10;
      initialDiamonds = 10;
    } else if (plan === 'intensif') {
      price = 3000;
      limit = 10;
      maxEnergy = 20;
      initialDiamonds = 30;
    } else if (plan === 'premium') {
      price = 5000;
      limit = 20;
      maxEnergy = 30;
      initialDiamonds = 60;
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const sub: UserSubscription = {
      userId,
      plan,
      price,
      status: 'active',
      startedAt: new Date().toISOString(),
      expiresAt,
      paymentProvider,
      externalSubscriptionId: externalId || `sub-mock-${Date.now()}`,
      dailyRevisionLimit: limit
    };
    this.subscriptions.set(userId, sub);

    // Mettre à jour l'énergie
    const currentEnergy = this.userEnergy.get(userId)!;
    currentEnergy.dailyRevisionLimit = limit;
    currentEnergy.maxEnergy = maxEnergy;
    currentEnergy.currentEnergy = Math.max(currentEnergy.currentEnergy, maxEnergy);
    currentEnergy.dailyRevisionRemaining = Math.max(0, limit - currentEnergy.dailyRevisionUsed);

    // Synchroniser user_progress
    this.progress.energyBalance = currentEnergy.currentEnergy;

    // Créditer les diamants initiaux idempotents
    const subEventKey = `subscription_initial:${sub.externalSubscriptionId}`;
    await this.claimReward(
      subEventKey,
      'subscription_initial',
      initialDiamonds,
      `Diamants de bienvenue — Abonnement ${plan.toUpperCase()}`,
      { plan }
    );

    // Déclencher parrainage si filleul en attente
    const ref = this.referralAccounts.get(userId);
    if (ref && ref.referredByUserId && ref.referralStatus === 'pending') {
      const referrerId = ref.referredByUserId;
      const eventKey = `referral_first_sub:${userId}`;
      if (!this.rewardEvents.has(eventKey)) {
        this.rewardEvents.add(eventKey);
        this.initUserEconomy(referrerId);
        const referrerDiamonds = this.userDiamonds.get(referrerId);
        if (referrerDiamonds) {
          referrerDiamonds.balance += 10;
          this.diamondTransactions.unshift({
            id: `dtx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            userId: referrerId,
            amount: 10,
            balanceAfter: referrerDiamonds.balance,
            reason: 'Premier abonnement payant d\'un filleul',
            referenceId: eventKey,
            createdAt: new Date().toISOString()
          });
        }
        ref.referralStatus = 'rewarded';
        const referrerRef = this.referralAccounts.get(referrerId);
        if (referrerRef) {
          referrerRef.rewardedReferrals += 1;
        }
      }
    }

    return this.getEconomyState();
  }

  async createCheckoutSession(
    plan: SubscriptionPlan,
    _customer?: { firstname?: string; lastname?: string; email?: string; phone?: string },
    returnUrl?: string
  ): Promise<{ success: boolean; checkoutUrl?: string; token?: string; transactionId?: string; simulated?: boolean; message?: string }> {
    await this.simulateDelay();
    const txId = `mock_feda_${Date.now()}`;
    const baseUrl = returnUrl || 'https://revizo-nine.vercel.app';
    const checkoutUrl = `${baseUrl}?payment=success&tx_id=${txId}&plan=${plan}&mode=mock`;

    return {
      success: true,
      checkoutUrl,
      token: `tok_${txId}`,
      transactionId: txId,
      simulated: true,
      message: 'Session FedaPay simulée pour le développement local.'
    };
  }

  async consumeEnergy(
    amount: number = 1,
    reason: string = 'Session pédagogique',
    referenceId?: string
  ): Promise<{ success: boolean; currentEnergy: number; maxEnergy: number; message?: string }> {
    await this.simulateDelay();
    const userId = this.profile.id;
    this.initUserEconomy(userId);

    const energy = this.userEnergy.get(userId)!;
    if (energy.currentEnergy < amount) {
      return {
        success: false,
        currentEnergy: energy.currentEnergy,
        maxEnergy: energy.maxEnergy,
        message: 'Énergie insuffisante. Convertis 5 diamants pour obtenir 1 énergie.'
      };
    }

    energy.currentEnergy -= amount;
    this.progress.energyBalance = energy.currentEnergy;

    this.energyTransactions.unshift({
      id: `etx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      amount: -amount,
      balanceAfter: energy.currentEnergy,
      reason,
      referenceId,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      currentEnergy: energy.currentEnergy,
      maxEnergy: energy.maxEnergy
    };
  }

  async convertDiamondsToEnergy(): Promise<EnergyConversionResult> {
    await this.simulateDelay();
    const userId = this.profile.id;
    this.initUserEconomy(userId);

    const diamonds = this.userDiamonds.get(userId)!;
    const energy = this.userEnergy.get(userId)!;

    if (energy.currentEnergy >= energy.maxEnergy) {
      return {
        success: false,
        error: 'energy_already_full',
        message: 'Ton énergie est déjà à son maximum.',
        currentDiamonds: diamonds.balance,
        currentEnergy: energy.currentEnergy,
        maxEnergy: energy.maxEnergy,
        convertedToday: energy.diamondsConvertedToday
      };
    }

    if (diamonds.balance < 5) {
      return {
        success: false,
        error: 'insufficient_diamonds',
        message: 'Il te faut au moins 5 diamants pour obtenir 1 énergie.',
        currentDiamonds: diamonds.balance,
        currentEnergy: energy.currentEnergy,
        maxEnergy: energy.maxEnergy,
        convertedToday: energy.diamondsConvertedToday
      };
    }

    if (energy.diamondsConvertedToday >= 10) {
      return {
        success: false,
        error: 'daily_conversion_limit_reached',
        message: 'Tu as atteint la limite quotidienne de 10 énergies récupérées par diamants.',
        currentDiamonds: diamonds.balance,
        currentEnergy: energy.currentEnergy,
        maxEnergy: energy.maxEnergy,
        convertedToday: energy.diamondsConvertedToday
      };
    }

    diamonds.balance -= 5;
    energy.currentEnergy += 1;
    energy.diamondsConvertedToday += 1;
    this.progress.diamondsBalance = diamonds.balance;
    this.progress.energyBalance = energy.currentEnergy;

    this.diamondTransactions.unshift({
      id: `dtx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      amount: -5,
      balanceAfter: diamonds.balance,
      reason: 'Conversion en 1 énergie ⚡',
      createdAt: new Date().toISOString()
    });

    this.energyTransactions.unshift({
      id: `etx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      amount: 1,
      balanceAfter: energy.currentEnergy,
      reason: 'Conversion de 5 diamants 💎',
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      currentDiamonds: diamonds.balance,
      currentEnergy: energy.currentEnergy,
      maxEnergy: energy.maxEnergy,
      convertedToday: energy.diamondsConvertedToday
    };
  }

  async claimReward(
    eventKey: string,
    _rewardType: string,
    diamonds: number,
    reason: string,
    _metadata?: any
  ): Promise<RewardClaimResult> {
    await this.simulateDelay();
    const userId = this.profile.id;
    this.initUserEconomy(userId);

    const diamondsState = this.userDiamonds.get(userId)!;

    if (this.rewardEvents.has(eventKey)) {
      return {
        success: true,
        alreadyClaimed: true,
        diamondsAwarded: 0,
        currentDiamonds: diamondsState.balance,
        message: 'Cette récompense a déjà été attribuée.'
      };
    }

    this.rewardEvents.add(eventKey);
    diamondsState.balance += diamonds;
    this.progress.diamondsBalance = diamondsState.balance;

    this.diamondTransactions.unshift({
      id: `dtx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      amount: diamonds,
      balanceAfter: diamondsState.balance,
      reason,
      referenceId: eventKey,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      alreadyClaimed: false,
      diamondsAwarded: diamonds,
      currentDiamonds: diamondsState.balance
    };
  }

  async applyReferralCode(code: string): Promise<{ success: boolean; message: string }> {
    await this.simulateDelay();
    const userId = this.profile.id;
    this.initUserEconomy(userId);

    const cleanCode = code.trim().toUpperCase();
    let referrerId = this.referralCodes.get(cleanCode);
    if (!referrerId) {
      for (const [uid, acc] of this.referralAccounts.entries()) {
        if (acc.referralCode === cleanCode) {
          referrerId = uid;
          this.referralCodes.set(cleanCode, uid);
          break;
        }
      }
    }

    if (!referrerId) {
      return { success: false, message: 'Ce code de parrainage n\'existe pas.' };
    }

    if (referrerId === userId) {
      return { success: false, message: 'Tu ne peux pas utiliser ton propre code de parrainage.' };
    }

    const currentRef = this.referralAccounts.get(userId)!;
    if (currentRef.referredByUserId) {
      return { success: false, message: 'Tu as déjà utilisé un code de parrainage.' };
    }

    currentRef.referredByUserId = referrerId;
    currentRef.referralStatus = 'pending';

    const referrerRef = this.referralAccounts.get(referrerId);
    if (referrerRef) {
      referrerRef.totalReferrals += 1;
    }

    return {
      success: true,
      message: 'Code de parrainage appliqué ! Ton parrain recevra 10 💎 dès ton premier abonnement.'
    };
  }

  async recordRevisionUsage(): Promise<RevisionUsageResult> {
    await this.simulateDelay();
    const userId = this.profile.id;
    this.initUserEconomy(userId);

    const energy = this.userEnergy.get(userId)!;
    if (energy.dailyRevisionUsed >= energy.dailyRevisionLimit) {
      return {
        allowed: false,
        limit: energy.dailyRevisionLimit,
        used: energy.dailyRevisionUsed,
        remaining: 0,
        error: 'daily_limit_reached',
        message: `Tu as atteint ta limite de ${energy.dailyRevisionLimit} révisions du jour. Ton compteur sera réinitialisé demain.`
      };
    }

    energy.dailyRevisionUsed += 1;
    energy.dailyRevisionRemaining = energy.dailyRevisionLimit - energy.dailyRevisionUsed;

    return {
      allowed: true,
      limit: energy.dailyRevisionLimit,
      used: energy.dailyRevisionUsed,
      remaining: energy.dailyRevisionRemaining
    };
  }

  async getTransactionHistory(): Promise<{ diamonds: DiamondTransaction[]; energy: EnergyTransaction[] }> {
    await this.simulateDelay();
    const userId = this.profile.id;
    return {
      diamonds: this.diamondTransactions.filter(t => t.userId === userId),
      energy: this.energyTransactions.filter(t => t.userId === userId)
    };
  }
}
