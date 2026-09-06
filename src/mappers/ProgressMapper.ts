import { UserProgress } from '../types';
import { SupabaseProgressRow } from '../types/database.types';

export class ProgressMapper {
  static toDomain(row: SupabaseProgressRow): UserProgress {
    return {
      userId: row.user_id,
      totalXp: row.total_xp,
      level: row.level,
      xpToNextLevel: row.xp_to_next_level,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      diamondsBalance: row.diamonds_balance,
      energyBalance: row.energy_balance,
      dailyGoalMinutes: row.daily_goal_minutes,
      dailyGoalProgressMinutes: row.daily_goal_progress_minutes,
      lastActivityDate: row.last_activity_date,
      weeklyDays: Array.isArray(row.weekly_days) ? row.weekly_days : [false, false, false, false, false, false, false]
    };
  }

  static toRow(progress: Partial<UserProgress>): Partial<SupabaseProgressRow> {
    const row: Partial<SupabaseProgressRow> = {};
    if (progress.userId !== undefined) row.user_id = progress.userId;
    if (progress.totalXp !== undefined) row.total_xp = progress.totalXp;
    if (progress.level !== undefined) row.level = progress.level;
    if (progress.xpToNextLevel !== undefined) row.xp_to_next_level = progress.xpToNextLevel;
    if (progress.currentStreak !== undefined) row.current_streak = progress.currentStreak;
    if (progress.longestStreak !== undefined) row.longest_streak = progress.longestStreak;
    if (progress.diamondsBalance !== undefined) row.diamonds_balance = progress.diamondsBalance;
    if (progress.energyBalance !== undefined) row.energy_balance = progress.energyBalance;
    if (progress.dailyGoalMinutes !== undefined) row.daily_goal_minutes = progress.dailyGoalMinutes;
    if (progress.dailyGoalProgressMinutes !== undefined) row.daily_goal_progress_minutes = progress.dailyGoalProgressMinutes;
    if (progress.lastActivityDate !== undefined) row.last_activity_date = progress.lastActivityDate;
    if (progress.weeklyDays !== undefined) row.weekly_days = progress.weeklyDays;
    return row;
  }
}
