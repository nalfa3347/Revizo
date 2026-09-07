import { IDataProvider } from '../contracts/IDataProvider';
import {
  EconomyState,
  EnergyConversionResult,
  RewardClaimResult,
  DiamondTransaction,
  EnergyTransaction
} from '../types';

export class EconomyService {
  constructor(private dataProvider: IDataProvider) {}

  /**
   * Récupère l'état complet de l'économie de l'élève
   */
  async getEconomyState(): Promise<EconomyState> {
    return this.dataProvider.getEconomyState();
  }

  /**
   * Consomme de l'énergie (1 par défaut)
   */
  async consumeEnergy(
    amount: number = 1,
    reason: string = 'Session pédagogique',
    referenceId?: string
  ): Promise<{ success: boolean; currentEnergy: number; maxEnergy: number; message?: string }> {
    return this.dataProvider.consumeEnergy(amount, reason, referenceId);
  }

  /**
   * Convertit 5 diamants en 1 énergie (max 10/jour)
   */
  async convertDiamondsToEnergy(): Promise<EnergyConversionResult> {
    return this.dataProvider.convertDiamondsToEnergy();
  }

  /**
   * Réclame une récompense de diamants de manière strictement idempotente
   */
  async claimReward(
    eventKey: string,
    rewardType: string,
    diamonds: number,
    reason: string,
    metadata?: any
  ): Promise<RewardClaimResult> {
    return this.dataProvider.claimReward(eventKey, rewardType, diamonds, reason, metadata);
  }

  /**
   * Récompense pour complétion de révision (+2 💎)
   */
  async rewardRevisionCompletion(revisionId: string, courseTitle?: string): Promise<RewardClaimResult> {
    return this.claimReward(
      `user_completed_revision:${revisionId}`,
      'revision_completed',
      2,
      `Révision terminée${courseTitle ? ' : ' + courseTitle : ''}`,
      { revisionId, courseTitle }
    );
  }

  /**
   * Récompense pour complétion de quiz (+2 💎 + bonus si score >= 80%)
   */
  async rewardQuizCompletion(quizId: string, scorePct: number, courseTitle?: string): Promise<{
    base: RewardClaimResult;
    bonus?: RewardClaimResult;
  }> {
    const base = await this.claimReward(
      `user_completed_quiz:${quizId}`,
      'quiz_completed',
      2,
      `Quiz terminé${courseTitle ? ' : ' + courseTitle : ''}`,
      { quizId, scorePct, courseTitle }
    );

    let bonus: RewardClaimResult | undefined;
    if (scorePct >= 80) {
      bonus = await this.claimReward(
        `user_quiz_high_score:${quizId}`,
        'quiz_high_score',
        3,
        `Excellence au quiz (${scorePct}%)`,
        { quizId, scorePct }
      );
    }

    return { base, bonus };
  }

  /**
   * Récompense pour série de 5 bonnes réponses (+2 💎)
   */
  async rewardStreak5(quizId: string): Promise<RewardClaimResult> {
    const dateStr = new Date().toISOString().split('T')[0];
    return this.claimReward(
      `user_streak_5:${quizId}:${dateStr}`,
      'streak_5',
      2,
      'Série de 5 bonnes réponses consécutives 🎯',
      { quizId, date: dateStr }
    );
  }

  /**
   * Récupère l'historique complet des transactions
   */
  async getTransactionHistory(): Promise<{ diamonds: DiamondTransaction[]; energy: EnergyTransaction[] }> {
    return this.dataProvider.getTransactionHistory();
  }

  /**
   * Récupère l'historique des transactions de diamants
   */
  async getDiamondTransactions(): Promise<DiamondTransaction[]> {
    const res = await this.dataProvider.getTransactionHistory();
    return res.diamonds;
  }

  /**
   * Récupère l'historique des transactions d'énergie
   */
  async getEnergyTransactions(): Promise<EnergyTransaction[]> {
    const res = await this.dataProvider.getTransactionHistory();
    return res.energy;
  }
}
