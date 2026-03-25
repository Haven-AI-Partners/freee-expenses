export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface UserConnection {
  id: string;
  user_id: string;
  provider: "freee" | "google";
  access_token: string;
  refresh_token: string;
  expires_at: string;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  applicant_name: string;
  payment_type: "employee_pay" | "company_pay";
  folder_pattern: string;
}

export type RunStatus = "pending" | "running" | "completed" | "failed";

export interface ExpenseRun {
  id: string;
  user_id: string;
  month: string;
  status: RunStatus;
  total_receipts: number;
  submitted_count: number;
  failed_count: number;
  total_amount: number;
  created_at: string;
  completed_at: string | null;
}

export type ItemStatus = "pending" | "extracted" | "submitted" | "failed";

export interface ExpenseItem {
  id: string;
  run_id: string;
  file_name: string;
  file_id: string;
  status: ItemStatus;
  extracted_data: ExtractedReceiptData | null;
  freee_receipt_id: number | null;
  freee_expense_id: number | null;
  error_message: string | null;
}

export interface ExtractedReceiptData {
  issue_date: string;
  partner_name: string;
  amount: number;
  tax_amount: number;
  description: string;
  account_item_name: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export interface FreeeTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  created_at: number;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}
