import { AIProvider } from './AIProvider';
import { MockAIProvider } from './MockAIProvider';
import { DocumentExtractorService } from '../document/DocumentExtractorService';
import { Course, CourseAnalysis, Revision, Quiz } from '../../types';
import { IDataProvider } from '../../contracts/IDataProvider';

export type PipelineStage = 
  | 'idle'
  | 'extracting'      // "Lecture et analyse de ton cours…"
  | 'analyzing'       // "Extraction des notions importantes…"
  | 'generating_rev'  // "Création de ta fiche de révision…"
  | 'generating_quiz' // "Préparation de ton quiz…"
  | 'completed'       // "Ton cours est prêt !"
  | 'error';

export interface PipelineProgress {
  stage: PipelineStage;
  message: string;
  percent: number;
}

export interface PipelineResult {
  course: Course;
  analysis: CourseAnalysis;
  revision: Revision;
  quiz: Quiz;
}

export class AIOrchestrator {
  private extractor: DocumentExtractorService;
  private aiProvider: AIProvider;
  private dataProvider: IDataProvider;

  constructor(
    dataProvider: IDataProvider,
    aiProvider?: AIProvider,
    extractor?: DocumentExtractorService
  ) {
    this.dataProvider = dataProvider;
    this.extractor = extractor || new DocumentExtractorService();
    this.aiProvider = aiProvider || new MockAIProvider();
  }

  /**
   * Exécute le pipeline complet de traitement d'un document
   */
  async processCourseDocument(
    file: File,
    userId: string,
    onProgress?: (progress: PipelineProgress) => void
  ): Promise<PipelineResult> {
    try {
      // 1. EXTRACTION DU DOCUMENT
      onProgress?.({
        stage: 'extracting',
        message: 'Lecture et analyse de ton cours…',
        percent: 20
      });
      const extractedDoc = await this.extractor.extract(file);

      // 2. ANALYSE SÉMANTIQUE & CONCEPTS
      onProgress?.({
        stage: 'analyzing',
        message: 'Extraction des notions importantes…',
        percent: 45
      });
      const analysis = await this.aiProvider.analyzeCourse(extractedDoc);

      // 3. GÉNÉRATION DE LA FICHE DE RÉVISION
      onProgress?.({
        stage: 'generating_rev',
        message: 'Création de ta fiche de révision…',
        percent: 70
      });
      const revision = await this.aiProvider.generateRevision(analysis);

      // 4. GÉNÉRATION DU QUIZ ASSOCIÉ AUX CONCEPTS
      onProgress?.({
        stage: 'generating_quiz',
        message: 'Préparation de ton quiz…',
        percent: 90
      });
      const quiz = await this.aiProvider.generateQuiz(analysis);

      // 5. ENREGISTREMENT EN MÉMOIRE (Zéro persistance interdite)
      const newCourse: Course = {
        id: analysis.courseId,
        userId,
        subjectId: analysis.subjectId,
        subjectName: analysis.subjectName,
        title: analysis.title,
        summary: analysis.summary,
        difficulty: analysis.difficulty,
        status: 'ready',
        conceptsCount: analysis.concepts.length,
        originalDocumentName: file.name,
        fileSize: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progressPercentage: 0
      };

      // Sauvegarde en mémoire dans le DataProvider
      await this.dataProvider.saveImportedCourseData(newCourse, analysis.concepts, revision, quiz);

      onProgress?.({
        stage: 'completed',
        message: 'Ton cours est prêt !',
        percent: 100
      });

      return {
        course: newCourse,
        analysis,
        revision,
        quiz
      };
    } catch (err: any) {
      onProgress?.({
        stage: 'error',
        message: 'Une difficulté est survenue lors de la lecture du document. Vérifie que le fichier est lisible.',
        percent: 0
      });
      throw err;
    }
  }
}
