import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '../services/ai/MockAIProvider';
import { RevisionMapper } from '../mappers/RevisionMapper';
import { QuizMapper } from '../mappers/QuizMapper';
import { CourseAnalysis, Revision, Quiz } from '../types';
import { ExtractedDocument } from '../services/document/DocumentExtractorService';

describe('REVIZO — Pipeline Pédagogique Enrichi V2 (5 Objectifs Clés)', () => {
  const sampleDoc: ExtractedDocument = {
    name: 'cours_pythagore.pdf',
    titleCandidate: 'Théorème de Pythagore',
    mimeType: 'application/pdf',
    size: 2048,
    text: `Chapitre 1 : Les Fondements du Théorème de Pythagore
Le théorème de Pythagore est une propriété fondamentale reliant les longueurs des côtés dans un triangle rectangle.
Dans tout triangle rectangle, le carré de la longueur de l'hypoténuse est égal à la somme des carrés des longueurs des deux autres côtés.
Formule : a² + b² = c² où c est l'hypoténuse.

Rappel en fin de chapitre :
Ne pas oublier que pour calculer l'hypoténuse, le théorème de Pythagore s'applique toujours si le triangle est rectangle.

Chapitre 2 : La Réciproque et les Pièges Classiques
La réciproque permet de prouver qu'un triangle est rectangle si la relation d'égalité est vérifiée.
Attention au piège fréquent : toujours identifier le plus grand côté avant d'écrire l'égalité.`,
    headings: ['1. Notions Fondamentales', '2. Principes Clés & Méthode'],
    paragraphs: [
      `Le théorème de Pythagore est une propriété fondamentale reliant les longueurs des côtés dans un triangle rectangle. Dans tout triangle rectangle, le carré de l'hypoténuse est égal à la somme des carrés des deux autres côtés.`,
      `La réciproque permet de prouver qu'un triangle est rectangle si la relation d'égalité est vérifiée. Toujours identifier le plus grand côté avant de poser l'égalité.`
    ],
    pagesCount: 2
  };

  const aiProvider = new MockAIProvider();

  it('OBJECTIF 1 — Déduplication Sémantique : extrait des concepts dédupliqués et agrégés', async () => {
    const analysis: CourseAnalysis = await aiProvider.analyzeCourse(sampleDoc);

    expect(analysis.concepts.length).toBeGreaterThanOrEqual(2);
    // Vérifier que chaque concept a un nom unique et des keyPoints
    const names = analysis.concepts.map(c => c.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);

    // Vérifier l'ancrage des concepts
    analysis.concepts.forEach(c => {
      expect(c.id).toBeDefined();
      expect(c.summary).toBeDefined();
      expect(c.keyPoints.length).toBeGreaterThan(0);
    });
  });

  it('OBJECTIF 2 — Richesse et Simplicité : génère des fiches avec sous-titres, explications amicales, analogies, astuces mémo et pièges', async () => {
    const analysis = await aiProvider.analyzeCourse(sampleDoc);
    const revision: Revision = await aiProvider.generateRevision(analysis);

    expect(revision.sections.length).toBeGreaterThanOrEqual(2);

    revision.sections.forEach((section) => {
      // Sous-titre court et clair
      expect(section.subtitle).toBeDefined();
      expect(section.subtitle?.length).toBeGreaterThan(5);

      // Explication en langage simple
      expect(section.simpleExplanation).toBeDefined();
      expect(section.simpleExplanation?.length).toBeGreaterThan(10);

      // Formulation technique
      expect(section.technicalFormulation).toBeDefined();

      // Analogie concrète
      expect(section.analogyOrExample).toBeDefined();
      expect(section.analogyOrExample).toContain('Imagine');

      // Astuce mémo
      expect(section.mnemonicTip).toBeDefined();

      // ⚠️ Piège fréquent
      expect(section.commonMistake).toBeDefined();

      // Points clés à retenir
      expect(section.keyTakeaways.length).toBeGreaterThan(0);
    });
  });

  it('OBJECTIF 3 — Lutter Contre l’Ennui : alterne la structure visuelle avec une rotation de formats de présentation', async () => {
    const analysis = await aiProvider.analyzeCourse(sampleDoc);
    const revision = await aiProvider.generateRevision(analysis);

    const formats = revision.sections.map(s => s.presentationFormat);
    expect(formats.length).toBeGreaterThanOrEqual(2);
    
    // Vérifie que les formats ne sont pas identiques sur des sections consécutives
    expect(formats[0]).toBe('definition_directe');
    expect(formats[1]).toBe('question_reponse');
    expect(formats[0]).not.toBe(formats[1]);
  });

  it('OBJECTIF 4 — Dérivation en Cascade : les questions et exercices dérivent des concepts dédupliqués de la fiche', async () => {
    const analysis = await aiProvider.analyzeCourse(sampleDoc);
    const quiz: Quiz = await aiProvider.generateQuiz(analysis);

    const conceptIds = new Set(analysis.concepts.map(c => c.id));

    // Chaque question de quiz référence l'ID du concept dont elle découle
    expect(quiz.questions.length).toBeGreaterThan(0);
    quiz.questions.forEach((q) => {
      expect(q.conceptId).toBeDefined();
      expect(conceptIds.has(q.conceptId)).toBe(true);
    });
  });

  it('OBJECTIF 5 — Variété des Questions : alterne les catégories de questions pédagogiques', async () => {
    const analysis = await aiProvider.analyzeCourse(sampleDoc);
    const quiz = await aiProvider.generateQuiz(analysis);

    const categories = quiz.questions.map(q => q.questionCategory);
    expect(categories.length).toBeGreaterThanOrEqual(2);

    // Vérifie que plusieurs catégories coexistent dans le quiz
    const distinctCategories = new Set(categories);
    expect(distinctCategories.size).toBeGreaterThanOrEqual(2);
    expect(categories[0]).toBe('rappel_direct');
    expect(categories[1]).toBe('application_concrete');
  });

  it('MAPPERS & PERSISTANCE : préserve intégralement les champs riches de section et de questions', () => {
    const domainRevision: Revision = {
      id: 'rev-test-1',
      courseId: 'crs-1',
      courseTitle: 'Cours Test',
      title: 'Fiche Test',
      summary: 'Résumé',
      sections: [
        {
          id: 'sec-1',
          order: 1,
          title: 'Section 1',
          subtitle: 'Sous-titre sans jargon',
          presentationFormat: 'definition_directe',
          simpleExplanation: 'Explication simple et amicale.',
          technicalFormulation: 'a² + b² = c²',
          analogyOrExample: 'Comme une échelle posée contre un mur.',
          mnemonicTip: 'Retiens SOH-CAH-TOA.',
          commonMistake: 'Confondre sinus et cosinus.',
          conceptId: 'cpt-1',
          content: 'Contenu assemblé',
          keyTakeaways: ['Point 1', 'Point 2'],
          sourceReferences: [{ page: 1, section: 'Intro' }]
        }
      ],
      totalSections: 1,
      keyConcepts: ['Concept 1'],
      rulesFormulas: [],
      isDownloaded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Conversion Domaine -> DB Row -> Domaine
    const row = RevisionMapper.toRow(domainRevision, 'usr-1', 'ana-1');
    const restored = RevisionMapper.toDomain(row as any);

    expect(restored.sections.length).toBe(1);
    const s = restored.sections[0];
    expect(s.subtitle).toBe('Sous-titre sans jargon');
    expect(s.presentationFormat).toBe('definition_directe');
    expect(s.simpleExplanation).toBe('Explication simple et amicale.');
    expect(s.technicalFormulation).toBe('a² + b² = c²');
    expect(s.analogyOrExample).toBe('Comme une échelle posée contre un mur.');
    expect(s.mnemonicTip).toBe('Retiens SOH-CAH-TOA.');
    expect(s.commonMistake).toBe('Confondre sinus et cosinus.');
    expect(s.conceptId).toBe('cpt-1');
    expect(s.sourceReferences?.[0].page).toBe(1);

    // QuizMapper
    const domainQuiz: Quiz = {
      id: 'quiz-1',
      courseId: 'crs-1',
      courseTitle: 'Cours Test',
      title: 'Quiz Test',
      difficulty: 2,
      status: 'available',
      totalQuestions: 1,
      questions: [
        {
          id: 'qq-1',
          quizId: 'quiz-1',
          courseId: 'crs-1',
          conceptId: 'cpt-1',
          conceptName: 'Concept 1',
          questionCategory: 'piege_confusion',
          question: 'Quel est le piège ?',
          choices: ['Choix A', 'Choix B'],
          correctChoiceIndex: 0,
          explanation: 'Explication',
          difficulty: 2,
          sourceReferences: [{ page: 2, section: 'Pièges' }]
        }
      ]
    };

    const quizRow = QuizMapper.toRow(domainQuiz, 'usr-1');
    const restoredQuiz = QuizMapper.toDomain(quizRow as any);

    expect(restoredQuiz.questions.length).toBe(1);
    expect(restoredQuiz.questions[0].questionCategory).toBe('piege_confusion');
    expect(restoredQuiz.questions[0].sourceReferences?.[0].page).toBe(2);
  });
});
