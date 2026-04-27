/** Feature types: content — repositories, resources, polls, voting */

import type { Profile } from "./auth"

export interface Repository {
  id: string
  owner_id: string
  title: string
  description: string | null
  access_role: "all" | "tutor" | "admin"
  created_at: string
  profiles?: Profile
  resources?: Resource[]
}

export interface Resource {
  id: string
  repository_id: string
  title: string
  description: string | null
  url: string
  file_type: string | null
  uploaded_by: string
  created_at: string
  profiles?: Profile
}

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
