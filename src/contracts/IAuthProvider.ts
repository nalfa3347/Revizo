import { UserProfile, SignInCredentials, SignUpData } from '../types';

export interface IdentifierCheckResult {
  exists: boolean;
  type: 'email' | 'phone';
}

/**
 * REVIZO — Contrat d'Interface du Fournisseur d'Authentification
 * Découple strictement l'UI du mécanisme sous-jacent.
 * Actuellement implémenté par MockAuthProvider, puis remplacé par SupabaseAuthProvider.
 */
export interface IAuthProvider {
  getCurrentUser(): Promise<UserProfile | null>;
  isAuthenticated(): Promise<boolean>;
  checkIdentifier(identifier: string): Promise<IdentifierCheckResult>;
  signIn(credentials: SignInCredentials): Promise<UserProfile>;
  signUp(data: SignUpData): Promise<UserProfile>;
  signOut(): Promise<void>;
  onAuthStateChange?(callback: (user: UserProfile | null) => void): () => void;
}
