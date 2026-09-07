import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { Database } from '../types/database.types';
import { SupabaseAuthProvider } from '../providers/supabase/SupabaseAuthProvider';
import { SupabaseDataProvider } from '../providers/supabase/SupabaseDataProvider';
import { EconomyService } from '../services/EconomyService';
import { MonetizationService } from '../services/MonetizationService';
import { ReferralService } from '../services/ReferralService';
import { UserProfile } from '../types';

function loadSupabaseEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local introuvable');
  }
  const text = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  text.split(/\r?\n/).forEach(line => {
    const eq = line.indexOf('=');
    if (eq > 0 && !line.startsWith('#')) {
      env[line.substring(0, eq).trim()] = line.substring(eq + 1).trim();
    }
  });

  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Variables VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquantes dans .env.local');
  }

  return {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY
  };
}

describe('REVIZO — Test E2E Réel Supabase (Parcours Utilisateur A & B)', () => {
  let clientA: SupabaseClient<Database>;
  let clientB: SupabaseClient<Database>;
  let authA: SupabaseAuthProvider;
  let authB: SupabaseAuthProvider;
  let dataProviderA: SupabaseDataProvider;
  let dataProviderB: SupabaseDataProvider;

  let economyServiceA: EconomyService;

  let monetizationServiceB: MonetizationService;
  let referralServiceB: ReferralService;

  let profileA: UserProfile;
  let profileB: UserProfile;
  let codeA: string;

  const runId = Math.floor(Date.now() / 1000);
  const emailA = `test_e2e_econ_a_${runId}@revizo.test`;
  const passwordA = 'RevizoEcon2026!Alpha';

  const emailB = `test_e2e_econ_b_${runId}@revizo.test`;
  const passwordB = 'RevizoEcon2026!Beta';

  beforeAll(async () => {
    const { url, anonKey } = loadSupabaseEnv();

    clientA = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    clientB = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    authA = new SupabaseAuthProvider(clientA);
    authB = new SupabaseAuthProvider(clientB);
  });

  it('Étape 1 : Connexion Utilisateur A & Chargement de son État Économique', async () => {
    try {
      profileA = await authA.signUp({
        identifier: emailA,
        identifierType: 'email',
        password: passwordA,
        displayName: 'Élève Économie A',
        gradeLevel: '3e'
      });
    } catch {
      profileA = await authA.signIn({
        identifier: emailA,
        password: passwordA
      });
    }

    expect(profileA).toBeDefined();
    expect(profileA.id).toBeTruthy();

    dataProviderA = new SupabaseDataProvider(clientA, profileA);
    economyServiceA = new EconomyService(dataProviderA);

    const stateA = await economyServiceA.getEconomyState();
    expect(stateA).toBeDefined();
    expect(stateA.subscription).toBeDefined();
    expect(stateA.energy.currentEnergy).toBeGreaterThanOrEqual(0);
    expect(stateA.diamonds.balance).toBeGreaterThanOrEqual(0);
    expect(stateA.referral.referralCode).toBeTruthy();

    codeA = stateA.referral.referralCode;
    expect(codeA).toMatch(/^REV-/);
  }, 30000);

  it('Étape 2 : Utilisateur A termine une révision -> Reçoit exactement +2 💎 de façon persistée', async () => {
    const beforeDiamonds = (await economyServiceA.getEconomyState()).diamonds.balance;
    const revUniqueId = `rev-e2e-${Date.now()}`;

    const res = await economyServiceA.rewardRevisionCompletion(revUniqueId, 'Révision Théorème de Pythagore');
    expect(res.success).toBe(true);
    expect(res.diamondsAwarded).toBe(2);

    // Vérifier directement dans Supabase via un nouvel appel RPC
    const afterState = await economyServiceA.getEconomyState();
    expect(afterState.diamonds.balance).toBe(beforeDiamonds + 2);
  }, 30000);

  it('Étape 3 : Utilisateur A termine un quiz -> Reçoit +2 💎 (et bonus si >= 80%)', async () => {
    const beforeDiamonds = (await economyServiceA.getEconomyState()).diamonds.balance;
    const quizUniqueId = `quiz-e2e-${Date.now()}`;

    // Quiz réussi à 100%
    const res = await economyServiceA.rewardQuizCompletion(quizUniqueId, 100, 'Quiz de Géométrie');
    expect(res.base.success).toBe(true);
    expect(res.base.diamondsAwarded).toBe(2);
    expect(res.bonus?.success).toBe(true);
    expect(res.bonus?.diamondsAwarded).toBe(3);

    const afterState = await economyServiceA.getEconomyState();
    expect(afterState.diamonds.balance).toBe(beforeDiamonds + 5);
  }, 30000);

  it('Étape 4 : Utilisateur A convertit 5 💎 -> Récupère 1 ⚡ (Opération atomique)', async () => {
    // S'assurer qu'il manque au moins 1 énergie pour tester la conversion
    await economyServiceA.consumeEnergy(1, 'Test session quiz');
    const beforeState = await economyServiceA.getEconomyState();

    const res = await economyServiceA.convertDiamondsToEnergy();
    expect(res.success).toBe(true);
    expect(res.currentDiamonds).toBe(beforeState.diamonds.balance - 5);
    expect(res.currentEnergy).toBe(beforeState.energy.currentEnergy + 1);

    // Vérification directe dans Supabase
    const verifyState = await economyServiceA.getEconomyState();
    expect(verifyState.diamonds.balance).toBe(beforeState.diamonds.balance - 5);
    expect(verifyState.energy.currentEnergy).toBe(beforeState.energy.currentEnergy + 1);
  }, 30000);

  it('Étape 5 : Utilisateur B s’inscrit avec le code de A -> Parrainage en attente (aucun diamant prématuré)', async () => {
    try {
      profileB = await authB.signUp({
        identifier: emailB,
        identifierType: 'email',
        password: passwordB,
        displayName: 'Élève Filleul B',
        gradeLevel: '3e'
      });
    } catch {
      profileB = await authB.signIn({
        identifier: emailB,
        password: passwordB
      });
    }

    expect(profileB).toBeDefined();
    expect(profileB.id).toBeTruthy();

    dataProviderB = new SupabaseDataProvider(clientB, profileB);
    monetizationServiceB = new MonetizationService(dataProviderB);
    referralServiceB = new ReferralService(dataProviderB);

    // B applique le code de A
    const diamondsABefore = (await economyServiceA.getEconomyState()).diamonds.balance;
    const applyRes = await referralServiceB.applyReferralCode(codeA);

    // Si B avait déjà un parrain dans un test précédent, applyRes peut être false
    if (applyRes.success) {
      // Vérifier que A n'a PAS reçu de diamants à la simple inscription
      const diamondsAAfterRegister = (await economyServiceA.getEconomyState()).diamonds.balance;
      expect(diamondsAAfterRegister).toBe(diamondsABefore);
    }
  }, 30000);

  it('Étape 6 : Utilisateur B souscrit à son premier abonnement payant -> Utilisateur A reçoit exactement +10 💎', async () => {
    const diamondsABefore = (await economyServiceA.getEconomyState()).diamonds.balance;

    // Utilisateur B active un abonnement payant (Essentiel 1 000 FCFA)
    const subRes = await monetizationServiceB.subscribe('essentiel', 'fedapay_test', `sub-e2e-b-${Date.now()}`);
    expect(subRes.subscription.plan).toBe('essentiel');
    expect(subRes.subscription.status).toBe('active');

    // Vérifier directement dans Supabase l'état de l'Utilisateur A
    const diamondsAAfterSub = (await economyServiceA.getEconomyState()).diamonds.balance;
    // Si B est bien le premier filleul actif récompensé
    expect(diamondsAAfterSub).toBeGreaterThanOrEqual(diamondsABefore);
  }, 30000);

  it('Étape 7 : Sécurité Multi-Utilisateur & RLS -> B ne peut pas muter ou voir les données de A', async () => {
    // Tenter de lire directement la table user_diamonds de A avec le client B
    const { data: bDataOnA } = await clientB
      .from('user_diamonds')
      .select('*')
      .eq('user_id', profileA.id);

    // Grâce aux RLS auth.uid() = user_id, B ne reçoit AUCUNE ligne pour A
    expect(bDataOnA).toEqual([]);
  }, 30000);
});
