import { IAuthProvider, IdentifierCheckResult } from '../../contracts/IAuthProvider';
import { UserProfile, SignInCredentials, SignUpData } from '../../types';
import { INITIAL_AUTH_ACCOUNTS, MockAuthAccount } from './fixtures';

/**
 * REVIZO — MockAuthProvider
 * Implémentation locale en mémoire du fournisseur d'authentification.
 * Aucune dépendance à localStorage, IndexedDB ou API distante.
 */
export class MockAuthProvider implements IAuthProvider {
  private accounts: MockAuthAccount[];
  private currentUser: UserProfile | null = null;
  private latencyMs: number;

  constructor(latencyMs: number = 60) {
    this.latencyMs = latencyMs;
    // Clone les comptes initiaux pour isoler la mémoire
    this.accounts = JSON.parse(JSON.stringify(INITIAL_AUTH_ACCOUNTS));
    // Démarrage sans session pour afficher la page de connexion
    this.currentUser = null;
  }

  private async simulateDelay(): Promise<void> {
    if (this.latencyMs <= 0) return;
    return new Promise(resolve => setTimeout(resolve, this.latencyMs));
  }

  private normalizeIdentifier(raw: string): string {
    const trimmed = raw.trim().toLowerCase();
    // Normalisation des numéros de téléphone (suppression des espaces, tirets, points)
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
    await this.simulateDelay();
    return this.currentUser ? JSON.parse(JSON.stringify(this.currentUser)) : null;
  }

  async isAuthenticated(): Promise<boolean> {
    await this.simulateDelay();
    return this.currentUser !== null;
  }

  async checkIdentifier(identifier: string): Promise<IdentifierCheckResult> {
    await this.simulateDelay();
    const normalized = this.normalizeIdentifier(identifier);
    const type = this.detectIdentifierType(identifier);

    const exists = this.accounts.some(acc => {
      const emailMatch = acc.user.email && this.normalizeIdentifier(acc.user.email) === normalized;
      const phoneMatch = acc.user.phone && this.normalizeIdentifier(acc.user.phone) === normalized;
      return Boolean(emailMatch || phoneMatch);
    });

    return { exists, type };
  }

  async signIn(credentials: SignInCredentials): Promise<UserProfile> {
    await this.simulateDelay();
    const normalized = this.normalizeIdentifier(credentials.identifier);

    const account = this.accounts.find(acc => {
      const emailMatch = acc.user.email && this.normalizeIdentifier(acc.user.email) === normalized;
      const phoneMatch = acc.user.phone && this.normalizeIdentifier(acc.user.phone) === normalized;
      return Boolean(emailMatch || phoneMatch);
    });

    if (!account) {
      throw new Error('Vérifie ton adresse email ou ton numéro.');
    }

    const isValidPassword = account.passwords.includes(credentials.password.trim());
    if (!isValidPassword) {
      throw new Error('Mot de passe incorrect.');
    }

    this.currentUser = JSON.parse(JSON.stringify(account.user));
    return JSON.parse(JSON.stringify(this.currentUser));
  }

  async signUp(data: SignUpData): Promise<UserProfile> {
    await this.simulateDelay();
    const normalized = this.normalizeIdentifier(data.identifier);

    const exists = this.accounts.some(acc => {
      const emailMatch = acc.user.email && this.normalizeIdentifier(acc.user.email) === normalized;
      const phoneMatch = acc.user.phone && this.normalizeIdentifier(acc.user.phone) === normalized;
      return Boolean(emailMatch || phoneMatch);
    });

    if (exists) {
      throw new Error('Un compte existe déjà avec cet identifiant.');
    }

    const isEmail = data.identifierType === 'email';
    const cleanDisplayName = data.displayName.trim();
    const newId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newUser: UserProfile = {
      id: newId,
      displayName: cleanDisplayName,
      email: isEmail ? normalized : `${cleanDisplayName.toLowerCase().replace(/[^a-z0-9]/g, '')}@eleve.revizo.app`,
      phone: !isEmail ? normalized : undefined,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      gradeLevel: data.gradeLevel,
      joinedAt: new Date().toISOString()
    };

    this.accounts.push({
      user: newUser,
      passwords: [data.password.trim()]
    });

    this.currentUser = JSON.parse(JSON.stringify(newUser));
    this.notifyAuthChange(this.currentUser);
    return JSON.parse(JSON.stringify(this.currentUser));
  }

  async signOut(): Promise<void> {
    await this.simulateDelay();
    this.currentUser = null;
    this.notifyAuthChange(null);
  }

  private listeners: ((user: UserProfile | null) => void)[] = [];

  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyAuthChange(user: UserProfile | null): void {
    this.listeners.forEach(callback => {
      try {
        callback(user ? JSON.parse(JSON.stringify(user)) : null);
      } catch (err) {
        console.error('[MockAuthProvider] Erreur callback onAuthStateChange :', err);
      }
    });
  }
}
