import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase";
import { submitRun } from "@/lib/processing/run-processor";

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: runId } = await params;
  const supabase = await createSupabaseClient();

  // RLS ensures user can only approve their own runs
  const { data: run } = await supabase
    .from("expense_runs")
    .select("id, status")
    .eq("id", runId)
    .single();

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  if (run.status !== "extracted") {
    return NextResponse.json(
      { error: "Run is not ready for approval" },
      { status: 400 }
    );
  }

  try {
    await submitRun(runId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Approval failed for run ${runId}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed" },
      { status: 500 }
    );
  }
}
