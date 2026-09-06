import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SupabaseRevisionRow } from '../types/database.types';
import { Revision } from '../types';
import { RevisionMapper } from '../mappers/RevisionMapper';

export class RevisionRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getByCourseId(courseId: string, userId: string): Promise<Revision | null> {
    const { data, error } = await this.client
      .from('revisions')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return RevisionMapper.toDomain(data as SupabaseRevisionRow);
  }

  async create(revision: Partial<Revision>, userId: string, analysisId?: string): Promise<Revision> {
    const payload = RevisionMapper.toRow(revision, userId, analysisId);
    const { data, error } = await this.client
      .from('revisions')
      .insert(payload as any)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`[RevisionRepository.create] Impossible d’enregistrer la révision : ${error?.message}`);
    }
    return RevisionMapper.toDomain(data as SupabaseRevisionRow);
  }

  async markDownloaded(revisionId: string, userId: string, isDownloaded: boolean): Promise<boolean> {
    const { error } = await this.client
      .from('revisions')
      .update({
        is_downloaded: isDownloaded,
        downloaded_at: isDownloaded ? new Date().toISOString() : null
      })
      .eq('id', revisionId)
      .eq('user_id', userId);

    return !error;
  }
}
