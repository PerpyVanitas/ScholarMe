const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  if (users.users.length === 0) {
    console.log("No users found");
    return;
  }
  const user = users.users[0];
  
  // Create a client as the user
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${user.id}`
        }
      }
    }
  );
  
  // Actually, to query as the user, we need a valid JWT. But we can just use supabase-js with an auth override or generate a JWT.
  // Or we can just log the error in the Next.js server actions by inspecting the console!
}

test();
