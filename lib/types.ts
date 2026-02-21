/**
 * ==========================================================================
 * TYPES.TS - Central Type Definitions for ScholarMe
 * ==========================================================================
 *
 * PURPOSE: This file defines ALL TypeScript interfaces and types used across
 * the entire ScholarMe application. Every database table has a matching
 * interface here. These types are imported by pages, components, and API
 * routes to ensure type-safety throughout the app.
 *
 * HOW IT CONNECTS:
 * - Each interface mirrors a Supabase database table (see scripts/ for schema)
 * - Optional fields with "?" (e.g., `profiles?: Profile`) represent JOIN
 *   relationships -- they're only populated when you use `.select("*, profiles(*)")`
 *   in a Supabase query
 * - These types are used by BOTH the web app (Next.js) and mobile app (Expo)
 *
 * DATABASE TABLE MAPPING:
 *   TypeScript Interface  -->  Supabase Table
 *   ────────────────────       ──────────────
 *   Role                 -->  roles
 *   Profile              -->  profiles
 *   AuthCard             -->  auth_cards
 *   Specialization       -->  specializations
 *   Tutor                -->  tutors
 *   TutorAvailability    -->  tutor_availability
 *   Session              -->  sessions
 *   SessionRating        -->  session_ratings
 *   Repository           -->  repositories
 *   Resource             -->  resources
 *   Notification         -->  notifications
 *   AnalyticsLog         -->  analytics_logs
 * ==========================================================================
 */

/**
 * The three possible user roles in ScholarMe.
 * - "administrator": Full access - can manage users, cards, view analytics
 * - "tutor": Can manage availability, accept/complete sessions, share resources
 * - "learner": Can browse tutors, book sessions, access resources
 *
 * IMPORTANT: This type is checked throughout the app to show/hide UI sections
 * and restrict access. The sidebar navigation, dashboard content, and API
 * authorization all depend on this role.
 */
export type UserRole = "administrator" | "tutor" | "learner";

/**
 * Roles table - stores the three role definitions.
 * Each profile has a `role_id` that points to one of these roles.
 * The `name` field is what the app uses to determine permissions.
 */
export interface Role {
  id: string;       // UUID primary key
  name: UserRole;   // "administrator" | "tutor" | "learner"
}

/**
 * Profiles table - stores user information.
 * IMPORTANT: This is created automatically by a Supabase database trigger
 * when a new user signs up via Supabase Auth. The trigger copies the user's
 * email and metadata (full_name) from the auth.users table into this profiles table.
 *
 * The `roles` field is a JOIN -- only populated when the query includes
 * `.select("*, roles(*)")` to join the roles table via the `role_id` foreign key.
 */
export interface Profile {
  id: string;              // UUID - matches the Supabase Auth user ID (auth.users.id)
  role_id: string;         // Foreign key to the "roles" table
  full_name: string;       // User's display name
  email: string;           // User's email address
  avatar_url: string | null;  // Optional profile picture URL
  created_at: string;      // Timestamp of when the profile was created
  roles?: Role;            // JOIN: the user's role (only present when joined in query)
}

/**
 * Auth Cards table - stores physical/virtual card credentials for card-based login.
 * IMPORTANT: This is an alternative authentication method for environments where
 * email login isn't practical (e.g., school computer labs). An admin issues a
 * card_id + PIN to a user, and they can login with those instead of email/password.
 *
 * The `profiles` field is a JOIN to show which user owns the card.
 */
export interface AuthCard {
  id: string;              // UUID primary key
  user_id: string;         // Foreign key to profiles.id (which user this card belongs to)
  card_id: string;         // The card identifier (e.g., "CARD-001") - what the user enters
  pin: string;             // PIN code for the card (NOTE: stored as plaintext in MVP, should use bcrypt in production)
  status: "active" | "revoked";  // Admin can revoke cards to disable them
  issued_at: string;       // Timestamp of when the card was issued
  profiles?: Profile;      // JOIN: the user who owns this card
}

