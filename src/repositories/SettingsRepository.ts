import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SupabaseSettingsRow } from '../types/database.types';
import { AppSettings } from '../types';
import { SettingsMapper } from '../mappers/SettingsMapper';

export class SettingsRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getByUserId(userId: string): Promise<AppSettings | null> {
    const { data, error } = await this.client
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return SettingsMapper.toDomain(data as SupabaseSettingsRow);
  }

  async upsert(settings: Partial<AppSettings>, userId: string): Promise<AppSettings> {
    const payload = SettingsMapper.toRow(settings, userId);
    const { data, error } = await this.client
      .from('user_settings')
      .upsert(payload as any)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`[SettingsRepository.upsert] Impossible d’enregistrer les paramètres : ${error?.message}`);
    }
    return SettingsMapper.toDomain(data as SupabaseSettingsRow);
  }
}
