ALTER TABLE automations ADD COLUMN IF NOT EXISTS conflicts jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS orchestration_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  execution_id text NOT NULL,
  scene_id uuid NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  automation_id uuid REFERENCES automations(id) ON DELETE SET NULL,
  source text NOT NULL,
  status text NOT NULL CHECK (status IN ('running','succeeded','partial','failed')),
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE(home_id, execution_id)
);

CREATE INDEX IF NOT EXISTS orchestration_executions_home_created_idx ON orchestration_executions(home_id,created_at DESC);
