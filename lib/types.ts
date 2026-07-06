/** Central type definitions -- each interface mirrors a Supabase table. */

export type UserRole =
  | "administrator"
  | "tutor"
  | "learner"
  | "finance_manager"
  | "auditor"
  | "president"
  | "treasurer"
  | "committee_head"
  | "faculty_adviser"
  | "super_admin"
  | "officer";

export type DesignationType =
  "member" | "esas_scholar" | "officer" | "administrator" | "super_admin";

export interface HsDesignation {
  id: string;
  user_id: string;
  designation: DesignationType;
  position?: string | null;
  academic_year: string;
  is_current: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  name: UserRole;
}

export interface Profile {
  id: string;
  role_id: string | null;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  avatar_url: string | null;
  phone_number?: string | null;
  birthdate?: string | null;
  date_of_birth?: string | null;
  membership_number?: string | null;
  degree_program?: string | null;
  year_level?: number | null;
  bio?: string | null;
  total_xp?: number;
  current_level?: number;
  profile_completed?: boolean | null;
  onboarding_completed?: boolean;
  terms_accepted_at?: string | null;
  esas_scholar?: boolean;
  academic_year_joined?: string | null;
  unique_id_number?: string | null;
  is_card_issued?: boolean | null;
  created_at: string;
  roles?: Array<{ id: string; name: string }>;
  hs_designations?: HsDesignation[];
}

export interface AuthCard {
  id: string;
  user_id: string;
  card_id: string;
  pin: string;
  status: "active" | "revoked";
  issued_at: string;
  profiles?: Profile;
}

export interface Specialization {
  id: string;
  name: string;
}

export interface Tutor {
  id: string;
  user_id: string;
  profile_id?: string;
  bio: string | null;
  rating: number;
  total_ratings: number;
  years_experience: number | null;
  hourly_rate: number | null;
  total_sessions_completed?: number;
  total_students_helped?: number;
  response_rate?: number;
  total_hours_tutored?: number;
  created_at: string;
  profiles: Profile;
  tutor_specializations: { specializations: Specialization }[];
}

export interface TutorAvailability {
  id: string;
  tutor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Session {
  id: string;
  tutor_id: string;
  learner_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  specialization_id: string | null;
  status: SessionStatus;
  notes: string | null;
  created_at: string;
  tutors?: Tutor & { profiles?: Profile };
  learner_profile?: Profile;
  specializations?: Specialization;
  session_ratings?: SessionRating[];
}

export interface SessionRating {
  id: string;
  session_id: string;
  learner_id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
}

export interface Repository {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  access_role: "all" | "tutor" | "admin";
  created_at: string;
  profiles?: Profile;
  resources?: Resource[];
}

export interface Resource {
  id: string;
  repository_id: string;
  title: string;
  description: string | null;
  url: string;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
  profiles?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "session" | "system" | "resource";
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface Timesheet {
  id: string;
  tutor_id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  created_at: string;
  tutors?: Tutor & { profiles?: Profile };
}

export interface AnalyticsLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type PollStatus = "draft" | "active" | "closed";

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  status: PollStatus;
  start_date: string;
  end_date: string;
  allow_multiple_votes: boolean;
  is_anonymous: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  poll_options?: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  display_order: number;
  created_at: string;
  vote_count?: number;
}

export interface UserVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: "ios" | "android" | "web";
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participant_id: string;
  title?: string | null;
  messages?: ConversationMessage[];
  conversation_participants?: Array<{ profile_id: string; profiles?: Profile }>;
  profiles?: Profile;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  created_at: string;
  sender?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export type FinanceRequestStatus =
  "pending" | "finance_review" | "president_approved" | "released" | "rejected";

export interface FinanceBudgetRequest {
  id: string;
  activity_title: string;
  objectives: string | null;
  breakdown: Record<string, unknown>;
  amount: number;
  submitted_by: string;
  status: FinanceRequestStatus;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export type PettyCashStatus = "pending" | "approved" | "rejected";

export interface FinancePettyCash {
  id: string;
  amount: number;
  justification: string;
  submitted_by: string;
  status: PettyCashStatus;
  approved_by: string | null;
  linked_request_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  approver?: Profile;
}

export interface FinanceLiquidation {
  id: string;
  request_id: string | null;
  receipt_urls: string[];
  proof_of_payment_urls: string[];
  submitted_by: string;
  submitted_at: string;
  is_late: boolean;
  created_at: string;
  updated_at: string;
  finance_budget_requests?: FinanceBudgetRequest;
  profiles?: Profile;
}

export type ScardsStatus = "draft" | "auditor_review" | "cosigned";

export interface FinanceScards {
  id: string;
  event_id: string | null;
  receipts_total: number;
  disbursements_total: number;
  balance: number;
  status: ScardsStatus;
  cosigned_by: string | null;
  cosigned_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  finance_budget_requests?: FinanceBudgetRequest;
  cosigner?: Profile;
}

export interface FinanceAuditFinding {
  id: string;
  scards_id: string | null;
  auditor_id: string | null;
  issue_type: string;
  description: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  finance_scards?: FinanceScards;
  auditor?: Profile;
}

export type TeamTaskStatus = "todo" | "in_progress" | "review" | "done";

export interface TeamTask {
  id: string;
  committee_id: string | null;
  deliverable: string;
  deadline: string | null;
  assignee_id: string | null;
  status: TeamTaskStatus;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
}

export interface TeamSchedule {
  id: string;
  member_id: string;
  date: string;
  activity: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}
