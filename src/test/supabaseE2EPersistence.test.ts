import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { Database } from '../types/database.types';
import { SupabaseAuthProvider } from '../providers/supabase/SupabaseAuthProvider';
import { SupabaseDataProvider } from '../providers/supabase/SupabaseDataProvider';
import { UserProfile } from '../types';

function loadSupabaseEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local introuvable');
  }
  const text = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  text.split(/\r?\n/).forEach(line => {
    const eq = line.indexOf('=');
    if (eq > 0 && !line.startsWith('#')) {
      env[line.substring(0, eq).trim()] = line.substring(eq + 1).trim();
    }
  });

  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Variables VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquantes dans .env.local');
  }

  return {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY
  };
}

describe('REVIZO 2.0 — Persistance Supabase Réelle & Isolation RLS Multi-Comptes', () => {
  let clientA: SupabaseClient<Database>;
  let clientB: SupabaseClient<Database>;
  let authA: SupabaseAuthProvider;
  let authB: SupabaseAuthProvider;
  let dataProviderA: SupabaseDataProvider;
  let dataProviderB: SupabaseDataProvider;

  let profileA: UserProfile;
  let profileB: UserProfile;
  let createdCourseAId: string;
  let createdCourseBId: string;

  const emailA = 'test_alpha_2026@revizo.test';
  const passwordA = 'RevizoPass2026!Alpha';

  const emailB = 'test_beta_2026@revizo.test';
  const passwordB = 'RevizoPass2026!Beta';

  beforeAll(async () => {
    const { url, anonKey } = loadSupabaseEnv();

    // Deux instances indépendantes en mémoire avec la clé publique (anon key)
    clientA = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    clientB = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    authA = new SupabaseAuthProvider(clientA);
    authB = new SupabaseAuthProvider(clientB);
  });

  it('Compte A : Inscription ou Connexion réussie et profil initialisé', async () => {
    try {
      profileA = await authA.signUp({
        identifier: emailA,
        identifierType: 'email',
        password: passwordA,
        displayName: 'Élève Alpha',
        gradeLevel: '3e'
      });
    } catch {
      profileA = await authA.signIn({
        identifier: emailA,
        password: passwordA
      });
    }

    expect(profileA).toBeDefined();
    expect(profileA.id).toBeTruthy();
    expect(profileA.displayName).toContain('Alpha');

    dataProviderA = new SupabaseDataProvider(clientA, profileA);

    let progressA = await dataProviderA.getProgress();
    if (progressA.energyBalance < 3) {
      await clientA.from('user_progress').update({ energy_balance: 3, diamonds_balance: Math.max(progressA.diamondsBalance, 20) }).eq('user_id', profileA.id);
      progressA = await dataProviderA.getProgress();
    }
    expect(progressA).toBeDefined();
    expect(progressA.userId).toBe(profileA.id);
    expect(progressA.energyBalance).toBeGreaterThanOrEqual(1);
    expect(progressA.diamondsBalance).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('Compte A : Création d’un cours et persistance en base', async () => {
    const courseA = await dataProviderA.createCourse({
      title: 'Mathématiques : Théorème de Pythagore',
      subjectId: 'sbj-math',
      subjectName: 'Mathématiques',
      summary: 'Étude des triangles rectangles et calcul des hypoténuses.',
      difficulty: 2,
      status: 'ready',
      conceptsCount: 2,
      progressPercentage: 0
    });

    expect(courseA).toBeDefined();
    expect(courseA.id).toBeTruthy();
    expect(courseA.userId).toBe(profileA.id);
    expect(courseA.title).toBe('Mathématiques : Théorème de Pythagore');

    createdCourseAId = courseA.id;

    // Vérification de la lecture
    const fetchedCourse = await dataProviderA.getCourseById(createdCourseAId);
    expect(fetchedCourse).toBeDefined();
    expect(fetchedCourse?.id).toBe(createdCourseAId);
  }, 30000);

  it('Compte B : Inscription ou Connexion réussie et profil initialisé', async () => {
    try {
      profileB = await authB.signUp({
        identifier: emailB,
        identifierType: 'email',
        password: passwordB,
        displayName: 'Élève Bêta',
        gradeLevel: '4e'
      });
    } catch {
      profileB = await authB.signIn({
        identifier: emailB,
        password: passwordB
      });
    }

    expect(profileB).toBeDefined();
    expect(profileB.id).toBeTruthy();
    expect(profileB.id).not.toBe(profileA.id);

    dataProviderB = new SupabaseDataProvider(clientB, profileB);

    const progressB = await dataProviderB.getProgress();
    expect(progressB).toBeDefined();
    expect(progressB.userId).toBe(profileB.id);
  }, 30000);

  it('SÉCURITÉ RLS : Le Compte B ne voit PAS le cours du Compte A', async () => {
    // Liste des cours pour B ne doit pas inclure le cours de A
    const coursesForB = await dataProviderB.getCourses();
    const foundCourseAInB = coursesForB.some(c => c.id === createdCourseAId);
    expect(foundCourseAInB).toBe(false);

    // Tentative d'accès direct par ID
    const directFetch = await dataProviderB.getCourseById(createdCourseAId);
    expect(directFetch).toBeNull();

    // Vérification directe au niveau de la table via la requête Supabase du client B
    const { data: rawRows } = await clientB
      .from('courses')
      .select('*')
      .eq('id', createdCourseAId);

    expect(rawRows).toBeDefined();
    expect(rawRows?.length).toBe(0);
  }, 30000);

  it('SÉCURITÉ RLS : Le Compte B ne peut pas modifier la progression du Compte A', async () => {
    // Le client B tente de modifier le solde de diamants du Compte A
    await clientB
      .from('user_progress')
      .update({ diamonds_balance: 9999 } as any)
      .eq('user_id', profileA.id);

    // Vérification depuis le client A : les diamants de A n'ont pas bougé
    const currentProgressA = await dataProviderA.getProgress();
    expect(currentProgressA.diamondsBalance).not.toBe(9999);
  }, 30000);

  it('Compte B : Création de son propre cours et indépendance des données', async () => {
    const courseB = await dataProviderB.createCourse({
      title: 'Français : Les Figures de Style',
      subjectId: 'sbj-fr',
      subjectName: 'Français',
      summary: 'Métaphores, comparaisons et hyperboles dans les textes.',
      difficulty: 1,
      status: 'ready',
      conceptsCount: 3,
      progressPercentage: 10
    });

    expect(courseB).toBeDefined();
    expect(courseB.userId).toBe(profileB.id);
    createdCourseBId = courseB.id;

    // A ne voit pas le cours de B
    const coursesForA = await dataProviderA.getCourses();
    const foundCourseBInA = coursesForA.some(c => c.id === createdCourseBId);
    expect(foundCourseBInA).toBe(false);

    // B voit son cours
    const coursesForB = await dataProviderB.getCourses();
    const foundCourseBInB = coursesForB.some(c => c.id === createdCourseBId);
    expect(foundCourseBInB).toBe(true);
  }, 30000);

  it('Persistance Multi-Sessions : Reconnexion et intégrité des données', async () => {
    // Reconnexion Compte A
    const reconnectedUserA = await authA.signIn({
      identifier: emailA,
      password: passwordA
    });
    expect(reconnectedUserA.id).toBe(profileA.id);

    const dataProviderAReconnected = new SupabaseDataProvider(clientA, reconnectedUserA);
    const userACourses = await dataProviderAReconnected.getCourses();
    expect(userACourses.some(c => c.id === createdCourseAId)).toBe(true);
    expect(userACourses.some(c => c.id === createdCourseBId)).toBe(false);

    // Reconnexion Compte B
    const reconnectedUserB = await authB.signIn({
      identifier: emailB,
      password: passwordB
    });
    expect(reconnectedUserB.id).toBe(profileB.id);

    const dataProviderBReconnected = new SupabaseDataProvider(clientB, reconnectedUserB);
    const userBCourses = await dataProviderBReconnected.getCourses();
    expect(userBCourses.some(c => c.id === createdCourseBId)).toBe(true);
    expect(userBCourses.some(c => c.id === createdCourseAId)).toBe(false);
  }, 30000);

  it('Phase 18 : Calcul de Maîtrise par Concept & Persistance des Résultats de Quiz dans Supabase', async () => {
    const testCourseId = `crs-prog-${Date.now()}`;
    const concept1Id = `cpt-geom-${Date.now()}`;
    const concept2Id = `cpt-calc-${Date.now()}`;
    const quizId = `qiz-test-${Date.now()}`;

    // 1. Sauvegarde d'un cours importé complet (Course, Concepts, Revision, Quiz)
    await dataProviderA.saveImportedCourseData(
      {
        id: testCourseId,
        userId: profileA.id,
        subjectId: 'sbj-math',
        subjectName: 'Mathématiques',
        title: 'Géométrie et Calculs',
        summary: 'Notions fondamentales de géométrie.',
        difficulty: 2,
        status: 'ready',
        conceptsCount: 2,
        progressPercentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      [
        {
          id: concept1Id,
          courseId: testCourseId,
          name: 'Notion 1 : Aire du triangle',
          summary: 'Base x Hauteur / 2',
          importance: 4,
          masteryScore: 50,
          keyPoints: ['Formule classique'],
          isWeak: false
        },
        {
          id: concept2Id,
          courseId: testCourseId,
          name: 'Notion 2 : Périmètre du cercle',
          summary: '2 x Pi x R',
          importance: 3,
          masteryScore: 50,
          keyPoints: ['Rayon'],
          isWeak: false
        }
      ],
      {
        id: `rev-${Date.now()}`,
        courseId: testCourseId,
        courseTitle: 'Géométrie et Calculs',
        title: 'Fiche Géométrie',
        summary: 'Résumé des formules',
        sections: [],
        keyConcepts: [],
        rulesFormulas: [],
        totalSections: 1,
        isDownloaded: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: quizId,
        courseId: testCourseId,
        title: 'Quiz Formules',
        courseTitle: 'Géométrie et Calculs',
        difficulty: 2,
        status: 'available',
        totalQuestions: 2,
        questions: [
          {
            id: `qst-1-${Date.now()}`,
            quizId,
            courseId: testCourseId,
            conceptId: concept1Id,
            conceptName: 'Aire du triangle',
            question: 'Quelle est la formule de l’aire du triangle ?',
            choices: ['B x H / 2', 'B x H', '2 x B x H'],
            correctChoiceIndex: 0,
            explanation: 'Base fois hauteur divisé par 2.',
            difficulty: 2
          },
          {
            id: `qst-2-${Date.now()}`,
            quizId,
            courseId: testCourseId,
            conceptId: concept2Id,
            conceptName: 'Périmètre du cercle',
            question: 'Quelle est la formule du périmètre ?',
            choices: ['Pi x R²', '2 x Pi x R', '4 x Pi'],
            correctChoiceIndex: 1,
            explanation: 'Le périmètre est 2 x Pi x R.',
            difficulty: 2
          }
        ]
      }
    );

    // Vérification de la présence des concepts en base
    const fetchedConcepts = await dataProviderA.getConceptsByCourseId(testCourseId);
    expect(fetchedConcepts.length).toBe(2);
    expect(fetchedConcepts.find(c => c.id === concept1Id)?.masteryScore).toBe(50);
    expect(fetchedConcepts.find(c => c.id === concept2Id)?.masteryScore).toBe(50);

    // 2. Démarrage de la session de quiz (s'assurer de l'énergie de test)
    const progBeforeQuiz = await dataProviderA.getProgress();
    if (progBeforeQuiz.energyBalance <= 0) {
      await clientA.from('user_progress').update({ energy_balance: 3 }).eq('user_id', profileA.id);
    }

    const session = await dataProviderA.startQuizSession(quizId);
    expect(session).toBeDefined();
    expect(session.quizId).toBe(quizId);

    const initialProgress = await dataProviderA.getProgress();
    const initialDiamonds = initialProgress.diamondsBalance;

    // 3. Réponse 1 : BONNE RÉPONSE sur le Concept 1
    const quiz = await dataProviderA.getQuizByCourseId(testCourseId);
    const q1 = quiz!.questions[0];
    const answer1 = await dataProviderA.submitQuizAnswer(session.id, {
      questionId: q1.id,
      conceptId: concept1Id,
      selectedChoiceIndex: q1.correctChoiceIndex
    });
    expect(answer1.isCorrect).toBe(true);

    // Vérification que le score du Concept 1 a AUGMENTÉ (+10 -> 60%)
    const conceptsAfterQ1 = await dataProviderA.getConceptsByCourseId(testCourseId);
    const updatedConcept1 = conceptsAfterQ1.find(c => c.id === concept1Id);
    expect(updatedConcept1?.masteryScore).toBe(60);
    expect(updatedConcept1?.isWeak).toBe(false);

    // 4. Réponse 2 : MAUVAISE RÉPONSE sur le Concept 2
    const q2 = quiz!.questions[1];
    const wrongChoiceIndex = q2.correctChoiceIndex === 0 ? 1 : 0;
    const answer2 = await dataProviderA.submitQuizAnswer(session.id, {
      questionId: q2.id,
      conceptId: concept2Id,
      selectedChoiceIndex: wrongChoiceIndex
    });
    expect(answer2.isCorrect).toBe(false);

    // Vérification que le score du Concept 2 a BAISSÉ (-10 -> 40%) et devient fragile
    const conceptsAfterQ2 = await dataProviderA.getConceptsByCourseId(testCourseId);
    const updatedConcept2 = conceptsAfterQ2.find(c => c.id === concept2Id);
    expect(updatedConcept2?.masteryScore).toBe(40);
    expect(updatedConcept2?.isWeak).toBe(true);

    // Vérification que getWeakConcepts détecte la notion fragile
    const weakList = await dataProviderA.getWeakConcepts();
    expect(weakList.some(w => w.id === concept2Id)).toBe(true);

    // 5. Vérification de l'enregistrement du résultat dans Supabase (quiz_results)
    const { data: resultsRows } = await clientA
      .from('quiz_results')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', profileA.id);

    expect(resultsRows).toBeDefined();
    expect(resultsRows!.length).toBeGreaterThan(0);
    const lastResult = resultsRows![0];
    expect(lastResult.score).toBe(1);
    expect(lastResult.total_questions).toBe(2);
    expect(lastResult.percentage).toBe(50);

    const finalProgress = await dataProviderA.getProgress();
    expect(finalProgress.diamondsBalance).toBeGreaterThanOrEqual(initialDiamonds);
  }, 30000);
});
