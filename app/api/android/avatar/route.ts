import { put, del } from "@vercel/blob";
import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { type NextRequest, NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

/** POST /api/android/avatar — Upload new avatar for mobile */
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

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "No file provided" } },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TYPE", message: "Please upload an image (JPG, PNG, GIF, WebP)" } },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: "FILE_TOO_LARGE", message: "Maximum file size is 5MB" } },
        { status: 400 }
      );
    }

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", authData.user.id)
      .single();

    // Delete old blob if it exists
    if (profile?.avatar_url?.startsWith("avatars/")) {
      try {
        await del(profile.avatar_url);
      } catch (e) {
        console.warn("Failed to delete old avatar:", e);
      }
    }

    // Upload to Vercel Blob (private store)
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatars/${authData.user.id}/avatar-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "private",
    });

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: blob.pathname })
      .eq("id", authData.user.id);

    if (updateError) {
      await del(blob.pathname).catch(() => {});
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: {
        avatarUrl: blob.pathname,
        url: blob.url // Although private, return for reference if needed
      }
    });
  } catch (error) {
    console.error("[Android Avatar] Upload error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Upload failed" } },
      { status: 500 }
    );
  }
}

/** DELETE /api/android/avatar — Remove avatar for mobile */
export async function DELETE(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ success: false }, { status: 401 });

    const supabase = createSupabaseForBearer(token);
    const { data: authData } = await supabase.auth.getUser(token);
    if (!authData.user) return NextResponse.json({ success: false }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", authData.user.id)
      .single();

    if (profile?.avatar_url?.startsWith("avatars/")) {
      await del(profile.avatar_url).catch(() => {});
    }

    await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", authData.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
