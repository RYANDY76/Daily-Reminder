-- Daily Reminder — Supabase schema (Authenticated RLS)

-- ===================================================================
-- TABLES
-- ===================================================================

CREATE TABLE IF NOT EXISTS couple_connections (
  id UUID PRIMARY KEY,
  invite_code TEXT UNIQUE,
  profile1_id TEXT NOT NULL,
  profile1_name TEXT NOT NULL,
  profile2_id TEXT,
  profile2_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  connected_at BIGINT NOT NULL,
  points BIGINT NOT NULL DEFAULT 0,
  level BIGINT NOT NULL DEFAULT 1,
  -- Foreign Keys linking to Supabase Auth
  auth_user1_id UUID REFERENCES auth.users(id),
  auth_user2_id UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_couple_connections_invite ON couple_connections(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_couple_connections_auth1 ON couple_connections(auth_user1_id);
CREATE INDEX IF NOT EXISTS idx_couple_connections_auth2 ON couple_connections(auth_user2_id);

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

CREATE TABLE IF NOT EXISTS couple_task_comments (
  id TEXT PRIMARY KEY,
  couple_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_couple_task_comments_couple ON couple_task_comments(couple_id);

-- Local-first app sync tables. These store one JSONB record per local entity,
-- scoped to the authenticated Supabase user and active Daily Reminder profile.
CREATE TABLE IF NOT EXISTS app_profiles (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_profiles_owner ON app_profiles(auth_user_id, profile_id);

CREATE TABLE IF NOT EXISTS app_tasks (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_tasks_owner ON app_tasks(auth_user_id, profile_id);

CREATE TABLE IF NOT EXISTS app_daily_history (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_daily_history_owner ON app_daily_history(auth_user_id, profile_id);

CREATE TABLE IF NOT EXISTS app_habits (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_habits_owner ON app_habits(auth_user_id, profile_id);

CREATE TABLE IF NOT EXISTS app_mood_logs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_mood_logs_owner ON app_mood_logs(auth_user_id, profile_id);

CREATE TABLE IF NOT EXISTS app_pomodoro_sessions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_pomodoro_sessions_owner ON app_pomodoro_sessions(auth_user_id, profile_id);

CREATE TABLE IF NOT EXISTS app_goals (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_goals_owner ON app_goals(auth_user_id, profile_id);

-- ===================================================================
-- ENABLE ROW LEVEL SECURITY
-- ===================================================================

ALTER TABLE couple_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_love_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_shared_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_daily_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_goals ENABLE ROW LEVEL SECURITY;

-- Drop old policies to replace them with auth.uid() based ones
DROP POLICY IF EXISTS "connections_select" ON couple_connections;
DROP POLICY IF EXISTS "connections_insert" ON couple_connections;
DROP POLICY IF EXISTS "connections_update" ON couple_connections;
DROP POLICY IF EXISTS "connections_delete" ON couple_connections;

DROP POLICY IF EXISTS "goals_select" ON couple_goals;
DROP POLICY IF EXISTS "goals_insert" ON couple_goals;
DROP POLICY IF EXISTS "goals_update" ON couple_goals;
DROP POLICY IF EXISTS "goals_delete" ON couple_goals;

DROP POLICY IF EXISTS "love_notes_select" ON couple_love_notes;
DROP POLICY IF EXISTS "love_notes_insert" ON couple_love_notes;
DROP POLICY IF EXISTS "love_notes_update" ON couple_love_notes;
DROP POLICY IF EXISTS "love_notes_delete" ON couple_love_notes;

DROP POLICY IF EXISTS "activity_select" ON couple_activity;
DROP POLICY IF EXISTS "activity_insert" ON couple_activity;
DROP POLICY IF EXISTS "activity_update" ON couple_activity;
DROP POLICY IF EXISTS "activity_delete" ON couple_activity;

DROP POLICY IF EXISTS "shared_tasks_select" ON couple_shared_tasks;
DROP POLICY IF EXISTS "shared_tasks_insert" ON couple_shared_tasks;
DROP POLICY IF EXISTS "shared_tasks_update" ON couple_shared_tasks;
DROP POLICY IF EXISTS "shared_tasks_delete" ON couple_shared_tasks;

DROP POLICY IF EXISTS "task_comments_select" ON couple_task_comments;
DROP POLICY IF EXISTS "task_comments_insert" ON couple_task_comments;
DROP POLICY IF EXISTS "task_comments_update" ON couple_task_comments;
DROP POLICY IF EXISTS "task_comments_delete" ON couple_task_comments;

DROP POLICY IF EXISTS "app_profiles_owner" ON app_profiles;
DROP POLICY IF EXISTS "app_tasks_owner" ON app_tasks;
DROP POLICY IF EXISTS "app_daily_history_owner" ON app_daily_history;
DROP POLICY IF EXISTS "app_habits_owner" ON app_habits;
DROP POLICY IF EXISTS "app_mood_logs_owner" ON app_mood_logs;
DROP POLICY IF EXISTS "app_pomodoro_sessions_owner" ON app_pomodoro_sessions;
DROP POLICY IF EXISTS "app_goals_owner" ON app_goals;

-- ===================================================================
-- SECURITY POLICIES: couple_connections
-- ===================================================================

-- SELECT: Allow read if the user is user1 or user2.
-- For invite_code lookups, use a dedicated function instead of exposing all pending connections.
CREATE POLICY "connections_select" ON couple_connections
  FOR SELECT TO authenticated
  USING (
    auth_user1_id = auth.uid() 
    OR auth_user2_id = auth.uid()
  );

-- Function for invite code lookup: only returns matching row if the caller is authenticated.
-- This prevents enumeration of all pending connections.
CREATE OR REPLACE FUNCTION lookup_by_invite_code(code TEXT)
RETURNS SETOF couple_connections
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM couple_connections
  WHERE invite_code = code AND status = 'pending'
  LIMIT 1;
$$;

-- INSERT: Only allow creating a connection for yourself
CREATE POLICY "connections_insert" ON couple_connections
  FOR INSERT TO authenticated
  WITH CHECK (
    auth_user1_id = auth.uid()
    AND status = 'pending'
  );

-- UPDATE: Allow user2 to join (via invite code lookup function), or allow members to update status
CREATE POLICY "connections_update" ON couple_connections
  FOR UPDATE TO authenticated
  USING (
    auth_user1_id = auth.uid() 
    OR auth_user2_id = auth.uid()
  )
  WITH CHECK (
    auth_user1_id = auth.uid() 
    OR auth_user2_id = auth.uid()
  );

-- Allow joining via invite_code: only pending connections can be updated by the joiner
-- This is scoped via the lookup_by_invite_code function, not via a broad USING clause.
CREATE POLICY "connections_join" ON couple_connections
  FOR UPDATE TO authenticated
  USING (
    auth_user2_id IS NULL 
    AND invite_code IS NOT NULL 
    AND status = 'pending'
  )
  WITH CHECK (
    auth_user2_id = auth.uid()
    AND status = 'active'
    AND invite_code IS NULL
  );

CREATE POLICY "connections_delete" ON couple_connections
  FOR DELETE TO authenticated
  USING (auth_user1_id = auth.uid() OR auth_user2_id = auth.uid());

-- ===================================================================
-- HELPER POLICY (reused for data tables)
-- Data tables require the user to be part of the connection matching couple_id
-- ===================================================================

CREATE POLICY "goals_select" ON couple_goals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "goals_insert" ON couple_goals FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "goals_update" ON couple_goals FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "goals_delete" ON couple_goals FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));

CREATE POLICY "love_notes_select" ON couple_love_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "love_notes_insert" ON couple_love_notes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "love_notes_update" ON couple_love_notes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "love_notes_delete" ON couple_love_notes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));

CREATE POLICY "activity_select" ON couple_activity FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "activity_insert" ON couple_activity FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "activity_update" ON couple_activity FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "activity_delete" ON couple_activity FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));

CREATE POLICY "shared_tasks_select" ON couple_shared_tasks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "shared_tasks_insert" ON couple_shared_tasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "shared_tasks_update" ON couple_shared_tasks FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "shared_tasks_delete" ON couple_shared_tasks FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));

