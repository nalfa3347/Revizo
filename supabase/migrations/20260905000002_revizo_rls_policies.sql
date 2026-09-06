-- ==============================================================================
-- REVIZO 2.0 — Migration 002 : Politiques de Sécurité Row Level Security (RLS)
-- Date : 2026-09-05
-- Description : Activation de RLS sur toutes les tables et isolation stricte
--               multi-tenant basée sur auth.uid().
--               Aucun utilisateur ne peut lire ou modifier les données d'autrui.
-- ==============================================================================

-- 1. Table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_own" ON public.users
  FOR DELETE USING (auth.uid() = id);

-- 2. Table courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_own" ON public.courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "courses_insert_own" ON public.courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "courses_update_own" ON public.courses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "courses_delete_own" ON public.courses
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Table course_files
ALTER TABLE public.course_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_files_select_own" ON public.course_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "course_files_insert_own" ON public.course_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "course_files_update_own" ON public.course_files
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "course_files_delete_own" ON public.course_files
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Table analyses
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analyses_select_own" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "analyses_insert_own" ON public.analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_update_own" ON public.analyses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_delete_own" ON public.analyses
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Table concepts
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concepts_select_own" ON public.concepts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "concepts_insert_own" ON public.concepts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "concepts_update_own" ON public.concepts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "concepts_delete_own" ON public.concepts
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Table revisions
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revisions_select_own" ON public.revisions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "revisions_insert_own" ON public.revisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "revisions_update_own" ON public.revisions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "revisions_delete_own" ON public.revisions
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Table quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes_select_own" ON public.quizzes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quizzes_insert_own" ON public.quizzes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quizzes_update_own" ON public.quizzes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quizzes_delete_own" ON public.quizzes
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Table quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_questions_select_own" ON public.quiz_questions
  FOR SELECT USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "quiz_questions_insert_own" ON public.quiz_questions
  FOR INSERT WITH CHECK (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "quiz_questions_update_own" ON public.quiz_questions
  FOR UPDATE USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  ) WITH CHECK (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "quiz_questions_delete_own" ON public.quiz_questions
  FOR DELETE USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

-- 9. Table quiz_results
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_results_select_own" ON public.quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quiz_results_insert_own" ON public.quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_results_update_own" ON public.quiz_results
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_results_delete_own" ON public.quiz_results
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Table user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_progress_select_own" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_progress_insert_own" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_update_own" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_delete_own" ON public.user_progress
  FOR DELETE USING (auth.uid() = user_id);

-- 11. Table notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 12. Table user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_select_own" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_settings_insert_own" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_update_own" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_delete_own" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);
