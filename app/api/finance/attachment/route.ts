import { NextRequest, NextResponse } from "next/server";
import { getSecureAttachmentUrl } from "@/features/finance/actions/finance-actions";
import { z } from "zod";

const GetPathSchema = z.object({
  path: z.string(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paramsObject = Object.fromEntries(searchParams);

  const result = GetPathSchema.safeParse(paramsObject);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { path } = result.data;

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
