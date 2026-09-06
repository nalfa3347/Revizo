import { AIProvider } from './AIProvider';
import { CourseAnalysis, Revision, Quiz } from '../../types';
import { ExtractedDocument } from '../document/DocumentExtractorService';

/**
 * GeminiProvider (Backend AI Connector)
 * 
 * Cette classe est l'implémentation cible pour connecter l'orchestrateur REVIZO
 * à l'API Gemini via le backend sécurisé (jamais en direct dans le frontend).
 * 
 * Dans cette phase locale, les requêtes sont déléguées à MockAIProvider
 * pour garantir le fonctionnement sans clé API ni dépendance externe.
 */
export class GeminiProvider implements AIProvider {
  readonly providerName = 'GeminiProvider (Orchestrateur Backend Sécurisé)';
  private backendEndpoint: string;

  constructor(backendEndpoint = '/api/ai') {
    this.backendEndpoint = backendEndpoint;
  }

  async analyzeCourse(_doc: ExtractedDocument): Promise<CourseAnalysis> {
    throw new Error(
      `GeminiProvider n'est pas encore activé en local (${this.backendEndpoint}). ` +
      `Utilisez MockAIProvider pour cette phase de test entièrement locale.`
    );
  }

  async generateRevision(_analysis: CourseAnalysis): Promise<Revision> {
    throw new Error(
      `GeminiProvider n'est pas encore activé en local. ` +
      `Utilisez MockAIProvider pour cette phase de test entièrement locale.`
    );
  }

  async generateQuiz(_analysis: CourseAnalysis): Promise<Quiz> {
    throw new Error(
      `GeminiProvider n'est pas encore activé en local. ` +
      `Utilisez MockAIProvider pour cette phase de test entièrement locale.`
    );
  }
}
