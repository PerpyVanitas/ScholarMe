/**
 * ==========================================================================
 * API: ADD RESOURCE TO REPOSITORY - POST /api/repositories/[id]/resources
 * ==========================================================================
 *
 * PURPOSE: Adds a new resource (study material link) to a specific repository.
 * Called from the Resources page when a tutor/admin adds a resource.
 *
 * Body: { title, description?, url, file_type?: "pdf"|"doc"|"video"|"link"|"other" }
 * Returns: The created resource record
 *
 * The [id] param is the repository's UUID. The resource is linked to this repo
 * via the repository_id foreign key.
 *
 * AUTH: Requires authenticated user. uploaded_by is set to current user's ID.
 * ==========================================================================
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  const { title, description, url, file_type } = await request.json();

  if (!title || !url) {
    return NextResponse.json({ error: "Title and URL are required" }, { status: 400 });
  }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
