"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { FacilityEvent, RsvpStatus } from "@/lib/types";

export async function getEvents(
  monthStart: Date,
  monthEnd: Date,
): Promise<FacilityEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facility_events")
    .select(
      `
      *,
      organizer:organizer_id (
        id,
        full_name,
        avatar_url
      ),
      event_rsvps (
        id,
        profile_id,
        status,
        profiles (
          id,
          full_name,
          avatar_url
        )
      )
    `,
    )
    .gte("start_time", monthStart.toISOString())
    .lte("end_time", monthEnd.toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }

  return (data ?? []) as FacilityEvent[];
}

export async function createEvent(data: {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  color_code: string;
  is_mandatory: boolean;
}) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("facility_events").insert({
    title: data.title,
    description: data.description || null,
    start_time: data.start_time,
    end_time: data.end_time,
    color_code: data.color_code,
    is_mandatory: data.is_mandatory,
    organizer_id: user.user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard/calendar");
  return { success: true };
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("facility_events")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard/calendar");
  return { success: true };
}

export async function updateEventRsvp(eventId: string, status: RsvpStatus) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error("Unauthorized");
  }

  // Check if RSVP exists
  const { data: existing } = await supabase
    .from("event_rsvps")
    .select("id")
    .eq("event_id", eventId)
    .eq("profile_id", user.user.id)
    .single();

  let error;
  if (existing) {
    const res = await supabase
      .from("event_rsvps")
      .update({ status })
      .eq("id", existing.id);
    error = res.error;
  } else {
    const res = await supabase.from("event_rsvps").insert({
      event_id: eventId,
      profile_id: user.user.id,
      status,
    });
    error = res.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard/calendar");
  return { success: true };
}
