import { IDataProvider } from '../contracts/IDataProvider';
import { UserProgress } from '../types';

export class GamificationService {
  constructor(private dataProvider: IDataProvider) {}

  async getProgress(): Promise<UserProgress> {
    return this.dataProvider.getProgress();
  }

  /**
   * Permet d'échanger 10 diamants contre 1 énergie (3 max)
   */
  async refillEnergyWithDiamonds(): Promise<{ success: boolean; newEnergy: number; newDiamonds: number }> {
    return this.dataProvider.spendDiamondsForEnergy(1);
  }

  async awardQuizXP(xp: number): Promise<void> {
    if ('awardXP' in this.dataProvider) {
      await (this.dataProvider as any).awardXP(xp);
    }
  }

  async deductEnergyOnMistake(): Promise<void> {
    if ('deductEnergy' in this.dataProvider) {
      await (this.dataProvider as any).deductEnergy(1);
    }
  }

  async recordDailyStreak(): Promise<void> {
    if ('awardStreakReward' in this.dataProvider) {
      await (this.dataProvider as any).awardStreakReward();
    }
  }

  calculateLevelProgress(totalXp: number): { currentLevel: number; xpInLevel: number; xpNeeded: number; percentage: number } {
    const xpPerLevel = 250;
    const currentLevel = Math.floor(totalXp / xpPerLevel) + 1;
    const xpInLevel = totalXp % xpPerLevel;
    const percentage = Math.round((xpInLevel / xpPerLevel) * 100);
    return {
      currentLevel,
      xpInLevel,
      xpNeeded: xpPerLevel,
      percentage
    };
  }
}
