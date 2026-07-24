const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, 
      full_name, 
      avatar_url, 
      degree_program, 
      status_message,
      is_private,
      roles (name)
    `);
    
  console.log("Error:", error);
}

test();
