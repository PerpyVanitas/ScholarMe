"use server"

import { createClient, createAdminClient } from "@/lib/supabase/create-client"
import { redirect } from "next/navigation"
import { birthdateFields, resolveRoleId } from "@/lib/profiles/db"

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
  const requestedRole = (formData.get("role") as string) || "learner"
  const selectedRole = requestedRole === "tutor" ? "tutor" : "learner"

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

  const roleId = await resolveRoleId(adminClient, selectedRole)

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
      role_id: roleId,
      role_name: selectedRole,
    },
  })
  if (createError) return { error: createError.message }

  if (created?.user) {
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: created.user.id,
        full_name: fullName,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email,
        phone_number: phoneNumber,
        ...birthdateFields(dateOfBirth || null),
        role_id: roleId,
        terms_accepted_at: new Date().toISOString(),
      }, { onConflict: "id" })

    if (profileError) return { error: profileError.message }
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
