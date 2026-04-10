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

async function getOrCreateManualRun(userId: string, month: string): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from("expense_runs")
    .select("id")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("status", "submitting")
    .single();

  if (existing) return existing.id;

  const { data: newRun, error } = await supabaseAdmin
    .from("expense_runs")
    .insert({ user_id: userId, month, status: "submitting" })
    .select("id")
    .single();

  if (error || !newRun) throw new Error("Failed to create expense run");
  return newRun.id;
}

interface FileEntry {
  fileId: string;
  fileName: string;
  extractedData: ExtractedReceiptData;
  sectionId?: string;
  approverId?: string;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { files } = (await request.json()) as { files: FileEntry[] };

  if (!files?.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
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

    // Group files by sectionId (department)
    const groups = new Map<string, FileEntry[]>();
    for (const file of files) {
      const key = file.sectionId || prefs?.department || "none";
      const group = groups.get(key) || [];
      group.push(file);
      groups.set(key, group);
    }

    const results: { expenseId: number; sectionId: string; fileIds: string[] }[] = [];
    const errors: string[] = [];

    for (const [sectionKey, groupFiles] of groups) {
      try {
        // Upload all receipts in this group
        const items: { receiptData: ExtractedReceiptData; receiptId: number; fileId: string; fileName: string }[] = [];

        for (const file of groupFiles) {
          const imageBuffer = await downloadFile(googleToken, file.fileId);
          const receiptId = await uploadReceipt(
            freeeToken,
            companyId,
            imageBuffer,
            file.fileName
          );
          items.push({
            receiptData: file.extractedData,
            receiptId,
            fileId: file.fileId,
            fileName: file.fileName,
          });
        }

        // Build title: XX月立替精算_Name
        const firstDate = groupFiles[0].extractedData.issue_date;
        const issueMonth = firstDate
          ? parseInt(firstDate.split("-")[1], 10)
          : new Date().getMonth() + 1;
        const applicantName = prefs?.applicant_name || "";
        const title = `${issueMonth}月立替精算_${applicantName}`;

        const approverId = groupFiles[0].approverId
          ? parseInt(groupFiles[0].approverId)
          : (prefs?.approver_id || null);

        const sectionId = sectionKey !== "none" ? parseInt(sectionKey) : null;

        // Create one expense application with all receipts as purchase lines
        const expenseId = await createExpenseApplication(
          freeeToken,
          companyId,
          title,
          {
            applicantId: prefs?.freee_member_id || null,
            sectionId,
            approverId,
            approvalFlowRouteId: 1161971,
          },
          items.map((i) => ({ receiptData: i.receiptData, receiptId: i.receiptId }))
        );

        results.push({
          expenseId,
          sectionId: sectionKey,
          fileIds: items.map((i) => i.fileId),
        });

        // Persist Freee IDs for all files in this group
        const month = items[0].receiptData.issue_date?.slice(0, 7) || getLastMonth();
        const runId = await getOrCreateManualRun(userId, month);

        for (const item of items) {
          await supabaseAdmin
            .from("ocr_results")
            .update({
              freee_receipt_id: item.receiptId,
              freee_expense_id: expenseId,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("file_id", item.fileId);

          // Write to expense_items
          const { data: existingItem } = await supabaseAdmin
            .from("expense_items")
            .select("id")
            .eq("run_id", runId)
            .eq("file_id", item.fileId)
            .single();

          if (existingItem) {
            await supabaseAdmin
              .from("expense_items")
              .update({
                status: "draft",
                extracted_data: item.receiptData,
                freee_receipt_id: item.receiptId,
                freee_expense_id: expenseId,
              })
              .eq("id", existingItem.id);
          } else {
            await supabaseAdmin.from("expense_items").insert({
              run_id: runId,
              file_id: item.fileId,
              file_name: item.fileName,
              status: "draft",
              extracted_data: item.receiptData,
              freee_receipt_id: item.receiptId,
              freee_expense_id: expenseId,
            });
          }
        }

        // Update run totals
        const { count } = await supabaseAdmin
          .from("expense_items")
          .select("*", { count: "exact", head: true })
          .eq("run_id", runId)
          .eq("status", "draft");

        const { data: allItems } = await supabaseAdmin
          .from("expense_items")
          .select("extracted_data")
          .eq("run_id", runId)
          .eq("status", "draft");

        const totalAmount = (allItems || []).reduce(
          (sum, i) => sum + ((i.extracted_data as { amount?: number })?.amount || 0),
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
      } catch (err) {
        const fileIds = groupFiles.map((f) => f.fileId).join(", ");
        errors.push(`Section ${sectionKey} (${fileIds}): ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return NextResponse.json({ results, errors });
  } catch (error) {
    console.error("Batch submit failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Batch submit failed" },
      { status: 500 }
    );
  }
}
