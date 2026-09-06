import { CourseAnalysis, Revision, Quiz } from '../../types';
import { ExtractedDocument } from '../document/DocumentExtractorService';

export interface AIProvider {
  readonly providerName: string;

  /**
   * Analyse sémantique et pédagogique du document extrait
   */
  analyzeCourse(doc: ExtractedDocument): Promise<CourseAnalysis>;

  /**
   * Génération de la fiche de révision essentielle
   */
  generateRevision(analysis: CourseAnalysis): Promise<Revision>;

  /**
   * Génération des questions de quiz basées strictement sur les concepts extraits
   */
  generateQuiz(analysis: CourseAnalysis): Promise<Quiz>;
}
