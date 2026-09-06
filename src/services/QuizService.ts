import { IDataProvider } from '../contracts/IDataProvider';
import { Quiz, QuizSession } from '../types';

export class QuizService {
  constructor(private dataProvider: IDataProvider) {}

  async getAllQuizzes(): Promise<Quiz[]> {
    return this.dataProvider.getQuizzes();
  }

  async getQuizForCourse(courseId: string): Promise<Quiz | null> {
    return this.dataProvider.getQuizByCourseId(courseId);
  }

  /**
   * Règle absolue N°15 : Le quiz ne peut être commencé que si l'élève est connecté.
   * Aucune réponse stockée localement en attente de synchronisation.
   */
  async startQuiz(quizId: string, isOnline: boolean): Promise<QuizSession> {
    if (!isOnline) {
      throw new Error('Connexion requise pour commencer le quiz.');
    }
    return this.dataProvider.startQuizSession(quizId);
  }

  async submitAnswer(
    sessionId: string,
    attempt: { questionId: string; conceptId: string; selectedChoiceIndex: number },
    isOnline: boolean
  ): Promise<{
    session: QuizSession;
    isCorrect: boolean;
    explanation: string;
    xpEarned: number;
  }> {
    if (!isOnline) {
      throw new Error('Connexion requise pour valider la réponse.');
    }
    return this.dataProvider.submitQuizAnswer(sessionId, attempt);
  }
}
