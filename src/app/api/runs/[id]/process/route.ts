import { NextRequest, NextResponse } from "next/server";
import { processRun } from "@/lib/processing/run-processor";

export const maxDuration = 60; // Vercel function timeout

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify internal secret (this endpoint is called internally)
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runId = params.id;

  try {
    await processRun(runId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Processing failed for run ${runId}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}
