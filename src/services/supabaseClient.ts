import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Indique si les variables d'environnement Supabase sont renseignées.
 */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && anonKey && url.trim() !== '' && anonKey.trim() !== '');
}

/**
 * Retourne le client Supabase typé s'il est configuré, sinon null.
 * Ne lève jamais d'erreur bloquante au démarrage.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (cachedClient) return cachedClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.trim() === '' || anonKey.trim() === '') {
    return null;
  }

  try {
    cachedClient = createClient<Database>(url.trim(), anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return cachedClient;
  } catch (err) {
    console.warn('Initialisation du client Supabase impossible (variables invalides) :', err);
    return null;
  }
}
