export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface UserConnection {
  id: string;
  user_id: string;
  provider: "google";
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface FreeeConnection {
  id: number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  applicant_name: string;
  freee_member_id: number | null;
  payment_type: "employee_pay" | "company_pay";
  folder_pattern: string;
  department: string | null;
  approver_id: number | null;
}

export type RunStatus = "pending" | "running" | "extracted" | "submitting" | "completed" | "failed";

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

export type ItemStatus = "pending" | "extracted" | "draft" | "finalized" | "failed";

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
  amount: number;           // Converted to JPY
  tax_amount: number;       // Converted to JPY
  description: string;
  account_item_name: string;
  // FX tracking (only set when original currency != JPY)
  currency?: string;        // Original currency (ISO 4217)
  original_amount?: number; // Amount in original currency
  original_tax_amount?: number;
  fx_rate?: number;         // Rate used for conversion (original → JPY)
  fx_date?: string;         // Date of the FX rate used
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
