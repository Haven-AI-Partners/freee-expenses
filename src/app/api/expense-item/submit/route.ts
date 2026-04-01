import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase";
import { getValidGoogleToken } from "@/lib/google/oauth";
import { getValidFreeeToken, getFreeeCompanyId } from "@/lib/freee/oauth";
import { downloadFile } from "@/lib/google/drive";
import { uploadReceipt, createExpenseApplication } from "@/lib/freee/api";
import { ExtractedReceiptData } from "@/types";
import { getLastMonth } from "@/lib/utils";

/**
 * Get or create a "manual" expense run for single-file submissions.
 * Reuses one run per user per month.
 */
async function getOrCreateManualRun(userId: string, month: string): Promise<string> {
  // Look for an existing manual run for this month
  const { data: existing } = await supabaseAdmin
    .from("expense_runs")
    .select("id")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("status", "submitting")
    .single();

  if (existing) return existing.id;

  // Create a new one
  const { data: newRun, error } = await supabaseAdmin
    .from("expense_runs")
    .insert({
      user_id: userId,
      month,
      status: "submitting",
    })
    .select("id")
    .single();

  if (error || !newRun) {
    throw new Error("Failed to create expense run");
  }

  return newRun.id;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId, fileName, extractedData, sectionId, approverId } = (await request.json()) as {
    fileId: string;
    fileName: string;
    extractedData: ExtractedReceiptData;
    sectionId?: string;
    approverId?: string;
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
      .select("applicant_name, freee_member_id, payment_type, department, approver_id")
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

    // Build title: XX月立替精算_Name
    const issueMonth = extractedData.issue_date
      ? parseInt(extractedData.issue_date.split("-")[1], 10)
      : new Date().getMonth() + 1;
    const applicantName = prefs?.applicant_name || "";
    const title = `${issueMonth}月立替精算_${applicantName}`;

    const expenseId = await createExpenseApplication(
      freeeToken,
      companyId,
      title,
      {
        applicantId: prefs?.freee_member_id || null,
        sectionId: sectionId ? parseInt(sectionId) : (prefs?.department ? parseInt(prefs.department) : null),
        approverId: approverId ? parseInt(approverId) : (prefs?.approver_id || null),
        approvalFlowRouteId: 1161971,
      },
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

    // Write to expense_items for consistency with batch flow
    const month = extractedData.issue_date?.slice(0, 7) || getLastMonth();
    const runId = await getOrCreateManualRun(userId, month);

    // Check if item already exists for this file in this run
    const { data: existingItem } = await supabaseAdmin
      .from("expense_items")
      .select("id")
      .eq("run_id", runId)
      .eq("file_id", fileId)
      .single();

    if (existingItem) {
      await supabaseAdmin
        .from("expense_items")
        .update({
          status: "submitted",
          extracted_data: extractedData,
          freee_receipt_id: receiptId,
          freee_expense_id: expenseId,
        })
        .eq("id", existingItem.id);
    } else {
      await supabaseAdmin.from("expense_items").insert({
        run_id: runId,
        file_id: fileId,
        file_name: fileName,
        status: "submitted",
        extracted_data: extractedData,
        freee_receipt_id: receiptId,
        freee_expense_id: expenseId,
      });
    }

    // Update run totals
    const { count } = await supabaseAdmin
      .from("expense_items")
      .select("*", { count: "exact", head: true })
      .eq("run_id", runId)
      .eq("status", "submitted");

    const { data: allItems } = await supabaseAdmin
      .from("expense_items")
      .select("extracted_data")
      .eq("run_id", runId)
      .eq("status", "submitted");

    const totalAmount = (allItems || []).reduce(
      (sum, item) => sum + ((item.extracted_data as { amount?: number })?.amount || 0),
      0
    );

    await supabaseAdmin
      .from("expense_runs")
      .update({
        total_receipts: count || 0,
        submitted_count: count || 0,
        total_amount: totalAmount,
      })
      .eq("id", runId);

    return NextResponse.json({ receiptId, expenseId });
  } catch (error) {
    console.error("Freee submission failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed" },
      { status: 500 }
    );
  }
}
