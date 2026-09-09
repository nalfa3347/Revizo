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

export type SectionPresentationFormat = 
  | 'definition_directe' 
  | 'question_reponse' 
  | 'mise_en_situation' 
  | 'comparaison_avant_apres';

export type QuestionCategory = 
  | 'rappel_direct' 
  | 'application_concrete' 
  | 'piege_confusion' 
  | 'mise_en_situation';

export type ExerciseType = 
  | 'application_directe' 
  | 'cas_pratique' 
  | 'analyse_piege' 
  | 'resolution_probleme';

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
  semanticAliases?: string[];
  prerequisites?: string[];
  relatedConcepts?: string[];
  sourceReferences?: SourceReference[];
  isWeak?: boolean; // Déduit si masteryScore < 60%
}

export interface RevisionSection {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  presentationFormat?: SectionPresentationFormat;
  simpleExplanation?: string;
  technicalFormulation?: string;
  analogyOrExample?: string;
  mnemonicTip?: string;
  commonMistake?: string;
  conceptId?: string;
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
  questionCategory?: QuestionCategory;
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
  questionCategory?: QuestionCategory;
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
  exerciseType?: ExerciseType;
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

// ==============================================================================
// SYSTÈME ÉCONOMIQUE, ABONNEMENTS, ÉNERGIE, DIAMANTS & PARRAINAGE
// ==============================================================================

export type SubscriptionPlan = 'free' | 'essentiel' | 'intensif' | 'premium';
export type SubscriptionStatus = 'free' | 'active' | 'expired' | 'cancelled' | 'past_due';

export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  priceFcfa: number;
  dailyRevisionLimit: number;
  maxEnergy: number;
  initialDiamonds: number;
  badge?: string;
  isPopular?: boolean;
  features: string[];
}

export interface UserSubscription {
  id?: string;
  userId: string;
  plan: SubscriptionPlan;
  price: number;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt?: string | null;
  paymentProvider?: string;
  externalSubscriptionId?: string;
  dailyRevisionLimit: number;
  dailyRevisionUsed?: number;
}

export interface UserEnergyState {
  currentEnergy: number;
  maxEnergy: number;
  dailyRevisionLimit: number;
  dailyRevisionUsed: number;
  dailyRevisionRemaining: number;
  diamondsConvertedToday: number;
  maxDailyDiamondConversions: number;
  dailyRefillsUsed?: number;
}

export interface UserDiamondsState {
  balance: number;
  lifetimeEarned?: number;
}

export interface ReferralInfo {
  referralCode: string;
  referredByUserId?: string | null;
  referralStatus: 'none' | 'pending' | 'rewarded';
  totalReferrals: number;
  rewardedReferrals: number;
  referralsCount?: number;
  rewardsEarnedCount?: number;
}

export interface EconomyState {
  subscription: UserSubscription;
  energy: UserEnergyState;
  diamonds: UserDiamondsState;
  referral: ReferralInfo;
}

export interface DiamondTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  referenceId?: string;
  createdAt: string;
}

export interface EnergyTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  referenceId?: string;
  createdAt: string;
}

export interface RewardClaimResult {
  success: boolean;
  alreadyClaimed: boolean;
  diamondsAwarded: number;
  currentDiamonds: number;
  message?: string;
}

export interface EnergyConversionResult {
  success: boolean;
  currentDiamonds: number;
  currentEnergy: number;
  maxEnergy: number;
  convertedToday: number;
  error?: string;
  message?: string;
}

export interface RevisionUsageResult {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  plan?: string;
  canUpgrade?: boolean;
  upgradeTarget?: string | null;
  error?: string;
  message?: string;
  trialExhausted?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanDetails> = {
  free: {
    id: 'free',
    name: 'Essai Gratuit',
    priceFcfa: 0,
    dailyRevisionLimit: 1,
    maxEnergy: 3,
    initialDiamonds: 10,
    features: [
      '1 cours d\'essai gratuit à vie',
      '3 énergies ⚡ max',
      'Accès aux quiz essentiels',
      'Téléchargement PDF des fiches'
    ]
  },
  essentiel: {
    id: 'essentiel',
    name: 'Essentiel',
    priceFcfa: 1000,
    dailyRevisionLimit: 4,
    maxEnergy: 10,
    initialDiamonds: 10,
    features: [
      '4 révisions intelligentes par jour',
      '10 énergies ⚡ max',
      '10 diamants 💎 de bienvenue',
      'Génération complète de quiz & exercices',
      'Accès prioritaire à l\'analyse Gemini'
    ]
  },
  intensif: {
    id: 'intensif',
    name: 'Pro',
    priceFcfa: 3000,
    dailyRevisionLimit: 10,
    maxEnergy: 20,
    initialDiamonds: 30,
    isPopular: true,
    badge: 'Le plus populaire',
    features: [
      '10 révisions intelligentes par jour',
      '20 énergies ⚡ max',
      '30 diamants 💎 de bienvenue',
      'Idéal pour préparer les examens et brevets',
      'Quiz de révision espacée illimités',
      'Support prioritaire'
    ]
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    priceFcfa: 5000,
    dailyRevisionLimit: 18,
    maxEnergy: 30,
    initialDiamonds: 60,
    badge: 'Expérience complète',
    features: [
      '18 révisions intelligentes par jour',
      '30 énergies ⚡ max',
      '60 diamants 💎 de bienvenue',
      'L\'expérience d\'apprentissage ultime',
      'Toutes les matières sans compromis',
      'Analyses documentaires approfondies'
    ]
  }
};

