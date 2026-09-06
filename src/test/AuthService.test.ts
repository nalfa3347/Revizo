import { describe, it, expect, beforeEach } from 'vitest';
import { MockAuthProvider } from '../providers/mock/MockAuthProvider';
import { AuthService } from '../services/AuthService';

describe('AuthService & MockAuthProvider', () => {
  let authProvider: MockAuthProvider;
  let authService: AuthService;

  beforeEach(() => {
    authProvider = new MockAuthProvider(0);
    authService = new AuthService(authProvider);
  });

  it('démarre sans utilisateur connecté par défaut (protection des pages)', async () => {
    const isAuth = await authService.isAuthenticated();
    const currentUser = await authService.getCurrentUser();
    expect(isAuth).toBe(false);
    expect(currentUser).toBeNull();
  });

  it('valide correctement les identifiants email et téléphone', () => {
    // Email valide
    const emailRes = authService.validateIdentifier('nasser@revizo.app');
    expect(emailRes.isValid).toBe(true);
    expect(emailRes.type).toBe('email');

    // Téléphone valide
    const phoneRes = authService.validateIdentifier('0612345678');
    expect(phoneRes.isValid).toBe(true);
    expect(phoneRes.type).toBe('phone');

    // Format téléphone avec espaces
    const phoneWithSpaces = authService.validateIdentifier('06 12 34 56 78');
    expect(phoneWithSpaces.isValid).toBe(true);
    expect(phoneWithSpaces.type).toBe('phone');

    // Invalide
    const invalid = authService.validateIdentifier('invalide');
    expect(invalid.isValid).toBe(false);

    // Vide
    const empty = authService.validateIdentifier('');
    expect(empty.isValid).toBe(false);
  });

  it('valide le format du mot de passe (au moins 6 caractères)', () => {
    expect(authService.validatePassword('12345').isValid).toBe(false);
    expect(authService.validatePassword('123456').isValid).toBe(true);
    expect(authService.validatePassword('Password123!').isValid).toBe(true);
  });

  it('reconnaît le compte de démonstration Nasser par email et par téléphone', async () => {
    const checkEmail = await authService.checkIdentifier('nasser@revizo.app');
    expect(checkEmail.exists).toBe(true);
    expect(checkEmail.type).toBe('email');

    const checkPhone = await authService.checkIdentifier('0612345678');
    expect(checkPhone.exists).toBe(true);
    expect(checkPhone.type).toBe('phone');

    const checkUnknown = await authService.checkIdentifier('inconnu@revizo.app');
    expect(checkUnknown.exists).toBe(false);
  });

  it('connecte l’élève avec un mot de passe valide', async () => {
    const user = await authService.signIn({
      identifier: 'nasser@revizo.app',
      password: 'Password123!'
    });

    expect(user.displayName).toBe('Nasser');
    expect(user.email).toBe('nasser@revizo.app');
    expect(await authService.isAuthenticated()).toBe(true);
    expect(await authService.getCurrentUser()).not.toBeNull();
  });

  it('rejette la connexion en cas de mot de passe incorrect avec un message bienveillant', async () => {
    await expect(
      authService.signIn({
        identifier: 'nasser@revizo.app',
        password: 'mauvais_mdp'
      })
    ).rejects.toThrow('Mot de passe incorrect.');
  });

  it('rejette la connexion pour un identifiant inconnu', async () => {
    await expect(
      authService.signIn({
        identifier: 'inconnu@revizo.app',
        password: 'Password123!'
      })
    ).rejects.toThrow('Vérifie ton adresse email ou ton numéro.');
  });

  it('permet la création d’un nouveau compte et connecte automatiquement l’élève', async () => {
    const newUser = await authService.signUp({
      identifier: 'lea.martin@college.fr',
      identifierType: 'email',
      password: 'SecretPassword99!',
      displayName: 'Léa Martin',
      gradeLevel: '4e'
    });

    expect(newUser.displayName).toBe('Léa Martin');
    expect(newUser.gradeLevel).toBe('4e');
    expect(newUser.email).toBe('lea.martin@college.fr');
    expect(await authService.isAuthenticated()).toBe(true);

    // Vérifie qu'elle peut se reconnecter
    await authService.signOut();
    expect(await authService.isAuthenticated()).toBe(false);

    const relogged = await authService.signIn({
      identifier: 'lea.martin@college.fr',
      password: 'SecretPassword99!'
    });
    expect(relogged.displayName).toBe('Léa Martin');
  });

  it('déconnecte proprement la session sans laisser de trace résiduelle', async () => {
    await authService.signIn({
      identifier: 'nasser@revizo.app',
      password: 'Password123!'
    });
    expect(await authService.isAuthenticated()).toBe(true);

    await authService.signOut();
    expect(await authService.isAuthenticated()).toBe(false);
    expect(await authService.getCurrentUser()).toBeNull();
  });
});
