BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE homes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE home_members (
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','resident','guest')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (home_id, user_id)
);

CREATE TABLE floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  UNIQUE (home_id, name)
);

CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id uuid NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  UNIQUE (floor_id, name)
);

CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  encrypted_credentials bytea,
  credential_iv bytea,
  credential_auth_tag bytea,
  credential_key_version text,
  credentials_rotated_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (home_id, provider)
);

CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  integration_id uuid NOT NULL REFERENCES integrations(id) ON DELETE RESTRICT,
  external_id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'unknown',
  capabilities jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, external_id)
);

CREATE TABLE device_states (
  device_id uuid PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  state jsonb NOT NULL DEFAULT '{}',
  reported_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE device_commands (
  request_id uuid PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  capability text NOT NULL,
  value jsonb,
  status text NOT NULL CHECK (status IN ('pending','acknowledged','succeeded','failed','timed_out')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  home_id uuid REFERENCES homes(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  target_id text,
  request_id uuid,
  result text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_devices_home ON devices(home_id);
CREATE INDEX idx_devices_room ON devices(room_id);
CREATE INDEX idx_audit_home_date ON audit_logs(home_id, created_at DESC);
CREATE INDEX idx_commands_device_date ON device_commands(device_id, created_at DESC);

COMMIT;
