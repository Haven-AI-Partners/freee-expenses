import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getValidFreeeToken, getFreeeCompanyId } from "@/lib/freee/oauth";
import { getCurrentFreeeMember } from "@/lib/freee/api";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getValidFreeeToken();
    const companyId = await getFreeeCompanyId();
    const member = await getCurrentFreeeMember(token, companyId);
    return NextResponse.json({ member });
  } catch (error) {
    console.error("Failed to fetch Freee members:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch members" },
      { status: 500 }
    );
  }
}
