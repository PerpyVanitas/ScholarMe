"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateProfileData {
  first_name: string;
  last_name: string;
  phone_number: string | null;
  birthdate: string | null;
  membership_number?: string | null;
  profile_theme_color?: string | null;
}

export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: `${data.first_name} ${data.last_name}`.trim(),
      phone_number: data.phone_number,
      birthdate: data.birthdate,
      date_of_birth: data.birthdate,
      membership_number: data.membership_number,
      profile_theme_color: data.profile_theme_color,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) {
    console.error("Avatar update error:", error);
    return { success: false, error: error.message };
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

  // Get or create tutor record
  const { data: existingTutor } = await supabase
    .from("tutors")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  let tutorId = existingTutor?.id;

  if (!tutorId) {
    // Create tutor record
    const { data: newTutor, error: createError } = await supabase
      .from("tutors")
      .insert({
        profile_id: user.id,
        bio: data.bio,
        hourly_rate: data.hourly_rate,
        years_experience: data.years_experience,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Tutor creation error:", createError);
      return { success: false, error: createError.message };
    }

    tutorId = newTutor.id;
  } else {
    // Update existing tutor record
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
