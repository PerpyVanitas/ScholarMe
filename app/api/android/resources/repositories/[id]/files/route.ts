import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { type NextRequest, NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ success: false }, { status: 401 });

    const supabase = createSupabaseForBearer(token);
    const { data: authData } = await supabase.auth.getUser(token);
    if (!authData.user) return NextResponse.json({ success: false }, { status: 401 });

    const { id: repositoryId } = await params;

    const { data: files, error } = await supabase
      .from("resources")
      .select("*, profiles!resources_uploaded_by_fkey(full_name)")
      .eq("repository_id", repositoryId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedFiles = files.map((f: any) => ({
      id: f.id,
      repositoryId: f.repository_id,
      title: f.title,
      description: f.description,
      url: f.url,
      fileType: f.file_type,
      uploadedBy: f.uploaded_by,
      createdAt: f.created_at,
      uploaderName: f.profiles?.full_name || "Unknown"
    }));

    return NextResponse.json({
      success: true,
      data: mappedFiles
    });
  } catch (error) {
    console.error("[Android Resources] Failed to fetch files:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
