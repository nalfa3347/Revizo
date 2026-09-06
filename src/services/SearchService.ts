import { IDataProvider } from '../contracts/IDataProvider';
import { SearchResultItem } from '../types';

/**
 * REVIZO — SearchService
 * Encapsule la recherche transversale (cours, fiches de révision, quiz).
 * Découple totalement l'UI de la recherche de données.
 */
export class SearchService {
  constructor(private dataProvider: IDataProvider) {}

  /**
   * Effectue une recherche globale à travers cours, révisions et quiz
   */
  async search(query: string): Promise<SearchResultItem[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      return [];
    }

    try {
      return await this.dataProvider.searchAll(trimmed);
    } catch (err) {
      console.error('Erreur lors de la recherche globale :', err);
      return [];
    }
  }

  /**
   * Suggestions d'exemples de recherche rapides
   */
  getQuickSuggestions(): string[] {
    return [
      'Mathématiques',
      'Français',
      'Sciences',
      'Histoire-Géo',
      'Quiz',
      'Révision'
    ];
  }
}
