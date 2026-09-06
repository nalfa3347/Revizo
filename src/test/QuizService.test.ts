import { describe, it, expect, beforeEach } from 'vitest';
import { QuizService } from '../services/QuizService';
import { MockDataProvider } from '../providers/mock/MockDataProvider';

describe('QuizService & Règle Quiz Hors Connexion', () => {
  let provider: MockDataProvider;
  let quizService: QuizService;

  beforeEach(() => {
    provider = new MockDataProvider(0);
    quizService = new QuizService(provider);
  });

  it('interdit strictement de commencer un quiz sans connexion (Règle N°15)', async () => {
    const isOnline = false;
    await expect(quizService.startQuiz('qiz-svt-01', isOnline)).rejects.toThrow(
      'Connexion requise pour commencer le quiz.'
    );
  });

  it('permet de démarrer une session de quiz lorsque la connexion est active', async () => {
    const isOnline = true;
    const session = await quizService.startQuiz('qiz-svt-01', isOnline);

    expect(session).toBeDefined();
    expect(session.energyRemaining).toBe(3);
    expect(session.status).toBe('active');
    expect(session.currentPosition).toBe(0);
  });

  it('interdit d’enregistrer une réponse hors connexion', async () => {
    const session = await quizService.startQuiz('qiz-svt-01', true);
    const isOnline = false;

    await expect(
      quizService.submitAnswer(
        session.id,
        {
          questionId: 'qst-svt-1',
          conceptId: 'cpt-svt-1',
          selectedChoiceIndex: 1
        },
        isOnline
      )
    ).rejects.toThrow('Connexion requise pour valider la réponse.');
  });

  it('applique la perte d’énergie sur mauvaise réponse et fournit une explication immédiate', async () => {
    const session = await quizService.startQuiz('qiz-svt-01', true);
    const result = await quizService.submitAnswer(
      session.id,
      {
        questionId: 'qst-svt-1',
        conceptId: 'cpt-svt-1',
        selectedChoiceIndex: 0 // Mauvaise réponse
      },
      true
    );

    expect(result.isCorrect).toBe(false);
    expect(result.explanation).toContain('asthénosphère');
    expect(result.session.energyRemaining).toBe(2);
  });
});
