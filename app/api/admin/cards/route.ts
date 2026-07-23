import { handleApiError } from "@/lib/utils/api-error";
/** POST/PUT /api/admin/cards -- admin-only: toggle is_card_issued. */
import { createClient } from "@/lib/supabase/create-client";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const isAdmin = Array.isArray(profile?.roles)
    ? profile.roles.some((role: { name: string }) =>
        ["administrator", "super_admin"].includes(role.name),
      )
    : ["administrator", "super_admin"].includes(
        (profile?.roles as { name: string } | undefined)?.name || "",
      );

  if (!isAdmin) return null;
  return user;
}

/** Update is_card_issued for a user */
export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Define Zod schema for the request body
  const PostSchema = z.object({
    user_id: z.string(), // Assuming user_id is a string (e.g., a UUID)
    is_card_issued: z.boolean(), // Assuming is_card_issued is a boolean
  });

  let body;
  try {
    body = await request.json();
  } catch (err) {
    // If request.json() itself fails, it's likely a malformed JSON body
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedBody = PostSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { user_id, is_card_issued } = parsedBody.data;

  // The original check for missing fields is now handled by Zod's schema
  // if (!user_id || is_card_issued === undefined) {
  //   return NextResponse.json(
  //     { error: "Missing required fields" },
  //     { status: 400 },
  //   );
  // }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await adminClient
    .from("profiles")
    .update({ is_card_issued })
    .eq("id", user_id)
    .select()
    .single();

  if (error) {
    return handleApiError(error);
  }

  return NextResponse.json(data);
}
