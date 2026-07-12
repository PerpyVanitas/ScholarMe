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

export async function saveIntegration(name: string, url: string, key: string, isActive: boolean = true) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_configs")
    .upsert({
      integration_name: name,
      webhook_url: url,
      api_key: key,
      is_active: isActive,
    }, { onConflict: "integration_name" });

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
    .select(`
      tutor_id,
      clock_in,
      clock_out,
      profiles!attendance_logs_tutor_id_fkey(full_name)
    `)
    .not("clock_out", "is", null);

  if (error) {
    console.error("Failed to fetch payroll data", error);
    return { success: false, csv: "", error: error.message };
  }

  // Aggregate hours
  const tutorHours: Record<string, { name: string, hours: number }> = {};

  for (const log of logs || []) {
    const tutorId = log.tutor_id;
    const name = Array.isArray(log.profiles) ? log.profiles[0]?.full_name : log.profiles?.full_name;
    const fullName = name || "Unknown Tutor";
    
    const start = new Date(log.clock_in).getTime();
    const end = new Date(log.clock_out).getTime();
    const hours = (end - start) / (1000 * 60 * 60);

    if (!tutorHours[tutorId]) {
      tutorHours[tutorId] = { name: fullName, hours: 0 };
    }
    tutorHours[tutorId].hours += hours;
  }

  // Rate is mocked at $20/hr
  const RATE = 20;
  
  let csv = "Tutor ID,Name,Hours,Amount\n";
  for (const [id, data] of Object.entries(tutorHours)) {
    const amount = (data.hours * RATE).toFixed(2);
    csv += `${id},"${data.name}",${data.hours.toFixed(2)},$${amount}\n`;
  }

  if (Object.keys(tutorHours).length === 0) {
    csv = "Tutor ID,Name,Hours,Amount\nNo data,No data,0,$0.00";
  }

  return { success: true, csv };
}
