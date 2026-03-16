import { put, del, get } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/avatar - Serve private avatar image
export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.searchParams.get("pathname");

    if (!pathname) {
      return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
    }

    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });

    if (!result) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Blob hasn't changed — tell the browser to use its cached copy
    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, no-cache",
        },
      });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Error serving avatar:", error);
    return NextResponse.json({ error: "Failed to serve avatar" }, { status: 500 });
  }
}

// POST /api/avatar - Upload new avatar
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Get current profile to delete old avatar if exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    // Delete old blob if it exists and is a pathname (private blob)
    if (profile?.avatar_url?.startsWith("avatars/")) {
      try {
        await del(profile.avatar_url);
      } catch {
        // Ignore deletion errors for old avatars
      }
    }

    // Upload to Vercel Blob (private store)
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatars/${user.id}/avatar-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "private",
    });

    // Update profile with new avatar pathname (not URL for private blobs)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: blob.pathname })
      .eq("id", user.id);

    if (updateError) {
      // Try to clean up the blob if profile update fails
      await del(blob.pathname).catch(() => {});
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Return the pathname for the client to use with the GET route
    return NextResponse.json({ pathname: blob.pathname });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// DELETE /api/avatar - Remove avatar
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.avatar_url?.startsWith("avatars/")) {
      try {
        await del(profile.avatar_url);
      } catch {
        // Ignore deletion errors
      }
    }

    // Clear avatar_url in profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
