import { Revision, RevisionSection } from '../types';
import { SupabaseRevisionRow } from '../types/database.types';

export class RevisionMapper {
  static toDomain(row: SupabaseRevisionRow): Revision {
    return {
      id: row.id,
      courseId: row.course_id,
      courseTitle: row.title || 'Cours',
      title: row.title,
      summary: row.summary,
      keyConcepts: Array.isArray(row.key_concepts) ? row.key_concepts : [],
      rulesFormulas: Array.isArray(row.rules_formulas) ? row.rules_formulas : [],
      sections: Array.isArray(row.sections)
        ? row.sections.map((s: any, idx: number): RevisionSection => ({
            id: s.id || `sec-${idx + 1}`,
            order: s.order ?? s.orderIndex ?? idx + 1,
            title: s.title,
            subtitle: s.subtitle,
            presentationFormat: s.presentationFormat,
            simpleExplanation: s.simpleExplanation,
            technicalFormulation: s.technicalFormulation,
            analogyOrExample: s.analogyOrExample,
            mnemonicTip: s.mnemonicTip,
            commonMistake: s.commonMistake,
            conceptId: s.conceptId,
            content: s.content,
            keyTakeaways: s.keyTakeaways || s.key_takeaways || [],
            formulas: s.formulas,
            examples: s.examples,
            sourceReferences: s.sourceReferences
          }))
        : [],
      totalSections: row.total_sections || (row.sections ? row.sections.length : 0),
      isDownloaded: row.is_downloaded || false,
      downloadedAt: row.downloaded_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at
    };
  }

  static toRow(revision: Partial<Revision>, userId?: string, analysisId?: string): Partial<SupabaseRevisionRow> {
    const row: Partial<SupabaseRevisionRow> = {};
    if (revision.id !== undefined) row.id = revision.id;
    if (revision.courseId !== undefined) row.course_id = revision.courseId;
    if (userId !== undefined) row.user_id = userId;
    if (analysisId !== undefined) row.analysis_id = analysisId;
    if (revision.title !== undefined) row.title = revision.title;
    if (revision.summary !== undefined) row.summary = revision.summary;
    if (revision.keyConcepts !== undefined) row.key_concepts = revision.keyConcepts;
    if (revision.rulesFormulas !== undefined) row.rules_formulas = revision.rulesFormulas;
    if (revision.sections !== undefined) {
      row.sections = revision.sections.map((s, idx) => ({
        id: s.id,
        order: s.order ?? idx + 1,
        title: s.title,
        subtitle: s.subtitle,
        presentationFormat: s.presentationFormat,
        simpleExplanation: s.simpleExplanation,
        technicalFormulation: s.technicalFormulation,
        analogyOrExample: s.analogyOrExample,
        mnemonicTip: s.mnemonicTip,
        commonMistake: s.commonMistake,
        conceptId: s.conceptId,
        content: s.content,
        keyTakeaways: s.keyTakeaways || [],
        formulas: s.formulas,
        examples: s.examples,
        sourceReferences: s.sourceReferences
      }));
    }
    if (revision.totalSections !== undefined) row.total_sections = revision.totalSections;
    if (revision.isDownloaded !== undefined) row.is_downloaded = revision.isDownloaded;
    if (revision.downloadedAt !== undefined) row.downloaded_at = revision.downloadedAt || null;
    return row;
  }
}
