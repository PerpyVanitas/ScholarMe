/** Tutors feature type definitions */
import type { Profile, Specialization } from "@/shared/types"

export interface Tutor {
  id: string
  user_id: string
  bio: string | null
  hourly_rate?: number | null
  years_experience?: number | null
  rating: number
  total_ratings: number
  created_at: string
  profiles?: Profile
  tutor_specializations?: { specializations: Specialization }[]
}

export interface TutorAvailability {
  id: string
  tutor_id: string
  day_of_week: number // 0 = Sunday ... 6 = Saturday
  start_time: string  // "HH:MM:SS"
  end_time: string
}

export interface TutorDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tutor: {
    id: string
    profile_id?: string
    bio: string | null
    hourly_rate: number | null
    years_experience: number | null
    rating: number
    total_ratings: number
    profiles: {
      full_name: string
      email: string
      avatar_url: string | null
      phone_number: string | null
    }
    tutor_specializations: Array<{
      specializations: {
        id: string
        name: string
      }
    }>
  }
}
