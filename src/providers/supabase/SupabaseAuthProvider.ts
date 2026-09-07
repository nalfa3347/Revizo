import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database.types';
import { IAuthProvider, IdentifierCheckResult } from '../../contracts/IAuthProvider';
import { UserProfile, SignInCredentials, SignUpData } from '../../types';
import { UserRepository } from '../../repositories/UserRepository';
import { ProgressRepository } from '../../repositories/ProgressRepository';
import { SettingsRepository } from '../../repositories/SettingsRepository';

/**
 * REVIZO — SupabaseAuthProvider
 * Implémentation du fournisseur d'authentification basée sur Supabase Auth & PostgreSQL.
 * Découple totalement le code client de l'implémentation d'authentification.
 */
export class SupabaseAuthProvider implements IAuthProvider {
  private userRepo: UserRepository;
  private progressRepo: ProgressRepository;
  private settingsRepo: SettingsRepository;

  constructor(private client: SupabaseClient<Database>) {
    this.userRepo = new UserRepository(client);
    this.progressRepo = new ProgressRepository(client);
    this.settingsRepo = new SettingsRepository(client);
  }

  private normalizeIdentifier(raw: string): string {
    const trimmed = raw.trim().toLowerCase();
    if (/^[\d+\s.-]+$/.test(trimmed)) {
      return trimmed.replace(/[\s.-]/g, '');
    }
    return trimmed;
  }

  private detectIdentifierType(identifier: string): 'email' | 'phone' {
    const normalized = this.normalizeIdentifier(identifier);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return 'email';
    }
    return 'phone';
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error || !user) return null;

      const profile = await this.userRepo.getById(user.id);
      if (profile) return profile;

      // Si le profil en table n'existe pas encore, construire un profil temporaire à partir du compte auth
      return {
        id: user.id,
        email: user.email || '',
        phone: user.phone || undefined,
        displayName: (user.user_metadata?.display_name as string) || 'Élève',
        gradeLevel: (user.user_metadata?.grade_level as any) || '3e',
        joinedAt: user.created_at
      };
    } catch (err) {
      console.error('[SupabaseAuthProvider.getCurrentUser] Erreur :', err);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async checkIdentifier(identifier: string): Promise<IdentifierCheckResult> {
    const normalized = this.normalizeIdentifier(identifier);
    const type = this.detectIdentifierType(identifier);

    try {
      // Vérification discrète dans la table publique des profils
      let query = this.client.from('users').select('id');
      if (type === 'email') {
        query = query.eq('email', normalized);
      } else {
        query = query.eq('phone', normalized);
      }

      const { data } = await query.maybeSingle();
      return {
        exists: Boolean(data),
        type
      };
    } catch {
      return {
        exists: false,
        type
      };
    }
  }

  async signIn(credentials: SignInCredentials): Promise<UserProfile> {
    const normalized = this.normalizeIdentifier(credentials.identifier);
    const type = this.detectIdentifierType(credentials.identifier);

    const authPayload = type === 'email'
      ? { email: normalized, password: credentials.password }
      : { phone: normalized, password: credentials.password };

    const { data, error } = await this.client.auth.signInWithPassword(authPayload);
    if (error || !data.user) {
      throw new Error(error?.message || 'Identifiants invalides.');
    }

    const profile = await this.userRepo.getById(data.user.id);
    if (profile) return profile;

    // Création initiale si absent
    return this.userRepo.upsert({
      id: data.user.id,
      email: data.user.email || '',
      phone: data.user.phone || undefined,
      displayName: (data.user.user_metadata?.display_name as string) || 'Élève',
      gradeLevel: (data.user.user_metadata?.grade_level as any) || '3e'
    });
  }

  async signUp(signUpData: SignUpData): Promise<UserProfile> {
    const normalized = this.normalizeIdentifier(signUpData.identifier);
    const type = this.detectIdentifierType(signUpData.identifier);
    const displayName = signUpData.displayName.trim();

    const authPayload = type === 'email'
      ? {
          email: normalized,
          password: signUpData.password,
          options: {
            data: {
              display_name: displayName,
              grade_level: signUpData.gradeLevel
            }
          }
        }
      : {
          phone: normalized,
          password: signUpData.password,
          options: {
            data: {
              display_name: displayName,
              grade_level: signUpData.gradeLevel
            }
          }
        };

    const { data, error } = await this.client.auth.signUp(authPayload);
    if (error || !data.user) {
      throw new Error(error?.message || 'Impossible de créer le compte.');
    }

    // Détection Supabase : si l'utilisateur existe déjà, identities est une liste vide
    if (data.user.identities && data.user.identities.length === 0) {
      throw new Error("Un compte existe déjà avec cette adresse email. Veuillez vous connecter directement.");
    }

    const newProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email || (type === 'email' ? normalized : ''),
      phone: data.user.phone || (type === 'phone' ? normalized : undefined),
      displayName,
      gradeLevel: signUpData.gradeLevel,
      joinedAt: new Date().toISOString()
    };

    // Initialisation profil, progression et paramètres dans Supabase
    // Note : Le trigger PostgreSQL `on_auth_user_created` (SECURITY DEFINER) initialise déjà
    // automatiquement users, user_progress et user_settings en base de données.
    // Les upserts client ne sont exécutés que si une session active est disponible.
    if (data.session) {
      try {
        await this.userRepo.upsert(newProfile);
        await this.progressRepo.upsert({
          userId: data.user.id,
          totalXp: 0,
          level: 1,
          xpToNextLevel: 100,
          currentStreak: 1,
          longestStreak: 1,
          diamondsBalance: 10,
          energyBalance: 3,
          dailyGoalMinutes: 15,
          dailyGoalProgressMinutes: 0,
          lastActivityDate: new Date().toISOString().split('T')[0],
          weeklyDays: [true, false, false, false, false, false, false]
        });
        await this.settingsRepo.upsert(
          {
            theme: 'light',
            animationsEnabled: true,
            language: 'fr',
            notificationsRevision: true,
            notificationsDailyReminders: true,
            notificationsRewards: true
          },
          data.user.id
        );
      } catch (clientInitErr) {
        console.warn('[SupabaseAuthProvider] Initialisation client facultative (déjà assurée par trigger) :', clientInitErr);
      }
    }

    return newProfile;
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    const { data: { subscription } } = this.client.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        callback(null);
        return;
      }
      const profile = await this.getCurrentUser();
      callback(profile);
    });

    return () => {
      subscription.unsubscribe();
    };
  }
}
