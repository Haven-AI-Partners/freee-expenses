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
  options: {
    applicantId?: number | null;
    sectionId?: number | null;
    approverId?: number | null;
    approvalFlowRouteId?: number | null;
  },
  items: {
    receiptData: ExtractedReceiptData;
    receiptId: number;
  }[]
): Promise<number> {
  const purchaseLines = items.map((item) => ({
    receipt_id: item.receiptId,
    transaction_date: item.receiptData.issue_date,
    expense_application_lines: [
      {
        description: `${item.receiptData.partner_name} - ${item.receiptData.description}`,
        amount: item.receiptData.amount,
      },
    ],
  }));

  const expenseApplication: Record<string, unknown> = {
    company_id: parseInt(companyId),
    title,
    issue_date: new Date().toISOString().split("T")[0],
    purchase_lines: purchaseLines,
    draft: true,
  };

  if (options.applicantId) {
    expenseApplication.applicant_id = options.applicantId;
  }
  if (options.sectionId) {
    expenseApplication.section_id = options.sectionId;
  }
  if (options.approverId) {
    expenseApplication.approver_id = options.approverId;
  }
  if (options.approvalFlowRouteId) {
    expenseApplication.approval_flow_route_id = options.approvalFlowRouteId;
  }

  const res = await fetch(`${FREEE_API_BASE}/expense_applications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expenseApplication),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Freee expense application creation failed: ${error}`);
  }

  const data = await res.json();
  return data.expense_application.id;
}

/**
 * Update an expense application to remove draft status (finalize it).
 */
/**
 * Update an expense application to remove draft status (finalize it).
 * First fetches the current application to get required fields like title.
 */
export async function finalizeExpenseApplication(
  accessToken: string,
  companyId: string,
  expenseApplicationId: number
): Promise<void> {
  // Fetch the current application to get the title
  const getRes = await fetch(
    `${FREEE_API_BASE}/expense_applications/${expenseApplicationId}?company_id=${parseInt(companyId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!getRes.ok) {
    const error = await getRes.text();
    throw new Error(`Freee fetch expense failed: ${error}`);
  }

  const { expense_application: app } = await getRes.json();

  // Echo back purchase_lines from the existing application
  const purchaseLines = (app.purchase_lines || []).map(
    (pl: { id: number; transaction_date: string; receipt_id: number; expense_application_lines: { id: number; description: string; amount: number }[] }) => ({
      id: pl.id,
      transaction_date: pl.transaction_date,
      receipt_id: pl.receipt_id,
      expense_application_lines: pl.expense_application_lines.map((line) => ({
        id: line.id,
        description: line.description,
        amount: line.amount,
      })),
    })
  );

  const body: Record<string, unknown> = {
    company_id: parseInt(companyId),
    title: app.title,
    issue_date: app.issue_date,
    section_id: app.section_id,
    purchase_lines: purchaseLines,
    approval_flow_route_id: app.approval_flow_route_id,
    approver_id: app.approver_id || 13907627, // fallback: Kent Monma
    draft: false,
  };

  const res = await fetch(
    `${FREEE_API_BASE}/expense_applications/${expenseApplicationId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Freee finalize failed: ${error}`);
  }
}

/**
 * Cancel (取り消す) a submitted expense application in Freee.
 * Fetches the current step/round from the application first.
 */
export async function cancelExpenseApplication(
  accessToken: string,
  companyId: string,
  expenseApplicationId: number
): Promise<void> {
  // Fetch current application to get step and round
  const getRes = await fetch(
    `${FREEE_API_BASE}/expense_applications/${expenseApplicationId}?company_id=${parseInt(companyId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!getRes.ok) {
    const error = await getRes.text();
    throw new Error(`Freee fetch expense failed: ${error}`);
  }

  const { expense_application: app } = await getRes.json();

  const res = await fetch(
    `${FREEE_API_BASE}/expense_applications/${expenseApplicationId}/actions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company_id: parseInt(companyId),
        approval_action: "cancel",
        target_step_id: app.current_step_id,
        target_round: app.current_round,
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Freee cancel failed: ${error}`);
  }
}

/**
 * Delete a draft/canceled expense application from Freee.
 */
export async function deleteExpenseApplication(
  accessToken: string,
  companyId: string,
  expenseApplicationId: number
): Promise<void> {
  const res = await fetch(
    `${FREEE_API_BASE}/expense_applications/${expenseApplicationId}?company_id=${parseInt(companyId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Freee delete failed: ${error}`);
  }
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

export async function getCurrentFreeeMember(
  accessToken: string,
  companyId: string
): Promise<{ id: number; display_name: string; email: string } | null> {
  const res = await fetch(
    `${FREEE_API_BASE}/users/me?companies=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("Freee users/me API error:", res.status, error);
    throw new Error(`Failed to fetch Freee user: ${res.status} ${error}`);
  }

  const data = await res.json();
  const user = data.user;
  if (!user) return null;

  // Find the member ID for this company
  const company = user.companies?.find(
    (c: { id: number }) => c.id.toString() === companyId
  );

  return {
    id: company?.employee_id || user.id,
    display_name: `${user.last_name || ""} ${user.first_name || ""}`.trim() || user.email || "",
    email: user.email || "",
  };
}

export async function getSections(
  accessToken: string,
  companyId: string
): Promise<{ id: number; name: string }[]> {
  const res = await fetch(
    `${FREEE_API_BASE}/sections?company_id=${parseInt(companyId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch Freee sections: ${error}`);
  }

  const data = await res.json();
  return data.sections || [];
}

export async function getAvailableApprovers(
  accessToken: string,
  companyId: string
): Promise<{ id: number; display_name: string }[]> {
  // Try to get approvers from approval flow routes
  try {
    const res = await fetch(
      `${FREEE_API_BASE}/approval_flow_routes?form_type=expense_application&company_id=${parseInt(companyId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (res.ok) {
      const data = await res.json();
      const specifyRoute = (data.approval_flow_routes || []).find(
        (r: { name: string }) => r.name === "承認者を指定"
      );

      if (specifyRoute) {
        const detailRes = await fetch(
          `${FREEE_API_BASE}/approval_flow_routes/${specifyRoute.id}?company_id=${parseInt(companyId)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (detailRes.ok) {
          const detail = await detailRes.json();
          const approverMap = new Map<number, string>();
          const route = detail.approval_flow_route;
          for (const step of route?.steps || []) {
            for (const approver of step.approvers || []) {
              const id = approver.user_id || approver.id;
              if (id && !approverMap.has(id)) {
                approverMap.set(id, approver.name || approver.display_name || `User ${id}`);
              }
            }
          }

          if (approverMap.size > 0) {
            return Array.from(approverMap, ([id, display_name]) => ({ id, display_name }));
          }
        }
      }
    }
  } catch {
    // Fall through to empty
  }

  return [];
}
