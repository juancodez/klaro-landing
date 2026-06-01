-- Extend profiles table with fiscal identification and banking fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS steuernummer text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ust_id_nr    text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS iban         text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bic          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name    text;
