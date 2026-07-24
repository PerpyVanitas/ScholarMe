import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase config");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  const { data, error } = await supabase.from("profiles").select(`
      id, 
      full_name, 
      avatar_url, 
      degree_program, 
      membership_classification, 
      status_message,
      is_private,
      roles (name)
    `).limit(5);
  console.log("Profiles:", data);
  if (error) console.log("Error:", error);
}

checkProfiles();
