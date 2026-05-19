import { put } from "@vercel/blob";
import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { type NextRequest, NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

/** POST /api/android/resources/upload — Upload raw file for study resources */
export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Missing authorization token" } },
        { status: 401 }
      );
    }

    const supabase = createSupabaseForBearer(token);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const repositoryId = formData.get("repositoryId") as string;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;

    if (!file || !repositoryId || !title) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Missing file, repositoryId, or title" } },
        { status: 400 }
      );
    }

    // Upload file to Vercel Blob
    const ext = file.name.split(".").pop() || "bin";
    const filename = `resources/${repositoryId}/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: "public",
    });

    // Fetch uploader name for the DTO
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", authData.user.id)
      .single();

    // Insert record in resources table
    const { data: resource, error: insertError } = await supabase
      .from("resources")
      .insert({
        repository_id: repositoryId,
        title: title,
        description: description,
        url: blob.url,
        file_type: ext,
        uploaded_by: authData.user.id,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: resource.id,
        repositoryId: resource.repository_id,
        title: resource.title,
        description: resource.description,
        url: resource.url,
        fileType: resource.file_type,
        uploadedBy: resource.uploaded_by,
        createdAt: resource.created_at,
        uploaderName: profile?.full_name || "Unknown"
      }
    });

  } catch (error: any) {
    console.error("[Android Resources] Upload error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "Upload failed" } },
      { status: 500 }
    );
  }
}
