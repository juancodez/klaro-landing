-- Migration 001: user_profiles
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS user_profiles (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  steuernummer      text DEFAULT '',
  ust_id_nr         text DEFAULT '',
  steuer_id         text DEFAULT '',
  finanzamt         text DEFAULT '',
  tax_type          text DEFAULT 'freiberufler'
                    CHECK (tax_type IN ('freiberufler', 'gewerbetreibender', 'kleinunternehmer')),
  kleinunternehmer  boolean DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- RLS: users can only read/write their own row
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles: own row only"
  ON user_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
