import { Course } from '../types';
import { SupabaseCourseRow } from '../types/database.types';

export class CourseMapper {
  static toDomain(row: SupabaseCourseRow): Course {
    return {
      id: row.id,
      userId: row.user_id,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      title: row.title,
      summary: row.summary,
      difficulty: (row.difficulty as 1 | 2 | 3 | 4 | 5) || 2,
      status: (row.status as 'draft' | 'analyzing' | 'ready' | 'error') || 'ready',
      conceptsCount: row.concepts_count || 0,
      progressPercentage: row.progress_pct || 0,
      originalDocumentName: row.original_document_name || undefined,
      fileSize: row.file_size || undefined,
      isDownloaded: row.is_downloaded || false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static toRow(course: Partial<Course>): Partial<SupabaseCourseRow> {
    const row: Partial<SupabaseCourseRow> = {};
    if (course.id !== undefined) row.id = course.id;
    if (course.userId !== undefined) row.user_id = course.userId;
    if (course.subjectId !== undefined) row.subject_id = course.subjectId;
    if (course.subjectName !== undefined) row.subject_name = course.subjectName;
    if (course.title !== undefined) row.title = course.title;
    if (course.summary !== undefined) row.summary = course.summary;
    if (course.difficulty !== undefined) row.difficulty = course.difficulty;
    if (course.status !== undefined) row.status = course.status;
    if (course.conceptsCount !== undefined) row.concepts_count = course.conceptsCount;
    if (course.progressPercentage !== undefined) row.progress_pct = course.progressPercentage;
    if (course.originalDocumentName !== undefined) row.original_document_name = course.originalDocumentName || null;
    if (course.fileSize !== undefined) row.file_size = course.fileSize || null;
    if (course.isDownloaded !== undefined) row.is_downloaded = course.isDownloaded;
    return row;
  }
}
