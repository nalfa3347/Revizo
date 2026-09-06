import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataProvider } from '../providers/mock/MockDataProvider';
import { UserService } from '../services/UserService';

describe('UserService', () => {
  let provider: MockDataProvider;
  let userService: UserService;

  beforeEach(() => {
    provider = new MockDataProvider(0);
    userService = new UserService(provider);
  });

  it('récupère le profil initial de l’élève', async () => {
    const profile = await userService.getProfile();
    expect(profile.displayName).toBe('Nasser');
    expect(profile.email).toBe('nasser@revizo.app');
    expect(profile.gradeLevel).toBe('3e');
  });

  it('permet de modifier le prénom et le niveau scolaire', async () => {
    const updated = await userService.updateProfile({
      displayName: 'Nasser Benali',
      gradeLevel: '2nde'
    });

    expect(updated.displayName).toBe('Nasser Benali');
    expect(updated.gradeLevel).toBe('2nde');

    const fresh = await userService.getProfile();
    expect(fresh.displayName).toBe('Nasser Benali');
    expect(fresh.gradeLevel).toBe('2nde');
  });

  it('fournit les 4 indicateurs clés de progression', async () => {
    const progress = await userService.getProgress();
    expect(progress.level).toBe(8);
    expect(progress.totalXp).toBeGreaterThan(0);
    expect(progress.currentStreak).toBe(12);
    expect(progress.diamondsBalance).toBe(24);
  });

  it('calcule les 3 objectifs d’apprentissage concrets', async () => {
    const goals = await userService.getGoals();
    expect(goals.length).toBe(3);

    const dailyGoal = goals.find(g => g.id === 'goal-daily');
    expect(dailyGoal).toBeDefined();
    expect(dailyGoal?.progressPct).toBe(67); // 10 / 15 = 67%
    expect(dailyGoal?.category).toBe('daily');

    const streakGoal = goals.find(g => g.id === 'goal-streak');
    expect(streakGoal).toBeDefined();
    expect(streakGoal?.currentValue).toBe('12 jours');
    expect(streakGoal?.category).toBe('streak');

    const masteryGoal = goals.find(g => g.id === 'goal-mastery');
    expect(masteryGoal).toBeDefined();
    expect(masteryGoal?.category).toBe('mastery');
  });

  it('permet de simuler la déconnexion locale proprement', async () => {
    await expect(userService.logout()).resolves.toBeUndefined();
  });
});
