import { NextRequest, NextResponse } from "next/server";
import { exchangeFreeeCode } from "@/lib/freee/oauth";
import { encrypt } from "@/lib/encryption";
import { supabaseAdmin } from "@/lib/supabase";

const FREEE_API_BASE = "https://api.freee.co.jp/api/1";

/**
 * @deprecated This redirect-based callback is superseded by the OOB code-paste
 * flow in /api/admin/freee-exchange. Kept for backward compatibility.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin?error=missing_params", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeFreeeCode(code);

    // Fetch company info
    const companiesRes = await fetch(`${FREEE_API_BASE}/companies`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!companiesRes.ok) {
      throw new Error("Failed to fetch Freee companies");
    }

    const companiesData = await companiesRes.json();
    const companyId = companiesData.companies?.[0]?.id?.toString() || process.env.FREEE_COMPANY_ID || "";

    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    // Upsert singleton connection row
    await supabaseAdmin.from("freee_connection").upsert(
      {
        id: 1,
        access_token: encrypt(tokens.access_token),
        refresh_token: encrypt(tokens.refresh_token),
        expires_at: expiresAt,
        company_id: companyId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    return NextResponse.redirect(
      new URL("/admin?freee=connected", request.url)
    );
  } catch (error) {
    console.error("Freee OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/admin?error=freee_auth_failed", request.url)
    );
  }
}
