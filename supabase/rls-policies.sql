-- ============================================================================
-- Daily Reminder: Row Level Security Policies
-- ============================================================================
-- This file enables RLS and creates policies for all tables.
-- Each policy uses auth.uid() to restrict access to the authenticated user.
-- ============================================================================

-- 1. app_profiles ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_profiles (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  accent_color TEXT DEFAULT '#1D9E75',
  pin TEXT,
  dark_mode TEXT DEFAULT 'system',
  google_id TEXT,
  google_email TEXT,
  google_photo_url TEXT,
  google_calendar_connected BOOLEAN DEFAULT false,
  google_calendar_id TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  created_at BIGINT NOT NULL,
  last_sync_at BIGINT
);

ALTER TABLE app_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON app_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_insert_own" ON app_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_own" ON app_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "profiles_delete_own" ON app_profiles
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_app_profiles_user_id ON app_profiles(user_id);

-- 2. app_tasks ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_tasks (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES app_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  session TEXT NOT NULL,
  notes TEXT DEFAULT '',
  color TEXT DEFAULT '#1D9E75',
  done BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  tags JSONB DEFAULT '[]',
  due_date TEXT,
  subtasks JSONB DEFAULT '[]',
  time_tracking JSONB,
  recurring JSONB,
  is_recurring BOOLEAN DEFAULT false,
  recurring_id TEXT,
  date TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  google_event_id TEXT,
  synced_to_google BOOLEAN DEFAULT false,
  snoozed_until BIGINT,
  is_shared BOOLEAN DEFAULT false,
  shared_with TEXT,
  assigned_to TEXT,
  shared_by TEXT,
  shared_at BIGINT,
  completed_by TEXT,
  attachment_url TEXT,
  comment_count INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE app_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own" ON app_tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tasks_insert_own" ON app_tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tasks_update_own" ON app_tasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "tasks_delete_own" ON app_tasks
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_app_tasks_user_id ON app_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_app_tasks_profile_id ON app_tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_app_tasks_date ON app_tasks(date);

-- 3. app_daily_history -------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_daily_history (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES app_profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  tasks_done INTEGER DEFAULT 0,
  tasks_missed INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  daily_productivity_score INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE app_daily_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_history_select_own" ON app_daily_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "daily_history_insert_own" ON app_daily_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_history_update_own" ON app_daily_history
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "daily_history_delete_own" ON app_daily_history
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_app_daily_history_user_id ON app_daily_history(user_id);
CREATE INDEX IF NOT EXISTS idx_app_daily_history_profile_id ON app_daily_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_app_daily_history_date ON app_daily_history(date);

-- 4. app_habits --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_habits (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES app_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '⭐',
  color TEXT DEFAULT '#3B82F6',
  frequency TEXT DEFAULT 'daily',
  target_days JSONB DEFAULT '[]',
  completed_dates JSONB DEFAULT '[]',
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  reminder_time TEXT,
  created_at BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE app_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habits_select_own" ON app_habits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "habits_insert_own" ON app_habits
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "habits_update_own" ON app_habits
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "habits_delete_own" ON app_habits
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_app_habits_user_id ON app_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_app_habits_profile_id ON app_habits(profile_id);

-- 5. app_mood_logs -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_mood_logs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES app_profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
  note TEXT DEFAULT '',
  created_at BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE app_mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mood_logs_select_own" ON app_mood_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "mood_logs_insert_own" ON app_mood_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "mood_logs_update_own" ON app_mood_logs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "mood_logs_delete_own" ON app_mood_logs
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_app_mood_logs_user_id ON app_mood_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_app_mood_logs_profile_id ON app_mood_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_app_mood_logs_date ON app_mood_logs(date);

-- 6. app_pomodoro_sessions ---------------------------------------------------
CREATE TABLE IF NOT EXISTS app_pomodoro_sessions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES app_profiles(id) ON DELETE CASCADE,
  task_id TEXT,
  task_title TEXT DEFAULT '',
  date TEXT NOT NULL,
  started_at BIGINT NOT NULL,
  duration INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('work', 'break')),
  completed BOOLEAN DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE app_pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pomodoro_sessions_select_own" ON app_pomodoro_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "pomodoro_sessions_insert_own" ON app_pomodoro_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "pomodoro_sessions_update_own" ON app_pomodoro_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "pomodoro_sessions_delete_own" ON app_pomodoro_sessions
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_app_pomodoro_sessions_user_id ON app_pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_pomodoro_sessions_profile_id ON app_pomodoro_sessions(profile_id);

-- 7. app_goals ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_goals (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES app_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  target_date TEXT NOT NULL,
  color TEXT DEFAULT '#8B5CF6',
  icon TEXT DEFAULT '🎯',
  task_ids JSONB DEFAULT '[]',
  completed_task_ids JSONB DEFAULT '[]',
  done BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE app_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select_own" ON app_goals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "goals_insert_own" ON app_goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_update_own" ON app_goals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "goals_delete_own" ON app_goals
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_app_goals_user_id ON app_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_app_goals_profile_id ON app_goals(profile_id);

-- 8. couple_connections ------------------------------------------------------
-- These tables already exist in the migration file, but we recreate policies
-- with proper auth-based access instead of wide-open anon access.

ALTER TABLE couple_connections ENABLE ROW LEVEL SECURITY;

-- Drop the old wide-open policies if they exist
DROP POLICY IF EXISTS "anon_all_couple_connections" ON couple_connections;

CREATE POLICY "couple_connections_select_participant" ON couple_connections
  FOR SELECT USING (
    profile1_id = auth.uid()::text OR profile2_id = auth.uid()::text
  );

CREATE POLICY "couple_connections_insert_own" ON couple_connections
  FOR INSERT WITH CHECK (
    profile1_id = auth.uid()::text
  );

CREATE POLICY "couple_connections_update_participant" ON couple_connections
  FOR UPDATE USING (
    profile1_id = auth.uid()::text OR profile2_id = auth.uid()::text
  );

CREATE POLICY "couple_connections_delete_participant" ON couple_connections
  FOR DELETE USING (
    profile1_id = auth.uid()::text OR profile2_id = auth.uid()::text
  );

-- 9. couple_goals ------------------------------------------------------------
ALTER TABLE couple_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_couple_goals" ON couple_goals;

CREATE POLICY "couple_goals_select_couple" ON couple_goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_goals.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

CREATE POLICY "couple_goals_insert_couple" ON couple_goals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_goals.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

CREATE POLICY "couple_goals_update_couple" ON couple_goals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_goals.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

CREATE POLICY "couple_goals_delete_couple" ON couple_goals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_goals.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

-- 10. couple_love_notes ------------------------------------------------------
ALTER TABLE couple_love_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_couple_love_notes" ON couple_love_notes;

CREATE POLICY "couple_love_notes_select_couple" ON couple_love_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_love_notes.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

CREATE POLICY "couple_love_notes_insert_couple" ON couple_love_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_love_notes.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

CREATE POLICY "couple_love_notes_update_couple" ON couple_love_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_love_notes.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

CREATE POLICY "couple_love_notes_delete_couple" ON couple_love_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_love_notes.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

-- 11. couple_activity --------------------------------------------------------
ALTER TABLE couple_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_couple_activity" ON couple_activity;

CREATE POLICY "couple_activity_select_couple" ON couple_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_activity.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

CREATE POLICY "couple_activity_insert_couple" ON couple_activity
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_activity.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

CREATE POLICY "couple_activity_update_couple" ON couple_activity
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_activity.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

CREATE POLICY "couple_activity_delete_couple" ON couple_activity
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM couple_connections
      WHERE couple_connections.id = couple_activity.couple_id::uuid
        AND (couple_connections.profile1_id = auth.uid()::text
          OR couple_connections.profile2_id = auth.uid()::text)
    )
  );

-- Ensure indexes on profileId/userId columns for performance
CREATE INDEX IF NOT EXISTS idx_couple_connections_profile1 ON couple_connections(profile1_id);
CREATE INDEX IF NOT EXISTS idx_couple_connections_profile2 ON couple_connections(profile2_id);
CREATE INDEX IF NOT EXISTS idx_couple_goals_couple_id ON couple_goals(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_love_notes_couple_id ON couple_love_notes(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_activity_couple_id ON couple_activity(couple_id);
