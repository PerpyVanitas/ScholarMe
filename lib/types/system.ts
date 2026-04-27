/** Feature types: system — notifications, timesheets, analytics, device tokens */

import type { Tutor } from "./tutor"
import type { Profile } from "./auth"

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

export interface Timesheet {
  id: string
  tutor_id: string
  user_id: string
  clock_in: string
  clock_out: string | null
  notes: string | null
  created_at: string
  tutors?: Tutor & { profiles?: Profile }
}

export interface AnalyticsLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
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

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const
