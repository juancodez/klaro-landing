-- Migration 003: tasks (Action Center)
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS tasks (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_type            text NOT NULL
                       CHECK (task_type IN (
                         'ustVA_due',          -- UStVA deadline approaching
                         'invoice_unpaid',     -- Invoice unpaid > 30 days
                         'quarter_threshold',  -- Quarter > 80% elapsed
                         'docs_unclassified',  -- Uploaded docs not classified
                         'custom'
                       )),
  title                text NOT NULL,
  description          text DEFAULT '',
  priority             text DEFAULT 'amber'
                       CHECK (priority IN ('red', 'amber', 'green')),
  status               text DEFAULT 'open'
                       CHECK (status IN ('open', 'dismissed', 'completed')),
  due_date             date,
  related_entity_type  text,  -- 'invoice' | 'expense' | 'declaration' | null
  related_entity_id    uuid,
  action_url           text DEFAULT '',
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Only show open tasks efficiently
CREATE INDEX IF NOT EXISTS idx_tasks_user_open
  ON tasks (user_id, status, priority)
  WHERE status = 'open';

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks: own rows only"
  ON tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
