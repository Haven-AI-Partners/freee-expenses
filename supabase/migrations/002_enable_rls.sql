-- Enable Row Level Security on all tables
-- Uses auth.jwt()->>'sub' to extract the Clerk user ID from the JWT

-- users: own row only
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users FOR SELECT
  USING (id = auth.jwt()->>'sub');

CREATE POLICY users_insert_own ON users FOR INSERT
  WITH CHECK (id = auth.jwt()->>'sub');

CREATE POLICY users_update_own ON users FOR UPDATE
  USING (id = auth.jwt()->>'sub')
  WITH CHECK (id = auth.jwt()->>'sub');


-- user_connections (Google Drive only): own rows only
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_connections_select_own ON user_connections FOR SELECT
  USING (user_id = auth.jwt()->>'sub');

CREATE POLICY user_connections_insert_own ON user_connections FOR INSERT
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY user_connections_update_own ON user_connections FOR UPDATE
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY user_connections_delete_own ON user_connections FOR DELETE
  USING (user_id = auth.jwt()->>'sub');


-- freee_connection (singleton): readable by all authenticated users, writable only via service role
ALTER TABLE freee_connection ENABLE ROW LEVEL SECURITY;

CREATE POLICY freee_connection_select_authenticated ON freee_connection FOR SELECT
  USING (auth.jwt()->>'sub' IS NOT NULL);


-- user_preferences: own row only
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_preferences_select_own ON user_preferences FOR SELECT
  USING (user_id = auth.jwt()->>'sub');

CREATE POLICY user_preferences_insert_own ON user_preferences FOR INSERT
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY user_preferences_update_own ON user_preferences FOR UPDATE
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');


-- expense_runs: own rows only
ALTER TABLE expense_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY expense_runs_select_own ON expense_runs FOR SELECT
  USING (user_id = auth.jwt()->>'sub');

CREATE POLICY expense_runs_insert_own ON expense_runs FOR INSERT
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY expense_runs_update_own ON expense_runs FOR UPDATE
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');


-- expense_items: scoped via parent expense_run's user_id
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY expense_items_select_own ON expense_items FOR SELECT
  USING (run_id IN (SELECT id FROM expense_runs WHERE user_id = auth.jwt()->>'sub'));

CREATE POLICY expense_items_insert_own ON expense_items FOR INSERT
  WITH CHECK (run_id IN (SELECT id FROM expense_runs WHERE user_id = auth.jwt()->>'sub'));

CREATE POLICY expense_items_update_own ON expense_items FOR UPDATE
  USING (run_id IN (SELECT id FROM expense_runs WHERE user_id = auth.jwt()->>'sub'))
  WITH CHECK (run_id IN (SELECT id FROM expense_runs WHERE user_id = auth.jwt()->>'sub'));
