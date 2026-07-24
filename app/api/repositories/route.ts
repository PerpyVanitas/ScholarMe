import { z } from "zod";
import { handleApiError } from "@/lib/utils/api-error";
/** GET/POST /api/repositories -- list or create resource repositories. */
import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

/** Fetch all repositories with owner name and resource count */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = (page - 1) * limit;

  const supabase = await createClient();
  const { data: repos, error, count } = await supabase
    .from("repositories")
    .select("*, profiles(full_name), resources(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return handleApiError(error);
  }

  return NextResponse.json({
    data: repos,
    pagination: {
      page,
      limit,
      total: count || 0,
    }
  });
}

const postBodySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  access_role: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsedBody = postBodySchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { title, description, access_role } = parsedBody.data;

  const { data, error } = await supabase
    .from("repositories")
    .insert({
      owner_id: user.id,
      title,
      description: description || null,
      access_role: access_role || "all",
    })
    .select()
    .single();

  if (error) {
    return handleApiError(error);
  }

  return NextResponse.json(data, { status: 201 });
}
