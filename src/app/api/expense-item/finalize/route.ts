import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getValidFreeeToken, getFreeeCompanyId } from "@/lib/freee/oauth";
import { finalizeExpenseApplication } from "@/lib/freee/api";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileIds } = (await request.json()) as { fileIds?: string[] };

  try {
    const freeeToken = await getValidFreeeToken();
    const companyId = await getFreeeCompanyId();

    // Get OCR results with Freee expense IDs
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
      return NextResponse.json({ finalized: 0 });
    }

    // Deduplicate by expense ID (grouped expenses share the same ID)
    const uniqueExpenseIds = [...new Set(results.map((r) => r.freee_expense_id!))];

    let finalized = 0;
    const errors: string[] = [];

    for (const expenseId of uniqueExpenseIds) {
      try {
        await finalizeExpenseApplication(
          freeeToken,
          companyId,
          expenseId
        );
        finalized++;
      } catch (err) {
        errors.push(
          `Expense ${expenseId}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({ finalized, errors });
  } catch (error) {
    console.error("Finalize failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Finalize failed" },
      { status: 500 }
    );
  }
}
