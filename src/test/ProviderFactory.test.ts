import { describe, it, expect } from 'vitest';
import { getActiveProviderType, createDataProvider, createAuthProvider } from '../providers/providerFactory';
import { MockDataProvider } from '../providers/mock/MockDataProvider';
import { MockAuthProvider } from '../providers/mock/MockAuthProvider';
import { SupabaseDataProvider } from '../providers/supabase/SupabaseDataProvider';
import { SupabaseAuthProvider } from '../providers/supabase/SupabaseAuthProvider';

describe('ProviderFactory — Provider Selection and Fallback Security', () => {
  it('détecte correctement le provider actif selon l’environnement configuré', () => {
    const activeType = getActiveProviderType();
    const envProvider = (import.meta.env.VITE_DATA_PROVIDER || '').toLowerCase().trim();

    if (envProvider === 'supabase') {
      expect(activeType).toBe('supabase');
    } else {
      expect(activeType).toBe('mock');
    }
  });

  it('instancie un IDataProvider fonctionnel correspondant au type actif', () => {
    const activeType = getActiveProviderType();
    const dataProvider = createDataProvider(null, 10);

    expect(dataProvider).toBeDefined();
    if (activeType === 'supabase') {
      expect(dataProvider instanceof SupabaseDataProvider).toBe(true);
    } else {
      expect(dataProvider instanceof MockDataProvider).toBe(true);
    }
    expect(typeof dataProvider.getCourses).toBe('function');
    expect(typeof dataProvider.getRevisionByCourseId).toBe('function');
    expect(typeof dataProvider.getQuizByCourseId).toBe('function');
    expect(typeof dataProvider.getProgress).toBe('function');
  });

  it('instancie un IAuthProvider fonctionnel correspondant au type actif', () => {
    const activeType = getActiveProviderType();
    const authProvider = createAuthProvider(10);

    expect(authProvider).toBeDefined();
    if (activeType === 'supabase') {
      expect(authProvider instanceof SupabaseAuthProvider).toBe(true);
    } else {
      expect(authProvider instanceof MockAuthProvider).toBe(true);
    }
    expect(typeof authProvider.signIn).toBe('function');
    expect(typeof authProvider.signUp).toBe('function');
    expect(typeof authProvider.signOut).toBe('function');
    expect(typeof authProvider.getCurrentUser).toBe('function');
  });

  it('garantit que le MockDataProvider fonctionne immédiatement avec les données initiales', async () => {
    const mockProvider = new MockDataProvider(0);
    const profile = await mockProvider.getProfile();
    expect(profile).toBeDefined();
    expect(profile.displayName).toBe('Nasser');

    const courses = await mockProvider.getCourses();
    expect(Array.isArray(courses)).toBe(true);
    expect(courses.length).toBeGreaterThan(0);
  });
});
