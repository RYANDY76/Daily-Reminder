-- Push notification deduplication log
CREATE TABLE IF NOT EXISTS push_sent_log (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  sent_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_sent_log_profile ON push_sent_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_push_sent_log_sent_at ON push_sent_log(sent_at);

-- Service role only (edge functions use service role)
ALTER TABLE push_sent_log ENABLE ROW LEVEL SECURITY;
-- No policies = only service role can access
