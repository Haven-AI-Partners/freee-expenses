-- Add "finalized" to expense_items status enum
ALTER TABLE expense_items DROP CONSTRAINT IF EXISTS expense_items_status_check;
ALTER TABLE expense_items ADD CONSTRAINT expense_items_status_check
  CHECK (status IN ('pending', 'extracted', 'submitted', 'finalized', 'failed'));

-- Migrate existing finalized state from ocr_results to expense_items
UPDATE expense_items ei
SET status = 'finalized'
FROM ocr_results ocr
WHERE ei.freee_expense_id = ocr.freee_expense_id
  AND ocr.finalized = TRUE
  AND ei.status = 'submitted';

-- Drop the finalized column from ocr_results (no longer needed)
ALTER TABLE ocr_results DROP COLUMN IF EXISTS finalized;
