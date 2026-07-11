BEGIN;

ALTER TABLE devices ALTER COLUMN integration_id DROP NOT NULL;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'plug';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS online boolean NOT NULL DEFAULT true;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS position_x numeric(6,3) NOT NULL DEFAULT 50;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS position_y numeric(6,3) NOT NULL DEFAULT 50;

CREATE TABLE floorplans (
  home_id uuid PRIMARY KEY REFERENCES homes(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}',
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name text NOT NULL,
  actions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(home_id, name)
);

CREATE TABLE automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  scene_id uuid NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger jsonb NOT NULL DEFAULT '{"type":"manual"}',
  conditions jsonb NOT NULL DEFAULT '[]',
  enabled boolean NOT NULL DEFAULT true,
  last_execution jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(home_id, name)
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  severity text NOT NULL CHECK (severity IN ('info','success','warning','error')),
  title text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE energy_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  kwh numeric(14,5) NOT NULL CHECK (kwh >= 0),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE energy_settings (
  home_id uuid PRIMARY KEY REFERENCES homes(id) ON DELETE CASCADE,
  tariff numeric(14,5) CHECK (tariff >= 0),
  currency char(3) NOT NULL DEFAULT 'BRL',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scenes_home ON scenes(home_id);
CREATE INDEX idx_automations_home ON automations(home_id);
CREATE INDEX idx_notifications_home_date ON notifications(home_id, created_at DESC);
CREATE INDEX idx_energy_home_date ON energy_readings(home_id, recorded_at DESC);

COMMIT;
