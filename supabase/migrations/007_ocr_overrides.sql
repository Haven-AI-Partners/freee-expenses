-- Add overrides column for manual corrections to OCR data
-- The original OCR data stays in extracted_data, manual edits go in overrides.
-- When submitting to Freee, overrides are merged on top of extracted_data.
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS overrides JSONB;
