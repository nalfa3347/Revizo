import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataProvider } from '../providers/mock/MockDataProvider';
import { SearchService } from '../services/SearchService';

describe('SearchService', () => {
  let provider: MockDataProvider;
  let searchService: SearchService;

  beforeEach(() => {
    provider = new MockDataProvider(0);
    searchService = new SearchService(provider);
  });

  it('renvoie un tableau vide pour une requête vide ou inférieure à 2 caractères', async () => {
    const emptyResult = await searchService.search('');
    expect(emptyResult).toEqual([]);

    const spacesResult = await searchService.search('   ');
    expect(spacesResult).toEqual([]);

    const singleCharResult = await searchService.search('a');
    expect(singleCharResult).toEqual([]);
  });

  it('retrouve un cours par son titre (« second degré »)', async () => {
    const results = await searchService.search('second degré');
    expect(results.length).toBeGreaterThan(0);

    const courseRes = results.find(r => r.type === 'course');
    expect(courseRes).toBeDefined();
    expect(courseRes?.title.toLowerCase()).toContain('second degré');
    expect(courseRes?.badgeText).toBe('Cours');
    expect(courseRes?.targetTab).toBe('courses');
  });

  it('retrouve du contenu par le nom d’une matière (« Mathématiques »)', async () => {
    const results = await searchService.search('Mathématiques');
    expect(results.length).toBeGreaterThan(0);

    const hasMath = results.some(r => r.subjectName.toLowerCase().includes('math'));
    expect(hasMath).toBe(true);
  });

  it('retrouve une fiche de révision par une notion clé ou section', async () => {
    const results = await searchService.search('discriminant');
    expect(results.length).toBeGreaterThan(0);

    const revRes = results.find(r => r.type === 'revision');
    expect(revRes).toBeDefined();
    expect(revRes?.badgeText).toBe('Révision');
    expect(revRes?.targetTab).toBe('revisions');
  });

  it('retrouve un quiz par son intitulé ou cours associé', async () => {
    const results = await searchService.search('Quiz');
    expect(results.length).toBeGreaterThan(0);

    const quizRes = results.find(r => r.type === 'quiz');
    expect(quizRes).toBeDefined();
    expect(quizRes?.badgeText).toBe('Quiz');
    expect(quizRes?.targetTab).toBe('quizzes');
  });

  it('renvoie un tableau vide pour une recherche inexistante', async () => {
    const results = await searchService.search('xyz999_inexistant_introuvable');
    expect(results).toEqual([]);
  });

  it('fournit des suggestions rapides cohérentes avec REVIZO', () => {
    const suggestions = searchService.getQuickSuggestions();
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).toContain('Second degré');
    expect(suggestions).toContain('Mathématiques');
  });
});
