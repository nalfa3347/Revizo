import { IDataProvider } from '../contracts/IDataProvider';
import { IAuthProvider } from '../contracts/IAuthProvider';
import { MockDataProvider } from './mock/MockDataProvider';
import { MockAuthProvider } from './mock/MockAuthProvider';
import { SupabaseDataProvider } from './supabase/SupabaseDataProvider';
import { SupabaseAuthProvider } from './supabase/SupabaseAuthProvider';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient';
import { UserProfile } from '../types';

export type ProviderType = 'mock' | 'supabase';

/**
 * Détermine le type de fournisseur actif selon les variables d'environnement.
 * Par défaut : 'mock' (développement local sans backend Supabase).
 */
export function getActiveProviderType(): ProviderType {
  const configuredType = (import.meta.env.VITE_DATA_PROVIDER || '').toLowerCase().trim();
  if (configuredType === 'supabase') {
    if (isSupabaseConfigured()) {
      return 'supabase';
    }
    console.warn(
      '[REVIZO ProviderFactory] VITE_DATA_PROVIDER est défini sur "supabase", mais les variables VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY sont manquantes. Bascule automatique sur MockDataProvider pour préserver l’exécution locale.'
    );
    return 'mock';
  }
  return 'mock';
}

/**
 * Fabrique du fournisseur de données IDataProvider.
 */
export function createDataProvider(authUser?: UserProfile | null, latencyMs: number = 50): IDataProvider {
  const providerType = getActiveProviderType();

  if (providerType === 'supabase') {
    const client = getSupabaseClient();
    if (client) {
      return new SupabaseDataProvider(client, authUser || undefined);
    }
  }

  return new MockDataProvider(latencyMs);
}

/**
 * Fabrique du fournisseur d'authentification IAuthProvider.
 */
export function createAuthProvider(latencyMs: number = 60): IAuthProvider {
  const providerType = getActiveProviderType();

  if (providerType === 'supabase') {
    const client = getSupabaseClient();
    if (client) {
      return new SupabaseAuthProvider(client);
    }
  }

  return new MockAuthProvider(latencyMs);
}
