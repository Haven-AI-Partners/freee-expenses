import { supabase } from "@/lib/supabase";
import { getValidFreeeToken, getFreeeCompanyId } from "@/lib/freee/oauth";
import { getValidGoogleToken } from "@/lib/google/oauth";
import { searchFolder, listImagesInFolder, downloadFile } from "@/lib/google/drive";
import { uploadReceipt, createExpenseApplication } from "@/lib/freee/api";
import { extractReceiptData } from "@/lib/claude/extract-receipt";
import { resolveFolderName } from "@/lib/utils";

export async function processRun(runId: string): Promise<void> {
  // Load the run
  const { data: run, error: runError } = await supabase
    .from("expense_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    throw new Error(`Run not found: ${runId}`);
  }

  const userId = run.user_id;

  // Update status to running
  await supabase
    .from("expense_runs")
    .update({ status: "running" })
    .eq("id", runId);

  try {
    // Load user preferences
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    const folderPattern = prefs?.folder_pattern || "YYYY-MM Expenses";

    // Get shared Freee token + company ID (same for all users)
    const freeeToken = await getValidFreeeToken();
    const companyId = getFreeeCompanyId();

    // Get per-user Google Drive token
    const googleToken = await getValidGoogleToken(userId);

    // Resolve folder name
    const folderName = resolveFolderName(folderPattern, run.month);

    // Search for folder in Google Drive
    const folderId = await searchFolder(googleToken, folderName);
    if (!folderId) {
      throw new Error(`Folder not found in Google Drive: ${folderName}`);
    }

    // List images in folder
    const files = await listImagesInFolder(googleToken, folderId);

    if (files.length === 0) {
      await supabase
        .from("expense_runs")
        .update({
          status: "completed",
          total_receipts: 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);
      return;
    }

    // Update total count
    await supabase
      .from("expense_runs")
      .update({ total_receipts: files.length })
      .eq("id", runId);

    // Create expense_items entries
    const items = files.map((file) => ({
      run_id: runId,
      file_name: file.name,
      file_id: file.id,
      status: "pending",
    }));

    const { data: insertedItems } = await supabase
      .from("expense_items")
      .insert(items)
      .select("*");

    if (!insertedItems) {
      throw new Error("Failed to create expense items");
    }

    let submittedCount = 0;
    let failedCount = 0;
    let totalAmount = 0;

    // Process each receipt sequentially
    for (const item of insertedItems) {
      try {
        // Download image from Google Drive
        const imageBuffer = await downloadFile(googleToken, item.file_id);

        // Extract receipt data with Claude Vision
        const extractedData = await extractReceiptData(
          imageBuffer,
          "image/jpeg"
        );

        // Update item with extracted data
        await supabase
          .from("expense_items")
          .update({
            status: "extracted",
            extracted_data: extractedData,
          })
          .eq("id", item.id);

        // Upload receipt to Freee (shared connection)
        const receiptId = await uploadReceipt(
          freeeToken,
          companyId,
          imageBuffer,
          item.file_name
        );

        // Create expense application in Freee (shared connection)
        const expenseId = await createExpenseApplication(
          freeeToken,
          companyId,
          `${run.month} - ${extractedData.partner_name}`,
          prefs?.freee_member_id || null,
          prefs?.payment_type || "employee_pay",
          [{ receiptData: extractedData, receiptId }]
        );

        // Update item as submitted
        await supabase
          .from("expense_items")
          .update({
            status: "submitted",
            freee_receipt_id: receiptId,
            freee_expense_id: expenseId,
          })
          .eq("id", item.id);

        submittedCount++;
        totalAmount += extractedData.amount;
      } catch (itemError) {
        console.error(`Failed to process item ${item.id}:`, itemError);

        await supabase
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

    // Update run as completed
    await supabase
      .from("expense_runs")
      .update({
        status: "completed",
        submitted_count: submittedCount,
        failed_count: failedCount,
        total_amount: totalAmount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
  } catch (error) {
    console.error(`Run ${runId} failed:`, error);

    await supabase
      .from("expense_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }
}
