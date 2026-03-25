import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/lib/google/oauth";
import { encrypt } from "@/lib/encryption";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(
      new URL("/connect?error=missing_params", request.url)
    );
  }

  try {
    const tokens = await exchangeGoogleCode(code);

    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    await supabase.from("user_connections").upsert(
      {
        user_id: userId,
        provider: "google",
        access_token: encrypt(tokens.access_token),
        refresh_token: encrypt(tokens.refresh_token),
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    return NextResponse.redirect(
      new URL("/connect?google=connected", request.url)
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/connect?error=google_auth_failed", request.url)
    );
  }
}
