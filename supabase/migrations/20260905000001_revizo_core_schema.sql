-- ==============================================================================
-- REVIZO 2.0 — Migration 001 : Schéma Central des Tables PostgreSQL
-- Date : 2026-09-05
-- Description : Création des 12 tables métier avec contraintes d'intégrité,
--               clés étrangères en cascade et index de performance.
-- ==============================================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fonction utilitaire pour la mise à jour automatique du champ updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. Table: users (Profils d'élèves synchronisés avec auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  display_name TEXT NOT NULL,
  grade_level TEXT NOT NULL DEFAULT '3e',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 2. Table: courses (Cours importés et organisés par matière)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  difficulty SMALLINT NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('draft', 'analyzing', 'ready', 'error')),
  concepts_count INTEGER NOT NULL DEFAULT 0,
  progress_pct INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  original_document_name TEXT,
  file_size BIGINT,
  is_downloaded BOOLEAN NOT NULL DEFAULT FALSE,
  downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_subject_id ON public.courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at DESC);

CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 3. Table: course_files (Fichiers sources associés aux cours)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_files (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_files_course_id ON public.course_files(course_id);
CREATE INDEX IF NOT EXISTS idx_course_files_user_id ON public.course_files(user_id);

-- ------------------------------------------------------------------------------
-- 4. Table: analyses (Résultats d'analyse sémantique IA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analyses (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  structured_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_version TEXT NOT NULL DEFAULT 'gemini-1.5-pro',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_course_id ON public.analyses(course_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);

-- ------------------------------------------------------------------------------
-- 5. Table: concepts (Notions pédagogiques extraites du cours)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.concepts (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  analysis_id TEXT REFERENCES public.analyses(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  importance SMALLINT NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  difficulty SMALLINT NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 5),
  mastery_score SMALLINT NOT NULL DEFAULT 50 CHECK (mastery_score BETWEEN 0 AND 100),
  order_index INTEGER NOT NULL DEFAULT 0,
  key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  rules_formulas JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concepts_course_id ON public.concepts(course_id);
CREATE INDEX IF NOT EXISTS idx_concepts_user_id ON public.concepts(user_id);
CREATE INDEX IF NOT EXISTS idx_concepts_mastery ON public.concepts(user_id, mastery_score);

-- ------------------------------------------------------------------------------
-- 6. Table: revisions (Fiches de révision structurées)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.revisions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  analysis_id TEXT REFERENCES public.analyses(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
  rules_formulas JSONB DEFAULT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_sections INTEGER NOT NULL DEFAULT 1,
  reading_time_minutes INTEGER NOT NULL DEFAULT 3,
  is_downloaded BOOLEAN NOT NULL DEFAULT FALSE,
  downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revisions_course_id ON public.revisions(course_id);
CREATE INDEX IF NOT EXISTS idx_revisions_user_id ON public.revisions(user_id);

CREATE TRIGGER set_revisions_updated_at
  BEFORE UPDATE ON public.revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. Table: quizzes (Quiz générés associés aux révisions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  revision_id TEXT REFERENCES public.revisions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  course_title TEXT NOT NULL,
  difficulty SMALLINT NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 3),
  total_questions INTEGER NOT NULL DEFAULT 0,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);

-- ------------------------------------------------------------------------------
-- 8. Table: quiz_questions (Questions de quiz décomposées par concept)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  concept_id TEXT REFERENCES public.concepts(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_choice_index SMALLINT NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL,
  difficulty SMALLINT NOT NULL DEFAULT 2,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_concept_id ON public.quiz_questions(concept_id);

-- ------------------------------------------------------------------------------
-- 9. Table: quiz_results (Résultats des sessions de quiz)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0 CHECK (percentage BETWEEN 0 AND 100),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  attempts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON public.quiz_results(quiz_id);

-- ------------------------------------------------------------------------------
-- 10. Table: user_progress (Progression, XP, Streak, Énergie, Diamants)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  xp_to_next_level INTEGER NOT NULL DEFAULT 100,
  current_streak INTEGER NOT NULL DEFAULT 1,
  longest_streak INTEGER NOT NULL DEFAULT 1,
  diamonds_balance INTEGER NOT NULL DEFAULT 10,
  energy_balance SMALLINT NOT NULL DEFAULT 3 CHECK (energy_balance BETWEEN 0 AND 3),
  daily_goal_minutes INTEGER NOT NULL DEFAULT 15,
  daily_goal_progress_minutes INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weekly_days JSONB NOT NULL DEFAULT '[true, false, false, false, false, false, false]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 11. Table: notifications (Centre de notifications de l'élève)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'reminder',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  relative_time TEXT,
  target_tab TEXT,
  target_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ------------------------------------------------------------------------------
-- 12. Table: user_settings (Préférences utilisateur)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light',
  animations_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  language TEXT NOT NULL DEFAULT 'fr',
  notifications_revision BOOLEAN NOT NULL DEFAULT TRUE,
  notifications_daily_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  notifications_rewards BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
