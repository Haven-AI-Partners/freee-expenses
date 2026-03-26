-- Add "extracted" and "submitting" to expense_runs status check constraint
-- to support the review/approval flow before sending to Freee
ALTER TABLE expense_runs DROP CONSTRAINT IF EXISTS expense_runs_status_check;
ALTER TABLE expense_runs ADD CONSTRAINT expense_runs_status_check
  CHECK (status IN ('pending', 'running', 'extracted', 'submitting', 'completed', 'failed'));
