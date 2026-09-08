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
    if (/^[\d+\s().-]+$/.test(trimmed)) {
      return trimmed.replace(/[\s().-]/g, '');
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

  private phoneToVirtualEmail(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return `phone_${digits}@auth.revizo.app`;
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      // 1. Assurer la validité de la session et rafraîchir le token automatiquement si expiré
      const { data: { session }, error: sessionError } = await this.client.auth.getSession();
      if (sessionError || !session?.user) {
        return null;
      }

      const user = session.user;
      const profile = await this.userRepo.getById(user.id);
      
      const isVirtualEmail = (email?: string | null) => Boolean(email && (email.endsWith('@auth.revizo.app') || email.startsWith('phone_')));

      if (profile) {
        return {
          ...profile,
          email: isVirtualEmail(profile.email) ? '' : profile.email,
          phone: profile.phone || (user.user_metadata?.phone as string) || user.phone || undefined
        };
      }

      // Si le profil en table n'existe pas encore, construire le profil depuis auth.users
      return {
        id: user.id,
        email: isVirtualEmail(user.email) ? '' : (user.email || ''),
        phone: (user.user_metadata?.phone as string) || user.phone || undefined,
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
      // Vérification sécurisée via fonction RPC SECURITY DEFINER (contourne l'isolation RLS pour les visiteurs non connectés)
      const { data, error } = await (this.client as any).rpc('check_identifier_exists', {
        p_identifier: normalized
      });

      if (!error && typeof data === 'boolean') {
        return {
          exists: data,
          type
        };
      }

      // En cas de secours, tentative via table publique
      let query = this.client.from('users').select('id');
      if (type === 'email') {
        query = query.eq('email', normalized);
      } else {
        const digits = normalized.replace(/\D/g, '');
        query = query.or(`phone.eq.${normalized},phone.eq.${digits}`);
      }

      const fallbackRes = await query.maybeSingle();
      return {
        exists: Boolean(fallbackRes.data),
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

    let authUser: any = null;

    if (type === 'email') {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: normalized,
        password: credentials.password
      });
      if (error || !data.user) {
        if (error?.message?.includes('Invalid login credentials')) {
          throw new Error('Identifiants ou mot de passe incorrect.');
        }
        throw new Error(error?.message || 'Identifiants ou mot de passe incorrect.');
      }
      authUser = data.user;
    } else {
      // Connexion par numéro de téléphone : mapping d'email virtuel déterministe
      const digits = normalized.replace(/\D/g, '');
      const primaryVirtualEmail = this.phoneToVirtualEmail(digits);

      let signInResult = await this.client.auth.signInWithPassword({
        email: primaryVirtualEmail,
        password: credentials.password
      });

      // Tentative de secours pour les numéros ouest-africains (avec ou sans indicatif 228)
      if (signInResult.error && digits.length === 8) {
        const altEmail = `phone_228${digits}@auth.revizo.app`;
        const altResult = await this.client.auth.signInWithPassword({
          email: altEmail,
          password: credentials.password
        });
        if (!altResult.error && altResult.data.user) {
          signInResult = altResult;
        }
      } else if (signInResult.error && digits.length === 11 && digits.startsWith('228')) {
        const altEmail = `phone_${digits.slice(3)}@auth.revizo.app`;
        const altResult = await this.client.auth.signInWithPassword({
          email: altEmail,
          password: credentials.password
        });
        if (!altResult.error && altResult.data.user) {
          signInResult = altResult;
        }
      } else if (signInResult.error && digits.length === 10 && digits.startsWith('0')) {
        // Numéros français avec 0 initial (06... -> 336...)
        const altEmail = `phone_33${digits.slice(1)}@auth.revizo.app`;
        const altResult = await this.client.auth.signInWithPassword({
          email: altEmail,
          password: credentials.password
        });
        if (!altResult.error && altResult.data.user) {
          signInResult = altResult;
        }
      } else if (signInResult.error && digits.length === 11 && digits.startsWith('33')) {
        // Numéros français avec indicatif (336... -> 06...)
        const altEmail = `phone_0${digits.slice(2)}@auth.revizo.app`;
        const altResult = await this.client.auth.signInWithPassword({
          email: altEmail,
          password: credentials.password
        });
        if (!altResult.error && altResult.data.user) {
          signInResult = altResult;
        }
      }

      if (signInResult.error || !signInResult.data.user) {
        if (signInResult.error?.message?.includes('Invalid login credentials')) {
          throw new Error('Identifiants ou mot de passe incorrect.');
        }
        throw new Error(signInResult.error?.message || 'Identifiants ou mot de passe incorrect.');
      }

      authUser = signInResult.data.user;
    }

    const profile = await this.userRepo.getById(authUser.id);
    if (profile) {
      const isVirtual = profile.email && (profile.email.endsWith('@auth.revizo.app') || profile.email.startsWith('phone_'));
      return {
        ...profile,
        email: isVirtual ? '' : profile.email,
        phone: profile.phone || (authUser.user_metadata?.phone as string) || (type === 'phone' ? credentials.identifier.trim() : undefined)
      };
    }

    // Création initiale si profil absent
    return this.userRepo.upsert({
      id: authUser.id,
      email: type === 'email' ? normalized : '',
      phone: type === 'phone' ? credentials.identifier.trim() : undefined,
      displayName: (authUser.user_metadata?.display_name as string) || 'Élève',
      gradeLevel: (authUser.user_metadata?.grade_level as any) || '3e'
    });
  }

  async signUp(signUpData: SignUpData): Promise<UserProfile> {
    const normalized = this.normalizeIdentifier(signUpData.identifier);
    const type = this.detectIdentifierType(signUpData.identifier);
    const displayName = signUpData.displayName.trim();
    const isPhone = type === 'phone';

    // Vérification préventive pour éviter les erreurs génériques de Supabase
    const existingCheck = await this.checkIdentifier(signUpData.identifier);
    if (existingCheck.exists) {
      throw new Error(
        isPhone
          ? 'Un compte existe déjà avec ce numéro de téléphone. Connecte-toi directement.'
          : 'Un compte existe déjà avec cette adresse email. Connecte-toi directement.'
      );
    }

    let emailToUse = normalized;
    if (isPhone) {
      const digits = normalized.replace(/\D/g, '');
      emailToUse = this.phoneToVirtualEmail(digits);
    }

    const authPayload = {
      email: emailToUse,
      password: signUpData.password,
      options: {
        data: {
          display_name: displayName,
          grade_level: signUpData.gradeLevel,
          phone: isPhone ? signUpData.identifier.trim() : undefined,
          is_phone_account: isPhone
        }
      }
    };

    const { data, error } = await this.client.auth.signUp(authPayload);
    if (error || !data.user) {
      throw new Error(error?.message || 'Impossible de créer le compte.');
    }

    // Détection Supabase : si l'utilisateur existe déjà, identities est une liste vide
    if (data.user.identities && data.user.identities.length === 0) {
      throw new Error(
        isPhone
          ? 'Un compte existe déjà avec ce numéro de téléphone. Connecte-toi directement.'
          : 'Un compte existe déjà avec cette adresse email. Connecte-toi directement.'
      );
    }

    const newProfile: UserProfile = {
      id: data.user.id,
      email: isPhone ? '' : normalized,
      phone: isPhone ? signUpData.identifier.trim() : undefined,
      displayName,
      gradeLevel: signUpData.gradeLevel,
      joinedAt: new Date().toISOString()
    };

    // Initialisation profil, progression et paramètres dans Supabase
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
