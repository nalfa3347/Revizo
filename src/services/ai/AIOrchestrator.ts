import { AIProvider } from './AIProvider';
import { MockAIProvider } from './MockAIProvider';
import { DocumentExtractorService } from '../document/DocumentExtractorService';
import { Course, CourseAnalysis, Revision, Quiz, ComprehensionQuestion, QuizPlan, Exercise } from '../../types';
import { IDataProvider } from '../../contracts/IDataProvider';
import { getActiveProviderType } from '../../providers/providerFactory';
import { GeminiEdgeOrchestrator } from './GeminiEdgeOrchestrator';

export type PipelineStage = 
  | 'idle'
  | 'reading'              // "Lecture du cours…"
  | 'understanding'        // "Compréhension du cours…"
  | 'prioritizing'         // "Identification des notions essentielles…"
  | 'generating_rev'       // "Création de ta fiche de révision…"
  | 'generating_questions' // "Préparation de tes questions…"
  | 'generating_quiz'      // "Préparation de tes quiz…"
  | 'generating_exercises' // "Préparation de tes exercices…"
  | 'extracting'           // Rétrocompatibilité locale
  | 'analyzing'            // Rétrocompatibilité locale
  | 'completed'            // "Ton cours est prêt !"
  | 'error';

export interface PipelineProgress {
  stage: PipelineStage;
  message: string;
  percent: number;
}

export interface PipelineResult {
  course: Course;
  analysis?: CourseAnalysis;
  revision: Revision;
  quiz: Quiz;
  comprehensionQuestions?: ComprehensionQuestion[];
  quizPlan?: QuizPlan | null;
  exercises?: Exercise[];
}

export class AIOrchestrator {
  private extractor: DocumentExtractorService;
  private aiProvider: AIProvider;
  private dataProvider: IDataProvider;
  private geminiEdgeOrchestrator: GeminiEdgeOrchestrator;

  constructor(
    dataProvider: IDataProvider,
    aiProvider?: AIProvider,
    extractor?: DocumentExtractorService
  ) {
    this.dataProvider = dataProvider;
    this.extractor = extractor || new DocumentExtractorService();
    this.aiProvider = aiProvider || new MockAIProvider();
    this.geminiEdgeOrchestrator = new GeminiEdgeOrchestrator();
  }

  /**
   * Exécute le pipeline complet de traitement d'un document
   * En mode Supabase : utilise UNIQUEMENT Gemini 2.5 Flash via Edge Function. Zéro fallback silencieux vers Mock.
   * En mode Mock : utilise MockAIProvider pour le développement local et les tests isolés.
   */
  async processCourseDocument(
    file: File,
    userId: string,
    onProgress?: (progress: PipelineProgress) => void
  ): Promise<PipelineResult> {
    const providerType = getActiveProviderType();

    // ========================================================
    // MODE PRODUCTION / SUPABASE : GEMINI 2.5 FLASH RÉEL
    // ========================================================
    if (providerType === 'supabase') {
      try {
        const result = await this.geminiEdgeOrchestrator.processCourseDocument(file, userId, onProgress);
        return result;
      } catch (err: any) {
        // En mode Supabase, AUCUN fallback silencieux vers MockAIProvider
        onProgress?.({
          stage: 'error',
          message: err.message || "Nous n'avons pas réussi à analyser ton cours. Réessaie dans quelques instants.",
          percent: 0
        });
        throw err;
      }
    }

    // ========================================================
    // MODE MOCK : DÉVELOPPEMENT LOCAL & TESTS ISOLÉS
    // ========================================================
    try {
      // 1. Lecture du cours…
      onProgress?.({
        stage: 'reading',
        message: 'Lecture du cours…',
        percent: 20
      });
      const extractedDoc = await this.extractor.extract(file);

      // 2. Compréhension du cours…
      onProgress?.({
        stage: 'understanding',
        message: 'Compréhension du cours…',
        percent: 40
      });
      const analysis = await this.aiProvider.analyzeCourse(extractedDoc);

      // 3. Identification des notions essentielles…
      onProgress?.({
        stage: 'prioritizing',
        message: 'Identification des notions essentielles…',
        percent: 55
      });

      // 4. Création de ta fiche de révision…
      onProgress?.({
        stage: 'generating_rev',
        message: 'Création de ta fiche de révision…',
        percent: 70
      });
      const revision = await this.aiProvider.generateRevision(analysis);

      // 5. Préparation de tes questions et quiz…
      onProgress?.({
        stage: 'generating_quiz',
        message: 'Préparation de tes quiz…',
        percent: 85
      });
      const quiz = await this.aiProvider.generateQuiz(analysis);

      // Génération de questions de compréhension et exercices mock
      const comprehensionQuestions: ComprehensionQuestion[] = (analysis.concepts || []).slice(0, 3).map((c, i) => ({
        id: `cq-${analysis.courseId}-${i + 1}`,
        courseId: analysis.courseId,
        conceptId: c.id,
        question: `Expliquez brièvement en quoi consiste : ${c.name}`,
        expectedAnswer: c.summary,
        explanation: `Cette notion est essentielle dans le cours.`,
        sourceReferences: [{ page: 1, section: c.name }]
      }));

      const exercises: Exercise[] = (analysis.concepts || []).slice(0, 2).map((c, i) => ({
        id: `ex-${analysis.courseId}-${i + 1}`,
        courseId: analysis.courseId,
        conceptId: c.id,
        statement: `Exercice d'application sur : ${c.name}`,
        instructions: `Appliquez la méthode vue dans le cours pour résoudre le problème.`,
        expectedMethod: `Méthode standard du cours`,
        correction: `Solution détaillée basée sur la définition de ${c.name}.`,
        difficulty: 2,
        sourceReferences: [{ page: 1, section: c.name }],
        status: 'pending'
      }));

      const quizPlan: QuizPlan = {
        id: `qp-${analysis.courseId}`,
        courseId: analysis.courseId,
        title: `Plan de Quiz : ${analysis.title}`,
        plannedQuizzes: [
          {
            quizId: quiz.id,
            title: quiz.title,
            difficulty: 2,
            purpose: 'Validation immédiate',
            conceptIds: analysis.concepts.map(c => c.id),
            questionsCount: quiz.totalQuestions,
            scheduledSession: 1,
            isReady: true
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

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

      // Sauvegarde dans le DataProvider
      await this.dataProvider.saveImportedCourseData(
        newCourse,
        analysis.concepts,
        revision,
        quiz,
        comprehensionQuestions,
        exercises,
        quizPlan
      );

      onProgress?.({
        stage: 'completed',
        message: 'Ton cours est prêt !',
        percent: 100
      });

      return {
        course: newCourse,
        analysis,
        revision,
        quiz,
        comprehensionQuestions,
        quizPlan,
        exercises
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
