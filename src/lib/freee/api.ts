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
  applicantName: string,
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

  const res = await fetch(`${FREEE_API_BASE}/expense_applications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      company_id: parseInt(companyId),
      title,
      issue_date: new Date().toISOString().split("T")[0],
      applicant_id: null,
      approval_flow_route_id: null,
      expense_application_lines: expenseLines,
    }),
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
