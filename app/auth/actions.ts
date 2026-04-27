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
  const firstName = formData.get("first_name") as string
  const lastName = formData.get("last_name") as string
  const fullName = `${firstName.trim()} ${lastName.trim()}`
  const phoneNumber = formData.get("phone_number") as string
  const dateOfBirth = formData.get("date_of_birth") as string
  const selectedRole = (formData.get("role") as string) || "learner"

  // Check if phone number is already registered
  if (phoneNumber) {
    const { data: existingPhone } = await adminClient
      .from("profiles")
      .select("id")
      .eq("phone_number", phoneNumber)
      .maybeSingle()

    if (existingPhone) {
      return { error: "This phone number is already registered. Please use a different number or sign in to your existing account." }
    }
  }

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
      first_name: firstName.trim(),
      last_name: lastName.trim(),
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
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email,
        phone_number: phoneNumber,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : null,
        birthdate: dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : null,
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
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // If user is clocked in, automatically clock them out
    if (user) {
      const { data: openEntry } = await supabase
        .from("timesheets")
        .select("id")
        .eq("user_id", user.id)
        .is("clock_out", null)
        .maybeSingle()
      
      if (openEntry) {
        await supabase
          .from("timesheets")
          .update({ clock_out: new Date().toISOString() })
          .eq("id", openEntry.id)
      }
    }
    
    await supabase.auth.signOut()
  } catch (error) {
    // Log but don't block signout on errors
    console.error("[v0] SignOut error:", error)
  }
  
  // Always redirect to home, even if there was an error
  redirect("/")
}
