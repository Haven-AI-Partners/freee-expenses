import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getLastMonth } from "@/lib/utils";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if today is the 1st of the month (for Vercel hobby plan daily cron)
  const today = new Date();
  if (today.getDate() !== 1) {
    return NextResponse.json({ message: "Not the 1st of the month, skipping" });
  }

  const month = getLastMonth();

  // Find all users with Google Drive connected
  // (Freee is a shared app connection, no per-user check needed)
  const { data: googleUsers } = await supabase
    .from("user_connections")
    .select("user_id")
    .eq("provider", "google");

  if (!googleUsers || googleUsers.length === 0) {
    return NextResponse.json({ message: "No users with Google Drive connected" });
  }

  let triggeredCount = 0;

  for (const { user_id: userId } of googleUsers) {
    // Check for existing run
    const { data: existing } = await supabase
      .from("expense_runs")
      .select("id")
      .eq("user_id", userId)
      .eq("month", month)
      .single();

    if (existing) continue;

    // Create run
    const { data: run } = await supabase
      .from("expense_runs")
      .insert({
        user_id: userId,
        month,
        status: "pending",
      })
      .select()
      .single();

    if (run) {
      // Trigger processing
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/runs/${run.id}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.CRON_SECRET || "",
        },
      }).catch((err) =>
        console.error(`Failed to trigger run for user ${userId}:`, err)
      );
      triggeredCount++;
    }
  }

  return NextResponse.json({
    message: `Triggered ${triggeredCount} runs for ${month}`,
  });
}
