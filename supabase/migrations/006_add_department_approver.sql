-- Add department and approver settings to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS approver_id INTEGER;
