"use server";

import { createClient } from "@/lib/supabase/server";

export async function getIntegrations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_configs")
    .select("*");

  if (error) {
    console.error("Failed to fetch integrations", error);
    return [];
  }
  return data;
}

export async function saveIntegration(
  name: string,
  url: string,
  key: string,
  isActive: boolean = true,
) {
  const supabase = await createClient();

  // Check if it exists first since integration_name might not have a unique constraint
  const { data: existing } = await supabase
    .from("integration_configs")
    .select("id")
    .eq("integration_name", name)
    .single();

  let error;

  if (existing) {
    const { error: updateError } = await supabase
      .from("integration_configs")
      .update({
        webhook_url: url,
        api_key: key,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("integration_configs")
      .insert({
        integration_name: name,
        webhook_url: url,
        api_key: key,
        is_active: isActive,
      });
    error = insertError;
  }

  if (error) {
    console.error("Failed to save integration", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function deleteIntegration(name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_configs")
    .delete()
    .eq("integration_name", name);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getPayrollCsv() {
  const supabase = await createClient();
  // Fetch from timesheets and summarize (since there's no actual payroll table, we summarize attendance logs)
  const { data: logs, error } = await supabase
    .from("attendance_logs")
    .select(
      `
      tutor_id,
      clock_in,
      clock_out,
      profiles!attendance_logs_tutor_id_fkey(
        full_name,
        tutor_profiles(hourly_rate)
      )
    `,
    )
    .not("clock_out", "is", null);

  if (error) {
    console.error("Failed to fetch payroll data", error);
    return { success: false, csv: "", error: error.message };
  }

  // Aggregate hours
  const tutorData: Record<
    string,
    { name: string; hours: number; rate: number }
  > = {};

  for (const log of logs || []) {
    const tutorId = log.tutor_id;
    const profile = Array.isArray(log.profiles)
      ? log.profiles[0]
      : log.profiles;
    const fullName = profile?.full_name || "Unknown Tutor";

    // Extract hourly_rate, default to 20 if not set or not found
    let rate = 20;
    if (profile?.tutor_profiles) {
      const tp = Array.isArray(profile.tutor_profiles)
        ? profile.tutor_profiles[0]
        : profile.tutor_profiles;
      if (tp && typeof tp.hourly_rate === "number") {
        rate = tp.hourly_rate;
      }
    }

    const start = new Date(log.clock_in).getTime();
    const end = new Date(log.clock_out).getTime();
    const hours = (end - start) / (1000 * 60 * 60);

    if (!tutorData[tutorId]) {
      tutorData[tutorId] = { name: fullName, hours: 0, rate };
    }
    tutorData[tutorId].hours += hours;
  }

  let csv = "Tutor ID,Name,Hours,Rate,Amount\n";
  for (const [id, data] of Object.entries(tutorData)) {
    const amount = (data.hours * data.rate).toFixed(2);
    csv += `${id},"${data.name}",${data.hours.toFixed(2)},$${data.rate.toFixed(2)},$${amount}\n`;
  }

  if (Object.keys(tutorData).length === 0) {
    csv = "Tutor ID,Name,Hours,Rate,Amount\nNo data,No data,0,$0.00,$0.00";
  }

  return { success: true, csv };
}
