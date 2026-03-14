// POST /api/account/avatar -- upload profile photo using Vercel Blob (PRIVATE store)
// GET /api/account/avatar -- serve private avatar
// DELETE /api/account/avatar -- remove profile photo
import { put, del, get } from "@vercel/blob";
import { createClient } from "@/lib/supabase/create-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  } catch (err) {
    console.error("[v0] Avatar fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch avatar" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

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

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatars/${user.id}/avatar-${Date.now()}.${ext}`;
    
    // IMPORTANT: Use private access for private blob store
    const blob = await put(filename, file, {
      access: "private",
      addRandomSuffix: false,
    });

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: blob.pathname })
      .eq("id", user.id);

    if (updateError) {
      await del(blob.pathname).catch(() => {});
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ 
      url: `/api/upload/avatar?pathname=${encodeURIComponent(blob.pathname)}`,
      pathname: blob.pathname 
    });
  } catch (err) {
    console.error("[v0] Avatar upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[v0] Avatar delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
