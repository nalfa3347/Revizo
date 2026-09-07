import { SupabaseClient } from '@supabase/supabase-js';
import {
  EconomyState,
  SubscriptionPlan,
  EnergyConversionResult,
  RewardClaimResult,
  RevisionUsageResult,
  DiamondTransaction,
  EnergyTransaction
} from '../types';

export class EconomyRepository {
  constructor(private client: SupabaseClient<any>) {}

  /**
   * Récupère l'état économique complet d'un élève (abonnement, énergie, diamants, parrainage)
   */
  async getEconomyState(userId: string): Promise<EconomyState> {
    const { data, error } = await this.client.rpc('get_user_economy_state', {
      p_user_id: userId
    });

    if (error || !data) {
      throw new Error(`[EconomyRepository.getEconomyState] Erreur RPC: ${error?.message}`);
    }

    return {
      subscription: {
        userId,
        plan: data.subscription.plan,
        price: data.subscription.price,
        status: data.subscription.status,
        startedAt: data.subscription.started_at,
        expiresAt: data.subscription.expires_at,
        paymentProvider: data.subscription.payment_provider,
        dailyRevisionLimit: data.subscription.daily_revision_limit
      },
      energy: {
        currentEnergy: data.energy.current_energy,
        maxEnergy: data.energy.max_energy,
        dailyRevisionLimit: data.energy.daily_revision_limit,
        dailyRevisionUsed: data.energy.daily_revision_used,
        dailyRevisionRemaining: data.energy.daily_revision_remaining,
        diamondsConvertedToday: data.energy.diamonds_converted_today,
        maxDailyDiamondConversions: data.energy.max_daily_diamond_conversions || 10
      },
      diamonds: {
        balance: data.diamonds.balance
      },
      referral: {
        referralCode: data.referral.referral_code,
        referredByUserId: data.referral.referred_by_user_id,
        referralStatus: data.referral.referral_status,
        totalReferrals: data.referral.total_referrals,
        rewardedReferrals: data.referral.rewarded_referrals
      }
    };
  }

  /**
   * Active un abonnement (Essentiel, Intensif, Premium)
   */
  async activateSubscription(
    userId: string,
    plan: SubscriptionPlan,
    paymentProvider: string = 'fedapay',
    externalId?: string
  ): Promise<EconomyState> {
    const { error } = await this.client.rpc('activate_subscription', {
      p_user_id: userId,
      p_plan: plan,
      p_payment_provider: paymentProvider,
      p_external_id: externalId || null
    });

    if (error) {
      throw new Error(`[EconomyRepository.activateSubscription] Erreur RPC: ${error.message}`);
    }

    return this.getEconomyState(userId);
  }

  /**
   * Crée une session de paiement sécurisée FedaPay via l'Edge Function fedapay-checkout
   */
  async createCheckoutSession(
    userId: string,
    plan: SubscriptionPlan,
    customer?: { firstname?: string; lastname?: string; email?: string; phone?: string },
    returnUrl?: string
  ): Promise<{ success: boolean; checkoutUrl?: string; token?: string; transactionId?: string; simulated?: boolean; message?: string }> {
    const { data, error } = await this.client.functions.invoke('fedapay-checkout', {
      body: {
        userId,
        plan,
        customer: customer ? {
          firstname: customer.firstname,
          lastname: customer.lastname,
          email: customer.email,
          ...(customer.phone ? { phone_number: { number: customer.phone, country: 'BJ' } } : {})
        } : undefined,
        return_url: returnUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://revizo-nine.vercel.app')
      }
    });

    if (error) {
      throw new Error(`[EconomyRepository.createCheckoutSession] Erreur Edge Function: ${error.message}`);
    }

    return {
      success: Boolean(data?.success),
      checkoutUrl: data?.checkout_url,
      token: data?.token,
      transactionId: data?.transaction_id,
      simulated: Boolean(data?.simulated),
      message: data?.message
    };
  }

