import { NextRequest, NextResponse } from "next/server";
import { getSecureAttachmentUrl } from "@/features/finance/actions/finance-actions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return new NextResponse("Missing file path", { status: 400 });
  }

  try {
    const signedUrl = await getSecureAttachmentUrl(path);
    if (!signedUrl) {
      return new NextResponse("File not found", { status: 404 });
    }
    return NextResponse.redirect(signedUrl);
  } catch (error: unknown) {
    console.error("Error fetching attachment:", error);
    return new NextResponse("Unauthorized or file not found", { status: 401 });
  }
}
