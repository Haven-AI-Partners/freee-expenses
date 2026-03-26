import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getValidFreeeToken } from "@/lib/freee/oauth";
import { supabaseAdmin } from "@/lib/supabase";

const FREEE_API_BASE = "https://api.freee.co.jp/api/1";

/**
 * POST: Auto-detect the Freee company ID using the stored access token.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessToken = await getValidFreeeToken();

    const companiesRes = await fetch(`${FREEE_API_BASE}/companies`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!companiesRes.ok) {
      throw new Error("Failed to fetch companies from Freee");
    }

    const companiesData = await companiesRes.json();
    const companyId = companiesData.companies?.[0]?.id?.toString();

    if (!companyId) {
      return NextResponse.json(
        { error: "No companies found for this Freee account" },
        { status: 404 }
      );
    }

    // Update the stored company ID
    await supabaseAdmin
      .from("freee_connection")
      .update({
        company_id: companyId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    return NextResponse.json({ company_id: companyId });
  } catch (error) {
    console.error("Freee company detection error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to detect company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