CREATE POLICY "task_comments_select" ON couple_task_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "task_comments_insert" ON couple_task_comments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "task_comments_update" ON couple_task_comments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));
CREATE POLICY "task_comments_delete" ON couple_task_comments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM couple_connections c WHERE c.id::text = couple_id AND (c.auth_user1_id = auth.uid() OR c.auth_user2_id = auth.uid())));

-- ===================================================================
-- SECURITY POLICIES: local-first app sync tables
-- ===================================================================

CREATE POLICY "app_profiles_owner" ON app_profiles FOR ALL TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "app_tasks_owner" ON app_tasks FOR ALL TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "app_daily_history_owner" ON app_daily_history FOR ALL TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "app_habits_owner" ON app_habits FOR ALL TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "app_mood_logs_owner" ON app_mood_logs FOR ALL TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "app_pomodoro_sessions_owner" ON app_pomodoro_sessions FOR ALL TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "app_goals_owner" ON app_goals FOR ALL TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ===================================================================
-- GRANTS (authenticated only)
-- ===================================================================

REVOKE ALL ON SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON couple_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON couple_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON couple_love_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON couple_activity TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON couple_shared_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON couple_task_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_daily_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_mood_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_pomodoro_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_goals TO authenticated;

-- Ensure storage policies also require authentication
DROP POLICY IF EXISTS "task_attachments_public_select" ON storage.objects;
DROP POLICY IF EXISTS "task_attachments_insert" ON storage.objects;

CREATE POLICY "task_attachments_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'task-attachments');

CREATE POLICY "task_attachments_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-attachments');

-- Web Push subscriptions (for background notifications via Edge Function)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  subscription JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(auth_user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_owner" ON push_subscriptions;
CREATE POLICY "push_subscriptions_owner" ON push_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;

CREATE TABLE IF NOT EXISTS push_sent_log (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  sent_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_sent_log_profile ON push_sent_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_push_sent_log_sent_at ON push_sent_log(sent_at);
ALTER TABLE push_sent_log ENABLE ROW LEVEL SECURITY;
