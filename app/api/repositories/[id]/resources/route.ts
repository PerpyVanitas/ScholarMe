import { z } from "zod";
/** POST /api/repositories/[id]/resources -- add a study-material link to a repository. */
import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/utils/api-error";
import { rateLimit } from "@/lib/rate-limit";

const uploadRateLimiter = rateLimit({ interval: 60 * 1000, limit: 30 });

/** Add a resource to a specific repository */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Next.js 16: params is a Promise and must be awaited
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limitRes = await uploadRateLimiter.check(`upload:${user.id}:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many uploads" },
      { status: 429 },
    );
  }

  // Zod schema for request body validation
  const postResourceSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().nullable(),
    url: z.string().url("Invalid URL format"),
    file_type: z.string().optional().nullable(),
  });

  const body = await request.json();
  const parsedBody = postResourceSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { title, description, url, file_type } = parsedBody.data;

  // The original `if (!title || !url)` check is now handled by the Zod schema.

  const { data, error } = await supabase
    .from("resources")
    .insert({
      repository_id: id,
      title,
      description: description || null,
      url,
      file_type: file_type || null,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return handleApiError(error);
  }

  return NextResponse.json(data, { status: 201 });
}
