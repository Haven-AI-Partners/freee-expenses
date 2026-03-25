-- Users table (synced from Clerk)
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- clerk_user_id
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-user OAuth connections (Google Drive only)
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  access_token TEXT NOT NULL,       -- encrypted
  refresh_token TEXT NOT NULL,      -- encrypted
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Shared Freee app connection (single row)
CREATE TABLE freee_connection (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton row
  access_token TEXT NOT NULL,       -- encrypted
  refresh_token TEXT NOT NULL,      -- encrypted
  expires_at TIMESTAMPTZ NOT NULL,
  company_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL DEFAULT '',
  freee_member_id INTEGER,          -- Freee member ID within the company (for applicant_id)
  payment_type TEXT NOT NULL DEFAULT 'employee_pay' CHECK (payment_type IN ('employee_pay', 'company_pay')),
  folder_pattern TEXT NOT NULL DEFAULT 'YYYY-MM Expenses'
);

-- Expense runs
CREATE TABLE expense_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,              -- YYYY-MM format
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_receipts INTEGER NOT NULL DEFAULT 0,
  submitted_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_expense_runs_user_id ON expense_runs(user_id);
CREATE INDEX idx_expense_runs_status ON expense_runs(status);

-- Individual expense items within a run
CREATE TABLE expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES expense_runs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_id TEXT NOT NULL,            -- Google Drive file ID
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'extracted', 'submitted', 'failed')),
  extracted_data JSONB,
  freee_receipt_id BIGINT,
  freee_expense_id BIGINT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_items_run_id ON expense_items(run_id);
