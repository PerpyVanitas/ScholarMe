import { handleApiError } from "@/lib/utils/api-error";
import { createAdminClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";
import { GOVERNANCE_ROLES, hasAnyRole } from "@/lib/utils/roles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const supabase = await createAdminClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(name)")
    .eq("id", user.id)
    .single();

  const roleName = Array.isArray(profile?.roles)
    ? profile.roles[0]?.name
    : (profile?.roles as { name: string } | undefined)?.name;
  const isAuthorized = hasAnyRole(roleName as string, GOVERNANCE_ROLES);

  if (!profile || !isAuthorized) {
    return NextResponse.json(
      { error: "Access denied - admin only" },
      { status: 403 },
    );
  }

  try {
    if (type === "clocked_in") {
      const { data, error } = await supabase
        .from("timesheets")
        .select(
          `
          id, 
          clock_in, 
          tutors(
            id, 
            rating, 
            profiles(id, full_name, email, avatar_url), 
            tutor_specializations(specializations(name))
          )
        `,
        )
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json(data || []);
    }

    if (type === "tutors") {
      const { data, error } = await supabase
        .from("tutors")
        .select(
          "id, user_id, rating, total_ratings, created_at, profiles(id, full_name, email, avatar_url), tutor_specializations(specializations(name))",
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json(data || []);
    }

    if (type === "today") {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("sessions")
        .select(
          `
          id, 
          scheduled_date, 
          start_time, 
          end_time, 
          status, 
          notes, 
          tutors(profiles(full_name)), 
          learner_profile:profiles!learner_id(full_name), 
          specializations(name)
        `,
        )
        .eq("scheduled_date", today)
        .order("start_time", { ascending: true })
        .limit(50);

      if (error) throw error;
      return NextResponse.json(data || []);
    }

    if (type === "sessions") {
      const { data, error } = await supabase
        .from("sessions")
        .select(
          `
          id, 
          scheduled_date, 
          start_time, 
          end_time, 
          status, 
          notes, 
          tutors(profiles(full_name)), 
          learner_profile:profiles!learner_id(full_name), 
          specializations(name)
        `,
        )
        .order("scheduled_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json(data || []);
    }

    if (type === "pending") {
      const { data, error } = await supabase
        .from("sessions")
        .select(
          `
          id, 
          scheduled_date, 
          start_time, 
          end_time, 
          status, 
          notes, 
          tutors(profiles(full_name)), 
          learner_profile:profiles!learner_id(full_name), 
          specializations(name)
        `,
        )
        .eq("status", "pending")
        .order("scheduled_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json(data || []);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}
