import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase";
import { getValidGoogleToken } from "@/lib/google/oauth";
import { getValidFreeeToken, getFreeeCompanyId } from "@/lib/freee/oauth";
import { downloadFile } from "@/lib/google/drive";
import { uploadReceipt, createExpenseApplication } from "@/lib/freee/api";
import { ExtractedReceiptData } from "@/types";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId, fileName, extractedData } = (await request.json()) as {
    fileId: string;
    fileName: string;
    extractedData: ExtractedReceiptData;
  };

  if (!fileId || !extractedData) {
    return NextResponse.json(
      { error: "fileId and extractedData are required" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createSupabaseClient();
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("freee_member_id, payment_type")
      .eq("user_id", userId)
      .single();

    const freeeToken = await getValidFreeeToken();
    const companyId = await getFreeeCompanyId();
    const googleToken = await getValidGoogleToken(userId);

    const imageBuffer = await downloadFile(googleToken, fileId);

    const receiptId = await uploadReceipt(
      freeeToken,
      companyId,
      imageBuffer,
      fileName
    );

    const expenseId = await createExpenseApplication(
      freeeToken,
      companyId,
      `${extractedData.issue_date} - ${extractedData.partner_name}`,
      prefs?.freee_member_id || null,
      prefs?.payment_type || "employee_pay",
      [{ receiptData: extractedData, receiptId }]
    );

    // Persist Freee IDs back to ocr_results
    await supabaseAdmin
      .from("ocr_results")
      .update({
        freee_receipt_id: receiptId,
        freee_expense_id: expenseId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("file_id", fileId);

    return NextResponse.json({ receiptId, expenseId });
  } catch (error) {
    console.error("Freee submission failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed" },
      { status: 500 }
    );
  }
}
