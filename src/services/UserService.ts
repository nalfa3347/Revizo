import { IDataProvider } from '../contracts/IDataProvider';
import { UserProfile, UserProgress, CourseConcept } from '../types';

export interface UserGoal {
  id: string;
  title: string;
  description: string;
  progressPct: number;
  currentValue: string;
  targetValue: string;
  status: 'in_progress' | 'completed';
  category: 'daily' | 'streak' | 'mastery';
  icon: string;
}

export class UserService {
  constructor(private dataProvider: IDataProvider) {}

  async getProfile(): Promise<UserProfile> {
    return this.dataProvider.getProfile();
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.dataProvider.updateProfile(updates);
  }

  async getProgress(): Promise<UserProgress> {
    return this.dataProvider.getProgress();
  }

  async getGoals(): Promise<UserGoal[]> {
    const [progress, weakConcepts] = await Promise.all([
      this.dataProvider.getProgress(),
      this.dataProvider.getWeakConcepts()
    ]);

    const dailyPct = Math.min(100, Math.round((progress.dailyGoalProgressMinutes / progress.dailyGoalMinutes) * 100));
    const streakTarget = 14;
    const streakPct = Math.min(100, Math.round((progress.currentStreak / streakTarget) * 100));

    const weakConcept: CourseConcept | undefined = weakConcepts[0];
    const masteryPct = weakConcept ? weakConcept.masteryScore : 100;

    return [
      {
        id: 'goal-daily',
        title: 'Objectif quotidien de révision',
        description: `${progress.dailyGoalProgressMinutes} sur ${progress.dailyGoalMinutes} minutes révisées aujourd’hui`,
        progressPct: dailyPct,
        currentValue: `${progress.dailyGoalProgressMinutes} min`,
        targetValue: `${progress.dailyGoalMinutes} min`,
        status: dailyPct >= 100 ? 'completed' : 'in_progress',
        category: 'daily',
        icon: 'Target'
      },
      {
        id: 'goal-streak',
        title: 'Maintenir la série de travail',
        description: `Série active de ${progress.currentStreak} jours consécutifs`,
        progressPct: streakPct,
        currentValue: `${progress.currentStreak} jours`,
        targetValue: `${streakTarget} jours`,
        status: progress.currentStreak >= streakTarget ? 'completed' : 'in_progress',
        category: 'streak',
        icon: 'Flame'
      },
      {
        id: 'goal-mastery',
        title: 'Consolider les notions fragiles',
        description: weakConcept 
          ? `Améliorer la maîtrise de « ${weakConcept.name} »`
          : 'Toutes les notions actuelles sont maîtrisées à plus de 75%',
        progressPct: masteryPct,
        currentValue: `${masteryPct}%`,
        targetValue: '80%',
        status: masteryPct >= 80 ? 'completed' : 'in_progress',
        category: 'mastery',
        icon: 'Sparkles'
      }
    ];
  }

  async logout(): Promise<void> {
    // En environnement local de développement, simule la fin de session sans API distante
    return new Promise(resolve => setTimeout(resolve, 80));
  }
}
