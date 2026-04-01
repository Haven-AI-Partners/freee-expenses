import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getValidGoogleToken } from "@/lib/google/oauth";
import { downloadFile } from "@/lib/google/drive";
import { extractReceiptData } from "@/lib/claude/extract-receipt";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId, fileName, mimeType } = await request.json();
  if (!fileId) {
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    // Check for existing OCR result
    const { data: existing } = await supabaseAdmin
      .from("ocr_results")
      .select("extracted_data")
      .eq("user_id", userId)
      .eq("file_id", fileId)
      .single();

    if (existing?.extracted_data) {
      return NextResponse.json({ data: existing.extracted_data });
    }

    const googleToken = await getValidGoogleToken(userId);
    const imageBuffer = await downloadFile(googleToken, fileId);
    const extractedData = await extractReceiptData(
      imageBuffer,
      mimeType || "image/jpeg"
    );

    // Persist OCR result
    await supabaseAdmin.from("ocr_results").upsert(
      {
        user_id: userId,
        file_id: fileId,
        file_name: fileName || fileId,
        extracted_data: extractedData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,file_id" }
    );

    return NextResponse.json({ data: extractedData });
  } catch (error) {
    console.error("OCR extraction failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OCR failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId, all } = await request.json();

  if (!fileId && !all) {
    return NextResponse.json({ error: "fileId or all is required" }, { status: 400 });
  }

  try {
    if (all) {
      await supabaseAdmin
        .from("ocr_results")
        .delete()
        .eq("user_id", userId);
    } else {
      await supabaseAdmin
        .from("ocr_results")
        .delete()
        .eq("user_id", userId)
        .eq("file_id", fileId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete OCR result:", error);
    return NextResponse.json(
      { error: "Failed to delete OCR result" },
      { status: 500 }
    );
  }
}
