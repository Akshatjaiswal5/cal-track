-- ============================================================
-- Cal Track — Full Migration
-- Target schema: cal_track (not public)
-- Generated: 2026-03-27
-- ============================================================

-- 1. Create schema
CREATE SCHEMA IF NOT EXISTS cal_track;

-- ============================================================
-- 2. Table definitions
-- ============================================================

CREATE TABLE cal_track.user_settings (
  id          text        PRIMARY KEY,
  cal_goal    integer     NOT NULL DEFAULT 2000,
  protein_goal integer    NOT NULL DEFAULT 100
);

CREATE TABLE cal_track.food_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  min_calories  integer     NOT NULL DEFAULT 0,
  max_calories  integer     NOT NULL DEFAULT 0,
  min_protein   integer     NOT NULL DEFAULT 0,
  max_protein   integer     NOT NULL DEFAULT 0,
  subtypes      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cal_track.food_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  food_item_id  uuid        REFERENCES cal_track.food_items(id) ON DELETE SET NULL,
  food_name     text        NOT NULL,
  quantity      numeric     NOT NULL DEFAULT 1,
  calories      integer     NOT NULL DEFAULT 0,
  protein       integer     NOT NULL DEFAULT 0,
  subtype       text,
  meal_type     text        NOT NULL CHECK (meal_type IN ('morning', 'afternoon', 'dinner')),
  logged_at     timestamptz NOT NULL DEFAULT now()
);

-- Index for date-range queries on food_logs
CREATE INDEX food_logs_logged_at_idx ON cal_track.food_logs (logged_at);

-- ============================================================
-- 3. Seed data
-- ============================================================

-- user_settings
INSERT INTO cal_track.user_settings (id, cal_goal, protein_goal) VALUES
  ('default', 2200, 150);

-- food_items
INSERT INTO cal_track.food_items (id, name, min_calories, max_calories, min_protein, max_protein, subtypes, created_at) VALUES
  (
    'dac90135-ea68-4b99-b89f-cd0c7427065b',
    'Roti',
    60, 150, 1, 3,
    '[{"label": "Small Roti", "threshold": 0.33}, {"label": "Roti", "threshold": 0.66}, {"label": "Ghee Roti", "threshold": 1}]',
    '2026-03-27T07:07:20.085963+00:00'
  ),
  (
    'c5546653-325b-4980-91cb-70f1394691d0',
    'Nachos',
    25, 100, 1, 4,
    '[{"label": "Some Nachos", "threshold": 0.33}, {"label": "Half Nachos", "threshold": 0.66}, {"label": "Full Nachos", "threshold": 1}]',
    '2026-03-27T07:25:15.752656+00:00'
  );

-- food_logs
INSERT INTO cal_track.food_logs (id, food_item_id, food_name, quantity, calories, protein, subtype, meal_type, logged_at) VALUES
  (
    '66f57e5f-a6eb-4731-9209-30af50991a08',
    'dac90135-ea68-4b99-b89f-cd0c7427065b',
    'Roti',
    2, 244, 4,
    'Ghee Roti',
    'dinner',
    '2026-03-27T11:52:41.9+00:00'
  );

-- ============================================================
-- 4. Expose cal_track schema via PostgREST
--    Run this so the Supabase REST API can see the schema.
--    In the new project dashboard go to:
--    Settings → API → "Exposed schemas" and add "cal_track"
--    OR run the two grants below.
-- ============================================================

GRANT USAGE ON SCHEMA cal_track TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA cal_track TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA cal_track TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA cal_track
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA cal_track
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
