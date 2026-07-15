BEGIN;
CREATE TABLE notification_preferences (home_id uuid PRIMARY KEY REFERENCES homes(id) ON DELETE CASCADE,channels jsonb NOT NULL DEFAULT '{"internal":true,"push":false,"email":false}',quiet_hours jsonb NOT NULL DEFAULT '{"enabled":false,"start":"22:00","end":"07:00"}',updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE energy_alerts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,period text NOT NULL CHECK (period IN ('daily','monthly')),threshold_kwh numeric(14,5) NOT NULL CHECK (threshold_kwh > 0),severity text NOT NULL CHECK (severity IN ('info','warning','error')),enabled boolean NOT NULL DEFAULT true,room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,device_id uuid REFERENCES devices(id) ON DELETE CASCADE,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX idx_energy_alerts_home ON energy_alerts(home_id);
COMMIT;
