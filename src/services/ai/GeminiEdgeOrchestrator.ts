import { getSupabaseClient } from '../supabaseClient';
import { Course, CourseAnalysis, Revision, Quiz } from '../../types';
import { PipelineProgress, PipelineResult } from './AIOrchestrator';

export class GeminiEdgeOrchestrator {
  /**
   * Exécute le pipeline réel Gemini 2.5 Flash via Supabase Edge Function
   */
  async processCourseDocument(
    file: File,
    userId: string,
    onProgress?: (progress: PipelineProgress) => void
  ): Promise<PipelineResult> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error("Configuration Supabase manquante.");
    }

    try {
      // Étape 1 : Lecture du cours…
      onProgress?.({
        stage: 'reading',
        message: 'Lecture du cours…',
        percent: 15
      });

      // Conversion du fichier en base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      const courseId = `course-${Date.now()}`;
      const title = file.name.replace(/\.[^/.]+$/, "");

      // Étape 2 : Compréhension du cours…
      onProgress?.({
        stage: 'understanding',
        message: 'Compréhension du cours…',
        percent: 30
      });

      // Simulation de progression fluide des étapes backend réelles
      const progressTimer1 = setTimeout(() => {
        onProgress?.({
          stage: 'prioritizing',
          message: 'Identification des notions essentielles…',
          percent: 45
        });
      }, 3500);

      const progressTimer2 = setTimeout(() => {
        onProgress?.({
          stage: 'generating_rev',
          message: 'Création de ta fiche de révision…',
          percent: 60
        });
      }, 7000);

      const progressTimer3 = setTimeout(() => {
        onProgress?.({
          stage: 'generating_questions',
          message: 'Préparation de tes questions…',
          percent: 75
        });
      }, 10500);

      const progressTimer4 = setTimeout(() => {
        onProgress?.({
          stage: 'generating_quiz',
          message: 'Préparation de tes quiz…',
          percent: 85
        });
      }, 14000);

      const progressTimer5 = setTimeout(() => {
        onProgress?.({
          stage: 'generating_exercises',
          message: 'Préparation de tes exercices…',
          percent: 92
        });
      }, 17500);

      // Appel sécurisé à l'Edge Function Supabase orchestrate-course
      const { data, error } = await supabase.functions.invoke('orchestrate-course', {
        body: {
          courseId,
          title,
          subjectName: 'Général',
          fileBase64,
          mimeType
        }
      });

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      clearTimeout(progressTimer4);
      clearTimeout(progressTimer5);

      if (error) {
        let errMessage = "Nous n'avons pas réussi à analyser ton cours. Réessaie dans quelques instants.";
        try {
          // Extraire le message retourné par l'Edge Function
          if (error.context) {
            const ctxText = await error.context.text();
            const ctxJson = JSON.parse(ctxText);
            if (ctxJson.error) errMessage = ctxJson.error;
          }
        } catch {}

        if (mimeType.startsWith('image/') && (errMessage.includes('claire') || errMessage.includes('nette'))) {
          throw new Error("La photo n'est pas assez claire pour être analysée. Essaie avec une photo plus nette.");
        }
        throw new Error(errMessage);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "Nous n'avons pas réussi à analyser ton cours. Réessaie dans quelques instants.");
      }

      // Étape finale : Ton cours est prêt !
      onProgress?.({
        stage: 'completed',
        message: 'Ton cours est prêt !',
        percent: 100
      });

      const primaryQuiz: Quiz = data.quizPlan?.quizzes?.[0] ? {
        id: `quiz-${courseId}`,
        courseId: courseId,
        title: data.quizPlan.quizzes[0].title || `Quiz de compréhension : ${data.course.title}`,
        courseTitle: data.course.title,
        difficulty: 2,
        totalQuestions: data.quizPlan.quizzes[0].questions.length,
        status: 'available',
        questions: data.quizPlan.quizzes[0].questions.map((q: any, idx: number) => ({
          id: `qq-${courseId}-${idx + 1}`,
          quizId: `quiz-${courseId}`,
          courseId: courseId,
          conceptId: q.conceptId || (data.concepts?.[0]?.id ?? 'concept-1'),
          conceptName: '',
          question: q.question,
          choices: q.options || [],
          correctChoiceIndex: (q.options || []).indexOf(q.correctAnswer) >= 0 ? (q.options || []).indexOf(q.correctAnswer) : 0,
          explanation: q.explanation,
          difficulty: 2 as const,
          sourceReferences: q.sourceReferences || []
        }))
      } : {
        id: `quiz-${courseId}`,
        courseId: courseId,
        title: `Quiz de compréhension : ${data.course.title}`,
        courseTitle: data.course.title,
        difficulty: 2,
        totalQuestions: 0,
        status: 'available',
        questions: []
      };

      const analysis: CourseAnalysis = {
        courseId,
        subjectId: `subj-general`,
        subjectName: data.course.subjectName || 'Général',
        title: data.course.title,
        summary: data.course.summary,
        difficulty: 2,
        concepts: (data.concepts || []).map((c: any) => ({
          id: c.id,
          courseId,
          name: c.name,
          summary: c.summary,
          importance: c.importance || 1,
          masteryScore: 0,
          keyPoints: c.key_points || [],
          sourceReferences: c.source_references || []
        })),
        sections: [],
        extractedKeywords: []
      };

      const resultCourse: Course = {
        id: courseId,
        userId,
        subjectId: `subj-general`,
        subjectName: data.course.subjectName || 'Général',
        title: data.course.title,
        summary: data.course.summary,
        difficulty: 2,
        status: 'ready',
        conceptsCount: data.concepts?.length || 0,
        originalDocumentName: file.name,
        fileSize: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progressPercentage: 0
      };

      const resultRevision: Revision = {
        id: data.revision.id || `rev-${courseId}`,
        courseId,
        courseTitle: data.course.title,
        title: data.revision.title,
        summary: data.revision.summary,
        keyConcepts: data.revision.keyConcepts || [],
        rulesFormulas: [],
        sections: (data.revision.sections || []).map((s: any, idx: number) => ({
          id: s.id || `sec-${courseId}-${idx + 1}`,
          order: s.orderIndex ?? idx,
          title: s.title,
          content: s.content,
          keyTakeaways: s.keyTakeaways || []
        })),
        totalSections: data.revision.totalSections || data.revision.sections?.length || 0,
        isDownloaded: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        course: resultCourse,
        analysis,
        revision: resultRevision,
        quiz: primaryQuiz,
        comprehensionQuestions: data.comprehensionQuestions || [],
        quizPlan: data.quizPlan || null,
        exercises: data.exercises || []
      };

    } catch (err: any) {
      onProgress?.({
        stage: 'error',
        message: err.message || "Nous n'avons pas réussi à analyser ton cours. Réessaie dans quelques instants.",
        percent: 0
      });
      throw err;
    }
  }
}
