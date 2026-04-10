-- Rename "submitted" status to "draft" to avoid ambiguity.
-- "submitted" in our code historically meant "sent to Freee as draft",
-- which is confusing since Freee also has "submitted" (finalized) as a status.
ALTER TABLE expense_items DROP CONSTRAINT IF EXISTS expense_items_status_check;

UPDATE expense_items SET status = 'draft' WHERE status = 'submitted';

ALTER TABLE expense_items ADD CONSTRAINT expense_items_status_check
  CHECK (status IN ('pending', 'extracted', 'draft', 'finalized', 'failed'));
