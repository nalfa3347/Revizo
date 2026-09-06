import { IAuthProvider, IdentifierCheckResult } from '../contracts/IAuthProvider';
import { UserProfile, SignInCredentials, SignUpData, SchoolLevel } from '../types';

/**
 * REVIZO — AuthService
 * Encapsule la logique métier, la validation et les messages bienveillants pour les élèves.
 * Aucun message technique ou code d'erreur HTTP n'est exposé.
 */
export class AuthService {
  constructor(private authProvider: IAuthProvider) {}

  /**
   * Valide un identifiant (email ou téléphone)
   */
  validateIdentifier(rawIdentifier: string): { isValid: boolean; type: 'email' | 'phone'; errorMessage?: string } {
    const trimmed = rawIdentifier.trim();
    if (!trimmed) {
      return {
        isValid: false,
        type: 'email',
        errorMessage: 'Indique ton adresse email ou ton numéro de téléphone.'
      };
    }

    // Détection email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmed)) {
      return { isValid: true, type: 'email' };
    }

    // Détection téléphone (au moins 10 chiffres pour un format français/international)
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      return { isValid: true, type: 'phone' };
    }

    return {
      isValid: false,
      type: 'email',
      errorMessage: 'Vérifie ton adresse email ou ton numéro de téléphone.'
    };
  }

  /**
   * Valide un mot de passe
   */
  validatePassword(password: string): { isValid: boolean; errorMessage?: string } {
    const trimmed = password.trim();
    if (!trimmed) {
      return { isValid: false, errorMessage: 'Indique ton mot de passe.' };
    }
    if (trimmed.length < 6) {
      return {
        isValid: false,
        errorMessage: 'Ce mot de passe n’est pas valide (au moins 6 caractères).'
      };
    }
    return { isValid: true };
  }

  /**
   * Valide les informations d'inscription
   */
  validateSignUpData(data: SignUpData): { isValid: boolean; errorMessage?: string } {
    const idCheck = this.validateIdentifier(data.identifier);
    if (!idCheck.isValid) {
      return { isValid: false, errorMessage: idCheck.errorMessage };
    }

    const pwdCheck = this.validatePassword(data.password);
    if (!pwdCheck.isValid) {
      return { isValid: false, errorMessage: pwdCheck.errorMessage };
    }

    if (!data.displayName || data.displayName.trim().length < 2) {
      return {
        isValid: false,
        errorMessage: 'Indique ton prénom et ton nom pour personnaliser tes révisions.'
      };
    }

    const validLevels: SchoolLevel[] = ['6e', '5e', '4e', '3e', '2nde', '1ere', 'Terminale', 'Superieur'];
    if (!validLevels.includes(data.gradeLevel)) {
      return {
        isValid: false,
        errorMessage: 'Sélectionne ta classe scolaire.'
      };
    }

    return { isValid: true };
  }

  async checkIdentifier(identifier: string): Promise<IdentifierCheckResult> {
    const validation = this.validateIdentifier(identifier);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage || 'Identifiant invalide.');
    }
    return this.authProvider.checkIdentifier(identifier);
  }

  async signIn(credentials: SignInCredentials): Promise<UserProfile> {
    const idValidation = this.validateIdentifier(credentials.identifier);
    if (!idValidation.isValid) {
      throw new Error(idValidation.errorMessage || 'Vérifie ton adresse email ou ton numéro.');
    }

    const pwdValidation = this.validatePassword(credentials.password);
    if (!pwdValidation.isValid) {
      throw new Error(pwdValidation.errorMessage || 'Mot de passe incorrect.');
    }

    return this.authProvider.signIn({
      identifier: credentials.identifier.trim(),
      password: credentials.password.trim()
    });
  }

  async signUp(data: SignUpData): Promise<UserProfile> {
    const validation = this.validateSignUpData(data);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage || 'Informations d’inscription incomplètes.');
    }

    return this.authProvider.signUp({
      ...data,
      displayName: data.displayName.trim(),
      identifier: data.identifier.trim(),
      password: data.password.trim()
    });
  }

  async signOut(): Promise<void> {
    return this.authProvider.signOut();
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    return this.authProvider.getCurrentUser();
  }

  async isAuthenticated(): Promise<boolean> {
    return this.authProvider.isAuthenticated();
  }
}
