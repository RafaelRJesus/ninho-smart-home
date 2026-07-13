BEGIN;

CREATE TABLE floorplan_versions (
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  version integer NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (home_id, version)
);

CREATE INDEX idx_floorplan_versions_home_date ON floorplan_versions(home_id, created_at DESC);

COMMIT;
