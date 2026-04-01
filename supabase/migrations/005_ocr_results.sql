-- Stores OCR results for individual file processing (outside of batch runs)
CREATE TABLE ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL,            -- Google Drive file ID
  file_name TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  freee_receipt_id BIGINT,
  freee_expense_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, file_id)
);

CREATE INDEX idx_ocr_results_user_id ON ocr_results(user_id);

-- RLS
ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OCR results"
  ON ocr_results FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert own OCR results"
  ON ocr_results FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own OCR results"
  ON ocr_results FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true));
