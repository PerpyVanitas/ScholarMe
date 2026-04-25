import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/create-client";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const roles = profile?.roles as any;
  const isAdmin = Array.isArray(roles)
    ? roles.some((r) => r.name === "administrator")
    : roles?.name === "administrator";

  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("timesheets")
    .select("*, tutors(*, profiles(*))")
    .order("clock_in", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
