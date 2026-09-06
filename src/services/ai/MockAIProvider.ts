import { AIProvider } from './AIProvider';
import { CourseAnalysis, Revision, Quiz, QuizQuestion, CourseConcept } from '../../types';
import { ExtractedDocument } from '../document/DocumentExtractorService';

export class MockAIProvider implements AIProvider {
  readonly providerName = 'MockAIProvider (Local Semantic Processor)';

  /**
   * Analyse sémantique et pédagogique du document extrait
   */
  async analyzeCourse(doc: ExtractedDocument): Promise<CourseAnalysis> {
    const courseId = `crs-${Date.now().toString(36)}`;
    const lowerText = (doc.text + ' ' + doc.name).toLowerCase();

    // 1. Détection intelligente de la matière
    let subjectName = 'Sciences';
    let subjectId = 'sbj-sci';

    if (/\b(?:math|maths|mathématique|équation|inéquation|fraction|géométrie|pythagore|théorème|dérivée|polynôme|vecteur|trigonométrie)\b/i.test(lowerText)) {
      subjectName = 'Mathématiques';
      subjectId = 'sbj-math';
    } else if (/\b(?:français|littérature|commentaire|dissertation|poésie|molière|baudelaire|roman|figure de style|métaphore|auteur)\b/i.test(lowerText)) {
      subjectName = 'Français';
      subjectId = 'sbj-fr';
    } else if (/\b(?:histoire|géographie|géo|guerre|siècle|révolution|république|empire|traité|roi|mondialisation|territoire)\b/i.test(lowerText)) {
      subjectName = 'Histoire-Géo';
      subjectId = 'sbj-hist';
    } else if (/\b(?:svt|cellule|adn|organe|reproduction|tectonique|plaque|volcan|séisme|immunité|vivant|bactérie|biodiversité)\b/i.test(lowerText)) {
      subjectName = 'SVT';
      subjectId = 'sbj-sci';
    } else if (/\b(?:physique|chimie|atome|molécule|réaction|énergie|vitesse|force|tension|courant|acide|gravitation)\b/i.test(lowerText)) {
      subjectName = 'Sciences';
      subjectId = 'sbj-sci';
    }

    // 2. Détermination du titre du cours
    let cleanTitle = doc.titleCandidate.trim();
    if (!cleanTitle || cleanTitle.length < 5 || /^(page|cours|document|chapitre\s*\d*$)/i.test(cleanTitle)) {
      cleanTitle = doc.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    }
    // Nettoyage majuscule initiale
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    // 3. Découpage en sections thématiques à partir du texte réel
    const paragraphs = doc.paragraphs.length > 0 
      ? doc.paragraphs 
      : doc.text.split('\n\n').filter(p => p.trim().length > 20);

    const sections: { title: string; content: string; keyTakeaways: string[] }[] = [];
    const concepts: CourseConcept[] = [];

    // Détection de titres de sections réels ou création de sections adaptées au contenu
    if (doc.headings.length >= 2) {
      // Découpage selon les titres réels trouvés dans le PDF
      doc.headings.slice(0, 3).forEach((heading, idx) => {
        const associatedPara = paragraphs[idx] || paragraphs[0] || `Analyse détaillée de ${heading}.`;
        const keyPoints = this.extractSentences(associatedPara, 2);
        
        sections.push({
          title: heading.startsWith(`${idx + 1}`) ? heading : `${idx + 1}. ${heading}`,
          content: associatedPara,
          keyTakeaways: keyPoints
        });

        concepts.push({
          id: `cpt-${courseId}-${idx + 1}`,
          courseId,
          name: heading.replace(/^[0-9IVX.\s-]+/, '').trim() || `Notion ${idx + 1}`,
          summary: keyPoints[0] || associatedPara.slice(0, 120),
          importance: (5 - idx) as any,
          masteryScore: 0,
          keyPoints,
          isWeak: false
        });
      });
    } else {
      // Regroupement éditorial en 2 grandes sections à partir du texte extrait
      const midPoint = Math.max(1, Math.floor(paragraphs.length / 2));
      const textSection1 = paragraphs.slice(0, midPoint).join(' ') || doc.text.slice(0, 300);
      const textSection2 = paragraphs.slice(midPoint).join(' ') || doc.text.slice(300, 600) || textSection1;

      const takeaways1 = this.extractSentences(textSection1, 3);
      const takeaways2 = this.extractSentences(textSection2, 2);

      sections.push({
        title: '1. Notions Fondamentales',
        content: textSection1.slice(0, 450),
        keyTakeaways: takeaways1.length > 0 ? takeaways1 : [
          `Comprendre les concepts centraux de "${cleanTitle}".`,
          'Identifier les mécanismes clés et définitions essentielles.',
          'Savoir appliquer la méthode dans les exercices types.'
        ]
      });

      sections.push({
        title: '2. Principes Clés & Méthode',
        content: textSection2.slice(0, 450),
        keyTakeaways: takeaways2.length > 0 ? takeaways2 : [
          'Vérifier la cohérence des résultats et des justifications.',
          'Mémoriser les règles fondamentales du chapitre.'
        ]
      });

      concepts.push({
        id: `cpt-${courseId}-1`,
        courseId,
        name: `Fondements de ${cleanTitle}`,
        summary: takeaways1[0] || textSection1.slice(0, 120),
        importance: 5,
        masteryScore: 0,
        keyPoints: takeaways1,
        isWeak: false
      });

      concepts.push({
        id: `cpt-${courseId}-2`,
        courseId,
        name: `Mécanismes & Règles de ${cleanTitle}`,
        summary: takeaways2[0] || textSection2.slice(0, 120),
        importance: 4,
        masteryScore: 0,
        keyPoints: takeaways2,
        isWeak: false
      });
    }

    // 4. Synthèse globale fidèle au document
    const firstParagraph = paragraphs[0] || doc.text.slice(0, 200);
    const summary = firstParagraph.length > 180 
      ? firstParagraph.slice(0, 180).trim() + '...'
      : `Synthèse structurée du cours "${cleanTitle}" préparée par l'analyse pédagogique.`;

    return {
      courseId,
      title: cleanTitle,
      subjectName,
      subjectId,
      summary,
      difficulty: 3,
      concepts,
      sections,
      extractedKeywords: [cleanTitle, subjectName],
      rawTextSnippet: doc.text.slice(0, 400),
      pagesCount: doc.pagesCount
    };
  }

