-- Daily Reminder: couple cloud sync tables

CREATE TABLE IF NOT EXISTS couple_connections (
  id UUID PRIMARY KEY,
  invite_code TEXT UNIQUE,
  profile1_id TEXT NOT NULL,
  profile1_name TEXT NOT NULL,
  profile2_id TEXT,
  profile2_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  connected_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_couple_connections_invite ON couple_connections(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_couple_connections_p1 ON couple_connections(profile1_id);
CREATE INDEX IF NOT EXISTS idx_couple_connections_p2 ON couple_connections(profile2_id) WHERE profile2_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS couple_goals (
  id TEXT PRIMARY KEY,
  couple_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_couple_goals_couple ON couple_goals(couple_id);

CREATE TABLE IF NOT EXISTS couple_love_notes (
  id TEXT PRIMARY KEY,
  couple_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_couple_love_notes_couple ON couple_love_notes(couple_id);

CREATE TABLE IF NOT EXISTS couple_activity (
  id TEXT PRIMARY KEY,
  couple_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_couple_activity_couple ON couple_activity(couple_id);

CREATE TABLE IF NOT EXISTS couple_shared_tasks (
  id TEXT PRIMARY KEY,
  couple_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_couple_shared_tasks_couple ON couple_shared_tasks(couple_id);

-- RLS
ALTER TABLE couple_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_love_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_shared_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_couple_connections" ON couple_connections;
DROP POLICY IF EXISTS "anon_all_couple_goals" ON couple_goals;
DROP POLICY IF EXISTS "anon_all_couple_love_notes" ON couple_love_notes;
DROP POLICY IF EXISTS "anon_all_couple_activity" ON couple_activity;
DROP POLICY IF EXISTS "anon_all_couple_shared_tasks" ON couple_shared_tasks;

CREATE POLICY "anon_all_couple_connections" ON couple_connections FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_couple_goals" ON couple_goals FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_couple_love_notes" ON couple_love_notes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_couple_activity" ON couple_activity FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_couple_shared_tasks" ON couple_shared_tasks FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON couple_connections TO anon;
GRANT ALL ON couple_goals TO anon;
GRANT ALL ON couple_love_notes TO anon;
GRANT ALL ON couple_activity TO anon;
GRANT ALL ON couple_shared_tasks TO anon;
