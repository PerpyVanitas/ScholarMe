/**
 * ==========================================================================
 * AUTH ACTIONS - Server Actions for Authentication
 * ==========================================================================
 *
 * PURPOSE: These are Next.js Server Actions ("use server") that handle
 * authentication operations. They run on the SERVER, not in the browser,
 * which means they can safely interact with Supabase Auth.
 *
 * IMPORTANT: Server Actions are called from client components via form
 * submissions or direct function calls. They return data (not throw errors)
 * so the client can display error messages.
 *
 * THREE ACTIONS:
 * 1. loginWithEmail() - Sign in with email + password
 * 2. signUp() - Create a new account (sends confirmation email)
 * 3. signOut() - Sign out and redirect to login page
 *
 * NOTE: The login page currently uses the CLIENT-SIDE Supabase client
 * (createBrowserClient) directly instead of this loginWithEmail action.
 * This action exists as an alternative approach. Both work -- the client-side
 * approach was used because it made debugging easier during development.
 *
 * Called by: /app/auth/login/page.tsx, /app/auth/sign-up/page.tsx,
 *           /components/app-sidebar.tsx (sign out)
 * ==========================================================================
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Authenticates a user with email and password.
 * Returns { success: true } or { error: "message" }.
 * Does NOT redirect -- the calling component handles navigation.
 */
export async function loginWithEmail(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Supabase Auth verifies credentials and sets session cookies
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Creates a new user account. Supabase sends a confirmation email
 * with a link the user must click to verify their email.
 *
 * IMPORTANT: The `emailRedirectTo` option tells Supabase where to redirect
 * the user after they click the confirmation link in their email.
 * The `data.full_name` is stored in the user's metadata and is copied
 * to the profiles table by a database trigger.
 */
export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Where to redirect after email confirmation click
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
      // User metadata -- the database trigger reads this to populate profiles.full_name
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Signs the user out and redirects to the login page.
 * IMPORTANT: Uses Next.js redirect() which throws internally -- this is expected.
 * Called from the sidebar dropdown menu's "Sign Out" button.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();  // Clears the session cookies
  redirect("/auth/login");         // Server-side redirect (throws internally)
}
