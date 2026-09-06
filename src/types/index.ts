/**
 * REVIZO — Modèles du Domaine Métier
 * Types centraux découplés de l'infrastructure de persistance
 */

export type SchoolLevel = '6e' | '5e' | '4e' | '3e' | '2nde' | '1ere' | 'Terminale' | 'Superieur';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  displayName: string;
  avatarUrl?: string;
  gradeLevel: SchoolLevel;
  joinedAt: string;
}

export interface SignInCredentials {
  identifier: string; // Email ou téléphone
  password: string;
}

export interface SignUpData {
  identifier: string;
  identifierType: 'email' | 'phone';
  password: string;
  displayName: string;
  gradeLevel: SchoolLevel;
}

export interface UserProgress {
  userId: string;
  totalXp: number;
  level: number;
  xpToNextLevel?: number; // Ex: 260 XP avant le niveau 9
  currentStreak: number;
  longestStreak: number;
  diamondsBalance: number;
  energyBalance: number; // 0 à 3 max
  dailyGoalMinutes: number; // Ex: 15 min
  dailyGoalProgressMinutes: number; // Ex: 10 min (70%)
  lastActivityDate: string;
  weeklyDays?: boolean[]; // Ex: [true, true, true, true, true, true, false] pour L, M, M, J, V, S, D
}

export interface Subject {
  id: string;
  name: string;
  color: string; // Ex: '#F59E0B'
  icon: string;  // Nom d'icône Lucide
  masteryScore?: number; // Ex: 78%
  level?: number;        // Ex: Niveau 6
}

export interface CourseConcept {
  id: string;
  courseId: string;
  name: string;
  summary: string;
  importance: 1 | 2 | 3 | 4 | 5;
  masteryScore: number; // 0 à 100%
  keyPoints: string[];
  rulesFormulas?: string[];
  isWeak?: boolean; // Déduit si masteryScore < 60%
}

export interface RevisionSection {
  id: string;
  order: number;
  title: string;
  content: string;
  keyTakeaways: string[];
  formulas?: string[];
  examples?: string[];
}

export interface CourseAnalysis {
  courseId: string;
  title: string;
  subjectName: string;
  subjectId: string;
  summary: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  concepts: CourseConcept[];
  sections: {
    title: string;
    content: string;
    keyTakeaways: string[];
  }[];
  extractedKeywords: string[];
  rawTextSnippet?: string;
  pagesCount?: number;
}

export interface Revision {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  summary: string;
  sections: RevisionSection[];
  totalSections: number;
  keyConcepts: string[];
  rulesFormulas: string[];
  isDownloaded: boolean;
  downloadedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  summary: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  status: 'draft' | 'analyzing' | 'ready' | 'error';
  conceptsCount: number;
  originalDocumentName?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
  isDownloaded?: boolean; // Indique si la révision a été téléchargée sur l'appareil
  progressPercentage?: number; // Pourcentage de révision (ex: 65%)
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  courseId: string;
  conceptId: string;
  conceptName: string;
  question: string;
  choices: string[];
  correctChoiceIndex: number;
  explanation: string;
  difficulty: 1 | 2 | 3;
}

export interface Quiz {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  totalQuestions: number;
  difficulty: 1 | 2 | 3;
  status: 'available' | 'in_progress' | 'completed';
  bestScore?: number;
  lastPlayedAt?: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  questionId: string;
  conceptId: string;
  selectedChoiceIndex: number;
  isCorrect: boolean;
  energyLost: number;
  xpAwarded: number;
  answeredAt: string;
}

export interface QuizSession {
  id: string;
  quizId: string;
  courseId: string;
  currentPosition: number;
  totalQuestions: number;
  energyRemaining: number;
  status: 'active' | 'victory' | 'game_over';
  attempts: QuizAttempt[];
  startedAt: string;
  completedAt?: string;
}

export type ProcessingStep = 'upload' | 'ocr' | 'analysis' | 'concepts' | 'revision' | 'quiz';

export interface ProcessingJob {
  id: string;
  courseId: string;
  step: ProcessingStep;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressPct: number;
  message: string;
  errorDetails?: string;
}

export type NotificationType =
  | 'revision'
  | 'reminder'
  | 'progress'
  | 'quiz'
  | 'reward'
  | 'info'
  | 'success'
  | 'alert'
  | 'streak';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  targetTab?: 'revisions' | 'courses' | 'quizzes' | 'profile';
  targetId?: string; // ID du cours ou du quiz associé
  relativeTime?: string;
}

export type SearchResultType = 'course' | 'revision' | 'quiz';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subjectName: string;
  subjectColor?: string;
  description: string;
  badgeText: string;
  courseId: string;
  targetTab: 'revisions' | 'courses' | 'quizzes';
  extraInfo?: string;
}

export interface AppSettings {
  theme: 'light';
  animationsEnabled: boolean;
  language: 'fr';
  notificationsRevision: boolean;
  notificationsDailyReminders: boolean;
  notificationsRewards: boolean;
}

