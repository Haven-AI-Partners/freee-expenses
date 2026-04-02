import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase";
import { getValidGoogleToken } from "@/lib/google/oauth";
import { getValidFreeeToken, getFreeeCompanyId } from "@/lib/freee/oauth";
import { downloadFile } from "@/lib/google/drive";
import { uploadReceipt, createExpenseApplication } from "@/lib/freee/api";
import { ExtractedReceiptData } from "@/types";

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
        }
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
