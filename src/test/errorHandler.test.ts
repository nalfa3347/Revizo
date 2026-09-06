import { describe, it, expect } from 'vitest';
import { formatFriendlyError } from '../utils/errorHandler';

describe('formatFriendlyError (Règle Zéro Erreur Technique)', () => {
  it('traduit une déconnexion hors ligne en message rassurant', () => {
    const error = formatFriendlyError(new Error('Network error'), true);
    expect(error.title).toBe('Mode hors connexion');
    expect(error.message).toContain('Une connexion Internet est nécessaire');
    expect(error.message).not.toContain('Network error');
  });

  it('ne divulgue jamais Failed to fetch ou 500 à l’élève', () => {
    const error = formatFriendlyError(new Error('Failed to fetch: 500 Internal Server Error'));
    expect(error.title).toBe('Connexion interrompue');
    expect(error.message).not.toContain('500');
    expect(error.message).not.toContain('Failed to fetch');
    expect(error.message).not.toContain('Internal Server Error');
  });

  it('traduit les erreurs de ressource introuvable sans code 404', () => {
    const error = formatFriendlyError(new Error('Course 404 not found in database'));
    expect(error.title).toBe('Contenu indisponible');
    expect(error.message).not.toContain('404');
    expect(error.message).not.toContain('database');
  });

  it('traduit les erreurs de quota sans mentionner 429 ou rate limit', () => {
    const error = formatFriendlyError(new Error('Rate limit exceeded: 429 quota exhausted'));
    expect(error.title).toBe('Un petit instant...');
    expect(error.message).not.toContain('429');
    expect(error.message).not.toContain('quota');
  });
});
