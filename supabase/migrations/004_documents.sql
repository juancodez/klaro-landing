-- Migration 004: documents table + Storage bucket
-- Run after 001_user_profiles.sql
-- Go to: Supabase Dashboard → SQL Editor → New query → paste + run

-- ── Documents table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text        NOT NULL,
  file_path   text        NOT NULL,
  type        text        DEFAULT '',
  doc_type    text        DEFAULT 'otro'
              CHECK (doc_type IN ('factura', 'gasto', 'contrato', 'otro')),
  status      text        DEFAULT 'pendiente'
              CHECK (status IN ('pendiente', 'clasificado', 'verificado')),
  size_bytes  bigint      DEFAULT 0,
  year        int4        DEFAULT EXTRACT(year FROM now()),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents: own rows only"
  ON documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Storage bucket (private) ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage RLS: each user can only access files under their own user_id prefix
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents storage: owner upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "documents storage: owner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "documents storage: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );
