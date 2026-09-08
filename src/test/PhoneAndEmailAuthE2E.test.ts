import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { Database } from '../types/database.types';
import { SupabaseAuthProvider } from '../providers/supabase/SupabaseAuthProvider';
import { AuthService } from '../services/AuthService';

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

describe('REVIZO — Authentification et Persistance Réelle (Email & Numéro de Téléphone)', () => {
  let clientPhone: SupabaseClient<Database>;
  let authProviderPhone: SupabaseAuthProvider;
  let authServicePhone: AuthService;

  let clientEmail: SupabaseClient<Database>;
  let authProviderEmail: SupabaseAuthProvider;
  let authServiceEmail: AuthService;

  const timestamp = Date.now().toString().slice(-6);
  // Numéro ouest-africain / togolais valide (8 chiffres : 90 à 99 + 6 chiffres)
  const localPhoneNumber = `92${timestamp}`;
  const intlPhoneNumber = `+228 ${localPhoneNumber.slice(0, 2)} ${localPhoneNumber.slice(2, 4)} ${localPhoneNumber.slice(4, 6)} ${localPhoneNumber.slice(6)}`;
  const phonePassword = `PassPhone_${timestamp}!`;

  const emailAddress = `eleve_phone_test_${timestamp}@revizo.test`;
  const emailPassword = `PassEmail_${timestamp}!`;

  beforeAll(() => {
    const env = loadSupabaseEnv();

    clientPhone = createClient<Database>(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    authProviderPhone = new SupabaseAuthProvider(clientPhone);
    authServicePhone = new AuthService(authProviderPhone);

    clientEmail = createClient<Database>(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    authProviderEmail = new SupabaseAuthProvider(clientEmail);
    authServiceEmail = new AuthService(authProviderEmail);
  });

  it('Étape 1 : Inscription par numéro de téléphone réussie avec profil propre', async () => {
    const profile = await authServicePhone.signUp({
      identifier: intlPhoneNumber,
      identifierType: 'phone',
      password: phonePassword,
      displayName: `Koffi Phone ${timestamp}`,
      gradeLevel: '3e'
    });

    expect(profile).toBeDefined();
    expect(profile.id).toBeDefined();
    expect(profile.displayName).toBe(`Koffi Phone ${timestamp}`);
    expect(profile.gradeLevel).toBe('3e');
    // Le numéro de téléphone doit être conservé
    expect(profile.phone).toBeDefined();
    // L'email ne doit JAMAIS contenir l'adresse virtuelle interne
    expect(profile.email).not.toContain('@auth.revizo.app');
  });

  it('Étape 2 : Détection de l’identifiant (checkIdentifier) sous TOUTES les formes', async () => {
    // 1. Format international avec espaces
    const checkIntl = await authServicePhone.checkIdentifier(intlPhoneNumber);
    expect(checkIntl.exists).toBe(true);
    expect(checkIntl.type).toBe('phone');

    // 2. Format international compact (+22892...)
    const checkIntlCompact = await authServicePhone.checkIdentifier(`+228${localPhoneNumber}`);
    expect(checkIntlCompact.exists).toBe(true);

    // 3. Format local 8 chiffres (92...)
    const checkLocal = await authServicePhone.checkIdentifier(localPhoneNumber);
    expect(checkLocal.exists).toBe(true);

    // 4. Format local avec espaces (92 xx xx xx)
    const spacedLocal = `${localPhoneNumber.slice(0, 2)} ${localPhoneNumber.slice(2, 4)} ${localPhoneNumber.slice(4, 6)} ${localPhoneNumber.slice(6)}`;
    const checkSpaced = await authServicePhone.checkIdentifier(spacedLocal);
    expect(checkSpaced.exists).toBe(true);
  });

  it('Étape 3 : Connexion avec le numéro de téléphone (format local et international)', async () => {
    // 1. Connexion avec le format local 8 chiffres
    const loggedProfile = await authServicePhone.signIn({
      identifier: localPhoneNumber,
      password: phonePassword
    });

    expect(loggedProfile).toBeDefined();
    expect(loggedProfile.displayName).toBe(`Koffi Phone ${timestamp}`);
    expect(loggedProfile.email).not.toContain('@auth.revizo.app');

    // 2. Vérification session courante (getCurrentUser)
    const current = await authServicePhone.getCurrentUser();
    expect(current).toBeDefined();
    expect(current?.id).toBe(loggedProfile.id);
    expect(current?.email).not.toContain('@auth.revizo.app');
  });

  it('Étape 4 : Déconnexion puis reconnexion avec format international', async () => {
    await authServicePhone.signOut();
    const afterSignOut = await authServicePhone.getCurrentUser();
    expect(afterSignOut).toBeNull();

    // Reconnexion avec le format international complet
    const reconnected = await authServicePhone.signIn({
      identifier: intlPhoneNumber,
      password: phonePassword
    });

    expect(reconnected).toBeDefined();
    expect(reconnected.displayName).toBe(`Koffi Phone ${timestamp}`);
  });

  it('Étape 5 : Refus de réinscription du même numéro avec message clair', async () => {
    await expect(
      authServicePhone.signUp({
        identifier: localPhoneNumber,
        identifierType: 'phone',
        password: phonePassword,
        displayName: 'Doublon Test',
        gradeLevel: 'Terminale'
      })
    ).rejects.toThrow(/Un compte existe déjà avec ce numéro de téléphone/);
  });

  it('Étape 6 : Inscription et connexion par adresse email classique', async () => {
    // 1. Inscription
    const emailProfile = await authServiceEmail.signUp({
      identifier: emailAddress,
      identifierType: 'email',
      password: emailPassword,
      displayName: `Amina Email ${timestamp}`,
      gradeLevel: '1ere'
    });

    expect(emailProfile).toBeDefined();
    expect(emailProfile.email).toBe(emailAddress);

    // 2. Détection identifiant email
    const emailCheck = await authServiceEmail.checkIdentifier(emailAddress);
    expect(emailCheck.exists).toBe(true);
    expect(emailCheck.type).toBe('email');

    // 3. Déconnexion et reconnexion
    await authServiceEmail.signOut();
    const reconnectedEmail = await authServiceEmail.signIn({
      identifier: emailAddress,
      password: emailPassword
    });

    expect(reconnectedEmail).toBeDefined();
    expect(reconnectedEmail.displayName).toBe(`Amina Email ${timestamp}`);
    expect(reconnectedEmail.email).toBe(emailAddress);
  });

  it('Étape 7 : Refus de réinscription de la même adresse email avec message clair', async () => {
    await expect(
      authServiceEmail.signUp({
        identifier: emailAddress,
        identifierType: 'email',
        password: emailPassword,
        displayName: 'Doublon Email',
        gradeLevel: '2nde'
      })
    ).rejects.toThrow(/Un compte existe déjà avec cette adresse email/);
  });

  it('Étape 8 : Échec bienveillant en cas de mauvais mot de passe', async () => {
    await expect(
      authServicePhone.signIn({
        identifier: localPhoneNumber,
        password: 'MauvaisMotDePasse123!'
      })
    ).rejects.toThrow(/Identifiants ou mot de passe incorrect/);
  });
});
