-- ==============================================================================
-- REVIZO 2.0 — Migration 003 : Configuration du Stockage Supabase Storage & RLS
-- Date : 2026-09-05
-- Description : Création des buckets de stockage et politiques de sécurité RLS.
--               Note : Le téléchargement de fiche de révision sur l'appareil de l'élève
--               reste 100% géré localement côté client conformément aux exigences.
-- ==============================================================================

-- 1. Création des buckets (privés, isolation par utilisateur)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'source-documents',
    'source-documents',
    false,
    52428800, -- 50 MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'processed-assets',
    'processed-assets',
    false,
    20971520, -- 20 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/json']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Politiques RLS sur storage.objects (Arborescence stricte : <user_id>/<course_id>/<file>)
-- Lecture restreinte aux fichiers appartenant à l'utilisateur connecté
CREATE POLICY "storage_source_docs_select_own" ON storage.objects
  FOR SELECT
  USING (
    bucket_id IN ('source-documents', 'processed-assets')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Upload restreint au sous-dossier portant l'UUID de l'utilisateur connecté
CREATE POLICY "storage_source_docs_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id IN ('source-documents', 'processed-assets')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Mise à jour restreinte aux fichiers de l'utilisateur connecté
CREATE POLICY "storage_source_docs_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id IN ('source-documents', 'processed-assets')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('source-documents', 'processed-assets')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Suppression restreinte aux fichiers de l'utilisateur connecté
CREATE POLICY "storage_source_docs_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id IN ('source-documents', 'processed-assets')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