/**
 * Specializations table - categories of subjects tutors can teach.
 * Examples: "Mathematics", "Physics", "English Literature"
 * These are linked to tutors via the tutor_specializations junction table.
 */
export interface Specialization {
  id: string;    // UUID primary key
  name: string;  // Subject name (e.g., "Mathematics")
}

/**
 * Tutors table - extended profile data for users who are tutors.
 * IMPORTANT: A tutor record is created when an admin creates a user with the
 * "tutor" role (see /api/admin/users). It stores tutor-specific data like
 * bio, rating, and links to the user's profile.
 *
 * The `tutor_specializations` is a nested JOIN:
 *   tutors -> tutor_specializations (junction) -> specializations
 * This many-to-many relationship means a tutor can teach multiple subjects.
 */
export interface Tutor {
  id: string;              // UUID primary key (NOT the same as user_id)
  user_id: string;         // Foreign key to profiles.id
  bio: string | null;      // Tutor's self-written bio/description
  rating: number;          // Average rating (0-5), calculated from session_ratings
  total_ratings: number;   // Number of ratings received (used to calculate new averages)
  created_at: string;
  profiles?: Profile;      // JOIN: the tutor's user profile
  tutor_specializations?: { specializations: Specialization }[];  // JOIN: subjects this tutor teaches
}

/**
 * Tutor Availability table - weekly recurring time slots when a tutor is available.
 * Each row represents one time block on one day of the week.
 * For example: Monday 09:00-11:00, Wednesday 14:00-16:00
 *
 * Learners see these slots on the tutor detail page to know when they can book.
 * The day_of_week follows JavaScript's convention: 0=Sunday, 1=Monday, ..., 6=Saturday.
 */
export interface TutorAvailability {
  id: string;          // UUID primary key
  tutor_id: string;    // Foreign key to tutors.id (NOT profiles.id)
  day_of_week: number; // 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
  start_time: string;  // Time string in "HH:MM:SS" format (e.g., "09:00:00")
  end_time: string;    // Time string in "HH:MM:SS" format (e.g., "11:00:00")
}

/**
 * Session status lifecycle:
 * 1. "pending"   - Learner has booked, waiting for tutor to accept
 * 2. "confirmed" - Tutor accepted the booking
 * 3. "completed" - Tutor marked the session as done (learner can now rate it)
 * 4. "cancelled" - Either party cancelled the session
 */
export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled";

/**
 * Sessions table - the core entity of ScholarMe. Represents a tutoring session
 * between one learner and one tutor at a specific date/time.
 *
 * IMPORTANT JOINS:
 * - `tutors` + `tutors.profiles`: Gets the tutor's name (nested join)
 * - `learner_profile`: Gets the learner's name
 * - `specializations`: Gets the subject being taught
 * - `session_ratings`: Gets the learner's rating after completion
 *
 * Created via POST /api/sessions when a learner books a session.
 * Status is updated via PUT /api/sessions/[id]/status.
 * Rated via POST /api/sessions/[id]/rate.
 */
export interface Session {
  id: string;
  tutor_id: string;                            // Foreign key to tutors.id
  learner_id: string;                          // Foreign key to profiles.id (the learner)
  scheduled_date: string;                      // Date string "YYYY-MM-DD"
  start_time: string;                          // Time string "HH:MM:SS"
  end_time: string;                            // Time string "HH:MM:SS"
  specialization_id: string | null;            // Optional: which subject this session covers
  status: SessionStatus;                       // Current lifecycle state
  notes: string | null;                        // Optional notes from the learner
  created_at: string;
  tutors?: Tutor & { profiles?: Profile };     // JOIN: tutor with their profile name
  learner_profile?: Profile;                   // JOIN: the learner's profile
  specializations?: Specialization;            // JOIN: subject being taught
  session_ratings?: SessionRating[];           // JOIN: rating given after completion
}

