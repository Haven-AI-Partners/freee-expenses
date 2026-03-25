import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { getLastMonth } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const month = body.month || getLastMonth();

  // Ensure user exists in our DB
  await supabase.from("users").upsert(
    { id: userId, email: "" },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // Check for existing run for this month
  const { data: existingRun } = await supabase
    .from("expense_runs")
    .select("id, status")
    .eq("user_id", userId)
    .eq("month", month)
    .in("status", ["pending", "running"])
    .single();

  if (existingRun) {
    return NextResponse.json(
      { error: "A run is already in progress for this month", run: existingRun },
      { status: 409 }
    );
  }

  // Create a new run
  const { data: run, error } = await supabase
    .from("expense_runs")
    .insert({
      user_id: userId,
      month,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Trigger processing asynchronously via internal API call
  const processUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/runs/${run.id}/process`;
  fetch(processUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.CRON_SECRET || "",
    },
  }).catch((err) => console.error("Failed to trigger processing:", err));

  return NextResponse.json({ run });
}
