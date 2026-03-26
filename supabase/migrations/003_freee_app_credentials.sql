-- Add Freee app credentials columns (client_id, client_secret)
-- and relax NOT NULL constraints so credentials can be saved before OAuth completes.

ALTER TABLE freee_connection
  ADD COLUMN client_id TEXT,
  ADD COLUMN client_secret TEXT;

ALTER TABLE freee_connection
  ALTER COLUMN access_token DROP NOT NULL,
  ALTER COLUMN refresh_token DROP NOT NULL,
  ALTER COLUMN expires_at DROP NOT NULL,
  ALTER COLUMN company_id DROP NOT NULL;
