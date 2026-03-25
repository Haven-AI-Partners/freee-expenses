import { encrypt, decrypt } from "@/lib/encryption";
import { supabase } from "@/lib/supabase";

const FREEE_AUTH_URL = "https://accounts.secure.freee.co.jp/public_api/authorize";
const FREEE_TOKEN_URL = "https://accounts.secure.freee.co.jp/public_api/token";

/**
 * Generate the Freee OAuth URL for the admin to authorize the shared app connection.
 * This is a one-time setup — not per-user.
 */
export function getFreeeAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.FREEE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/freee/callback`,
    response_type: "code",
    prompt: "consent",
  });
  return `${FREEE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeFreeeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(FREEE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: process.env.FREEE_CLIENT_ID,
      client_secret: process.env.FREEE_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/freee/callback`,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Freee token exchange failed: ${error}`);
  }

  return res.json();
}

export async function refreshFreeeToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(FREEE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: process.env.FREEE_CLIENT_ID,
      client_secret: process.env.FREEE_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Freee token refresh failed: ${error}`);
  }

  return res.json();
}

/**
 * Get a valid Freee access token from the shared app connection.
 * Auto-refreshes if expiring within 5 minutes.
 */
export async function getValidFreeeToken(): Promise<string> {
  const { data: conn } = await supabase
    .from("freee_connection")
    .select("*")
    .eq("id", 1)
    .single();

  if (!conn) {
    throw new Error("Freee app connection not set up. An admin must connect Freee first.");
  }

  const expiresAt = new Date(conn.expires_at);
  const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (expiresAt > fiveMinFromNow) {
    return decrypt(conn.access_token);
  }

  // Refresh the token
  const decryptedRefresh = decrypt(conn.refresh_token);
  const tokens = await refreshFreeeToken(decryptedRefresh);

  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await supabase
    .from("freee_connection")
    .update({
      access_token: encrypt(tokens.access_token),
      refresh_token: encrypt(tokens.refresh_token),
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  return tokens.access_token;
}

/**
 * Get the shared Freee company ID from env or the DB connection row.
 */
export function getFreeeCompanyId(): string {
  const companyId = process.env.FREEE_COMPANY_ID;
  if (!companyId) {
    throw new Error("Missing FREEE_COMPANY_ID environment variable");
  }
  return companyId;
}
