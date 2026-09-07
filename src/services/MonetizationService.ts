import { IDataProvider } from '../contracts/IDataProvider';
import {
  SubscriptionPlan,
  PlanDetails,
  SUBSCRIPTION_PLANS,
  UserSubscription,
  RevisionUsageResult,
  EconomyState
} from '../types';

export class MonetizationService {
  constructor(private dataProvider: IDataProvider) {}

  /**
   * Retourne la liste des plans disponibles
   */
  getAvailablePlans(): PlanDetails[] {
    return [
      SUBSCRIPTION_PLANS.essentiel,
      SUBSCRIPTION_PLANS.intensif,
      SUBSCRIPTION_PLANS.premium
    ];
  }

  /**
   * Retourne les détails d'un plan
   */
  getPlanDetails(plan: SubscriptionPlan): PlanDetails {
    return SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.free;
  }

  /**
   * Récupère l'état d'abonnement actif
   */
  async getCurrentSubscription(): Promise<UserSubscription> {
    const economy = await this.dataProvider.getEconomyState();
    return economy.subscription;
  }

  /**
   * Vérifie et enregistre l'utilisation d'une révision quotidienne
   * (Bloque si la limite est atteinte)
   */
  async checkAndRecordRevision(): Promise<RevisionUsageResult> {
    return this.dataProvider.recordRevisionUsage();
  }

  /**
   * Active un abonnement (Essentiel, Intensif ou Premium)
   * Prêt pour intégration Fedapay
   */
  async subscribe(
    plan: SubscriptionPlan,
    paymentProvider: string = 'fedapay_test',
    externalId?: string
  ): Promise<EconomyState> {
    if (plan === 'free') {
      throw new Error('Le plan Free est déjà activé par défaut.');
    }
    return this.dataProvider.activateSubscription(plan, paymentProvider, externalId);
  }

  /**
   * Active un abonnement avec objet résultat pour les composants UI
   */
  async activateSubscription(
    plan: SubscriptionPlan,
    externalId?: string,
    paymentProvider: string = 'fedapay_test'
  ): Promise<{ success: boolean; economy?: EconomyState; message?: string }> {
    try {
      const economy = await this.subscribe(plan, paymentProvider, externalId);
      return { success: true, economy };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Crée une session de paiement FedaPay (Mobile Money & Carte bancaire)
   */
  async createCheckoutSession(
    plan: SubscriptionPlan,
    customer?: { firstname?: string; lastname?: string; email?: string; phone?: string },
    returnUrl?: string
  ): Promise<{ success: boolean; checkoutUrl?: string; token?: string; transactionId?: string; simulated?: boolean; message?: string }> {
    if (plan === 'free') {
      return { success: false, message: 'Le plan gratuit ne requiert aucun paiement.' };
    }
    return this.dataProvider.createCheckoutSession(plan, customer, returnUrl);
  }
}

