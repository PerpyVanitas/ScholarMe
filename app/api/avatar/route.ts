import { handleApiError } from "@/lib/utils/api-error";
import { get } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { ensureProfileRow } from "@/features/profiles/api/db";
import {
  deleteStoredAvatar,
  uploadAvatarForUser,
} from "@/features/profiles/api/avatar-upload";

// GET /api/avatar - Serve private avatar image
export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.searchParams.get("pathname");

    if (!pathname) {
      return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
    }

    // If already a public URL (e.g. legacy data), just redirect.
    if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
      return NextResponse.redirect(pathname);
    }

    // Intercept and serve base64 data URIs directly
    if (pathname.startsWith("data:image/")) {
      const matches = pathname.match(
        /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/,
      );
      if (matches && matches[1] && matches[2]) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=3600",
          },
        });
      }
    }

    // 1. Try Vercel Blob first if token is configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const result = await get(pathname, {
          access: "private",
          ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
        });

        if (result) {
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
        }
      } catch (err: unknown) {
        // If it's a BlobNotFoundError or token error, we just fall through to Supabase fallback
        const errName = (err as { name?: string })?.name;
        if (
          errName !== "BlobNotFoundError" &&
          errName !== "BlobStoreNotFoundError"
        ) {
          console.error("Vercel Blob get error:", err);
        }
      }
    }

    // 2. Fallback to Supabase if the pathname implies an avatar
    if (pathname.startsWith("avatars/")) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
      if (!base) {
        return NextResponse.json(
          { error: "Supabase URL is not configured" },
          { status: 500 },
        );
      }
      // Use public URL directly — the 'resources' bucket must have public access for avatars/
      const url = `${base}/storage/v1/object/public/resources/${pathname}`;
      return NextResponse.redirect(url);
    }

    return new NextResponse("Not found", { status: 404 });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/avatar - Upload new avatar
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        {
          error:
            "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
        },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 },
      );
    }

    const ensured = await ensureProfileRow(supabase, user);
    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    await deleteStoredAvatar(profile?.avatar_url);

    let pathname: string;
    try {
      pathname = await uploadAvatarForUser(supabase, user.id, file);
    } catch (uploadErr) {
      const message =
        uploadErr instanceof Error ? uploadErr.message : "Upload failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: pathname })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      await deleteStoredAvatar(pathname);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Profile row could not be updated" },
        { status: 500 },
      );
    }

    return NextResponse.json({ pathname });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/avatar - Remove avatar
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ensured = await ensureProfileRow(supabase, user);
    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    await deleteStoredAvatar(profile?.avatar_url);

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Profile row could not be updated" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
