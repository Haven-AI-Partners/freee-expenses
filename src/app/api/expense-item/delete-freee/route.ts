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

    let deleted = 0;
    const errors: string[] = [];

    for (const result of results) {
      try {
        // Fetch current status to decide whether to cancel first
        const getRes = await fetch(
          `https://api.freee.co.jp/api/1/expense_applications/${result.freee_expense_id}?company_id=${companyId}`,
          { headers: { Authorization: `Bearer ${freeeToken}` } }
        );

        if (getRes.ok) {
          const { expense_application: app } = await getRes.json();

          // Only cancel if not already draft/canceled
          if (app.status !== "draft") {
            try {
              await cancelExpenseApplication(
                freeeToken,
                companyId,
                result.freee_expense_id!
              );
            } catch {
              // If cancel fails, still try to delete
            }
          }
        }

        await deleteExpenseApplication(
          freeeToken,
          companyId,
          result.freee_expense_id!
        );

        // Clear Freee IDs from ocr_results
        await supabaseAdmin
          .from("ocr_results")
          .update({
            freee_receipt_id: null,
            freee_expense_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("file_id", result.file_id);

        deleted++;
      } catch (err) {
        errors.push(
          `${result.file_id}: ${err instanceof Error ? err.message : "Unknown error"}`
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
