/** Feature types: sessions and session ratings */

import type { Profile } from "./auth"
import type { Tutor, Specialization } from "./tutor"

export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled"

export interface Session {
  id: string
  tutor_id: string
  learner_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  specialization_id: string | null
  status: SessionStatus
  notes: string | null
  created_at: string
  tutors?: Tutor & { profiles?: Profile }
  learner_profile?: Profile
  specializations?: Specialization
  session_ratings?: SessionRating[]
}

export interface SessionRating {
  id: string
  session_id: string
  learner_id: string
  rating: number
  feedback: string | null
  created_at: string
}
