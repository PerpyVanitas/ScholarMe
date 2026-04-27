/** Feature types: authentication, profiles, roles */

export type UserRole = "administrator" | "tutor" | "learner"

export interface Role {
  id: string
  name: UserRole
}

export interface Profile {
  id: string
  role_id: string | null
  full_name: string
  first_name?: string | null
  last_name?: string | null
  email: string
  avatar_url: string | null
  phone_number?: string | null
  birthdate?: string | null
  date_of_birth?: string | null
  membership_number?: string | null
  profile_completed?: boolean | null
  terms_accepted_at?: string | null
  created_at: string
  /**
   * Supabase returns joined relations as arrays; use `normalizeRole()` from
   * `@/lib/utils/roles` to safely access `.name`.
   */
  roles?: Role | Role[]
}

export interface AuthCard {
  id: string
  user_id: string
  card_id: string
  pin: string
  status: "active" | "revoked"
  issued_at: string
  profiles?: Profile
}
