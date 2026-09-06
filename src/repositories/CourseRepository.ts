import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SupabaseCourseRow } from '../types/database.types';
import { Course } from '../types';
import { CourseMapper } from '../mappers/CourseMapper';

export class CourseRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async listByUserId(userId: string, subjectId?: string): Promise<Course[]> {
    let query = this.client
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[CourseRepository.listByUserId] Erreur Supabase :', error);
      return [];
    }
    return (data as SupabaseCourseRow[]).map(CourseMapper.toDomain);
  }

  async getById(id: string, userId: string): Promise<Course | null> {
    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return CourseMapper.toDomain(data as SupabaseCourseRow);
  }

  async create(course: Partial<Course>, userId: string): Promise<Course> {
    const payload = CourseMapper.toRow({ ...course, userId });
    const { data, error } = await this.client
      .from('courses')
      .insert(payload as any)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`[CourseRepository.create] Impossible de créer le cours : ${error?.message}`);
    }
    return CourseMapper.toDomain(data as SupabaseCourseRow);
  }

  async update(id: string, userId: string, updates: Partial<Course>): Promise<Course> {
    const payload = CourseMapper.toRow(updates);
    const { data, error } = await this.client
      .from('courses')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`[CourseRepository.update] Impossible de mettre à jour le cours : ${error?.message}`);
    }
    return CourseMapper.toDomain(data as SupabaseCourseRow);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const { error } = await this.client
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }
}