/**
 * Session Ratings table - feedback left by learners after a completed session.
 * A learner can rate a session only ONCE, and only after it's marked "completed".
 *
 * IMPORTANT: When a rating is submitted, the API also recalculates the tutor's
 * average rating using: newAvg = (oldAvg * oldCount + newRating) / (oldCount + 1)
 * This happens in POST /api/sessions/[id]/rate.
 */
export interface SessionRating {
  id: string;
  session_id: string;      // Foreign key to sessions.id
  learner_id: string;      // Foreign key to profiles.id (who left the rating)
  rating: number;          // 1-5 star rating
  feedback: string | null; // Optional text feedback
  created_at: string;
}

/**
 * Repositories table - containers for organizing study resources.
 * Think of them like folders. A tutor or admin creates a repository,
 * then adds resource links inside it.
 *
 * The `access_role` field controls who can see this repository:
 * - "all": Everyone (learners, tutors, admins)
 * - "tutor": Only tutors and admins
 * - "admin": Only admins
 *
 * NOTE: This access control is currently only enforced at the UI level.
 * For production, add Row Level Security (RLS) policies in Supabase.
 */
export interface Repository {
  id: string;
  owner_id: string;                        // Foreign key to profiles.id (who created it)
  title: string;                           // Repository name
  description: string | null;
  access_role: "all" | "tutor" | "admin";  // Who can see this repository
  created_at: string;
  profiles?: Profile;                      // JOIN: the owner's profile
  resources?: Resource[];                  // JOIN: resources inside this repo
}

/**
 * Resources table - individual study materials (links to documents, videos, etc.).
 * Each resource belongs to one repository.
 * Resources are links (URLs) -- actual file storage would use Supabase Storage or Vercel Blob.
 */
export interface Resource {
  id: string;
  repository_id: string;      // Foreign key to repositories.id
  title: string;               // Resource name
  description: string | null;
  url: string;                 // URL to the resource (external link, PDF, video, etc.)
  file_type: string | null;    // "pdf", "doc", "video", "link", "other"
  uploaded_by: string;         // Foreign key to profiles.id (who added it)
  created_at: string;
  profiles?: Profile;          // JOIN: who uploaded this resource
}

/**
 * Notifications table - in-app notifications for users.
 * Created server-side (e.g., when a session is booked, confirmed, etc.).
 * Displayed in the Notifications page with mark-as-read functionality.
 */
export interface Notification {
  id: string;
  user_id: string;                           // Foreign key to profiles.id (recipient)
  title: string;                             // Short notification title
  message: string;                           // Full notification message
  type: "session" | "system" | "resource";   // Category for icon/color
  is_read: boolean;                          // Whether the user has seen it
  link: string | null;                       // Optional deep link to related page
  created_at: string;
}

/**
 * Analytics Logs table - tracks user actions for admin analytics.
 * IMPORTANT: This table is currently unused in the UI -- analytics are
 * calculated directly from counting rows in other tables (profiles, sessions, etc.).
 * This table exists for future detailed event tracking.
 */
export interface AnalyticsLog {
  id: string;
  user_id: string | null;                     // Who performed the action (null for system events)
  action: string;                              // What happened (e.g., "session_booked")
  entity_type: string | null;                  // What type of thing was affected (e.g., "session")
  entity_id: string | null;                    // ID of the affected entity
  metadata: Record<string, unknown> | null;    // Additional JSON data
  created_at: string;
}

/**
 * Helper constant: maps day_of_week numbers (0-6) to readable day names.
 * Used by the Availability page and Tutor Detail page to display schedules.
 * Follows JavaScript's Date.getDay() convention: 0 = Sunday.
 */
export const DAYS_OF_WEEK = [
  "Sunday",    // 0
  "Monday",    // 1
  "Tuesday",   // 2
  "Wednesday", // 3
  "Thursday",  // 4
  "Friday",    // 5
  "Saturday",  // 6
] as const;
