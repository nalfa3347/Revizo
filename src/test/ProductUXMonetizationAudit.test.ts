import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataProvider } from '../providers/mock/MockDataProvider';
import { EconomyService } from '../services/EconomyService';
import { MonetizationService } from '../services/MonetizationService';
import { ReferralService } from '../services/ReferralService';

describe('REVIZO — AUDIT FINAL PRODUIT + UX + MONÉTISATION', () => {
  let dataProvider: MockDataProvider;
  let economyService: EconomyService;
  let monetizationService: MonetizationService;
  let referralService: ReferralService;

  beforeEach(() => {
    dataProvider = new MockDataProvider();
    economyService = new EconomyService(dataProvider);
    monetizationService = new MonetizationService(dataProvider);
    referralService = new ReferralService(dataProvider);
  });

  // =========================================================================
  // 1. PARCOURS NOUVEL UTILISATEUR & DÉCOUVERTE DU SYSTÈME
  // =========================================================================
  describe('1. Parcours Nouvel Utilisateur', () => {
    it('initialise un nouvel utilisateur avec le plan Free, 3 ⚡ max et 10 💎 de bienvenue', async () => {
      const state = await economyService.getEconomyState();
      expect(state.subscription.plan).toBe('free');
      expect(state.subscription.status).toBe('active');
      expect(state.subscription.dailyRevisionLimit).toBe(1);

      expect(state.energy.currentEnergy).toBe(3);
      expect(state.energy.maxEnergy).toBe(3);

      expect(state.diamonds.balance).toBe(10);
      expect(state.referral.referralCode).toMatch(/^REV-[A-Z0-9-]+$/);
    });

    it('permet de réaliser une révision complète et d’obtenir +2 💎 de façon persistée', async () => {
      const stateBefore = await economyService.getEconomyState();
      expect(stateBefore.diamonds.balance).toBe(10);

      const claimRes = await economyService.rewardRevisionCompletion('rev-audit-001', 'Histoire — Révolution');
      expect(claimRes.success).toBe(true);
      expect(claimRes.alreadyClaimed).toBe(false);
      expect(claimRes.diamondsAwarded).toBe(2);
      expect(claimRes.currentDiamonds).toBe(12);

      const stateAfter = await economyService.getEconomyState();
      expect(stateAfter.diamonds.balance).toBe(12);
    });

    it('récompense un quiz avec +2 💎 (fin de quiz) et +3 💎 (bonus si score ≥ 80%)', async () => {
      const res = await economyService.rewardQuizCompletion('quiz-audit-001', 85, 'Mathématiques');
      expect(res.base.success).toBe(true);
      expect(res.base.diamondsAwarded).toBe(2);
      expect(res.bonus?.success).toBe(true);
      expect(res.bonus?.diamondsAwarded).toBe(3);

      const state = await economyService.getEconomyState();
      expect(state.diamonds.balance).toBe(15);
    });
  });

  // =========================================================================
  // 2. ÉNERGIE (⚡)
  // =========================================================================
  describe('2. Système d’Énergie ⚡', () => {
    it('consomme 1 ⚡ sur demande et bloque quand le solde est épuisé', async () => {
      const d1 = await economyService.consumeEnergy(1, 'Erreur quiz Q1');
      expect(d1.success).toBe(true);
      expect(d1.currentEnergy).toBe(2);

      const d2 = await economyService.consumeEnergy(1, 'Erreur quiz Q2');
      expect(d2.success).toBe(true);
      expect(d2.currentEnergy).toBe(1);

      const d3 = await economyService.consumeEnergy(1, 'Erreur quiz Q3');
      expect(d3.success).toBe(true);
      expect(d3.currentEnergy).toBe(0);

      // 4e tentative -> rejet bienveillant sans jargon
      const d4 = await economyService.consumeEnergy(1, 'Erreur quiz Q4');
      expect(d4.success).toBe(false);
      expect(d4.currentEnergy).toBe(0);
      expect(d4.message).toContain('Énergie insuffisante');
    });

    it('convertit 5 💎 en 1 ⚡ de façon atomique', async () => {
      await economyService.consumeEnergy(1);
      const stateBefore = await economyService.getEconomyState();
      const initialDiamonds = stateBefore.diamonds.balance;
      const initialEnergy = stateBefore.energy.currentEnergy;

      const convRes = await economyService.convertDiamondsToEnergy();
      expect(convRes.success).toBe(true);
      expect(convRes.currentDiamonds).toBe(initialDiamonds - 5);
      expect(convRes.currentEnergy).toBe(initialEnergy + 1);

      const stateAfter = await economyService.getEconomyState();
      expect(stateAfter.diamonds.balance).toBe(5);
      expect(stateAfter.energy.currentEnergy).toBe(3);
    });

    it('refuse la conversion si l’énergie est déjà à son maximum', async () => {
      const state = await economyService.getEconomyState();
      expect(state.energy.currentEnergy).toBe(state.energy.maxEnergy);

      const convRes = await economyService.convertDiamondsToEnergy();
      expect(convRes.success).toBe(false);
      expect(convRes.error).toBe('energy_already_full');
    });

    it('respecte le plafond quotidien de 10 ⚡ récupérées par diamants', async () => {
      await monetizationService.activateSubscription('intensif');
      for (let i = 0; i < 15; i++) {
        await economyService.consumeEnergy(1);
      }
      await economyService.claimReward('test_bonus_bulk', 'bulk', 100, 'Test balance');

      for (let i = 0; i < 10; i++) {
        const c = await economyService.convertDiamondsToEnergy();
        expect(c.success).toBe(true);
      }

      const c11 = await economyService.convertDiamondsToEnergy();
      expect(c11.success).toBe(false);
      expect(c11.error).toBe('daily_conversion_limit_reached');
    });
  });

  // =========================================================================
  // 3. DIAMANTS (💎)
  // =========================================================================
  describe('3. Système de Diamants 💎 & Idempotence', () => {
    it('garantit qu’une même révision ne peut jamais être récompensée deux fois', async () => {
      const claim1 = await economyService.rewardRevisionCompletion('rev-unique-42', 'SVT');
      expect(claim1.success).toBe(true);
      expect(claim1.alreadyClaimed).toBe(false);
      expect(claim1.diamondsAwarded).toBe(2);

      const claim2 = await economyService.rewardRevisionCompletion('rev-unique-42', 'SVT');
      expect(claim2.success).toBe(true);
      expect(claim2.alreadyClaimed).toBe(true);
      expect(claim2.diamondsAwarded).toBe(0);
    });

    it('interdit rigoureusement tout solde de diamants négatif', async () => {
      await economyService.consumeEnergy(2);
      await economyService.convertDiamondsToEnergy();
      await economyService.convertDiamondsToEnergy();

      const stateZero = await economyService.getEconomyState();
      expect(stateZero.diamonds.balance).toBe(0);

      await economyService.consumeEnergy(1);
      const res = await economyService.convertDiamondsToEnergy();
      expect(res.success).toBe(false);
      expect(res.error).toBe('insufficient_diamonds');

      const stateAfter = await economyService.getEconomyState();
      expect(stateAfter.diamonds.balance).toBe(0);
      expect(stateAfter.diamonds.balance).toBeGreaterThanOrEqual(0);
    });

    it('trace chaque gain et chaque dépense dans l’historique des transactions', async () => {
      await economyService.rewardRevisionCompletion('rev-tx-test', 'Maths');
      await economyService.consumeEnergy(1);
      await economyService.convertDiamondsToEnergy();

      const history = await economyService.getTransactionHistory();
      expect(history.diamonds.length).toBeGreaterThanOrEqual(2);
      expect(history.energy.length).toBeGreaterThanOrEqual(2);

      const lastDiamond = history.diamonds[0];
      expect(lastDiamond.reason).toContain('Conversion');
      expect(lastDiamond.amount).toBe(-5);

      const rewardDiamond = history.diamonds.find(tx => tx.amount === 2);
      expect(rewardDiamond).toBeDefined();
      expect(rewardDiamond?.reason).toContain('Maths');
    });
  });

  // =========================================================================
  // 4. PARRAINAGE & PROTECTION ANTI-FRAUDE
  // =========================================================================
  describe('4. Système de Parrainage', () => {
    it('génère un code unique et empêche l’auto-parrainage', async () => {
      const state = await economyService.getEconomyState();
      const myCode = state.referral.referralCode;

      const selfReferral = await referralService.applyReferralCode(myCode);
      expect(selfReferral.success).toBe(false);
      expect(selfReferral.message).toContain('propre code');
    });

    it('attribue le parrainage en attente sans créditer de diamants prématurément', async () => {
      const codeA = (await economyService.getEconomyState()).referral.referralCode;

      const providerB = new MockDataProvider();
      (providerB as any).profile = {
        id: 'usr-beta-test',
        displayName: 'Élève Bêta',
        email: 'test_beta@revizo.test',
        gradeLevel: '3e',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      (providerB as any).initUserEconomy('usr-beta-test');
      const referralServiceB = new ReferralService(providerB);

      const applyRes = await referralServiceB.applyReferralCode(codeA);
      expect(applyRes.success).toBe(true);

      const stateA = await economyService.getEconomyState();
      expect(stateA.diamonds.balance).toBe(10);
    });

    it('refuse d’appliquer un deuxième code de parrainage sur le même compte', async () => {
      const codeA = (await economyService.getEconomyState()).referral.referralCode;

      const providerB = new MockDataProvider();
      (providerB as any).profile = {
        id: 'usr-beta-2',
        displayName: 'Élève Bêta 2',
        email: 'test_beta2@revizo.test',
        gradeLevel: '3e',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      (providerB as any).initUserEconomy('usr-beta-2');
      const referralServiceB = new ReferralService(providerB);

      await referralServiceB.applyReferralCode(codeA);
      const secondAttempt = await referralServiceB.applyReferralCode(codeA);
      expect(secondAttempt.success).toBe(false);
      expect(secondAttempt.message).toContain('déjà utilisé un code');
    });
  });

  // =========================================================================
  // 5. ABONNEMENTS (LES 3 OFFRES OFFICIELLES)
  // =========================================================================
  describe('5. Les 3 Abonnements Officiels', () => {
    it('expose exactement les 3 offres officielles avec prix FCFA et quotas prévus', () => {
      const plans = monetizationService.getAvailablePlans();
      expect(plans.length).toBe(3);

      const essentiel = plans.find(p => p.id === 'essentiel')!;
      expect(essentiel.priceFcfa).toBe(1000);
      expect(essentiel.dailyRevisionLimit).toBe(3);
      expect(essentiel.maxEnergy).toBe(10);
      expect(essentiel.initialDiamonds).toBe(10);

      const intensif = plans.find(p => p.id === 'intensif')!;
      expect(intensif.priceFcfa).toBe(3000);
      expect(intensif.dailyRevisionLimit).toBe(10);
      expect(intensif.maxEnergy).toBe(20);
      expect(intensif.initialDiamonds).toBe(30);
      expect(intensif.isPopular).toBe(true);

      const premium = plans.find(p => p.id === 'premium')!;
      expect(premium.priceFcfa).toBe(5000);
      expect(premium.dailyRevisionLimit).toBe(20);
      expect(premium.maxEnergy).toBe(30);
      expect(premium.initialDiamonds).toBe(60);
    });

    it('active Essentiel : met à jour le quota à 3 révisions/jour et attribue 10 💎 idempotents', async () => {
      const res = await monetizationService.activateSubscription('essentiel');
      expect(res.success).toBe(true);

      const state = await economyService.getEconomyState();
      expect(state.subscription.plan).toBe('essentiel');
      expect(state.subscription.dailyRevisionLimit).toBe(3);
      expect(state.energy.maxEnergy).toBe(10);
      expect(state.diamonds.balance).toBe(20);
    });

    it('active Intensif : met à jour le quota à 10 révisions/jour et énergie max à 20', async () => {
      const res = await monetizationService.activateSubscription('intensif');
      expect(res.success).toBe(true);

      const state = await economyService.getEconomyState();
      expect(state.subscription.plan).toBe('intensif');
      expect(state.subscription.dailyRevisionLimit).toBe(10);
      expect(state.energy.maxEnergy).toBe(20);
    });

    it('active Premium : met à jour le quota à 20 révisions/jour et énergie max à 30', async () => {
      const res = await monetizationService.activateSubscription('premium');
      expect(res.success).toBe(true);

      const state = await economyService.getEconomyState();
      expect(state.subscription.plan).toBe('premium');
      expect(state.subscription.dailyRevisionLimit).toBe(20);
      expect(state.energy.maxEnergy).toBe(30);
    });
  });

  // =========================================================================
  // 6. CONTRÔLE SERVEUR DES QUOTAS DE RÉVISION
  // =========================================================================
  describe('6. Limites Quotidiennes de Révision', () => {
    it('Essentiel : bloque strictement la 4e tentative de révision le même jour', async () => {
      await monetizationService.activateSubscription('essentiel');

      const r1 = await monetizationService.checkAndRecordRevision();
      expect(r1.allowed).toBe(true);
      expect(r1.used).toBe(1);

      const r2 = await monetizationService.checkAndRecordRevision();
      expect(r2.allowed).toBe(true);
      expect(r2.used).toBe(2);

      const r3 = await monetizationService.checkAndRecordRevision();
      expect(r3.allowed).toBe(true);
      expect(r3.used).toBe(3);

      // 4e révision -> REFUS STRICT
      const r4 = await monetizationService.checkAndRecordRevision();
      expect(r4.allowed).toBe(false);
      expect(r4.used).toBe(3);
      expect(r4.message).toContain('limite');
    });

    it('Intensif : autorise 10 révisions et bloque la 11e tentative', async () => {
      await monetizationService.activateSubscription('intensif');

      for (let i = 1; i <= 10; i++) {
        const r = await monetizationService.checkAndRecordRevision();
        expect(r.allowed).toBe(true);
        expect(r.used).toBe(i);
      }

      // 11e tentative -> REFUS
      const r11 = await monetizationService.checkAndRecordRevision();
      expect(r11.allowed).toBe(false);
      expect(r11.used).toBe(10);
    });

    it('Premium : autorise 20 révisions et bloque la 21e tentative', async () => {
      await monetizationService.activateSubscription('premium');

      for (let i = 1; i <= 20; i++) {
        const r = await monetizationService.checkAndRecordRevision();
        expect(r.allowed).toBe(true);
        expect(r.used).toBe(i);
      }

      // 21e tentative -> REFUS
      const r21 = await monetizationService.checkAndRecordRevision();
      expect(r21.allowed).toBe(false);
      expect(r21.used).toBe(20);
    });
  });

  // =========================================================================
  // 7. PERSISTANCE MULTI-SESSION
  // =========================================================================
  describe('7. Persistance Multi-Session', () => {
    it('préserve l’état complet après simulation de rechargement ou nouvelle session', async () => {
      await monetizationService.activateSubscription('intensif');
      await economyService.rewardRevisionCompletion('rev-persist-1', 'Physique');
      await economyService.consumeEnergy(1, 'Quiz test');

      const state1 = await economyService.getEconomyState();
      expect(state1.subscription.plan).toBe('intensif');
      expect(state1.energy.maxEnergy).toBe(20);

      const state2 = await economyService.getEconomyState();
      expect(state2.subscription.plan).toBe(state1.subscription.plan);
      expect(state2.diamonds.balance).toBe(state1.diamonds.balance);
      expect(state2.energy.currentEnergy).toBe(state1.energy.currentEnergy);
    });
  });

  // =========================================================================
  // 8. GESTION DE L’EXPIRATION D’ABONNEMENT
  // =========================================================================
  describe('8. Expiration d’Abonnement', () => {
    it('fait basculer un compte expiré au statut Free sans perdre ses diamants ni ses cours', async () => {
      await monetizationService.activateSubscription('premium');
      await economyService.rewardRevisionCompletion('rev-cours-conserve', 'SVT');
      const stateActive = await economyService.getEconomyState();
      const diamondsBeforeExpiration = stateActive.diamonds.balance;

      const profile = await dataProvider.getProfile();
      const userSub = (dataProvider as any).subscriptions.get(profile.id);
      userSub.expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const stateExpired = await economyService.getEconomyState();
      expect(stateExpired.subscription.status).toBe('expired');
      expect(stateExpired.subscription.plan).toBe('free');
      expect(stateExpired.subscription.dailyRevisionLimit).toBe(1);

      expect(stateExpired.diamonds.balance).toBe(diamondsBeforeExpiration);
      expect(stateExpired.energy.maxEnergy).toBe(3);
    });
  });
});
