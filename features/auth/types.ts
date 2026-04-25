/** Auth feature type definitions */

export interface AuthCard {
  id: string
  user_id: string
  card_id: string
  pin: string
  status: "active" | "revoked"
  issued_at: string
  profiles?: import("@/lib/types").Profile
}

export interface LoginFormData {
  email: string
  password: string
}

export interface SignUpFormData {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
  role: "learner" | "tutor"
}

export interface AuthResult {
  success?: boolean
  error?: string
}
