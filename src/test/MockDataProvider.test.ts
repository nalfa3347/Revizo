import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataProvider } from '../providers/mock/MockDataProvider';

describe('MockDataProvider', () => {
  let provider: MockDataProvider;

  beforeEach(() => {
    provider = new MockDataProvider(0); // 0ms delay in tests
  });

  it('fournit le profil et la progression initiale avec 3 énergies', async () => {
    const profile = await provider.getProfile();
    const progress = await provider.getProgress();

    expect(profile.displayName).toBe('Nasser');
    expect(profile.gradeLevel).toBe('3e');
    expect(progress.energyBalance).toBe(3);
    expect(progress.diamondsBalance).toBeGreaterThan(0);
    expect(progress.currentStreak).toBeGreaterThan(0);
  });

  it('permet de récupérer les cours et de filtrer par matière', async () => {
    const courses = await provider.getCourses();
    expect(courses.length).toBeGreaterThanOrEqual(3);

    const svtCourses = await provider.getCourses('sbj-svt');
    expect(svtCourses.length).toBe(1);
    expect(svtCourses[0].subjectName).toBe('SVT');
  });

  it('extrait les concepts clés et identifie les notions faibles (< 60% de maîtrise)', async () => {
    const concepts = await provider.getConceptsByCourseId('crs-svt-01');
    expect(concepts.length).toBe(4);

    const weakConcepts = await provider.getWeakConcepts();
    expect(weakConcepts.length).toBeGreaterThan(0);
    weakConcepts.forEach(c => {
      expect(c.masteryScore).toBeLessThan(60);
    });
  });

  it('permet de marquer une révision comme téléchargée sur l’appareil', async () => {
    const revision = await provider.getRevisionByCourseId('crs-hist-01');
    expect(revision).not.toBeNull();
    expect(revision!.isDownloaded).toBe(false);

    const updated = await provider.markRevisionDownloaded(revision!.id, true);
    expect(updated).toBe(true);

    const freshRevision = await provider.getRevisionByCourseId('crs-hist-01');
    expect(freshRevision!.isDownloaded).toBe(true);
    expect(freshRevision!.downloadedAt).toBeDefined();
  });

  it('gère le rechargement d’énergie avec les diamants selon les règles de gamification', async () => {
    // Diminuer l'énergie d'abord
    const session = await provider.startQuizSession('qiz-svt-01');
    await provider.submitQuizAnswer(session.id, {
      questionId: 'qst-svt-1',
      conceptId: 'cpt-svt-1',
      selectedChoiceIndex: 0 // mauvaise réponse
    });

    const progressAfterLoss = await provider.getProgress();
    expect(progressAfterLoss.energyBalance).toBe(2);

    // Recharger avec des diamants
    const initialDiamonds = progressAfterLoss.diamondsBalance;
    const refillResult = await provider.spendDiamondsForEnergy(1);

    expect(refillResult.success).toBe(true);
    expect(refillResult.newEnergy).toBe(3);
    expect(refillResult.newDiamonds).toBe(initialDiamonds - 10);
  });

  it('permet de créer et supprimer un cours', async () => {
    const newCourse = await provider.createCourse({
      title: 'Les fractions et nombres relatifs',
      subjectId: 'sbj-math',
      subjectName: 'Mathématiques',
      difficulty: 2
    });

    expect(newCourse.id).toBeDefined();
    expect(newCourse.title).toBe('Les fractions et nombres relatifs');

    const fetched = await provider.getCourseById(newCourse.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.title).toBe('Les fractions et nombres relatifs');

    const deleted = await provider.deleteCourse(newCourse.id);
    expect(deleted).toBe(true);

    const afterDelete = await provider.getCourseById(newCourse.id);
    expect(afterDelete).toBeNull();
  });

  it('gère la victoire de session de quiz avec attribution de XP et diamants', async () => {
    const session = await provider.startQuizSession('qiz-hist-01');
    expect(session.status).toBe('active');
    expect(session.totalQuestions).toBe(2);

    // Question 1 : bonne réponse
    const res1 = await provider.submitQuizAnswer(session.id, {
      questionId: 'qst-hist-1',
      conceptId: 'cpt-hist-1',
      selectedChoiceIndex: 1
    });
    expect(res1.isCorrect).toBe(true);
    expect(res1.xpEarned).toBe(25);
    expect(res1.session.currentPosition).toBe(1);
    expect(res1.session.status).toBe('active');

    // Question 2 : bonne réponse -> Victoire
    const initialProgress = await provider.getProgress();
    const res2 = await provider.submitQuizAnswer(session.id, {
      questionId: 'qst-hist-2',
      conceptId: 'cpt-hist-2',
      selectedChoiceIndex: 1
    });
    expect(res2.isCorrect).toBe(true);
    expect(res2.session.status).toBe('victory');
    expect(res2.session.completedAt).toBeDefined();

    const finalProgress = await provider.getProgress();
    expect(finalProgress.diamondsBalance).toBe(initialProgress.diamondsBalance + 5);
  });

  it('bloque le démarrage de quiz si énergie = 0 et gère le game over', async () => {
    // Épuiser l'énergie (3 mauvaises réponses)
    const session1 = await provider.startQuizSession('qiz-svt-01');
    await provider.submitQuizAnswer(session1.id, { questionId: 'qst-svt-1', conceptId: 'cpt-svt-1', selectedChoiceIndex: 0 });
    await provider.submitQuizAnswer(session1.id, { questionId: 'qst-svt-2', conceptId: 'cpt-svt-2', selectedChoiceIndex: 0 });
    const res3 = await provider.submitQuizAnswer(session1.id, { questionId: 'qst-svt-3', conceptId: 'cpt-svt-3', selectedChoiceIndex: 0 });

    expect(res3.session.status).toBe('game_over');
    expect(res3.session.energyRemaining).toBe(0);

    const progress = await provider.getProgress();
    expect(progress.energyBalance).toBe(0);

    // Tentative de démarrer un nouveau quiz sans énergie
    await expect(provider.startQuizSession('qiz-svt-01')).rejects.toThrow(/énergie/);
  });

  it('enregistre correctement les données complètes d’un cours importé', async () => {
    const course = {
      id: 'crs-test-new',
      userId: 'usr-demo-001',
      subjectId: 'sbj-fr',
      subjectName: 'Français',
      title: 'La versification et figures de style',
      summary: 'Les règles de la poésie classique et moderne.',
      difficulty: 2 as const,
      status: 'ready' as const,
      conceptsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const concepts = [
      {
        id: 'cpt-fr-test',
        courseId: 'crs-test-new',
        name: 'L’Alexandrin et la césure',
        summary: 'Vers de 12 syllabes coupé en deux hémistiches.',
        importance: 5 as const,
        masteryScore: 80,
        keyPoints: ['12 syllabes', 'Césure à l’hémistiche']
      }
    ];

    const revision = {
      id: 'rev-fr-test',
      courseId: 'crs-test-new',
      courseTitle: course.title,
      title: 'Fiche — Versification',
      summary: 'Résumé des règles métriques.',
      sections: [],
      totalSections: 0,
      keyConcepts: ['Alexandrin'],
      rulesFormulas: ['12 syllabes'],
      isDownloaded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const quiz = {
      id: 'qiz-fr-test',
      courseId: 'crs-test-new',
      courseTitle: course.title,
      title: 'Quiz — Versification',
      totalQuestions: 1,
      difficulty: 2 as const,
      status: 'available' as const,
      questions: []
    };

    await provider.saveImportedCourseData(course, concepts, revision, quiz);

    const fetchedCourse = await provider.getCourseById('crs-test-new');
    expect(fetchedCourse).not.toBeNull();
    expect(fetchedCourse!.title).toBe('La versification et figures de style');

    const fetchedConcepts = await provider.getConceptsByCourseId('crs-test-new');
    expect(fetchedConcepts.length).toBe(1);

    const fetchedRevision = await provider.getRevisionByCourseId('crs-test-new');
    expect(fetchedRevision).not.toBeNull();

    const fetchedQuiz = await provider.getQuizByCourseId('crs-test-new');
    expect(fetchedQuiz).not.toBeNull();
  });

  it('gère les notifications et le marquage comme lu', async () => {
    const notifs = await provider.getNotifications();
    expect(notifs.length).toBeGreaterThan(0);
    const unread = notifs[0];
    expect(unread.read).toBe(false);

    await provider.markNotificationAsRead(unread.id);
    const updatedNotifs = await provider.getNotifications();
    const target = updatedNotifs.find(n => n.id === unread.id);
    expect(target!.read).toBe(true);
  });

  it('isole les cours par utilisateur — l\'utilisateur B ne voit pas les cours de l\'utilisateur A', async () => {
    // 1. En tant qu'utilisateur A (usr-demo-001), vérifier qu'on a des cours
    const coursesUserA = await provider.getCourses();
    expect(coursesUserA.length).toBeGreaterThan(0);
    const allUserA = coursesUserA.every(c => c.userId === 'usr-demo-001');
    expect(allUserA).toBe(true);

    // 2. Créer un cours supplémentaire en tant qu'utilisateur A
    const courseA = await provider.createCourse({
      title: 'Cours exclusif de A',
      subjectId: 'sbj-math',
      subjectName: 'Mathématiques'
    });
    expect(courseA.userId).toBe('usr-demo-001');

    // 3. Changer de profil vers l'utilisateur B
    provider.setActiveProfile({
      id: 'usr-other-002',
      email: 'autre@revizo.app',
      displayName: 'Autre Élève',
      gradeLevel: '2nde',
      joinedAt: '2026-09-01T00:00:00Z'
    });

    // 4. L'utilisateur B ne doit voir aucun cours de A
    const coursesUserB = await provider.getCourses();
    const hasUserACourses = coursesUserB.some(c => c.userId === 'usr-demo-001');
    expect(hasUserACourses).toBe(false);

    // 5. L'utilisateur B crée son propre cours
    const courseB = await provider.createCourse({
      title: 'Cours de B',
      subjectId: 'sbj-fr',
      subjectName: 'Français'
    });
    expect(courseB.userId).toBe('usr-other-002');

    // 6. L'utilisateur B ne voit que son cours
    const coursesUserBAfter = await provider.getCourses();
    expect(coursesUserBAfter.length).toBe(1);
    expect(coursesUserBAfter[0].userId).toBe('usr-other-002');

    // 7. Revenir à l'utilisateur A — il voit ses cours mais pas ceux de B
    provider.setActiveProfile({
      id: 'usr-demo-001',
      email: 'nasser@revizo.app',
      displayName: 'Nasser',
      gradeLevel: '3e',
      joinedAt: '2026-08-15T08:00:00Z'
    });

    const coursesUserAFinal = await provider.getCourses();
    const hasUserBCourses = coursesUserAFinal.some(c => c.userId === 'usr-other-002');
    expect(hasUserBCourses).toBe(false);
    expect(coursesUserAFinal.length).toBeGreaterThan(0);
    expect(coursesUserAFinal.every(c => c.userId === 'usr-demo-001')).toBe(true);
  });
});
