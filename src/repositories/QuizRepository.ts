import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SupabaseQuizRow, SupabaseQuizResultRow } from '../types/database.types';
import { Quiz } from '../types';
import { QuizMapper } from '../mappers/QuizMapper';

export class QuizRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async listByUserId(userId: string): Promise<Quiz[]> {
    const { data, error } = await this.client
      .from('quizzes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[QuizRepository.listByUserId] Erreur Supabase :', error);
      return [];
    }
    return (data as SupabaseQuizRow[]).map(QuizMapper.toDomain);
  }

  async getByCourseId(courseId: string, userId: string): Promise<Quiz | null> {
    const { data, error } = await this.client
      .from('quizzes')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return QuizMapper.toDomain(data as SupabaseQuizRow);
  }

  async create(quiz: Partial<Quiz>, userId: string): Promise<Quiz> {
    const payload = QuizMapper.toRow(quiz, userId);
    const { data, error } = await this.client
      .from('quizzes')
      .insert(payload as any)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`[QuizRepository.create] Impossible d’enregistrer le quiz : ${error?.message}`);
    }
    return QuizMapper.toDomain(data as SupabaseQuizRow);
  }

  async saveResult(result: Omit<SupabaseQuizResultRow, 'created_at'>): Promise<void> {
    const { error } = await this.client
      .from('quiz_results')
      .insert(result as any);

    if (error) {
      console.error('[QuizRepository.saveResult] Erreur sauvegarde résultat :', error);
    }
  }
}
