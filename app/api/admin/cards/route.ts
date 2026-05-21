/** POST/PUT /api/admin/cards -- admin-only: issue or revoke auth cards. */
import { createClient } from "@/lib/supabase/create-client";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const isAdmin = Array.isArray(profile?.roles)
    ? profile.roles.some((role: any) => role.name === "administrator")
    : (profile?.roles as any)?.name === "administrator";
  
  if (!isAdmin) return null;
  return user;
}

function hashPin(pin: string) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

/** Issue a new card to a user */
export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { user_id, card_id } = await request.json();
  const rawPin = crypto.randomUUID(); // Secure random token embedded in the QR Code
  const hashedPin = hashPin(rawPin);

  if (!user_id || !card_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await adminClient
    .from("auth_cards")
    .insert({ user_id, card_id, pin: hashedPin })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // We return the rawPin so the frontend can generate the QR code
  return NextResponse.json({ ...data, pin: rawPin }, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id, status, pin } = await request.json();

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const updateFields: any = {};
  if (status !== undefined) updateFields.status = status;
  if (pin !== undefined) updateFields.pin = hashPin(pin);

  const { data, error } = await adminClient
    .from("auth_cards")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
