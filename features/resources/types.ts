/** Resources feature type definitions */
import type { Profile } from "@/shared/types"

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
