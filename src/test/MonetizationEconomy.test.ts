import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataProvider } from '../providers/mock/MockDataProvider';
import { EconomyService } from '../services/EconomyService';
import { MonetizationService } from '../services/MonetizationService';
import { ReferralService } from '../services/ReferralService';

describe('REVIZO — Système Économique, Abonnements, Énergie, Diamants & Parrainage', () => {
  let provider: MockDataProvider;
  let economyService: EconomyService;
  let monetizationService: MonetizationService;
  let referralService: ReferralService;

  beforeEach(() => {
    provider = new MockDataProvider(0); // 0ms de latence pour les tests
    economyService = new EconomyService(provider);
    monetizationService = new MonetizationService(provider);
    referralService = new ReferralService(provider);
  });

  // ==========================================
  // SECTION A : ABONNEMENTS
  // ==========================================
  describe('A. Abonnements Mensuels & Cycles de Vie', () => {
    it('initialise un nouvel utilisateur sur le plan Free par défaut', async () => {
      const state = await economyService.getEconomyState();
      expect(state.subscription.plan).toBe('free');
      expect(['free', 'active']).toContain(state.subscription.status);
      expect(state.energy.dailyRevisionLimit).toBe(1);
      expect(state.energy.maxEnergy).toBe(3);
    });

    it('active le forfait ESSENTIEL avec les règles officielles (1 000 FCFA, 3 révisions/j, 10 ⚡ max, 10 💎 offerts)', async () => {
      const initialDiamonds = (await economyService.getEconomyState()).diamonds.balance;
      const state = await monetizationService.subscribe('essentiel', 'fedapay_test', 'sub-essentiel-01');

      expect(state.subscription.plan).toBe('essentiel');
      expect(state.subscription.price).toBe(1000);
      expect(state.subscription.status).toBe('active');
      expect(state.energy.dailyRevisionLimit).toBe(3);
      expect(state.energy.maxEnergy).toBe(10);
      // Diamants de bienvenue (+10 💎)
      expect(state.diamonds.balance).toBe(initialDiamonds + 10);
    });

    it('active le forfait INTENSIF (3 000 FCFA, 10 révisions/j, 20 ⚡ max, 30 💎 offerts)', async () => {
      const initialDiamonds = (await economyService.getEconomyState()).diamonds.balance;
      const state = await monetizationService.subscribe('intensif', 'fedapay_test', 'sub-intensif-01');

      expect(state.subscription.plan).toBe('intensif');
      expect(state.subscription.price).toBe(3000);
      expect(state.energy.dailyRevisionLimit).toBe(10);
      expect(state.energy.maxEnergy).toBe(20);
      expect(state.diamonds.balance).toBe(initialDiamonds + 30);
    });

    it('active le forfait PREMIUM (5 000 FCFA, 20 révisions/j, 30 ⚡ max, 60 💎 offerts)', async () => {
      const initialDiamonds = (await economyService.getEconomyState()).diamonds.balance;
      const state = await monetizationService.subscribe('premium', 'fedapay_test', 'sub-premium-01');

      expect(state.subscription.plan).toBe('premium');
      expect(state.subscription.price).toBe(5000);
      expect(state.energy.dailyRevisionLimit).toBe(20);
      expect(state.energy.maxEnergy).toBe(30);
      expect(state.diamonds.balance).toBe(initialDiamonds + 60);
    });

    it('supporte le changement de plan en cours de période sans perdre de données', async () => {
      await monetizationService.subscribe('essentiel', 'fedapay_test', 'sub-chg-01');
      let state = await economyService.getEconomyState();
      expect(state.subscription.plan).toBe('essentiel');
      expect(state.energy.dailyRevisionLimit).toBe(3);

      // Upgrade vers Intensif
      state = await monetizationService.subscribe('intensif', 'fedapay_test', 'sub-chg-02');
      expect(state.subscription.plan).toBe('intensif');
      expect(state.energy.dailyRevisionLimit).toBe(10);
      expect(state.energy.maxEnergy).toBe(20);
    });

    it('conserve les diamants acquis lors d’une expiration de plan', async () => {
      await monetizationService.subscribe('essentiel', 'fedapay_test', 'sub-exp-01');
      const stateBefore = await economyService.getEconomyState();
      const diamondsBefore = stateBefore.diamonds.balance;

      // Simuler une expiration
      const sub = (provider as any).subscriptions.get(provider['profile'].id);
      sub.status = 'expired';
      sub.plan = 'free';

      const stateAfter = await economyService.getEconomyState();
      expect(stateAfter.diamonds.balance).toBe(diamondsBefore);
      expect(stateAfter.diamonds.balance).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // SECTION B : ÉNERGIE
  // ==========================================
  describe('B. Système d’Énergie ⚡ & Conversion', () => {
    it('consomme de l’énergie de façon contrôlée (1 ⚡ par session)', async () => {
      const initialEnergy = (await economyService.getEconomyState()).energy.currentEnergy;
      const res = await economyService.consumeEnergy(1, 'Test session');

      expect(res.success).toBe(true);
      expect(res.currentEnergy).toBe(initialEnergy - 1);
    });

    it('bloque la consommation si le solde d’énergie est épuisé', async () => {
      const state = await economyService.getEconomyState();
      // Vider l'énergie
      for (let i = 0; i < state.energy.currentEnergy; i++) {
        await economyService.consumeEnergy(1, 'Consommation test');
      }

      const emptyState = await economyService.getEconomyState();
      expect(emptyState.energy.currentEnergy).toBe(0);

      // Tenter de consommer encore
      const res = await economyService.consumeEnergy(1, 'Tentative refusée');
      expect(res.success).toBe(false);
      expect(res.currentEnergy).toBe(0);
    });

    it('convertit 5 diamants en 1 énergie (règle 5 💎 = 1 ⚡)', async () => {
      // S'assurer qu'il manque de l'énergie et qu'il y a assez de diamants
      await economyService.consumeEnergy(1, 'Besoin de recharge');
      const beforeState = await economyService.getEconomyState();
      const diamondsBefore = beforeState.diamonds.balance;
      const energyBefore = beforeState.energy.currentEnergy;

      expect(diamondsBefore).toBeGreaterThanOrEqual(5);

      const res = await economyService.convertDiamondsToEnergy();
      expect(res.success).toBe(true);
      expect(res.currentDiamonds).toBe(diamondsBefore - 5);
      expect(res.currentEnergy).toBe(energyBefore + 1);
    });

    it('respecte la limite quotidienne de recharge par diamants (max 10 ⚡ / jour)', async () => {
      await monetizationService.subscribe('premium', 'fedapay_test', 'sub-daily-limit');
      // Créditer suffisamment de diamants
      await economyService.claimReward('test_boost', 'bonus', 100, 'Test recharge boost');

      // Vider de l'énergie pour permettre les conversions
      for (let i = 0; i < 15; i++) {
        await economyService.consumeEnergy(1, 'Vide test');
      }

      // Convertir 10 fois
      for (let i = 0; i < 10; i++) {
        const c = await economyService.convertDiamondsToEnergy();
        expect(c.success).toBe(true);
      }

      // La 11e conversion dans la même journée doit être rejetée
      const eleventh = await economyService.convertDiamondsToEnergy();
      expect(eleventh.success).toBe(false);
      expect(eleventh.message?.toLowerCase()).toContain('limite');
    });

    it('contrôle strictement le quota de révisions quotidiennes', async () => {
      await monetizationService.subscribe('essentiel', 'fedapay_test', 'sub-limit-test');
      // Essentiel = 3 révisions max
      const r1 = await monetizationService.checkAndRecordRevision();
      expect(r1.allowed).toBe(true);
      expect(r1.used).toBe(1);

      const r2 = await monetizationService.checkAndRecordRevision();
      expect(r2.allowed).toBe(true);
      expect(r2.used).toBe(2);

      const r3 = await monetizationService.checkAndRecordRevision();
      expect(r3.allowed).toBe(true);
      expect(r3.used).toBe(3);

      // 4e révision : doit être refusée
      const r4 = await monetizationService.checkAndRecordRevision();
      expect(r4.allowed).toBe(false);
      expect(r4.message).toContain('Tu as atteint');
    });
  });

  // ==========================================
  // SECTION C : DIAMANTS & RÉCOMPENSES
  // ==========================================
  describe('C. Monnaie Diamants 💎 & Récompenses Idempotentes', () => {
    it('attribue +2 💎 pour une fiche de révision terminée', async () => {
      const before = (await economyService.getEconomyState()).diamonds.balance;
      const res = await economyService.rewardRevisionCompletion('rev-math-01', 'Fractions');

      expect(res.success).toBe(true);
      expect(res.diamondsAwarded).toBe(2);
      expect(res.currentDiamonds).toBe(before + 2);
    });

    it('applique une stricte idempotence : aucune double récompense pour la même révision', async () => {
      await economyService.rewardRevisionCompletion('rev-math-unique-01', 'Fractions');
      const middle = (await economyService.getEconomyState()).diamonds.balance;

      // 2e appel avec le même revisionId
      const res2 = await economyService.rewardRevisionCompletion('rev-math-unique-01', 'Fractions');
      expect(res2.alreadyClaimed).toBe(true);
      expect(res2.diamondsAwarded).toBe(0);

      const after = (await economyService.getEconomyState()).diamonds.balance;
      expect(after).toBe(middle);
    });

    it('attribue +2 💎 pour quiz terminé, et +3 💎 bonus supplémentaire si score >= 80%', async () => {
      const before = (await economyService.getEconomyState()).diamonds.balance;

      // Quiz réussi à 85%
      const res = await economyService.rewardQuizCompletion('quiz-svt-high-01', 85, 'Génétique');
      expect(res.base.success).toBe(true);
      expect(res.base.diamondsAwarded).toBe(2);
      expect(res.bonus).toBeDefined();
      expect(res.bonus?.success).toBe(true);
      expect(res.bonus?.diamondsAwarded).toBe(3);

      const after = (await economyService.getEconomyState()).diamonds.balance;
      expect(after).toBe(before + 5); // 2 + 3
    });

    it('attribue uniquement +2 💎 de base si le score du quiz est inférieur à 80%', async () => {
      const before = (await economyService.getEconomyState()).diamonds.balance;

      // Quiz réussi à 60%
      const res = await economyService.rewardQuizCompletion('quiz-svt-mid-01', 60, 'Génétique');
      expect(res.base.success).toBe(true);
      expect(res.base.diamondsAwarded).toBe(2);
      expect(res.bonus).toBeUndefined();

      const after = (await economyService.getEconomyState()).diamonds.balance;
      expect(after).toBe(before + 2);
    });

    it('interdit les soldes négatifs de diamants', async () => {
      // Vider tous les diamants
      await economyService.getEconomyState();
      (provider as any).userDiamonds.get(provider['profile'].id).balance = 2;

      // Tenter une conversion qui requiert 5 diamants
      const res = await economyService.convertDiamondsToEnergy();
      expect(res.success).toBe(false);

      const afterState = await economyService.getEconomyState();
      expect(afterState.diamonds.balance).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================
  // SECTION D : PARRAINAGE
  // ==========================================
  describe('D. Système de Parrainage & Sécurité Anti-Fraude', () => {
    it('génère un code de parrainage unique au format REV-XXXXXX', async () => {
      const code = await referralService.getReferralCode();
      expect(code).toMatch(/^REV-[A-Z0-9-]+$/);
    });

    it('n’attribue AUCUNE récompense à la simple inscription du filleul', async () => {
      const referrerId = 'user-referrer-01';

      (provider as any).referralAccounts.set(referrerId, {
        referralCode: 'REV-REF001',
        referredByUserId: null,
        referralStatus: 'none',
        totalReferrals: 0,
        rewardedReferrals: 0
      });
      (provider as any).userDiamonds.set(referrerId, { balance: 20 });

      // Le filleul applique le code du parrain
      const applied = await provider.applyReferralCode('REV-REF001');
      expect(applied.success).toBe(true);

      // Vérifier que le parrain n'a PAS encore reçu de diamants
      const referrerDiamonds = (provider as any).userDiamonds.get(referrerId).balance;
      expect(referrerDiamonds).toBe(20);
    });

    it('attribue exactement +10 💎 au parrain APRÈS premier abonnement payant du filleul', async () => {
      const referrerId = 'user-parrain-99';
      (provider as any).referralAccounts.set(referrerId, {
        referralCode: 'REV-PARRAIN',
        referredByUserId: null,
        referralStatus: 'none',
        totalReferrals: 0,
        rewardedReferrals: 0
      });
      (provider as any).userDiamonds.set(referrerId, { balance: 15 });

      // L'utilisateur courant applique le code
      await provider.applyReferralCode('REV-PARRAIN');

      // L'utilisateur prend son premier abonnement payant
      await monetizationService.subscribe('essentiel', 'fedapay_test', 'sub-referee-paid');

      // Le parrain doit avoir reçu +10 💎
      const referrerAccount = (provider as any).userDiamonds.get(referrerId);
      expect(referrerAccount.balance).toBe(25); // 15 + 10
    });

    it('n’attribue pas de double récompense si le filleul souscrit un deuxième abonnement', async () => {
      const referrerId = 'user-parrain-multi';
      (provider as any).referralAccounts.set(referrerId, {
        referralCode: 'REV-MULTI',
        referredByUserId: null,
        referralStatus: 'none',
        totalReferrals: 0,
        rewardedReferrals: 0
      });
      (provider as any).userDiamonds.set(referrerId, { balance: 10 });

      await provider.applyReferralCode('REV-MULTI');

      // 1er abonnement -> +10 💎
      await monetizationService.subscribe('essentiel', 'fedapay_test', 'sub-pay-1');
      expect((provider as any).userDiamonds.get(referrerId).balance).toBe(20);

      // 2e abonnement (renouvellement ou upgrade) -> aucune nouvelle récompense
      await monetizationService.subscribe('intensif', 'fedapay_test', 'sub-pay-2');
      expect((provider as any).userDiamonds.get(referrerId).balance).toBe(20);
    });

    it('interdit d’avoir plus d’un parrain par compte', async () => {
      (provider as any).referralAccounts.set('user-p1', {
        referralCode: 'REV-CODE1',
        referredByUserId: null,
        referralStatus: 'none',
        totalReferrals: 0,
        rewardedReferrals: 0
      });
      (provider as any).referralAccounts.set('user-p2', {
        referralCode: 'REV-CODE2',
        referredByUserId: null,
        referralStatus: 'none',
        totalReferrals: 0,
        rewardedReferrals: 0
      });

      const firstApply = await referralService.applyReferralCode('REV-CODE1');
      expect(firstApply.success).toBe(true);

      // Tentative d'appliquer un second parrain
      const secondApply = await referralService.applyReferralCode('REV-CODE2');
      expect(secondApply.success).toBe(false);
      expect(secondApply.message).toContain('déjà utilisé');
    });
  });

  // ==========================================
  // SECTION E & F : MULTI-UTILISATEUR & ATOMICITÉ
  // ==========================================
  describe('E & F. Isolation Multi-Utilisateur & Cohérence Concurrente', () => {
    it('isole strictement les soldes de diamants et quotas entre utilisateurs différents', async () => {
      const userAProvider = new MockDataProvider(0);
      userAProvider['profile'].id = 'user-A';
      (userAProvider as any).initUserEconomy('user-A');

      const userBProvider = new MockDataProvider(0);
      userBProvider['profile'].id = 'user-B';
      (userBProvider as any).initUserEconomy('user-B');

      await userAProvider.claimReward('reward_A', 'test', 50, 'Crédit A');
      const stateA = await userAProvider.getEconomyState();
      const stateB = await userBProvider.getEconomyState();

      expect(stateA.diamonds.balance).toBeGreaterThan(stateB.diamonds.balance);
    });

    it('maintient la cohérence sous des requêtes concurrentes de récompense', async () => {
      const before = (await economyService.getEconomyState()).diamonds.balance;

      // 5 requêtes concurrentes avec le même eventKey (simulation race condition)
      const eventKey = `concurrent_test_${Date.now()}`;
      const results = await Promise.all([
        economyService.claimReward(eventKey, 'race', 5, 'Concurrent 1'),
        economyService.claimReward(eventKey, 'race', 5, 'Concurrent 2'),
        economyService.claimReward(eventKey, 'race', 5, 'Concurrent 3'),
        economyService.claimReward(eventKey, 'race', 5, 'Concurrent 4'),
        economyService.claimReward(eventKey, 'race', 5, 'Concurrent 5')
      ]);

      // Exactement UNE seule requête doit avoir réussi à créditer
      const successCount = results.filter(r => r.success && !r.alreadyClaimed).length;
      expect(successCount).toBe(1);

      const after = (await economyService.getEconomyState()).diamonds.balance;
      expect(after).toBe(before + 5);
    });
  });
});
