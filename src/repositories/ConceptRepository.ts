import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SupabaseConceptRow } from '../types/database.types';
import { CourseConcept } from '../types';

export class ConceptRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async listByCourseId(courseId: string, userId: string): Promise<CourseConcept[]> {
    const { data, error } = await this.client
      .from('concepts')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error || !data) return [];
    return (data as SupabaseConceptRow[]).map(this.toDomain);
  }

  async listWeakByUserId(userId: string): Promise<CourseConcept[]> {
    const { data, error } = await this.client
      .from('concepts')
      .select('*')
      .eq('user_id', userId)
      .lt('mastery_score', 60)
      .order('mastery_score', { ascending: true });

    if (error || !data) return [];
    return (data as SupabaseConceptRow[]).map(this.toDomain);
  }

  async getById(id: string, userId: string): Promise<CourseConcept | null> {
    const { data, error } = await this.client
      .from('concepts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return this.toDomain(data as SupabaseConceptRow);
  }

  async updateMasteryScore(conceptId: string, userId: string, delta: number): Promise<number> {
    const current = await this.getById(conceptId, userId);
    if (!current) return 50;

    const newScore = Math.max(0, Math.min(100, current.masteryScore + delta));

    const { error } = await this.client
      .from('concepts')
      .update({ mastery_score: newScore })
      .eq('id', conceptId)
      .eq('user_id', userId);

    if (error) {
      console.error('[ConceptRepository.updateMasteryScore] Erreur mise à jour score :', error);
      return current.masteryScore;
    }

    return newScore;
  }

  async createMany(concepts: CourseConcept[], courseId: string, userId: string): Promise<void> {
    if (concepts.length === 0) return;

    const payload = concepts.map((c, idx) => ({
      id: c.id,
      course_id: courseId,
      analysis_id: null,
      user_id: userId,
      name: c.name,
      summary: c.summary,
      importance: c.importance,
      difficulty: 2,
      mastery_score: c.masteryScore ?? 50,
      order_index: idx,
      key_points: c.keyPoints || [],
      rules_formulas: c.rulesFormulas || null
    }));

    const { error } = await this.client.from('concepts').insert(payload as any);
    if (error) {
      console.error('[ConceptRepository.createMany] Erreur insertion concepts :', error);
      throw new Error(`Impossible d’enregistrer les concepts : ${error.message}`);
    }
  }

  private toDomain(row: SupabaseConceptRow): CourseConcept {
    return {
      id: row.id,
      courseId: row.course_id,
      name: row.name,
      summary: row.summary,
      importance: (row.importance as 1 | 2 | 3 | 4 | 5) || 3,
      masteryScore: row.mastery_score,
      keyPoints: Array.isArray(row.key_points) ? row.key_points : [],
      rulesFormulas: Array.isArray(row.rules_formulas) ? row.rules_formulas : undefined,
      isWeak: row.mastery_score < 60
    };
  }
}
