import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST: Save Freee app credentials (client_id, client_secret).
 * Encrypts and upserts into the singleton freee_connection row.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { client_id, client_secret } = body;

  if (!client_id || !client_secret) {
    return NextResponse.json(
      { error: "client_id and client_secret are required" },
      { status: 400 }
    );
  }

  try {
    await supabaseAdmin.from("freee_connection").upsert(
      {
        id: 1,
        client_id: encrypt(client_id),
        client_secret: encrypt(client_secret),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save Freee credentials:", error);
    return NextResponse.json(
      { error: "Failed to save credentials" },
      { status: 500 }
    );
  }
}
