import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getValidFreeeToken, getFreeeCompanyId } from "@/lib/freee/oauth";
import { cancelExpenseApplication, deleteExpenseApplication } from "@/lib/freee/api";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileIds } = (await request.json()) as { fileIds?: string[] };

  try {
    const freeeToken = await getValidFreeeToken();
    const companyId = await getFreeeCompanyId();

    let query = supabaseAdmin
      .from("ocr_results")
      .select("file_id, freee_expense_id")
      .eq("user_id", userId)
      .not("freee_expense_id", "is", null);

    if (fileIds?.length) {
      query = query.in("file_id", fileIds);
    }

    const { data: results } = await query;

    if (!results || results.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    // Deduplicate by expense ID (grouped expenses share the same ID)
    const uniqueExpenseIds = [...new Set(results.map((r) => r.freee_expense_id!))];

    let deleted = 0;
    const errors: string[] = [];

    for (const expenseId of uniqueExpenseIds) {
      try {
        // Fetch current status to decide whether to cancel first
        const getRes = await fetch(
          `https://api.freee.co.jp/api/1/expense_applications/${expenseId}?company_id=${companyId}`,
          { headers: { Authorization: `Bearer ${freeeToken}` } }
        );

        if (getRes.ok) {
          const { expense_application: app } = await getRes.json();

          if (app.status !== "draft") {
            try {
              await cancelExpenseApplication(freeeToken, companyId, expenseId);
            } catch {
              // If cancel fails, still try to delete
            }
          }
        }

        await deleteExpenseApplication(freeeToken, companyId, expenseId);

        // Clear Freee IDs for all files that shared this expense
        await supabaseAdmin
          .from("ocr_results")
          .update({
            freee_receipt_id: null,
            freee_expense_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("freee_expense_id", expenseId);

        // Reset expense_items status
        await supabaseAdmin
          .from("expense_items")
          .update({
            status: "extracted",
            freee_receipt_id: null,
            freee_expense_id: null,
          })
          .eq("freee_expense_id", expenseId);

        deleted++;
      } catch (err) {
        errors.push(
          `Expense ${expenseId}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({ deleted, errors });
  } catch (error) {
    console.error("Delete from Freee failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
