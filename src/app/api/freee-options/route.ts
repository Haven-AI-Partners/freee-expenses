import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getValidFreeeToken, getFreeeCompanyId } from "@/lib/freee/oauth";
import { getSections, getAvailableApprovers } from "@/lib/freee/api";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const freeeToken = await getValidFreeeToken();
    const companyId = await getFreeeCompanyId();

    const [sections, approvers] = await Promise.all([
      getSections(freeeToken, companyId),
      getAvailableApprovers(freeeToken, companyId),
    ]);

    return NextResponse.json({
      sections,
      members: approvers,
    });
  } catch (error) {
    console.error("Failed to fetch Freee options:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}
