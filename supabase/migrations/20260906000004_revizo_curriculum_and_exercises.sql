-- ==============================================================================
-- REVIZO 2.0 — Migration 004 : Curriculum Pédagogique Avancé
-- (Questions de Compréhension, Plans de Quiz Espacés & Exercices Adaptatifs)
-- Date : 2026-09-06
-- ==============================================================================

-- 1. Table : comprehension_questions (Questions immédiates de vérification)
CREATE TABLE IF NOT EXISTS public.comprehension_questions (
  id TEXT PRIMARY KEY DEFAULT ('qst-' || gen_random_uuid()::text),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  concept_id TEXT REFERENCES public.concepts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  expected_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  source_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comprehension_questions_course_id ON public.comprehension_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_comprehension_questions_user_id ON public.comprehension_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_comprehension_questions_concept_id ON public.comprehension_questions(concept_id);

ALTER TABLE public.comprehension_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comprehension_questions_select_own" ON public.comprehension_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "comprehension_questions_insert_own" ON public.comprehension_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comprehension_questions_update_own" ON public.comprehension_questions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comprehension_questions_delete_own" ON public.comprehension_questions
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Table : quiz_plans (Planification de quiz espacés dans le temps)
CREATE TABLE IF NOT EXISTS public.quiz_plans (
  id TEXT PRIMARY KEY DEFAULT ('qzp-' || gen_random_uuid()::text),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  planned_quizzes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_plans_course_id ON public.quiz_plans(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_plans_user_id ON public.quiz_plans(user_id);

ALTER TABLE public.quiz_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_plans_select_own" ON public.quiz_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quiz_plans_insert_own" ON public.quiz_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_plans_update_own" ON public.quiz_plans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_plans_delete_own" ON public.quiz_plans
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_quiz_plans_updated_at
  BEFORE UPDATE ON public.quiz_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Table : exercises (Exercices adaptatifs avec énoncé, méthode et correction)
CREATE TABLE IF NOT EXISTS public.exercises (
  id TEXT PRIMARY KEY DEFAULT ('exo-' || gen_random_uuid()::text),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  concept_id TEXT REFERENCES public.concepts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  instructions TEXT NOT NULL,
  expected_method TEXT,
  correction TEXT NOT NULL,
  difficulty SMALLINT NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 5),
  source_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'needs_review')),
  user_answer TEXT,
  score SMALLINT CHECK (score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_course_id ON public.exercises(course_id);
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON public.exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_concept_id ON public.exercises(concept_id);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises_select_own" ON public.exercises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "exercises_insert_own" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercises_update_own" ON public.exercises
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercises_delete_own" ON public.exercises
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
