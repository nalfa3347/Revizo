import { Quiz, QuizQuestion } from '../types';
import { SupabaseQuizRow } from '../types/database.types';

export class QuizMapper {
  static toDomain(row: SupabaseQuizRow): Quiz {
    return {
      id: row.id,
      courseId: row.course_id,
      title: row.title,
      courseTitle: row.course_title,
      difficulty: (row.difficulty as 1 | 2 | 3) || 2,
      status: 'available',
      totalQuestions: row.total_questions || (row.questions ? row.questions.length : 0),
      questions: Array.isArray(row.questions)
        ? row.questions.map((q): QuizQuestion => ({
            id: q.id,
            quizId: row.id,
            courseId: row.course_id,
            conceptId: q.conceptId || '',
            conceptName: 'Notion évaluée',
            question: q.question,
            choices: q.choices || [],
            correctChoiceIndex: q.correctChoiceIndex ?? 0,
            explanation: q.explanation || '',
            difficulty: (q.difficulty as 1 | 2 | 3) || 2
          }))
        : []
    };
  }

  static toRow(quiz: Partial<Quiz>, userId?: string): Partial<SupabaseQuizRow> {
    const row: Partial<SupabaseQuizRow> = {};
    if (quiz.id !== undefined) row.id = quiz.id;
    if (quiz.courseId !== undefined) row.course_id = quiz.courseId;
    if (userId !== undefined) row.user_id = userId;
    if (quiz.title !== undefined) row.title = quiz.title;
    if (quiz.courseTitle !== undefined) row.course_title = quiz.courseTitle;
    if (quiz.difficulty !== undefined) row.difficulty = quiz.difficulty;
    if (quiz.totalQuestions !== undefined) row.total_questions = quiz.totalQuestions;
    if (quiz.questions !== undefined) {
      row.questions = quiz.questions.map(q => ({
        id: q.id,
        conceptId: q.conceptId,
        question: q.question,
        choices: q.choices,
        correctChoiceIndex: q.correctChoiceIndex,
        explanation: q.explanation,
        difficulty: q.difficulty
      }));
    }
    return row;
  }
}
