-- Track whether the Freee expense has been finalized (moved from draft to submitted)
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS finalized BOOLEAN NOT NULL DEFAULT FALSE;
