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
  ComprehensionQuestion,
  Exercise,
  QuizPlan
} from '../types';

/**
 * REVIZO — Contrat de la Couche d'Accès aux Données (DAL)
 * Permet l'isolation complète entre l'UI et la persistance.
 * Utilisé par MockDataProvider en phase locale, puis par SupabaseDataProvider.
 */
export interface IDataProvider {
  // Profil & Progression
  getProfile(): Promise<UserProfile>;
  updateProfile(updates: Partial<UserProfile>): Promise<UserProfile>;
  setActiveProfile?(user: UserProfile): void;
  getProgress(): Promise<UserProgress>;
  spendDiamondsForEnergy(amount: number): Promise<{ success: boolean; newEnergy: number; newDiamonds: number }>;

  // Paramètres & Préférences
  getSettings(): Promise<AppSettings>;
  updateSettings(updates: Partial<AppSettings>): Promise<AppSettings>;

  // Matières
  getSubjects(): Promise<Subject[]>;

  // Cours
  getCourses(subjectId?: string): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | null>;
  createCourse(course: Partial<Course>): Promise<Course>;
  deleteCourse(id: string): Promise<boolean>;

  // Concepts & Notions
  getConceptsByCourseId(courseId: string): Promise<CourseConcept[]>;
  getWeakConcepts(): Promise<CourseConcept[]>;
  updateConceptMastery(conceptId: string, masteryDelta: number): Promise<CourseConcept>;

  // Révisions
  getRevisionByCourseId(courseId: string): Promise<Revision | null>;
  markRevisionDownloaded(revisionId: string, isDownloaded: boolean): Promise<boolean>;

  // Quiz
  getQuizzes(): Promise<Quiz[]>;
  getQuizByCourseId(courseId: string): Promise<Quiz | null>;
  startQuizSession(quizId: string): Promise<QuizSession>;
  submitQuizAnswer(sessionId: string, attempt: { questionId: string; conceptId: string; selectedChoiceIndex: number }): Promise<{
    session: QuizSession;
    isCorrect: boolean;
    explanation: string;
    xpEarned: number;
  }>;

  // Pipeline IA & Traitements
  createProcessingJob(courseId: string): Promise<ProcessingJob>;
  getProcessingJob(jobId: string): Promise<ProcessingJob | null>;
  saveImportedCourseData(
    course: Course,
    concepts: CourseConcept[],
    revision: Revision,
    quiz: Quiz,
    comprehensionQuestions?: ComprehensionQuestion[],
    exercises?: Exercise[],
    quizPlan?: QuizPlan
  ): Promise<void>;

  // Curriculum Avancé
  getComprehensionQuestions(courseId: string): Promise<ComprehensionQuestion[]>;
  getExercises(courseId: string): Promise<Exercise[]>;
  getQuizPlan(courseId: string): Promise<QuizPlan | null>;

  // Notifications
  getNotifications(): Promise<AppNotification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(): Promise<void>;
  clearAllNotifications(): Promise<void>;

  // Recherche Globale
  searchAll(query: string): Promise<SearchResultItem[]>;
}
