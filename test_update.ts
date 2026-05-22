import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testUpdate() {
  // get a user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()
  if (userError || !users.users.length) {
    console.error("No users found", userError)
    return
  }
  const user = users.users[0]
  console.log("Testing update for user:", user.email)

  const updateData = {
    first_name: "Test",
    last_name: "Update",
    full_name: "Test Update",
    phone_number: null,
    birthdate: null,
    date_of_birth: null,
    membership_number: null,
    degree_program: null,
    year_level: null,
    profile_completed: true,
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()

  console.log("Result:", data)
  console.log("Error:", error)
}

testUpdate()
