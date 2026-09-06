import { UserProfile, SchoolLevel } from '../types';
import { SupabaseUserRow } from '../types/database.types';

export class UserMapper {
  static toDomain(row: SupabaseUserRow): UserProfile {
    return {
      id: row.id,
      email: row.email || '',
      phone: row.phone || undefined,
      displayName: row.display_name,
      avatarUrl: row.avatar_url || undefined,
      gradeLevel: (row.grade_level as SchoolLevel) || '3e',
      joinedAt: row.created_at
    };
  }

  static toRow(profile: Partial<UserProfile>): Partial<SupabaseUserRow> {
    const row: Partial<SupabaseUserRow> = {};
    if (profile.id !== undefined) row.id = profile.id;
    if (profile.email !== undefined) row.email = profile.email || null;
    if (profile.phone !== undefined) row.phone = profile.phone || null;
    if (profile.displayName !== undefined) row.display_name = profile.displayName;
    if (profile.avatarUrl !== undefined) row.avatar_url = profile.avatarUrl || null;
    if (profile.gradeLevel !== undefined) row.grade_level = profile.gradeLevel;
    if (profile.joinedAt !== undefined) row.created_at = profile.joinedAt;
    return row;
  }
}
