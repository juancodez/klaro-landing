-- Migration 006: invoices — add cancelled status + missing columns
-- Run in Supabase Dashboard → SQL Editor

-- Add missing columns (idempotent)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number  text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS description     text    DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes          text    DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS date           date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date       date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_company  text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_address  text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_email    text;

-- Drop old status CHECK constraint (if any) and recreate with 'cancelled'
-- Supabase names constraints as <table>_<column>_check — adjust if yours differs
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'));

-- Default status to 'draft' for any existing rows without a status
UPDATE invoices SET status = 'draft' WHERE status IS NULL;
