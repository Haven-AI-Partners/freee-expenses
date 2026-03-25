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

  // Find all users with both Freee and Google connected
  const { data: freeeUsers } = await supabase
    .from("user_connections")
    .select("user_id")
    .eq("provider", "freee");

  const { data: googleUsers } = await supabase
    .from("user_connections")
    .select("user_id")
    .eq("provider", "google");

  if (!freeeUsers || !googleUsers) {
    return NextResponse.json({ message: "No connected users found" });
  }

  // Users with both connections
  const freeeUserIds = new Set(freeeUsers.map((u) => u.user_id));
  const eligibleUsers = googleUsers
    .filter((u) => freeeUserIds.has(u.user_id))
    .map((u) => u.user_id);

  let triggeredCount = 0;

  for (const userId of eligibleUsers) {
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
