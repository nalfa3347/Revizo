import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SupabaseUserRow } from '../types/database.types';
import { UserProfile } from '../types';
import { UserMapper } from '../mappers/UserMapper';

export class UserRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getById(id: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[UserRepository.getById] Erreur Supabase :', error);
      return null;
    }
    return data ? UserMapper.toDomain(data as SupabaseUserRow) : null;
  }

  async upsert(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
    const payload = UserMapper.toRow(profile);
    const { data, error } = await this.client
      .from('users')
      .upsert(payload as any)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`[UserRepository.upsert] Impossible d’enregistrer le profil : ${error?.message}`);
    }
    return UserMapper.toDomain(data as SupabaseUserRow);
  }

  async update(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const payload = UserMapper.toRow(updates);
    const { data, error } = await this.client
      .from('users')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`[UserRepository.update] Impossible de mettre à jour le profil : ${error?.message}`);
    }
    return UserMapper.toDomain(data as SupabaseUserRow);
  }
}
