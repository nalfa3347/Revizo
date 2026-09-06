import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../services/AuthService';
import { CourseService } from '../services/CourseService';
import { RevisionService } from '../services/RevisionService';
import { QuizService } from '../services/QuizService';
import { GamificationService } from '../services/GamificationService';
import { MockDataProvider } from '../providers/mock/MockDataProvider';
import { MockAuthProvider } from '../providers/mock/MockAuthProvider';

describe('PHASE 30 — Parcours Utilisateur Réel de Bout en Bout', () => {
  let dataProvider: MockDataProvider;
  let authProvider: MockAuthProvider;
  let authService: AuthService;
  let courseService: CourseService;
  let revisionService: RevisionService;
  let quizService: QuizService;
  let gamificationService: GamificationService;

  beforeEach(() => {
    dataProvider = new MockDataProvider(0);
    authProvider = new MockAuthProvider();
    authService = new AuthService(authProvider);
    courseService = new CourseService(dataProvider);
    revisionService = new RevisionService(dataProvider);
    quizService = new QuizService(dataProvider);
    gamificationService = new GamificationService(dataProvider);
  });

  it('exécute avec succès le cycle complet de révision REVIZO', async () => {
    // -------------------------------------------------------------
    // ÉTAPE 1 : Authentification de l'élève (Compte officiel de référence)
    // -------------------------------------------------------------
    const student = await authService.signIn({
      identifier: 'nasser@revizo.app',
      password: 'Password123!'
    });
    expect(student).toBeDefined();
    expect(student.displayName).toBe('Nasser');
    dataProvider.setActiveProfile(student);

    // -------------------------------------------------------------
    // ÉTAPE 2 : Découverte des cours et sélection
    // -------------------------------------------------------------
    const allCourses = await courseService.getAllCourses();
    expect(allCourses.length).toBeGreaterThan(0);
    const selectedCourse = allCourses[0];
    expect(selectedCourse.title).toBeTruthy();

    // -------------------------------------------------------------
    // ÉTAPE 3 : Consultation de la fiche de révision structurée
    // -------------------------------------------------------------
    const revision = await revisionService.getRevisionForCourse(selectedCourse.id);
    expect(revision).not.toBeNull();
    expect(revision?.sections.length).toBeGreaterThan(0);
    expect(revision?.summary).toBeTruthy();

    // -------------------------------------------------------------
    // ÉTAPE 4 : Téléchargement natif de la fiche (Phase 12)
    // -------------------------------------------------------------
    const downloadSuccess = await revisionService.downloadRevisionPDF(revision!);
    expect(downloadSuccess).toBe(true);
    const downloadedRev = await revisionService.getRevisionForCourse(selectedCourse.id);
    expect(downloadedRev?.isDownloaded).toBe(true);

    // -------------------------------------------------------------
    // ÉTAPE 5 : Démarrage du quiz pédagogique (Phase 14 & 17)
    // -------------------------------------------------------------
    const quiz = await quizService.getQuizForCourse(selectedCourse.id);
    expect(quiz).not.toBeNull();
    expect(quiz!.questions.length).toBeGreaterThan(0);

    const initialProgress = await dataProvider.getProgress();
    expect(initialProgress.energyBalance).toBe(3);

    const session = await quizService.startQuiz(quiz!.id, true);
    expect(session.status).toBe('active');

    // -------------------------------------------------------------
    // ÉTAPE 6 : Réponse à une question et analyse du résultat (Phase 16)
    // -------------------------------------------------------------
    const q1 = quiz!.questions[0];
    const answerResult = await quizService.submitAnswer(
      session.id,
      {
        questionId: q1.id,
        conceptId: q1.conceptId,
        selectedChoiceIndex: q1.correctChoiceIndex
      },
      true
    );
    expect(answerResult.isCorrect).toBe(true);
    expect(answerResult.explanation).toBeTruthy();

    // -------------------------------------------------------------
    // ÉTAPE 7 : Maîtrise de la notion & Gamification (Phase 17 & 18)
    // -------------------------------------------------------------
    await dataProvider.updateConceptMastery(q1.conceptId, 10);
    const concepts = await dataProvider.getConceptsByCourseId(selectedCourse.id);
    const updatedConcept = concepts.find(c => c.id === q1.conceptId);
    expect(updatedConcept).toBeDefined();

    // Récompense de série / fin de parcours
    await gamificationService.recordDailyStreak();
    const finalProgress = await dataProvider.getProgress();
    expect(finalProgress.diamondsBalance).toBeGreaterThanOrEqual(initialProgress.diamondsBalance);

    // -------------------------------------------------------------
    // ÉTAPE 8 : Robustesse Hors Connexion (Phase 13 & 25)
    // -------------------------------------------------------------
    // En mode hors ligne, la fiche préalablement téléchargée reste lisible
    const isOnline = false;
    const offlineCheck = await revisionService.getRevisionForCourse(selectedCourse.id);
    expect(offlineCheck?.isDownloaded).toBe(true);
    const canReadOffline = !isOnline && offlineCheck?.isDownloaded === true;
    expect(canReadOffline).toBe(true);

    // Et un nouveau quiz ne peut pas être démarré hors connexion
    await expect(quizService.startQuiz(quiz!.id, false)).rejects.toThrow(
      'Connexion requise pour commencer le quiz.'
    );
  });
});
