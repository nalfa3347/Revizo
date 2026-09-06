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
  xpToNextLevel?: number;
  currentStreak: number;
  longestStreak: number;
  diamondsBalance: number;
  energyBalance: number; // 0 à 3 max
  dailyGoalMinutes: number;
  dailyGoalProgressMinutes: number;
  lastActivityDate: string;
  weeklyDays?: boolean[];
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  masteryScore?: number;
  level?: number;
}

export interface SourceReference {
  page?: number;
  section?: string;
  paragraphSnippet?: string;
}

export type MustMemorizePriority = 'essential' | 'important' | 'useful' | 'contextual';

export interface MustMemorizeItem {
  conceptId: string;
  item: string;
  reason: string;
  priority: MustMemorizePriority;
  sourceReferences: SourceReference[];
}

export interface CourseConcept {
  id: string;
  courseId: string;
  name: string;
  definition?: string;
  explanation?: string;
  summary: string;
  importance: 1 | 2 | 3 | 4 | 5;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  masteryScore: number; // 0 à 100%
  keyPoints: string[];
  rulesFormulas?: string[];
  prerequisites?: string[];
  relatedConcepts?: string[];
  sourceReferences?: SourceReference[];
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
  sourceReferences?: SourceReference[];
}

export interface CourseAnalysis {
  courseId: string;
  title: string;
  subjectName: string;
  subjectId: string;
  schoolLevel?: SchoolLevel;
  language?: string;
  coursePurpose?: string;
  centralIdea?: string;
  learningObjectives?: string[];
  prerequisites?: string[];
  summary: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  concepts: CourseConcept[];
  mustMemorize?: MustMemorizeItem[];
  methods?: {
    name: string;
    purpose: string;
    steps: string[];
    conditions?: string;
    sourceReferences: SourceReference[];
  }[];
  rulesFormulas?: {
    expression: string;
    meaning: string;
    conditions?: string;
    sourceReferences: SourceReference[];
  }[];
  examples?: {
    statement: string;
    explanation: string;
    conceptIds: string[];
    sourceReferences: SourceReference[];
  }[];
  sections: {
    title: string;
    content: string;
    keyTakeaways: string[];
    sourceReferences?: SourceReference[];
  }[];
  extractedKeywords: string[];
  rawTextSnippet?: string;
  pagesCount?: number;
}

export interface RevisionMethod {
  name: string;
  steps: string[];
  conceptId?: string;
}

export interface RevisionFormula {
  name: string;
  formula: string;
  conditions?: string;
  conceptId?: string;
}

export interface Revision {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  summary: string; // essentialSummary
  essentialSummary?: string;
  fundamentalNotions?: string[];
  keyPoints?: string[];
  methods?: RevisionMethod[];
  formulas?: RevisionFormula[];
  examples?: string[];
  commonPitfalls?: string[];
  memorizationChecklist?: string[];
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
  isDownloaded?: boolean;
  progressPercentage?: number;
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
  sourceReferences?: SourceReference[];
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
  purpose?: string;
  scheduledSession?: number;
}

export interface ComprehensionQuestion {
  id: string;
  courseId: string;
  conceptId?: string;
  question: string;
  expectedAnswer: string;
  explanation: string;
  type?: 'comprehension' | 'definition' | 'relation' | 'method' | 'application';
  sourceReferences: SourceReference[];
  userAnswer?: string;
  isVerified?: boolean;
  createdAt?: string;
}

export interface Exercise {
  id: string;
  courseId: string;
  conceptId?: string;
  statement: string;
  instructions: string;
  expectedMethod?: string;
  correction: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  sourceReferences: SourceReference[];
  status: 'pending' | 'completed' | 'needs_review';
  userAnswer?: string;
  score?: number;
  createdAt?: string;
}

export interface PlannedQuizItem {
  quizId: string;
  title: string;
  purpose: string;
  difficulty: 1 | 2 | 3;
  conceptIds: string[];
  questionsCount: number;
  scheduledSession: number;
  isReady: boolean;
}

export interface QuizPlan {
  id: string;
  courseId: string;
  title: string;
  plannedQuizzes: PlannedQuizItem[];
  createdAt: string;
  updatedAt: string;
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
  targetId?: string;
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
