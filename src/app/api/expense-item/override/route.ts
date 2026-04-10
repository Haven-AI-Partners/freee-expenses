import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId, overrides } = (await request.json()) as {
    fileId: string;
    overrides: Record<string, unknown>;
  };

  if (!fileId) {
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    // Fetch existing overrides and merge
    const { data: existing } = await supabaseAdmin
      .from("ocr_results")
      .select("overrides")
      .eq("user_id", userId)
      .eq("file_id", fileId)
      .single();

    const merged = { ...(existing?.overrides || {}), ...overrides };

    await supabaseAdmin
      .from("ocr_results")
      .update({
        overrides: merged,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("file_id", fileId);

    return NextResponse.json({ success: true, overrides: merged });
  } catch (error) {
    console.error("Failed to save override:", error);
    return NextResponse.json(
      { error: "Failed to save override" },
      { status: 500 }
    );
  }
}