  /**
   * Consomme de l'énergie de manière atomique
   */
  async consumeEnergy(
    userId: string,
    amount: number = 1,
    reason: string = 'Session pédagogique',
    referenceId?: string
  ): Promise<{ success: boolean; currentEnergy: number; maxEnergy: number; message?: string }> {
    const { data, error } = await this.client.rpc('consume_energy', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_reference_id: referenceId || null
    });

    if (error || !data) {
      throw new Error(`[EconomyRepository.consumeEnergy] Erreur RPC: ${error?.message}`);
    }

    return {
      success: data.success,
      currentEnergy: data.current_energy,
      maxEnergy: data.max_energy,
      message: data.message
    };
  }

  /**
   * Convertit 5 💎 en 1 ⚡ (limité à max 10 ⚡/jour)
   */
  async convertDiamondsToEnergy(userId: string): Promise<EnergyConversionResult> {
    const { data, error } = await this.client.rpc('convert_diamonds_to_energy', {
      p_user_id: userId
    });

    if (error || !data) {
      throw new Error(`[EconomyRepository.convertDiamondsToEnergy] Erreur RPC: ${error?.message}`);
    }

    return {
      success: data.success,
      currentDiamonds: data.current_diamonds,
      currentEnergy: data.current_energy,
      maxEnergy: data.max_energy,
      convertedToday: data.converted_today,
      error: data.error,
      message: data.message
    };
  }

  /**
   * Réclame une récompense en diamants de façon strictement idempotente
   */
  async claimReward(
    userId: string,
    eventKey: string,
    rewardType: string,
    diamonds: number,
    reason: string,
    metadata: any = {}
  ): Promise<RewardClaimResult> {
    const { data, error } = await this.client.rpc('claim_reward', {
      p_user_id: userId,
      p_event_key: eventKey,
      p_reward_type: rewardType,
      p_diamonds: diamonds,
      p_reason: reason,
      p_metadata: metadata
    });

    if (error || !data) {
      throw new Error(`[EconomyRepository.claimReward] Erreur RPC: ${error?.message}`);
    }

    return {
      success: data.success,
      alreadyClaimed: data.already_claimed,
      diamondsAwarded: data.diamonds_awarded,
      currentDiamonds: data.current_diamonds,
      message: data.message
    };
  }

  /**
   * Applique un code de parrainage
   */
  async applyReferralCode(userId: string, code: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await this.client.rpc('apply_referral_code', {
      p_user_id: userId,
      p_referral_code: code
    });

    if (error || !data) {
      throw new Error(`[EconomyRepository.applyReferralCode] Erreur RPC: ${error?.message}`);
    }

    return {
      success: data.success,
      message: data.message || (data.success ? 'Code appliqué avec succès' : data.error)
    };
  }

  /**
   * Enregistre l'utilisation d'une révision quotidienne
   */
  async recordRevisionUsage(userId: string): Promise<RevisionUsageResult> {
    const { data, error } = await this.client.rpc('record_revision_usage', {
      p_user_id: userId
    });

    if (error || !data) {
      throw new Error(`[EconomyRepository.recordRevisionUsage] Erreur RPC: ${error?.message}`);
    }

    return {
      allowed: data.allowed,
      limit: data.limit,
      used: data.used,
      remaining: data.remaining,
      error: data.error,
      message: data.message
    };
  }

  /**
   * Récupère l'historique des transactions
   */
  async getTransactionHistory(userId: string): Promise<{ diamonds: DiamondTransaction[]; energy: EnergyTransaction[] }> {
    const [diamondsRes, energyRes] = await Promise.all([
      this.client
        .from('diamond_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      this.client
        .from('energy_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
    ]);

    const diamonds: DiamondTransaction[] = (diamondsRes.data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      balanceAfter: row.balance_after,
      reason: row.reason,
      referenceId: row.reference_id,
      createdAt: row.created_at
    }));

    const energy: EnergyTransaction[] = (energyRes.data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      balanceAfter: row.balance_after,
      reason: row.reason,
      referenceId: row.reference_id,
      createdAt: row.created_at
    }));

    return { diamonds, energy };
  }
}
