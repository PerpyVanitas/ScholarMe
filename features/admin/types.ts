/** Admin feature type definitions */
import type { Profile } from "@/shared/types"

export interface AnalyticsLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "session" | "system" | "resource"
  is_read: boolean
  link: string | null
  created_at: string
}

export interface DeviceToken {
  id: string
  user_id: string
  token: string
  platform: "ios" | "android" | "web"
  created_at: string
  updated_at: string
}

// Voting types
export type PollStatus = "draft" | "active" | "closed"

export interface Poll {
  id: string
  title: string
  description: string | null
  created_by: string | null
  status: PollStatus
  start_date: string
  end_date: string
  allow_multiple_votes: boolean
  is_anonymous: boolean
  created_at: string
  updated_at: string
  profiles?: Profile
  poll_options?: PollOption[]
}

export interface PollOption {
  id: string
  poll_id: string
  option_text: string
  display_order: number
  created_at: string
  vote_count?: number
}

export interface UserVote {
  id: string
  poll_id: string
  option_id: string
  user_id: string
  created_at: string
}
