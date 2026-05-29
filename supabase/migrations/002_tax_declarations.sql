-- Migration 002: tax_declarations
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS tax_declarations (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  declaration_type text NOT NULL
                   CHECK (declaration_type IN ('ustVA', 'einkommensteuer', 'gewerbesteuer')),
  quarter          int  CHECK (quarter BETWEEN 1 AND 4),
  year             int  NOT NULL,
  period_start     date NOT NULL,
  period_end       date NOT NULL,
  due_date         date NOT NULL,
  status           text DEFAULT 'pending'
                   CHECK (status IN ('pending', 'filed', 'overdue')),
  filed_at         timestamptz,
  iva_facturado    numeric(12,2) DEFAULT 0,
  vorsteuer        numeric(12,2) DEFAULT 0,
  neto_pagar       numeric(12,2) DEFAULT 0,
  notes            text DEFAULT '',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_tax_decl_user_year
  ON tax_declarations (user_id, year DESC, due_date DESC);

-- RLS
ALTER TABLE tax_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_declarations: own rows only"
  ON tax_declarations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_tax_declarations_updated_at
  BEFORE UPDATE ON tax_declarations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
