import { ExtractedReceiptData } from "@/types";

const FREEE_API_BASE = "https://api.freee.co.jp/api/1";

export async function uploadReceipt(
  accessToken: string,
  companyId: string,
  imageBuffer: Buffer,
  fileName: string
): Promise<number> {
  const formData = new FormData();
  formData.append("company_id", companyId);
  formData.append(
    "receipt",
    new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" }),
    fileName
  );

  const res = await fetch(`${FREEE_API_BASE}/receipts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Freee receipt upload failed: ${error}`);
  }

  const data = await res.json();
  return data.receipt.id;
}

export async function createExpenseApplication(
  accessToken: string,
  companyId: string,
  title: string,
  applicantId: number | null,
  paymentType: "employee_pay" | "company_pay",
  items: {
    receiptData: ExtractedReceiptData;
    receiptId: number;
  }[]
): Promise<number> {
  const expenseLines = items.map((item) => ({
    transaction_date: item.receiptData.issue_date,
    amount: item.receiptData.amount,
    description: `${item.receiptData.partner_name} - ${item.receiptData.description}`,
    receipt_id: item.receiptId,
  }));

  const body: Record<string, unknown> = {
    company_id: parseInt(companyId),
    title,
    issue_date: new Date().toISOString().split("T")[0],
    expense_application_lines: expenseLines,
  };

  // Set the applicant (Freee member) who is submitting this expense
  if (applicantId) {
    body.applicant_id = applicantId;
  }

  const res = await fetch(`${FREEE_API_BASE}/expense_applications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Freee expense application creation failed: ${error}`);
  }

  const data = await res.json();
  return data.expense_application.id;
}

export async function getCompanies(
  accessToken: string
): Promise<{ id: number; name: string }[]> {
  const res = await fetch(`${FREEE_API_BASE}/companies`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Freee companies");
  }

  const data = await res.json();
  return data.companies;
}

export async function getCompanyMembers(
  accessToken: string,
  companyId: string
): Promise<{ id: number; display_name: string; email: string }[]> {
  const res = await fetch(
    `${FREEE_API_BASE}/companies/${companyId}/sections?limit=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  // Use the users endpoint to get members
  const usersRes = await fetch(
    `${FREEE_API_BASE}/users?company_id=${companyId}&limit=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!usersRes.ok) {
    throw new Error("Failed to fetch Freee company members");
  }

  const data = await usersRes.json();
  return (data.users || []).map((u: { id: number; display_name?: string; email?: string }) => ({
    id: u.id,
    display_name: u.display_name || "",
    email: u.email || "",
  }));
}
