import { z } from "zod";
import { handleApiError } from "@/lib/utils/api-error";
/** GET/POST /api/repositories -- list or create resource repositories. */
import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

/** Fetch all repositories with owner name and resource count */
export async function GET() {
  const supabase = await createClient();
  const { data: repos, error } = await supabase
    .from("repositories")
    .select("*, profiles(full_name), resources(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return handleApiError(error);
  }

  return NextResponse.json(repos);
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
