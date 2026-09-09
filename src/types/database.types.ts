/**
 * REVIZO — Types Supabase Database
 * Représente la structure exacte des tables PostgreSQL dans Supabase.
 * Aucune dépendance directe entre les composants React et ce fichier.
 * La passerelle se fait exclusivement via les Mappers.
 */

import { SectionPresentationFormat, QuestionCategory, SourceReference } from './index';

export type SupabaseUserRow = {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string;
  grade_level: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseCourseRow = {
  id: string;
  user_id: string;
  subject_id: string;
  subject_name: string;
  title: string;
  summary: string;
  difficulty: number;
  status: 'draft' | 'analyzing' | 'ready' | 'error';
  concepts_count: number;
  progress_pct: number;
  original_document_name: string | null;
  file_size: number | null;
  is_downloaded: boolean;
  downloaded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseCourseFileRow = {
  id: string;
  course_id: string;
  user_id: string;
  name: string;
  file_type: string;
  storage_path: string;
  size_bytes: number;
  created_at: string;
};

export type SupabaseAnalysisRow = {
  id: string;
  course_id: string;
  user_id: string;
  structured_result: Record<string, unknown>;
  model_version: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

export type SupabaseConceptRow = {
  id: string;
  course_id: string;
  analysis_id: string | null;
  user_id: string;
  name: string;
  summary: string;
  importance: number;
  difficulty: number;
  mastery_score: number;
  order_index: number;
  key_points: string[];
  rules_formulas?: string[] | null;
  created_at: string;
};

export type SupabaseRevisionRow = {
  id: string;
  course_id: string;
  analysis_id: string | null;
  user_id: string;
  title: string;
  summary: string;
  key_concepts: string[];
  rules_formulas?: string[] | null;
  sections: Array<{
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
  }>;
  total_sections: number;
  reading_time_minutes: number;
  is_downloaded: boolean;
  downloaded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseQuizRow = {
  id: string;
  course_id: string;
  revision_id: string | null;
  user_id: string;
  title: string;
  course_title: string;
  difficulty: number;
  total_questions: number;
  questions: Array<{
    id: string;
    conceptId: string;
    questionCategory?: QuestionCategory;
    question: string;
    choices: string[];
    correctChoiceIndex: number;
    explanation: string;
    difficulty: number;
    sourceReferences?: SourceReference[];
  }>;
  created_at: string;
};

export type SupabaseQuizQuestionRow = {
  id: string;
  quiz_id: string;
  concept_id: string;
  question: string;
  options: string[];
  correct_choice_index: number;
  explanation: string;
  difficulty: number;
  order_index: number;
  created_at: string;
};

export type SupabaseQuizResultRow = {
  id: string;
  user_id: string;
  quiz_id: string;
  course_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  xp_earned: number;
  attempts: Array<{
    questionId: string;
    conceptId: string;
    selectedChoiceIndex: number;
    isCorrect: boolean;
    energyLost: number;
    xpAwarded: number;
    answeredAt: string;
  }>;
  created_at: string;
};

export type SupabaseProgressRow = {
  user_id: string;
  total_xp: number;
  level: number;
  xp_to_next_level: number;
  current_streak: number;
  longest_streak: number;
  diamonds_balance: number;
  energy_balance: number;
  daily_goal_minutes: number;
  daily_goal_progress_minutes: number;
  last_activity_date: string;
  weekly_days: boolean[];
  updated_at: string;
};

export type SupabaseNotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relative_time: string | null;
  target_tab: string | null;
  target_id: string | null;
  created_at: string;
};

export type SupabaseSettingsRow = {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  animations_enabled: boolean;
  language: string;
  notifications_revision: boolean;
  notifications_daily_reminders: boolean;
  notifications_rewards: boolean;
  updated_at: string;
};

export type SupabaseComprehensionQuestionRow = {
  id: string;
  course_id: string;
  concept_id: string | null;
  user_id: string;
  question: string;
  expected_answer: string;
  explanation: string;
  source_references: Array<{ page?: number; section?: string; paragraphSnippet?: string }>;
  created_at: string;
};

export type SupabaseQuizPlanRow = {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  planned_quizzes: Array<{
    quizId: string;
    title: string;
    purpose: string;
    difficulty: number;
    conceptIds: string[];
    questionsCount: number;
    scheduledSession: number;
    isReady: boolean;
  }>;
  created_at: string;
  updated_at: string;
};

export type SupabaseExerciseRow = {
  id: string;
  course_id: string;
  concept_id: string | null;
  user_id: string;
  statement: string;
  instructions: string;
  expected_method: string | null;
  correction: string;
  difficulty: number;
  source_references: Array<{ page?: number; section?: string; paragraphSnippet?: string }>;
  status: 'pending' | 'completed' | 'needs_review';
  user_answer: string | null;
  score: number | null;
  created_at: string;
  updated_at: string;
};

/**
 * Schéma Database global conforme GenericSchema pour @supabase/supabase-js
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: SupabaseUserRow;
        Insert: Omit<SupabaseUserRow, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<SupabaseUserRow>;
        Relationships: [];
      };
      courses: {
        Row: SupabaseCourseRow;
        Insert: Omit<SupabaseCourseRow, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<SupabaseCourseRow>;
        Relationships: [];
      };
      course_files: {
        Row: SupabaseCourseFileRow;
        Insert: Omit<SupabaseCourseFileRow, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<SupabaseCourseFileRow>;
        Relationships: [];
      };
      analyses: {
        Row: SupabaseAnalysisRow;
        Insert: Omit<SupabaseAnalysisRow, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<SupabaseAnalysisRow>;
        Relationships: [];
      };
      concepts: {
        Row: SupabaseConceptRow;
        Insert: Omit<SupabaseConceptRow, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<SupabaseConceptRow>;
        Relationships: [];
      };
      revisions: {
        Row: SupabaseRevisionRow;
        Insert: Omit<SupabaseRevisionRow, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<SupabaseRevisionRow>;
        Relationships: [];
      };
      quizzes: {
        Row: SupabaseQuizRow;
        Insert: Omit<SupabaseQuizRow, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<SupabaseQuizRow>;
        Relationships: [];
      };
      quiz_questions: {
        Row: SupabaseQuizQuestionRow;
        Insert: Omit<SupabaseQuizQuestionRow, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<SupabaseQuizQuestionRow>;
        Relationships: [];
      };
      quiz_results: {
        Row: SupabaseQuizResultRow;
        Insert: Omit<SupabaseQuizResultRow, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<SupabaseQuizResultRow>;
        Relationships: [];
      };
      user_progress: {
        Row: SupabaseProgressRow;
        Insert: Omit<SupabaseProgressRow, 'updated_at'> & {
          updated_at?: string;
        };
        Update: Partial<SupabaseProgressRow>;
        Relationships: [];
      };
      notifications: {
        Row: SupabaseNotificationRow;
        Insert: Omit<SupabaseNotificationRow, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<SupabaseNotificationRow>;
        Relationships: [];
      };
      user_settings: {
        Row: SupabaseSettingsRow;
        Insert: Omit<SupabaseSettingsRow, 'updated_at'> & {
          updated_at?: string;
        };
        Update: Partial<SupabaseSettingsRow>;
        Relationships: [];
      };
      comprehension_questions: {
        Row: SupabaseComprehensionQuestionRow;
        Insert: Omit<SupabaseComprehensionQuestionRow, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<SupabaseComprehensionQuestionRow>;
        Relationships: [];
      };
      quiz_plans: {
        Row: SupabaseQuizPlanRow;
        Insert: Omit<SupabaseQuizPlanRow, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<SupabaseQuizPlanRow>;
        Relationships: [];
      };
      exercises: {
        Row: SupabaseExerciseRow;
        Insert: Omit<SupabaseExerciseRow, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<SupabaseExerciseRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
