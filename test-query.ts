import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  const { data, error } = await supabase
    .from("friends")
    .select(`
      id,
      user_id1,
      user_id2,
      profiles!friends_user_id1_fkey (id, full_name, avatar_url)
    `);
    
  console.log("Data:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}

test();
