import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read and parse env file
const envText = fs.readFileSync("./.env.local", "utf8");
const envVars = {};
for (const line of envText.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^"|"$/g, "");
      envVars[key] = val;
    }
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log("Querying pg_policies for conversations...");
  // Let's try exec_sql RPC with different parameter names: 'sql' and 'sql_text'
  let result = await adminSupabase.rpc('exec_sql', { sql: "SELECT * FROM pg_policies WHERE schemaname = 'public';" });
  if (result.error) {
    result = await adminSupabase.rpc('exec_sql', { sql_text: "SELECT * FROM pg_policies WHERE schemaname = 'public';" });
  }

  if (result.error) {
    console.error("RPC exec_sql failed:", result.error.message);
    return;
  }

  console.log("Policies in database:");
  const policies = result.data || [];
  const conversationsPolicies = policies.filter(p => p.tablename === 'conversations');
  console.log(conversationsPolicies);

  console.log("\nAll policies matching messages/participants:");
  const chatPolicies = policies.filter(p => ['conversation_participants', 'messages'].includes(p.tablename));
  console.log(chatPolicies);
}

run();
