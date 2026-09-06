import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SupabaseExerciseRow, SupabaseComprehensionQuestionRow, SupabaseQuizPlanRow } from '../types/database.types';
import { Exercise, ComprehensionQuestion, QuizPlan } from '../types';

export class ExerciseRepository {
  constructor(private client: SupabaseClient<Database>) {}

  // --- Comprehension Questions ---
  async getComprehensionQuestionsByCourseId(courseId: string, userId: string): Promise<ComprehensionQuestion[]> {
    const { data, error } = await this.client
      .from('comprehension_questions')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return (data as SupabaseComprehensionQuestionRow[]).map(row => ({
      id: row.id,
      courseId: row.course_id,
      conceptId: row.concept_id || undefined,
      question: row.question,
      expectedAnswer: row.expected_answer,
      explanation: row.explanation,
      sourceReferences: row.source_references || [],
      createdAt: row.created_at
    }));
  }

  async saveComprehensionQuestions(questions: ComprehensionQuestion[], userId: string): Promise<void> {
    if (questions.length === 0) return;
    const payload = questions.map(q => ({
      id: q.id,
      course_id: q.courseId,
      concept_id: q.conceptId || null,
      user_id: userId,
      question: q.question,
      expected_answer: q.expectedAnswer,
      explanation: q.explanation,
      source_references: q.sourceReferences || []
    }));

    await this.client.from('comprehension_questions').insert(payload as any);
  }

  // --- Exercises ---
  async getExercisesByCourseId(courseId: string, userId: string): Promise<Exercise[]> {
    const { data, error } = await this.client
      .from('exercises')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return (data as SupabaseExerciseRow[]).map(row => ({
      id: row.id,
      courseId: row.course_id,
      conceptId: row.concept_id || undefined,
      statement: row.statement,
      instructions: row.instructions,
      expectedMethod: row.expected_method || undefined,
      correction: row.correction,
      difficulty: (row.difficulty as any) || 2,
      sourceReferences: row.source_references || [],
      status: row.status,
      userAnswer: row.user_answer || undefined,
      score: row.score || undefined,
      createdAt: row.created_at
    }));
  }

  async saveExercises(exercises: Exercise[], userId: string): Promise<void> {
    if (exercises.length === 0) return;
    const payload = exercises.map(ex => ({
      id: ex.id,
      course_id: ex.courseId,
      concept_id: ex.conceptId || null,
      user_id: userId,
      statement: ex.statement,
      instructions: ex.instructions,
      expected_method: ex.expectedMethod || null,
      correction: ex.correction,
      difficulty: ex.difficulty,
      source_references: ex.sourceReferences || [],
      status: ex.status || 'pending',
      user_answer: ex.userAnswer || null,
      score: ex.score || null
    }));

    await this.client.from('exercises').insert(payload as any);
  }

  // --- Quiz Plans ---
  async getQuizPlanByCourseId(courseId: string, userId: string): Promise<QuizPlan | null> {
    const { data, error } = await this.client
      .from('quiz_plans')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    const row = data as SupabaseQuizPlanRow;
    return {
      id: row.id,
      courseId: row.course_id,
      title: row.title,
      plannedQuizzes: (row.planned_quizzes as any) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async saveQuizPlan(plan: QuizPlan, userId: string): Promise<void> {
    const payload = {
      id: plan.id,
      course_id: plan.courseId,
      user_id: userId,
      title: plan.title,
      planned_quizzes: plan.plannedQuizzes
    };

    await this.client.from('quiz_plans').insert(payload as any);
  }
}
