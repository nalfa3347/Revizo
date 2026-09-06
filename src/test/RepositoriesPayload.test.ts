import { describe, it, expect } from 'vitest';
import { CourseMapper } from '../mappers/CourseMapper';
import { RevisionMapper } from '../mappers/RevisionMapper';
import { QuizMapper } from '../mappers/QuizMapper';
import { ProgressMapper } from '../mappers/ProgressMapper';
import { NotificationMapper } from '../mappers/NotificationMapper';
import { SettingsMapper } from '../mappers/SettingsMapper';
import { Course, Revision, Quiz, UserProgress, AppSettings, AppNotification } from '../types';

describe('Repositories Payload Validation — Data preparation before SQL operations', () => {
  it('valide le payload généré pour CourseRepository.create / update', () => {
    const course: Course = {
      id: 'crs-test-01',
      userId: 'usr-safe-01',
      subjectId: 'mathematiques',
      subjectName: 'Mathématiques',
      title: 'Théorème de Pythagore',
      summary: 'Démonstration et applications.',
      difficulty: 2,
      status: 'ready',
      conceptsCount: 3,
      progressPercentage: 50,
      originalDocumentName: 'pythagore.pdf',
      fileSize: 450000,
      isDownloaded: true,
      createdAt: '2026-09-05T00:00:00Z',
      updatedAt: '2026-09-05T00:00:00Z'
    };

    const payload = CourseMapper.toRow(course);

    expect(payload.id).toBe('crs-test-01');
    expect(payload.user_id).toBe('usr-safe-01');
    expect(payload.subject_id).toBe('mathematiques');
    expect(payload.progress_pct).toBe(50);
    expect(payload.is_downloaded).toBe(true);
    expect(payload.file_size).toBe(450000);
  });

  it('valide le payload généré pour RevisionRepository.create', () => {
    const revision: Revision = {
      id: 'rev-test-01',
      courseId: 'crs-test-01',
      courseTitle: 'Théorème de Pythagore',
      title: 'Fiche : Pythagore',
      summary: 'Points essentiels du triangle rectangle.',
      sections: [
        {
          id: 'sec-1',
          order: 1,
          title: 'Énoncé',
          content: 'a² + b² = c²',
          keyTakeaways: ['Triangle rectangle requis'],
          formulas: ['BC² = AB² + AC²']
        }
      ],
      totalSections: 1,
      keyConcepts: ['Hypoténuse', 'Angle droit'],
      rulesFormulas: ['a² + b² = c²'],
      isDownloaded: false,
      createdAt: '2026-09-05T00:00:00Z',
      updatedAt: '2026-09-05T00:00:00Z'
    };

    const payload = RevisionMapper.toRow(revision, 'usr-safe-01', 'ana-01');

    expect(payload.id).toBe('rev-test-01');
    expect(payload.course_id).toBe('crs-test-01');
    expect(payload.user_id).toBe('usr-safe-01');
    expect(payload.analysis_id).toBe('ana-01');
    expect(Array.isArray(payload.key_concepts)).toBe(true);
    expect(payload.key_concepts).toContain('Hypoténuse');
    expect(payload.rules_formulas).toContain('a² + b² = c²');
    expect(payload.sections?.length).toBe(1);
    expect(payload.sections?.[0].title).toBe('Énoncé');
  });

  it('valide le payload généré pour QuizRepository.create', () => {
    const quiz: Quiz = {
      id: 'qz-test-01',
      courseId: 'crs-test-01',
      courseTitle: 'Théorème de Pythagore',
      title: 'Validation rapide Pythagore',
      difficulty: 1,
      status: 'available',
      totalQuestions: 1,
      questions: [
        {
          id: 'q-1',
          quizId: 'qz-test-01',
          courseId: 'crs-test-01',
          conceptId: 'con-1',
          conceptName: 'Hypoténuse',
          question: 'Quel côté est le plus long ?',
          choices: ['Adjacent', 'Opposé', 'Hypoténuse'],
          correctChoiceIndex: 2,
          explanation: 'L’hypoténuse est opposée à l’angle droit.',
          difficulty: 1
        }
      ]
    };

    const payload = QuizMapper.toRow(quiz, 'usr-safe-01');

    expect(payload.id).toBe('qz-test-01');
    expect(payload.user_id).toBe('usr-safe-01');
    expect(payload.total_questions).toBe(1);
    expect(payload.questions?.length).toBe(1);
    expect(payload.questions?.[0].correctChoiceIndex).toBe(2);
  });

  it('valide le payload généré pour ProgressRepository.upsert', () => {
    const progress: UserProgress = {
      userId: 'usr-safe-01',
      totalXp: 500,
      level: 2,
      xpToNextLevel: 100,
      currentStreak: 3,
      longestStreak: 5,
      diamondsBalance: 20,
      energyBalance: 2,
      dailyGoalMinutes: 20,
      dailyGoalProgressMinutes: 10,
      lastActivityDate: '2026-09-05'
    };

    const payload = ProgressMapper.toRow(progress);

    expect(payload.user_id).toBe('usr-safe-01');
    expect(payload.total_xp).toBe(500);
    expect(payload.level).toBe(2);
    expect(payload.energy_balance).toBe(2);
    expect(payload.diamonds_balance).toBe(20);
  });

  it('valide les payloads de NotificationRepository et SettingsRepository', () => {
    const notif: AppNotification = {
      id: 'n-10',
      type: 'reward',
      title: 'Bravo !',
      message: 'Tu as obtenu 5 diamants.',
      read: false,
      createdAt: '2026-09-05T00:00:00Z',
      targetTab: 'profile'
    };
    const notifPayload = NotificationMapper.toRow(notif, 'usr-safe-01');
    expect(notifPayload.user_id).toBe('usr-safe-01');
    expect(notifPayload.target_tab).toBe('profile');
    expect(notifPayload.read).toBe(false);

    const settings: AppSettings = {
      theme: 'light',
      animationsEnabled: false,
      language: 'fr',
      notificationsRevision: true,
      notificationsDailyReminders: true,
      notificationsRewards: false
    };
    const settingsPayload = SettingsMapper.toRow(settings, 'usr-safe-01');
    expect(settingsPayload.user_id).toBe('usr-safe-01');
    expect(settingsPayload.animations_enabled).toBe(false);
    expect(settingsPayload.notifications_rewards).toBe(false);
  });
});