  /**
   * Génération de la fiche de révision à partir de l'analyse
   */
  async generateRevision(analysis: CourseAnalysis): Promise<Revision> {
    const revisionId = `rev-${analysis.courseId}`;

    return {
      id: revisionId,
      courseId: analysis.courseId,
      courseTitle: analysis.title,
      title: `Fiche Essentielle — ${analysis.title}`,
      summary: analysis.summary,
      sections: analysis.sections.map((sec, idx) => ({
        id: `sec-${analysis.courseId}-${idx + 1}`,
        order: idx + 1,
        title: sec.title,
        content: sec.content,
        keyTakeaways: sec.keyTakeaways
      })),
      totalSections: analysis.sections.length,
      keyConcepts: analysis.concepts.map(c => c.name),
      rulesFormulas: [],
      isDownloaded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Génération des questions de quiz basées STRICTEMENT sur les concepts extraits
   */
  async generateQuiz(analysis: CourseAnalysis): Promise<Quiz> {
    const quizId = `qiz-${analysis.courseId}`;
    const questions: QuizQuestion[] = [];

    // Pour chaque concept extrait, formulation d'une question d'évaluation ciblée
    analysis.concepts.forEach((concept, idx) => {
      const primaryKeyPoint = concept.keyPoints[0] || concept.summary;
      
      // Question 1 : Vérification de la notion essentielle
      questions.push({
        id: `qst-${analysis.courseId}-${idx * 2 + 1}`,
        quizId,
        courseId: analysis.courseId,
        conceptId: concept.id,
        conceptName: concept.name,
        question: `Concernant « ${concept.name} », quelle affirmation est exacte d'après le cours ?`,
        choices: [
          primaryKeyPoint,
          `Le concept de ${concept.name} ne s'applique jamais dans ce cadre.`,
          `Il s'agit d'une règle secondaire sans lien avec ${analysis.title}.`,
          `Cette notion est uniquement valable en cas d'erreur de calcul.`
        ],
        correctChoiceIndex: 0,
        explanation: `Le cours indique expressément : « ${primaryKeyPoint} ».`,
        difficulty: 2
      });

      // Question 2 si disponible
      if (concept.keyPoints.length > 1) {
        const secondaryPoint = concept.keyPoints[1];
        questions.push({
          id: `qst-${analysis.courseId}-${idx * 2 + 2}`,
          quizId,
          courseId: analysis.courseId,
          conceptId: concept.id,
          conceptName: concept.name,
          question: `Quel point clé doit-on obligatoirement retenir pour « ${concept.name} » ?`,
          choices: [
            `Une application aléatoire sans vérification des conditions préalables.`,
            secondaryPoint,
            `Une interdiction totale de réutilisation dans les évaluations.`,
            `L'opposé des définitions établies dans ce chapitre.`
          ],
          correctChoiceIndex: 1,
          explanation: `Le cours rappelle la règle suivante : « ${secondaryPoint} ».`,
          difficulty: (idx === 0 ? 1 : 3) as any
        });
      }
    });

    // S'il n'y avait qu'1 question, assurer au moins 3 questions pédagogiques
    while (questions.length < 3) {
      const qIndex = questions.length + 1;
      questions.push({
        id: `qst-${analysis.courseId}-${qIndex}`,
        quizId,
        courseId: analysis.courseId,
        conceptId: analysis.concepts[0]?.id || 'cpt-gen',
        conceptName: analysis.title,
        question: `Dans le cours « ${analysis.title} », quelle est la démarche méthodologique recommandée ?`,
        choices: [
          `Ignorer les étapes intermédiaires pour gagner du temps.`,
          `Identifier les notions clés, vérifier la cohérence des résultats et appliquer la méthode pas à pas.`,
          `Ne jamais relire l'énoncé avant de rédiger la réponse finale.`,
          `Changer arbitrairement les définitions admises du cours.`
        ],
        correctChoiceIndex: 1,
        explanation: `La rigueur méthodologique et la vérification des résultats sont essentielles pour réussir en ${analysis.subjectName}.`,
        difficulty: 2
      });
    }

    return {
      id: quizId,
      courseId: analysis.courseId,
      courseTitle: analysis.title,
      title: `Quiz — ${analysis.title}`,
      totalQuestions: questions.length,
      difficulty: 2,
      status: 'available',
      questions
    };
  }

  /**
   * Découpage robuste en phrases
   */
  private extractSentences(text: string, count: number): string[] {
    if (!text) return [];
    const sentences = text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 25 && s.length < 160);

    return sentences.slice(0, count);
  }
}
