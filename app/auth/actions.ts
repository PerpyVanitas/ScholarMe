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
  const phoneNumber = formData.get("phone_number") as string
  const dateOfBirth = formData.get("date_of_birth") as string
  const selectedRole = (formData.get("role") as string) || "learner"

  const { data: roleRow } = await supabase
    .from("roles")
    .select("id")
    .eq("name", selectedRole)
    .single()

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone_number: phoneNumber,
      date_of_birth: dateOfBirth,
      role_id: roleRow?.id,
      role_name: selectedRole,
    },
  })
  if (createError) return { error: createError.message }

  if (created?.user) {
    await adminClient
      .from("profiles")
      .upsert({
        id: created.user.id,
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : null,
        role_id: roleRow?.id || null,
        terms_accepted_at: new Date().toISOString(),
      }, { onConflict: "id" })
  }

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
