import { supabaseAdmin } from "@/lib/supabase";
import { getValidFreeeToken, getFreeeCompanyId } from "@/lib/freee/oauth";
import { getValidGoogleToken } from "@/lib/google/oauth";
import { searchFolder, listImagesInFolder, downloadFile } from "@/lib/google/drive";
import { uploadReceipt, createExpenseApplication } from "@/lib/freee/api";
import { extractReceiptData } from "@/lib/claude/extract-receipt";
import { resolveFolderName } from "@/lib/utils";

/**
 * Phase 1: Scan receipts from Google Drive and extract data with Claude Vision.
 * Stops after extraction so the user can review before submitting to Freee.
 */
export async function processRun(runId: string): Promise<void> {
  const { data: run, error: runError } = await supabaseAdmin
    .from("expense_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    throw new Error(`Run not found: ${runId}`);
  }

  const userId = run.user_id;

  await supabaseAdmin
    .from("expense_runs")
    .update({ status: "running" })
    .eq("id", runId);

  try {
    const { data: prefs } = await supabaseAdmin
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    const folderPattern = prefs?.folder_pattern || "YYYY-MM Expenses";
    const googleToken = await getValidGoogleToken(userId);
    const folderName = resolveFolderName(folderPattern, run.month);

    const folderId = await searchFolder(googleToken, folderName);
    if (!folderId) {
      throw new Error(`Folder not found in Google Drive: ${folderName}`);
    }

    const files = await listImagesInFolder(googleToken, folderId);

    if (files.length === 0) {
      await supabaseAdmin
        .from("expense_runs")
        .update({
          status: "completed",
          total_receipts: 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);
      return;
    }

    await supabaseAdmin
      .from("expense_runs")
      .update({ total_receipts: files.length })
      .eq("id", runId);

    const items = files.map((file) => ({
      run_id: runId,
      file_name: file.name,
      file_id: file.id,
      status: "pending",
    }));

    const { data: insertedItems } = await supabaseAdmin
      .from("expense_items")
      .insert(items)
      .select("*");

    if (!insertedItems) {
      throw new Error("Failed to create expense items");
    }

    let failedCount = 0;
    let totalAmount = 0;

    // Extract data from each receipt (but do NOT submit to Freee yet)
    for (const item of insertedItems) {
      try {
        const imageBuffer = await downloadFile(googleToken, item.file_id);

        const extractedData = await extractReceiptData(
          imageBuffer,
          "image/jpeg"
        );

        await supabaseAdmin
          .from("expense_items")
          .update({
            status: "extracted",
            extracted_data: extractedData,
          })
          .eq("id", item.id);

        totalAmount += extractedData.amount;
      } catch (itemError) {
        console.error(`Failed to extract item ${item.id}:`, itemError);

        await supabaseAdmin
          .from("expense_items")
          .update({
            status: "failed",
            error_message:
              itemError instanceof Error
                ? itemError.message
                : "Unknown error",
          })
          .eq("id", item.id);

        failedCount++;
      }
    }

    // Set status to "extracted" — waiting for user review & approval
    await supabaseAdmin
      .from("expense_runs")
      .update({
        status: "extracted",
        failed_count: failedCount,
        total_amount: totalAmount,
      })
      .eq("id", runId);
  } catch (error) {
    console.error(`Run ${runId} failed:`, error);

    await supabaseAdmin
      .from("expense_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }
}

/**
 * Phase 2: Submit approved extracted items to Freee.
 * Called after the user reviews and approves the extracted data.
 */
export async function submitRun(runId: string): Promise<void> {
  const { data: run, error: runError } = await supabaseAdmin
    .from("expense_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    throw new Error(`Run not found: ${runId}`);
  }

  if (run.status !== "extracted") {
    throw new Error(`Run is not ready for submission (status: ${run.status})`);
  }

  const userId = run.user_id;

  await supabaseAdmin
    .from("expense_runs")
    .update({ status: "submitting" })
    .eq("id", runId);

  try {
    const { data: prefs } = await supabaseAdmin
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    const freeeToken = await getValidFreeeToken();
    const companyId = await getFreeeCompanyId();
    const googleToken = await getValidGoogleToken(userId);

    // Get all extracted items (skip failed ones)
    const { data: items } = await supabaseAdmin
      .from("expense_items")
      .select("*")
      .eq("run_id", runId)
      .eq("status", "extracted");

    if (!items || items.length === 0) {
      await supabaseAdmin
        .from("expense_runs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);
      return;
    }

    let submittedCount = 0;
    let failedCount = run.failed_count || 0;

    for (const item of items) {
      try {
        const extractedData = item.extracted_data;
        if (!extractedData) {
          throw new Error("No extracted data");
        }

        // Re-download image for Freee upload
        const imageBuffer = await downloadFile(googleToken, item.file_id);

        const receiptId = await uploadReceipt(
          freeeToken,
          companyId,
          imageBuffer,
          item.file_name
        );

        const expenseId = await createExpenseApplication(
          freeeToken,
          companyId,
          `${run.month} - ${extractedData.partner_name}`,
          prefs?.freee_member_id || null,
          prefs?.payment_type || "employee_pay",
          [{ receiptData: extractedData, receiptId }]
        );

        await supabaseAdmin
          .from("expense_items")
          .update({
            status: "submitted",
            freee_receipt_id: receiptId,
            freee_expense_id: expenseId,
          })
          .eq("id", item.id);

        submittedCount++;
      } catch (itemError) {
        console.error(`Failed to submit item ${item.id}:`, itemError);

        await supabaseAdmin
          .from("expense_items")
          .update({
            status: "failed",
            error_message:
              itemError instanceof Error
                ? itemError.message
                : "Unknown error",
          })
          .eq("id", item.id);

        failedCount++;
      }
    }

    await supabaseAdmin
      .from("expense_runs")
      .update({
        status: "completed",
        submitted_count: submittedCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
  } catch (error) {
    console.error(`Run ${runId} submission failed:`, error);

    await supabaseAdmin
      .from("expense_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }
}
