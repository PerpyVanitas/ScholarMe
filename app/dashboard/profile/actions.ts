"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { birthdateFields, ensureProfileRow } from "@/lib/profiles/db";
import { ensureTutorRow } from "@/lib/tutors/db";

export interface UpdateProfileData {
  first_name: string;
  last_name: string;
  phone_number: string | null;
  birthdate: string | null;
  membership_number?: string | null;
  degree_program?: string | null;
  year_level?: number | null;
  esas_scholar?: boolean;
  academic_year_joined?: string | null;
  unique_id_number?: string | null;
}

export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const ensured = await ensureProfileRow(supabase, user);
  if (!ensured.ok) {
    return { success: false, error: ensured.error };
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: `${data.first_name} ${data.last_name}`.trim(),
      phone_number: data.phone_number,
      ...birthdateFields(data.birthdate),
      membership_number: data.membership_number,
      degree_program: data.degree_program,
      year_level: data.year_level,
      esas_scholar: data.esas_scholar,
      academic_year_joined: data.academic_year_joined,
      unique_id_number: data.unique_id_number,
      profile_completed: true,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Profile update error:", error);
    return { success: false, error: error.message, details: error.details, hint: error.hint };
  }

  if (!updated) {
    return { success: false, error: "Profile row could not be updated (RLS or no rows matched)" };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

/** Create profiles row when missing (e.g. after auth without trigger). */
export async function ensureProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const ensured = await ensureProfileRow(supabase, user);
  if (!ensured.ok) {
    return { success: false, error: ensured.error };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

/** Ensure tutors row exists (dashboard, availability, resources). */
export async function ensureTutor() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const result = await ensureTutorRow(supabase, user);
  if (!result.ok) {
    return { success: false, error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/home");
  revalidatePath("/dashboard/availability");
  revalidatePath("/dashboard/resources");
  return { success: true, tutorId: result.tutor.id };
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const ensured = await ensureProfileRow(supabase, user);
  if (!ensured.ok) {
    return { success: false, error: ensured.error };
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Avatar update error:", error);
    return { success: false, error: error.message };
  }

  if (!updated) {
    return { success: false, error: "Profile row could not be updated" };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

export interface UpdateTutorData {
  bio: string | null;
  hourly_rate: number | null;
  years_experience: number | null;
  specialization_ids: string[];
}

export async function updateTutorInfo(data: UpdateTutorData) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const tutorEnsured = await ensureTutorRow(supabase, user);
  if (!tutorEnsured.ok) {
    return { success: false, error: tutorEnsured.error };
  }

  const tutorId = tutorEnsured.tutor.id;

  const { error: updateError } = await supabase
    .from("tutors")
    .update({
      bio: data.bio,
      hourly_rate: data.hourly_rate,
      years_experience: data.years_experience,
    })
    .eq("id", tutorId);

  if (updateError) {
    console.error("Tutor update error:", updateError);
    return { success: false, error: updateError.message };
  }

  // Update specializations
  if (tutorId) {
    // Delete existing specializations
    await supabase
      .from("tutor_specializations")
      .delete()
      .eq("tutor_id", tutorId);

    // Insert new specializations
    if (data.specialization_ids.length > 0) {
      const { error: specError } = await supabase
        .from("tutor_specializations")
        .insert(
          data.specialization_ids.map(spec_id => ({
            tutor_id: tutorId,
            specialization_id: spec_id,
          }))
        );

      if (specError) {
        console.error("Specialization update error:", specError);
        return { success: false, error: specError.message };
      }
    }
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}
