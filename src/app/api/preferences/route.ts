import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseClient();

  const body = await request.json();
  const { applicant_name, freee_member_id, payment_type, folder_pattern } = body;

  // Ensure user exists before upserting preferences (FK constraint)
  await supabase.from("users").upsert(
    { id: userId, email: "" },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // RLS ensures user can only write their own preferences
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      applicant_name: applicant_name || "",
      freee_member_id: freee_member_id || null,
      payment_type: payment_type || "employee_pay",
      folder_pattern: folder_pattern || "YYYY-MM Expenses",
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Preferences save error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
