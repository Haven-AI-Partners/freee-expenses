import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { exchangeFreeeCodeOOB } from "@/lib/freee/oauth";
import { encrypt } from "@/lib/encryption";
import { supabaseAdmin } from "@/lib/supabase";

const FREEE_API_BASE = "https://api.freee.co.jp/api/1";

/**
 * POST: Exchange a Freee authorization code (OOB flow) for tokens.
 * Saves encrypted credentials + tokens + company_id in one step.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { client_id, client_secret, code } = body;

  if (!client_id || !client_secret || !code) {
    return NextResponse.json(
      { error: "client_id, client_secret, and code are required" },
      { status: 400 }
    );
  }

  try {
    const tokens = await exchangeFreeeCodeOOB(client_id, client_secret, code);

    // Fetch company info
    let companyId = "";
    try {
      const companiesRes = await fetch(`${FREEE_API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        companyId =
          companiesData.companies?.[0]?.id?.toString() ||
          process.env.FREEE_COMPANY_ID ||
          "";
      }
    } catch {
      // Company detection is best-effort; admin can auto-detect later
    }

    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    await supabaseAdmin.from("freee_connection").upsert(
      {
        id: 1,
        client_id: encrypt(client_id),
        client_secret: encrypt(client_secret),
        access_token: encrypt(tokens.access_token),
        refresh_token: encrypt(tokens.refresh_token),
        expires_at: expiresAt,
        company_id: companyId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    return NextResponse.json({
      access_token: tokens.access_token,
      company_id: companyId,
    });
  } catch (error) {
    console.error("Freee code exchange error:", error);
    const message =
      error instanceof Error ? error.message : "Token exchange failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
