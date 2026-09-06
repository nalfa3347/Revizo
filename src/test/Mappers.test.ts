import { describe, it, expect } from 'vitest';
import { UserMapper } from '../mappers/UserMapper';
import { CourseMapper } from '../mappers/CourseMapper';
import { RevisionMapper } from '../mappers/RevisionMapper';
import { QuizMapper } from '../mappers/QuizMapper';
import { ProgressMapper } from '../mappers/ProgressMapper';
import { NotificationMapper } from '../mappers/NotificationMapper';
import { SettingsMapper } from '../mappers/SettingsMapper';
import {
  SupabaseUserRow,
  SupabaseCourseRow,
  SupabaseRevisionRow,
  SupabaseQuizRow,
  SupabaseProgressRow,
  SupabaseNotificationRow,
  SupabaseSettingsRow
} from '../types/database.types';
import { UserProfile, Course } from '../types';

describe('Mappers — Domain <-> Supabase Row Conversions', () => {
  describe('UserMapper', () => {
    it('convertit correctement un SupabaseUserRow en UserProfile', () => {
      const row: SupabaseUserRow = {
        id: 'usr-123',
        email: 'eleve@revizo.fr',
        phone: null,
        display_name: 'Camille Martin',
        grade_level: '3e',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2026-09-01T10:00:00Z',
        updated_at: '2026-09-01T10:00:00Z'
      };

      const domain = UserMapper.toDomain(row);
      expect(domain.id).toBe('usr-123');
      expect(domain.displayName).toBe('Camille Martin');
      expect(domain.email).toBe('eleve@revizo.fr');
      expect(domain.gradeLevel).toBe('3e');
      expect(domain.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('convertit un UserProfile partiel en payload Supabase', () => {
      const updates: Partial<UserProfile> = {
        displayName: 'Camille Durand',
        gradeLevel: '2nde'
      };

      const rowPayload = UserMapper.toRow(updates);
      expect(rowPayload.display_name).toBe('Camille Durand');
      expect(rowPayload.grade_level).toBe('2nde');
    });
  });

  describe('CourseMapper', () => {
    it('convertit correctement un SupabaseCourseRow en Course', () => {
      const row: SupabaseCourseRow = {
        id: 'crs-456',
        user_id: 'usr-123',
        subject_id: 'histoire',
        subject_name: 'Histoire',
        title: 'La Révolution française',
        summary: 'Les origines de 1789 et la chute de la monarchie.',
        difficulty: 3,
        status: 'ready',
        concepts_count: 5,
        progress_pct: 65,
        original_document_name: 'revolution.pdf',
        file_size: 1024000,
        is_downloaded: true,
        downloaded_at: '2026-09-02T12:00:00Z',
        created_at: '2026-09-02T10:00:00Z',
        updated_at: '2026-09-02T10:00:00Z'
      };

      const domain = CourseMapper.toDomain(row);
      expect(domain.id).toBe('crs-456');
      expect(domain.title).toBe('La Révolution française');
      expect(domain.progressPercentage).toBe(65);
      expect(domain.isDownloaded).toBe(true);
      expect(domain.conceptsCount).toBe(5);
    });

    it('convertit un Course en SupabaseCourseRow payload', () => {
      const course: Partial<Course> = {
        id: 'crs-456',
        userId: 'usr-123',
        title: 'La Révolution française',
        progressPercentage: 80,
        isDownloaded: false
      };

      const rowPayload = CourseMapper.toRow(course);
      expect(rowPayload.id).toBe('crs-456');
      expect(rowPayload.user_id).toBe('usr-123');
      expect(rowPayload.progress_pct).toBe(80);
      expect(rowPayload.is_downloaded).toBe(false);
    });
  });

  describe('RevisionMapper', () => {
    it('convertit correctement un SupabaseRevisionRow en Revision', () => {
      const row: SupabaseRevisionRow = {
        id: 'rev-789',
        course_id: 'crs-456',
        analysis_id: 'ana-101',
        user_id: 'usr-123',
        title: 'Fiche Synthèse : La Révolution',
        summary: 'Synthèse des moments clés.',
        key_concepts: ['États généraux', 'Prise de la Bastille'],
        rules_formulas: ['14 juillet 1789'],
        sections: [
          {
            id: 'sec-1',
            order: 1,
            title: 'I. La crise de l’Ancien Régime',
            content: 'Crise financière et sociale.',
            keyTakeaways: ['Tensions fortes', 'Déficit public']
          }
        ],
        total_sections: 1,
        reading_time_minutes: 4,
        is_downloaded: false,
        downloaded_at: null,
        created_at: '2026-09-02T10:05:00Z',
        updated_at: '2026-09-02T10:05:00Z'
      };

      const domain = RevisionMapper.toDomain(row);
      expect(domain.id).toBe('rev-789');
      expect(domain.courseId).toBe('crs-456');
      expect(domain.sections.length).toBe(1);
      expect(domain.sections[0].keyTakeaways).toContain('Tensions fortes');
      expect(domain.keyConcepts).toContain('États généraux');
      expect(domain.rulesFormulas).toContain('14 juillet 1789');
    });
  });

  describe('QuizMapper', () => {
    it('convertit un SupabaseQuizRow en Quiz avec questions associées', () => {
      const row: SupabaseQuizRow = {
        id: 'qz-111',
        course_id: 'crs-456',
        revision_id: 'rev-789',
        user_id: 'usr-123',
        title: 'Quiz de validation : Révolution',
        course_title: 'La Révolution française',
        difficulty: 2,
        total_questions: 1,
        questions: [
          {
            id: 'q-1',
            conceptId: 'c-1',
            question: 'En quelle année a été prise la Bastille ?',
            choices: ['1789', '1792', '1804', '1815'],
            correctChoiceIndex: 0,
            explanation: 'La Bastille a été prise le 14 juillet 1789.',
            difficulty: 1
          }
        ],
        created_at: '2026-09-02T10:10:00Z'
      };

      const domain = QuizMapper.toDomain(row);
      expect(domain.id).toBe('qz-111');
      expect(domain.questions.length).toBe(1);
      expect(domain.questions[0].choices[0]).toBe('1789');
      expect(domain.questions[0].correctChoiceIndex).toBe(0);
    });
  });

  describe('ProgressMapper', () => {
    it('convertit un SupabaseProgressRow en UserProgress', () => {
      const row: SupabaseProgressRow = {
        user_id: 'usr-123',
        total_xp: 1450,
        level: 4,
        xp_to_next_level: 250,
        current_streak: 5,
        longest_streak: 8,
        diamonds_balance: 45,
        energy_balance: 3,
        daily_goal_minutes: 15,
        daily_goal_progress_minutes: 12,
        last_activity_date: '2026-09-04',
        weekly_days: [true, true, true, true, true, false, false],
        updated_at: '2026-09-04T18:00:00Z'
      };

      const domain = ProgressMapper.toDomain(row);
      expect(domain.userId).toBe('usr-123');
      expect(domain.totalXp).toBe(1450);
      expect(domain.level).toBe(4);
      expect(domain.currentStreak).toBe(5);
      expect(domain.diamondsBalance).toBe(45);
      expect(domain.energyBalance).toBe(3);
    });
  });

  describe('NotificationMapper & SettingsMapper', () => {
    it('convertit SupabaseNotificationRow en AppNotification', () => {
      const row: SupabaseNotificationRow = {
        id: 'notif-1',
        user_id: 'usr-123',
        type: 'revision',
        title: 'Fiche prête !',
        message: 'Ta révision est disponible.',
        read: false,
        relative_time: 'Il y a 5 min',
        target_tab: 'revisions',
        target_id: 'crs-456',
        created_at: '2026-09-04T19:00:00Z'
      };

      const domain = NotificationMapper.toDomain(row);
      expect(domain.id).toBe('notif-1');
      expect(domain.type).toBe('revision');
      expect(domain.read).toBe(false);
      expect(domain.targetTab).toBe('revisions');
    });

    it('convertit SupabaseSettingsRow en AppSettings et réciproquement', () => {
      const row: SupabaseSettingsRow = {
        user_id: 'usr-123',
        theme: 'light',
        animations_enabled: true,
        language: 'fr',
        notifications_revision: true,
        notifications_daily_reminders: false,
        notifications_rewards: true,
        updated_at: '2026-09-04T19:00:00Z'
      };

      const domain = SettingsMapper.toDomain(row);
      expect(domain.theme).toBe('light');
      expect(domain.animationsEnabled).toBe(true);
      expect(domain.notificationsDailyReminders).toBe(false);

      const rowBack = SettingsMapper.toRow(domain, 'usr-123');
      expect(rowBack.user_id).toBe('usr-123');
      expect(rowBack.notifications_daily_reminders).toBe(false);
    });
  });
});
