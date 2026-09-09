import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataProvider } from '../providers/mock/MockDataProvider';
import { MonetizationService } from '../services/MonetizationService';
import { EconomyService } from '../services/EconomyService';
import { ReferralService } from '../services/ReferralService';

describe('REVIZO — Intégration FedaPay (Paiements Mobile Money & Cartes)', () => {
  let provider: MockDataProvider;
  let monetizationService: MonetizationService;

  beforeEach(() => {
    provider = new MockDataProvider();
    monetizationService = new MonetizationService(provider);
  });

  describe('1. Initialisation de session de paiement Checkout FedaPay', () => {
    it('refuse d’initialiser un paiement pour le plan Free', async () => {
      const res = await monetizationService.createCheckoutSession('free');
      expect(res.success).toBe(false);
      expect(res.message).toContain('gratuit');
    });

    it('génère une session Checkout valide pour le plan Essentiel (1 000 FCFA)', async () => {
      const res = await monetizationService.createCheckoutSession('essentiel', {
        firstname: 'Koffi',
        lastname: 'Mensah',
        email: 'koffi@test.com'
      });

      expect(res.success).toBe(true);
      expect(res.checkoutUrl).toBeDefined();
      expect(res.checkoutUrl).toContain('plan=essentiel');
      expect(res.transactionId).toBeDefined();
    });

    it('génère une session Checkout valide pour le plan Intensif (3 000 FCFA)', async () => {
      const res = await monetizationService.createCheckoutSession('intensif');
      expect(res.success).toBe(true);
      expect(res.checkoutUrl).toContain('plan=intensif');
      expect(res.transactionId).toBeDefined();
    });

    it('génère une session Checkout valide pour le plan Premium (5 000 FCFA)', async () => {
      const res = await monetizationService.createCheckoutSession('premium');
      expect(res.success).toBe(true);
      expect(res.checkoutUrl).toContain('plan=premium');
      expect(res.transactionId).toBeDefined();
    });
  });

  describe('2. Confirmation de paiement et Activation du compte', () => {
    it('active automatiquement le plan Intensif après validation du paiement FedaPay', async () => {
      const checkout = await monetizationService.createCheckoutSession('intensif');
      expect(checkout.success).toBe(true);

      // Simulation du retour webhook FedaPay (transaction.approved)
      const activation = await monetizationService.activateSubscription(
        'intensif',
        checkout.transactionId,
        'fedapay'
      );

      expect(activation.success).toBe(true);
      expect(activation.economy?.subscription.plan).toBe('intensif');
      expect(activation.economy?.subscription.status).toBe('active');
      expect(activation.economy?.subscription.paymentProvider).toBe('fedapay');
      expect(activation.economy?.subscription.dailyRevisionLimit).toBe(10);
      expect(activation.economy?.energy.maxEnergy).toBe(20);
      expect(activation.economy?.energy.currentEnergy).toBe(20);
      // 10 initiaux + 30 offerts
      expect(activation.economy?.diamonds.balance).toBe(40);
    });

    it('déclenche le bonus parrain (+10 💎) uniquement lors de la confirmation du paiement', async () => {
      // 1. Parrain A
      const providerA = new MockDataProvider();
      const refServiceA = new ReferralService(providerA);
      const ecoServiceA = new EconomyService(providerA);
      const codeA = await refServiceA.getReferralCode();
      const initialDiamondsA = (await ecoServiceA.getEconomyState()).diamonds.balance;

      // 2. Filleul B s'inscrit avec le code de A
      const providerB = new MockDataProvider();
      providerB.setActiveProfile({
        id: 'user-b-fedapay',
        displayName: 'Élève Filleul',
        email: 'filleul@test.com',
        gradeLevel: 'Terminale',
        joinedAt: new Date().toISOString()
      });
      // Synchroniser la mémoire de parrainage
      (providerB as any).referralAccounts = (providerA as any).referralAccounts;
      (providerB as any).userDiamonds = (providerA as any).userDiamonds;
      (providerB as any).rewardEvents = (providerA as any).rewardEvents;
      (providerB as any).diamondTransactions = (providerA as any).diamondTransactions;

      const refServiceB = new ReferralService(providerB);
      await refServiceB.applyReferralCode(codeA);

      // Le parrain reçoit immédiatement +5 💎 dès l'inscription
      expect((await ecoServiceA.getEconomyState()).diamonds.balance).toBe(initialDiamondsA + 5);

      // 3. Filleul B souscrit et valide son paiement FedaPay
      const monServiceB = new MonetizationService(providerB);
      const checkoutB = await monServiceB.createCheckoutSession('intensif');
      await monServiceB.activateSubscription('intensif', checkoutB.transactionId, 'fedapay');

      // 4. Le parrain reçoit exactement +10 💎 supplémentaires (total: initial + 15 💎)
      const diamondsAAfter = (await ecoServiceA.getEconomyState()).diamonds.balance;
      expect(diamondsAAfter).toBe(initialDiamondsA + 15);

      // 5. Un rechargement ou webhook dupliqué ne recrédite pas le parrain
      await monServiceB.activateSubscription('intensif', checkoutB.transactionId, 'fedapay');
      const diamondsAAfterDuplicate = (await ecoServiceA.getEconomyState()).diamonds.balance;
      expect(diamondsAAfterDuplicate).toBe(initialDiamondsA + 15);
    });
  });
});
