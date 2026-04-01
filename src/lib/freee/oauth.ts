import { encrypt, decrypt } from "@/lib/encryption";
import { supabaseAdmin } from "@/lib/supabase";

const FREEE_AUTH_URL = "https://accounts.secure.freee.co.jp/public_api/authorize";
const FREEE_TOKEN_URL = "https://accounts.secure.freee.co.jp/public_api/token";

/**
 * Get Freee app credentials from the DB (preferred) or env vars (fallback).
 */
async function getFreeeCredentials(): Promise<{ clientId: string; clientSecret: string }> {
  const { data: conn } = await supabaseAdmin
    .from("freee_connection")
    .select("client_id, client_secret")
    .eq("id", 1)
    .single();

  if (conn?.client_id && conn?.client_secret) {
    return {
      clientId: decrypt(conn.client_id),
      clientSecret: decrypt(conn.client_secret),
    };
  }

  // Fall back to env vars
  const clientId = process.env.FREEE_CLIENT_ID;
  const clientSecret = process.env.FREEE_CLIENT_SECRET;
  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }

  throw new Error("Freee app credentials not configured. Set them on the Admin page.");
}

/**
 * Generate the Freee OAuth URL for the admin to authorize the shared app connection.
 * This is a one-time setup — not per-user.
 */
export async function getFreeeAuthUrl(): Promise<string> {
  const { clientId } = await getFreeeCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/freee/callback`,
    response_type: "code",
    prompt: "consent",
    scope: "read write",
  });
  return `${FREEE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeFreeeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = await getFreeeCredentials();
  const res = await fetch(FREEE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
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

/**
 * Exchange an authorization code using the OOB (out-of-band) flow.
 * Used by the manual code-paste wizard on the admin page.
 */
export async function exchangeFreeeCodeOOB(
  clientId: string,
  clientSecret: string,
  code: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(FREEE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
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
  const { clientId, clientSecret } = await getFreeeCredentials();
  const res = await fetch(FREEE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
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
  const { data: conn } = await supabaseAdmin
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

  await supabaseAdmin
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
 * Get the shared Freee company ID from the DB connection row, falling back to env.
 */
export async function getFreeeCompanyId(): Promise<string> {
  const { data: conn } = await supabaseAdmin
    .from("freee_connection")
    .select("company_id")
    .eq("id", 1)
    .single();

  if (conn?.company_id) {
    return conn.company_id;
  }

  const companyId = process.env.FREEE_COMPANY_ID;
  if (!companyId) {
    throw new Error("Missing Freee company ID. Connect Freee on the Admin page.");
  }
  return companyId;
}
