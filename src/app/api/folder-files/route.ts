import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase";
import { getValidGoogleToken } from "@/lib/google/oauth";
import { searchFolder, listAllInFolder } from "@/lib/google/drive";
import { resolveFolderName, getLastMonth } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month") || getLastMonth();

  try {
    const supabase = await createSupabaseClient();
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("folder_pattern")
      .eq("user_id", userId)
      .single();

    const folderPattern = prefs?.folder_pattern || "YYYY-MM Expenses";
    const folderName = resolveFolderName(folderPattern, month);

    const googleToken = await getValidGoogleToken(userId);
    const folderId = await searchFolder(googleToken, folderName);

    if (!folderId) {
      return NextResponse.json({ tree: [], folderName, found: false });
    }

    const tree = await listAllInFolder(googleToken, folderId);

    // Fetch existing OCR results for this user
    const { data: ocrResults } = await supabaseAdmin
      .from("ocr_results")
      .select("file_id, extracted_data, overrides, freee_receipt_id, freee_expense_id")
      .eq("user_id", userId);

    // Fetch finalized status from expense_items
    const { data: finalizedItems } = await supabaseAdmin
      .from("expense_items")
      .select("file_id, expense_runs!inner(user_id)")
      .eq("expense_runs.user_id", userId)
      .eq("status", "finalized");

    const finalizedSet = new Set((finalizedItems || []).map((i) => i.file_id));

    const ocrByFileId: Record<string, {
      extracted_data: unknown;
      freee_receipt_id: number | null;
      freee_expense_id: number | null;
      finalized: boolean;
    }> = {};
    for (const r of ocrResults || []) {
      // Merge overrides on top of extracted_data
      const merged = {
        ...(r.extracted_data as Record<string, unknown>),
        ...(r.overrides as Record<string, unknown> || {}),
      };
      ocrByFileId[r.file_id] = {
        extracted_data: merged,
        freee_receipt_id: r.freee_receipt_id,
        freee_expense_id: r.freee_expense_id,
        finalized: finalizedSet.has(r.file_id),
      };
    }

    return NextResponse.json({ tree, folderName, found: true, ocrByFileId });
  } catch (error) {
    console.error("Failed to list folder files:", error);
    return NextResponse.json(
      { error: "Failed to list folder files" },
      { status: 500 }
    );
  }
}
