import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SupabaseProgressRow } from '../types/database.types';
import { UserProgress } from '../types';
import { ProgressMapper } from '../mappers/ProgressMapper';

export class ProgressRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getByUserId(userId: string): Promise<UserProgress | null> {
    const { data, error } = await this.client
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return ProgressMapper.toDomain(data as SupabaseProgressRow);
  }

  async upsert(progress: Partial<UserProgress> & { userId: string }): Promise<UserProgress> {
    const payload = ProgressMapper.toRow(progress);
    const { data, error } = await this.client
      .from('user_progress')
      .upsert(payload as any)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`[ProgressRepository.upsert] Impossible de synchroniser la progression : ${error?.message}`);
    }
    return ProgressMapper.toDomain(data as SupabaseProgressRow);
  }

  async addXP(userId: string, amount: number): Promise<void> {
    const current = await this.getByUserId(userId);
    if (!current) return;

    const newXP = current.totalXp + amount;
    await this.upsert({ ...current, totalXp: newXP });
  }

  async deductEnergy(userId: string, amount: number): Promise<void> {
    const current = await this.getByUserId(userId);
    if (!current) return;

    const newEnergy = Math.max(0, current.energyBalance - amount);
    await this.upsert({ ...current, energyBalance: newEnergy });
  }

  async refillEnergyWithDiamonds(userId: string, cost: number = 10, amount: number = 3): Promise<{
    success: boolean;
    newEnergy: number;
    newDiamonds: number;
  }> {
    const current = await this.getByUserId(userId);
    if (!current) {
      throw new Error('Progression utilisateur introuvable.');
    }

    if (current.diamondsBalance < cost) {
      return {
        success: false,
        newEnergy: current.energyBalance,
        newDiamonds: current.diamondsBalance
      };
    }

    const updated = await this.upsert({
      ...current,
      diamondsBalance: current.diamondsBalance - cost,
      energyBalance: Math.min(3, current.energyBalance + amount)
    });

    return {
      success: true,
      newEnergy: updated.energyBalance,
      newDiamonds: updated.diamondsBalance
    };
  }

  async addDiamonds(userId: string, amount: number): Promise<void> {
    const current = await this.getByUserId(userId);
    if (!current) return;

    const newDiamonds = current.diamondsBalance + amount;
    await this.upsert({ ...current, diamondsBalance: newDiamonds });
  }
}
