const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const email = `test.scholarme.${Date.now()}@gmail.com`;
  const password = "Password123!";
  
  // 1. Create user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (authError) {
    console.error("Create user error:", authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log("Created user:", userId);
  
  try {
    // 2. Sign in
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) throw signInError;
    
    // 3. Query profiles as authenticated user
    const { data, error } = await supabaseAnon
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
      
    console.log("Query Error:", error);
    console.log("Query Data count:", data?.length);
    if (data?.length > 0) {
      console.log("Sample:", data[0]);
    }
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    // 4. Cleanup
    await supabaseAdmin.auth.admin.deleteUser(userId);
    console.log("Deleted user:", userId);
  }
}

test();
