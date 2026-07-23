/** Central type definitions -- each interface mirrors a Supabase table. */

export type UserRole =
  | "president"
  | "vice_president"
  | "secretary"
  | "treasurer"
  | "auditor"
  | "committee_head"
  | "assistant_committee_head"
  | "tutor"
  | "learner"
  | "administrator"
  | "super_admin";

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
  profile_theme_color?: string | null;
  profile_completed?: boolean | null;
  onboarding_completed?: boolean;
  terms_accepted_at?: string | null;
  esas_scholar?: boolean;
  academic_year_joined?: string | null;
  unique_id_number?: string | null;
  is_card_issued?: boolean | null;
  membership_classification?: "learner" | "regular_member" | "esas_scholar";
  committee?: string | null;
  is_private?: boolean | null;
  service_hours_balance?: number;
  role_expires_at?: string | null;
  pronouns?: string | null;
  status_message?: string | null;
  social_links?: Record<string, string> | null;
  referral_code?: string | null;
  referred_by?: string | null;
  dashboard_layout?: unknown;
  created_at: string;
  roles?: Array<{ id: string; name: string }>;
  hs_designations?: HsDesignation[];
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_name: string;
  badge_description?: string;
  icon_name?: string;
  unlocked_at: string;
}

export interface ForumPost {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface ForumReply {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
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
  is_paused?: boolean;
  is_lead_tutor?: boolean;
  strikes?: number;
  created_at: string;
  profiles: Profile;
  tutor_specializations: { specializations: Specialization }[];
  attendance_logs?: AttendanceLog[];
}

export interface TutorAvailability {
  id: string;
  tutor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export type SessionStatus =
  "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

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
  tutor_memo: string | null;
  prep_notes?: string | null;
  meeting_link?: string | null;
  is_office_hours?: boolean;
  max_participants?: number;
  participant_count?: number;
  transfer_to_tutor_id?: string | null;
  reschedule_requested_date?: string | null;
  reschedule_requested_start?: string | null;
  reschedule_requested_end?: string | null;
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
  last_confirmed_at?: string | null;
  notes: string | null;
  created_at: string;
  tutors?: Tutor & { profiles?: Profile };
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
  is_pinned?: boolean;
  reply_to_id?: string | null;
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
  is_pinned?: boolean;
  reply_to_id?: string | null;
}

export interface FinanceVendor {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
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
  attachment_url: string | null;
  vendor_id?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  finance_vendors?: FinanceVendor;
}

export type PettyCashStatus = "pending" | "approved" | "rejected";

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

export type TeamTaskStatus = "todo" | "in_progress" | "review" | "done";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface FacilityEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  color_code: string;
  organizer_id: string | null;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
  organizer?: Profile;
  event_rsvps?: EventRsvp[];
}

export type RsvpStatus = "going" | "maybe" | "not_going";

export interface EventRsvp {
  id: string;
  event_id: string;
  profile_id: string;
  status: RsvpStatus;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  facility_events?: FacilityEvent;
}

export interface PhysicalResource {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  resource_type: string;
  cover_image_url: string | null;
  total_quantity: number;
  available_quantity: number;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceCheckout {
  id: string;
  resource_id: string;
  profile_id: string;
  checkout_date: string;
  due_date: string;
  return_date: string | null;
  status: "active" | "returned" | "overdue" | "lost";
  notes: string | null;
  checked_out_by: string;
  checked_in_by: string | null;
  resource?: PhysicalResource;
  profile?: Profile;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: "planned" | "in-progress" | "completed";
  upvotes: number;
  created_by: string | null;
  created_at: string;
}

export interface OrganizationSettings {
  id: string;
  primary_color: string;
  logo_url: string | null;
  hero_title: string;
  hero_subtitle: string;
  updated_at: string;
  updated_by: string | null;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  status: "open" | "in-progress" | "resolved";
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  support_messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface AttendanceLog {
  id: string;
  tutor_id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string | null;
  lat?: number | null;
  lng?: number | null;
  location_verified?: boolean;
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

export interface AnalyticsLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
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

export interface ConversationParticipant {
  profile_id: string;
  profiles?: Profile;
}

export interface Friend {
  id: string;
  user_id1: string;
  user_id2: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  updated_at: string;
}

export interface PortfolioSettings {
  user_id: string;
  is_public: boolean;
  share_token: string;
  custom_bio?: string | null;
  github_url?: string | null;
  resume_url?: string | null;
  featured_badges?: string[];
  updated_at?: string;
}

export interface TutorEndorsement {
  id: string;
  tutor_id: string;
  learner_id: string;
  session_id?: string | null;
  content: string;
  is_public: boolean;
  created_at: string;
  tutors?: { profiles: Profile };
  learners?: Profile;
}

export interface OfficerHandoffNote {
  id: string;
  position_key: string;
  term_id?: string | null;
  author_id: string;
  content: string;
  key_contacts?: string | null;
  created_at: string;
  author?: Profile;
}

export interface MentorshipPreference {
  user_id: string;
  role_type: "mentor" | "mentee" | "both";
  is_active: boolean;
  interests?: string[];
  created_at: string;
  profiles?: Profile;
}

export interface MilestoneEvent {
  id: string;
  user_id: string;
  milestone_key: string;
  achieved_at: string;
}

export interface InstitutionalWikiDoc {
  id: string;
  title: string;
  category: "SOP" | "Governance" | "Tutor Manual" | "FAQ";
  content: string;
  access_role: UserRole;
  created_at: string;
  updated_at: string;
}

