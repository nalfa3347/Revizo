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
  SearchResultItem
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
  private activeSessions: Map<string, QuizSession> = new Map();
  private jobs: Map<string, ProcessingJob> = new Map();
  private latencyMs: number;

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
    quiz: Quiz
  ): Promise<void> {
    await this.simulateDelay();
    // Insère le cours en tête de liste
    this.courses.unshift({ ...course });
    this.concepts.unshift(...concepts.map(c => ({ ...c })));
    this.revisions.unshift({ ...revision });
    this.quizzes.unshift({ ...quiz });
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
}
