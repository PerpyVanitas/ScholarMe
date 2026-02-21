// Server Actions for authentication: email login, sign-up, and sign-out.
"use server"

import { createClient, createAdminClient } from "@/lib/supabase/create-client"
import { redirect } from "next/navigation"

export async function loginWithEmail(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("full_name") as string
  const selectedRole = (formData.get("role") as string) || "learner"

  // Look up the role_id for the chosen role
  const { data: roleRow } = await supabase
    .from("roles")
    .select("id")
    .eq("name", selectedRole)
    .single()

  // Use admin API to create user (auto-confirms, avoids email rate limits)
  const { error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role_id: roleRow?.id,
      role_name: selectedRole,
    },
  })
  if (createError) return { error: createError.message }

  // Sign the user in immediately
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError) return { error: signInError.message }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
