import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getValidGoogleToken } from "@/lib/google/oauth";
import { downloadFile } from "@/lib/google/drive";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fileId = request.nextUrl.searchParams.get("fileId");
  const mimeType = request.nextUrl.searchParams.get("mimeType") || "image/jpeg";

  if (!fileId) {
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    const googleToken = await getValidGoogleToken(userId);
    const buffer = await downloadFile(googleToken, fileId);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Drive preview failed:", error);
    return NextResponse.json(
      { error: "Failed to load file preview" },
      { status: 500 }
    );
  }
}
