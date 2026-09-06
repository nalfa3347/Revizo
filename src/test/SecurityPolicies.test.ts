import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Security & Multi-Tenant Isolation — RLS Validation', () => {
  const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');

  it('vérifie que les 3 fichiers de migration existent dans supabase/migrations/', () => {
    expect(fs.existsSync(migrationsDir)).toBe(true);
    const files = fs.readdirSync(migrationsDir);
    expect(files).toContain('20260905000001_revizo_core_schema.sql');
    expect(files).toContain('20260905000002_revizo_rls_policies.sql');
    expect(files).toContain('20260905000003_revizo_storage_buckets.sql');
  });

  it('vérifie que la migration RLS active Row Level Security sur chacune des 12 tables', () => {
    const rlsSql = fs.readFileSync(
      path.join(migrationsDir, '20260905000002_revizo_rls_policies.sql'),
      'utf-8'
    );

    const requiredTables = [
      'users',
      'courses',
      'course_files',
      'analyses',
      'concepts',
      'revisions',
      'quizzes',
      'quiz_questions',
      'quiz_results',
      'user_progress',
      'notifications',
      'user_settings'
    ];

    for (const table of requiredTables) {
      const rlsEnablePattern = new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
      expect(rlsSql).toMatch(rlsEnablePattern);
    }
  });

  it('vérifie que les politiques RLS appliquent le filtre auth.uid() sans contournement', () => {
    const rlsSql = fs.readFileSync(
      path.join(migrationsDir, '20260905000002_revizo_rls_policies.sql'),
      'utf-8'
    );

    // Vérifie la présence de auth.uid() dans les politiques
    expect(rlsSql).toContain('auth.uid() = id');
    expect(rlsSql).toContain('auth.uid() = user_id');
    // Vérifie qu'il n'y a pas de 'true' aveugle dans un USING de SELECT
    expect(rlsSql).not.toMatch(/FOR\s+SELECT\s+USING\s*\(\s*true\s*\)/i);
  });

  it('vérifie que la migration Storage protège les compartiments par dossier auth.uid()', () => {
    const storageSql = fs.readFileSync(
      path.join(migrationsDir, '20260905000003_revizo_storage_buckets.sql'),
      'utf-8'
    );

    expect(storageSql).toContain('source-documents');
    expect(storageSql).toContain('processed-assets');
    expect(storageSql).toContain('(storage.foldername(name))[1] = auth.uid()::text');
  });
});
